"""pixiplex/pixinet.py"""

from os import sync
import pathlib

import anywidget
import numpy as np
import traitlets
from dataclasses import dataclass, asdict, field
from numpy.typing import ArrayLike
from typing import Union, Optional, Any, TypedDict

OUTPUT_DIR = pathlib.Path(__file__).parent / "static"


@dataclass
class ForceCenter:
	"""Center force that translates nodes uniformly."""

	x: float = 0
	y: float = 0
	strength: float = 1


@dataclass
class ForceCollide:
	"""Collision force between nodes."""

	radius: Union[float, str] = 1  # Can be a number or accessor function name
	strength: float = 0.7
	iterations: int = 1


@dataclass
class ForceLink:
	"""Link force that pulls linked nodes together."""

	distance: Union[float, str] = 30  # Can be number or accessor function name
	strength: Optional[Union[float, str]] = None  # Can be number or accessor function name
	iterations: int = 1


@dataclass
class ForceManyBody:
	"""Many-body force for attraction/repulsion between nodes."""

	strength: Union[float, str] = -30  # Can be number or accessor function name
	theta: float = 0.9
	distanceMin: float = 1
	distanceMax: float = 10000


@dataclass
class ForceX:
	"""Positioning force along x-axis."""

	x: Union[float, str] = 0  # Can be number or accessor function name
	strength: Union[float, str] = 0.1  # Can be number or accessor function name


@dataclass
class ForceY:
	"""Positioning force along y-axis."""

	y: Union[float, str] = 0  # Can be number or accessor function name
	strength: Union[float, str] = 0.1  # Can be number or accessor function name


@dataclass
class ForceRadial:
	"""Radial positioning force."""

	radius: Union[float, str]
	x: float = 0
	y: float = 0
	strength: Union[float, str] = 0.1


@dataclass
class NodeStyle:
	border_width: float = 1.5
	border_color: str = "0xFFFFFF"
	color: str = "0x650A5A"
	radius: int = 6
	alpha: float = 1

	@staticmethod
	def as_dict(config: "NodeStyle", widget: anywidget.AnyWidget) -> dict[str, Any]:
		"""Dictionary serialization method necessary for widget synchronization."""
		return asdict(config)


@dataclass
class EdgeStyle:
	line_width: float = 1.0
	color: str = "0x000000"
	alpha: float = 1.0

	@staticmethod
	def as_dict(config: "EdgeStyle", widget: anywidget.AnyWidget) -> dict[str, Any]:
		"""Dictionary serialization method necessary for widget synchronization."""
		return asdict(config)


# TODO: could override __dict__ to have config.center.strength = 1
class ForceConfig:
	"""Fluent interface for configuring d3-forces."""

	def __init__(self) -> None:
		self.forces: dict[str, Any] = {}

	def center(self, name: str = "center", x: float = 0.0, y: float = 0.0, strength: float = 1.0) -> "ForceConfig":
		"""Add center force.

		Parameters:
			name: force name.
			x: x-position of the centering force.
			y: y-position of the centering force.
			strength: relative strength of the centering force.
		"""
		fc = ForceCenter(x, y, strength)
		self.forces[name] = {"type": "forceCenter", "enabled": True, "params": asdict(fc)}
		return self

	def collide(self, name: str = "collide", **kwargs) -> "ForceConfig":
		"""Add collision force."""
		self.forces[name] = {"type": "forceCollide", "enabled": True, "params": asdict(ForceCollide(**kwargs))}
		return self

	def link(self, name: str = "link", **kwargs) -> "ForceConfig":
		"""Adds a link force."""
		self.forces[name] = {"type": "forceLink", "enabled": True, "params": asdict(ForceLink(**kwargs))}
		return self

	def many_body(self, name: str = "charge", **kwargs) -> "ForceConfig":
		"""Adds a many-body force, such as a gravity (positive) or electrostatic charge (negative) force."""
		# Handle infinity for distance_max
		if "distance_max" in kwargs and kwargs["distance_max"] == float("inf"):
			kwargs["distance_max"] = None
		self.forces[name] = {"type": "forceManyBody", "enabled": True, "params": asdict(ForceManyBody(**kwargs))}
		return self

	def radial(self, radius: Union[float, str], name: str = "radial", **kwargs) -> "ForceConfig":
		"""Add radial positioning force."""
		self.forces[name] = {"type": "forceRadial", "params": asdict(ForceRadial(radius=radius, **kwargs))}
		return self

	def x(self, name: str = "x", **kwargs) -> "ForceConfig":
		"""Add x-positioning force."""
		self.forces[name] = {"type": "forceX", "enabled": True, "params": asdict(ForceX(**kwargs))}
		return self

	def y(self, name: str = "y", **kwargs) -> "ForceConfig":
		"""Add y-positioning force."""
		self.forces[name] = {"type": "forceY", "enabled": True, "params": asdict(ForceY(**kwargs))}
		return self

	@staticmethod
	def as_dict(config: "ForceConfig", widget: anywidget.AnyWidget) -> dict[str, Any]:
		"""Dictionary serialization method necessary for widget synchronization."""
		return config.forces.copy()

	def __repr__(self) -> str:
		if not self.forces:
			return "(empty force configuration)"
		msg = "Force Configuration {\n"
		for fn, fp in self.forces.items():
			params = ",".join([f"{k}={v}" for k, v in fp["params"].items()])
			msg += f" {['[off]', '[on] '][fp['enabled']]} {fn}: {fp['type']}({params})\n"
		msg += "}"
		return msg


# TODO: have opton to switch between unicode / float / array
class Pixinet(anywidget.AnyWidget):
	_esm = OUTPUT_DIR / "widget.js"
	_css = OUTPUT_DIR / "widget.css"

	scale = traitlets.Float(2.0).tag(sync=True)
	width = traitlets.Int(250).tag(sync=True)
	height = traitlets.Int(250).tag(sync=True)

	node_ids = traitlets.List(trait=traitlets.CInt).tag(sync=True)
	src_ids = traitlets.List(trait=traitlets.CInt).tag(sync=True)
	tgt_ids = traitlets.List(trait=traitlets.CInt).tag(sync=True)

	_x = traitlets.List(trait=traitlets.Float).tag(sync=True)
	_y = traitlets.List(trait=traitlets.Float).tag(sync=True)

	node_color = traitlets.List(trait=traitlets.Unicode, default_value=[]).tag(sync=True)
	node_radii = traitlets.List(trait=traitlets.Float, default_value=[]).tag(sync=True)
	node_value = traitlets.Int(0).tag(sync=True)

	node_style = traitlets.Instance(NodeStyle).tag(sync=True, to_json=NodeStyle.as_dict)
	# edge_style = traitlets.Instance(NodeStyle).tag(sync=True, to_json=NodeStyle.as_dict)

	## All the force parameters are collected in a dict / config class
	forces = traitlets.Instance(ForceConfig).tag(sync=True, to_json=ForceConfig.as_dict)

	def __init__(
		self,
		node_ids: ArrayLike,
		edgelist: ArrayLike,
		width: int = 250,
		height: int = 250,
		forces: ForceConfig | None = None,
	) -> None:
		self.width = width
		self.height = height
		self.node_ids = list(node_ids)
		self.node_radii = [5.0] * len(node_ids)
		self.src_ids = list(edgelist[:, 0])
		self.tgt_ids = list(edgelist[:, 1])
		self.forces = ForceConfig() if forces is None else forces
		self.node_style = NodeStyle()
		super().__init__()

	def center(self, fit_zoom: bool = False, x: float | None = None, y: float | None = None):
		msg = {"type": "msg:center", "fit": fit_zoom}
		msg["x"] = float(x) if x is not None else (self.width * self.scale / 2)
		msg["y"] = float(y) if y is not None else (self.height * self.scale / 2)
		self.send(msg)

	@property
	def x(self):
		self.send({"type": "msg:sync_node_coordinates"})
		return self._x

	@property
	def y(self):
		self.send({"type": "msg:sync_node_coordinates"})
		return self._y

	def embed_html(self, path: pathlib.Path):
		import ipywidgets.embed

		ipywidgets.embed.embed_minimal_html(str(path.resolve()), views=[self], drop_defaults=False)

	def embed_state(self, path: pathlib.Path = None):
		from ipywidgets.embed import embed_data
		import json

		return embed_data(self)

	def embed_raw(self, path: pathlib.Path | str):
		import json

		path = pathlib.Path(path)
		graph = {}
		graph["nodes"] = [{"id": i} for i in self.node_ids]
		graph["links"] = [{"source": i, "target": j} for i, j in zip(self.src_ids, self.tgt_ids)]
		html_template = f"""
		<div id="pixiplex_container" style="position: relative; overflow: hidden; overflow-y: hidden; padding: 0; margin: 5px; border: 1px solid black; "></div>
		<script type="module">
		import * as pn from "./pixinet.js"
		const WORLD_WIDTH = 1000;
		const WORLD_HEIGHT = 1000;
		console.log("Pixel ratio: " + devicePixelRatio);
		const graph = {json.dumps(graph)};
		const pp = new pn.Pixiplex(graph.nodes, graph.links, 400, 400, 2.0);
		window.pp = pp; 
		await pp.init();
		document.getElementById("pixiplex_container").appendChild(pp.view);
		</script>
		"""

		# json.dumps(graph)
		path.write_text(html_template)
