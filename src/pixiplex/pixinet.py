"""pixiplex/pixninet.py"""

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


class ForceConfig:
	"""Minimal fluent interface for d3-force configuration."""

	def __init__(self) -> None:
		self.forces: dict[str, Any] = {}

	def center(self, name: str = "center", **kwargs) -> "ForceConfig":
		"""Add center force."""
		self.forces[name] = {"type": "forceCenter", "enabled": True, "params": asdict(ForceCenter(**kwargs))}
		return self

	def collide(self, name: str = "collide", **kwargs) -> "ForceConfig":
		"""Add collision force."""
		self.forces[name] = {"type": "forceCollide", "enabled": True, "params": asdict(ForceCollide(**kwargs))}
		return self

	def link(self, name: str = "link", **kwargs) -> "ForceConfig":
		"""Add link force."""
		self.forces[name] = {"type": "forceLink", "enabled": True, "params": asdict(ForceLink(**kwargs))}
		return self

	def many_body(self, name: str = "charge", **kwargs) -> "ForceConfig":
		"""Add many-body (charge) force."""
		# Handle infinity for distance_max
		if "distance_max" in kwargs and kwargs["distance_max"] == float("inf"):
			kwargs["distance_max"] = None
		self.forces[name] = {"type": "forceManyBody", "enabled": True, "params": asdict(ForceManyBody(**kwargs))}
		return self

	def x(self, name: str = "x", **kwargs) -> "ForceConfig":
		"""Add x-positioning force."""
		self.forces[name] = {"type": "forceX", "enabled": True, "params": asdict(ForceX(**kwargs))}
		return self

	def y(self, name: str = "y", **kwargs) -> "ForceConfig":
		"""Add y-positioning force."""
		self.forces[name] = {"type": "forceY", "enabled": True, "params": asdict(ForceY(**kwargs))}
		return self

	def radial(self, radius: Union[float, str], name: str = "radial", **kwargs) -> "ForceConfig":
		"""Add radial positioning force."""
		self.forces[name] = {"type": "forceRadial", "params": asdict(ForceRadial(radius=radius, **kwargs))}
		return self

	def remove(self, name: str) -> "ForceConfig":
		"""Remove a force by name."""
		self.forces.pop(name, None)
		return self

	def clear(self) -> "ForceConfig":
		"""Remove all forces."""
		self.forces.clear()
		return self

	def update_force(self, name: str, **kwargs) -> "ForceConfig":
		"""Update parameters of an existing force."""
		if name in self.forces:
			self.forces[name]["params"].update(kwargs)
		return self

	@staticmethod
	def as_dict(config: "ForceConfig", widget: anywidget.AnyWidget) -> dict[str, Any]:
		"""Convert to dictionary for widget synchronization"""
		return config.forces.copy()

	def __repr__(self) -> str:
		if not self.forces:
			return "(empty force configuration)"
		msg = "Force Configuration {\n"
		for fn, fp in self.forces.items():
			msg += f"\t{fn}: {fp} ({['off', 'on'][fp['enabled']]})\n"
		msg += "}"
		return msg


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
		super().__init__()

	def center(self, fit_zoom: bool = False, x: float = None, y: float = None):
		msg = {"type": "msg:center", "fit": fit_zoom}
		msg["x"] = float(x) if x is not None else (self.width * self.scale / 2)
		msg["y"] = float(y) if y is not None else (self.height * self.scale / 2)
		self.send(msg)

	def manybody_force(
		self, name: str, strength: float = -30.0, theta: float = 0.90, distanceMin: float = 1.0, distanceMax: float = np.inf
	):
		params = dict(name=name, strength=strength, theta=theta, distanceMin=distanceMin, distanceMax=distanceMax)
		self.forces[name] = params
		# params = dict(name=name, strength=strength, theta=theta, distanceMin=distanceMin, distanceMax=distanceMax)
		# msg = {"type": "msg:add_force", "force": "manyBody", "params": params}
		# self.send(msg)

	def link_force(self, name: str, strength: float = -30.0, distance: float = None, iterations: int = 1):
		params = dict(name=name, strength=strength, distance=distance, iterations=iterations)
		msg = {"type": "msg:apply_force", "force": "link", "params": params}
		self.send(msg)

	def collide_force(self, name: str, strength: float = -30.0, radius: float = None, iterations: int = 1):
		params = dict(name=name, strength=strength, radius=radius, iterations=iterations)
		msg = {"type": "msg:apply_force", "force": "collide", "params": params}
		self.send(msg)
		return self

	def center_force(self, name: str, x: float, y: float = 0.0, strength: float = 1.0):
		params = dict(name=name, x=x, y=y, strength=strength)
		msg = {"type": "msg:apply_force", "force": "center", "params": params}
		self.send(msg)
		return self

	@property
	def x(self):
		self.send({"type": "msg:sync_node_coordinates"})
		return self._x

	@property
	def y(self):
		self.send({"type": "msg:sync_node_coordinates"})
		return self._y

	# @x.setter
	# def x(self, value: ArrayLike):
	# 	value = np.atleast_1d(value).astype(np.float32).ravel()
	# 	assert len(value) == len(self.node_ids)
	# 	self._x = value

	# forceManyBody: ['strength', 'theta', 'distanceMin', 'distanceMax'],
	# forceLink: ['distance', 'strength', 'iterations'],
	# forceCenter: ['x', 'y'],
	# forceCollide: ['radius', 'strength', 'iterations'],
	# forceX: ['strength', 'x'],
	# forceY: ['strength', 'y']


# import param
# from panel.custom import AnyWidgetComponent


# class PixinetPanel(AnyWidgetComponent):
# 	_esm = OUTPUT_DIR / "widget.js"
# 	_css = OUTPUT_DIR / "widget.css"

# 	scale = param.Number(2.0)
# 	width = param.Integer(400)
# 	height = param.Integer(400)

# 	node_ids = param.List(item_type=int)
# 	src_ids = param.List(item_type=int)
# 	tgt_ids = param.List(item_type=int)

# 	_x = param.List(item_type=float)
# 	_y = param.List(item_type=float)

# 	node_color = param.List(item_type=str)
# 	node_radii = param.List(item_type=float)

# 	forces = param.Dict()  # value_trait=traitlets.Dict(value_trait=),

# 	def __init__(self, node_ids: ArrayLike, edgelist: ArrayLike, width: int = 250, height: int = 250) -> None:
# 		super().__init__()
# 		self.width = width
# 		self.height = height
# 		self.node_ids = list(map(int, node_ids))
# 		self.src_ids = list(map(int, edgelist[:, 0]))
# 		self.tgt_ids = list(map(int, edgelist[:, 1]))
# 		self.forces = {}
# 		# {
# 		# 	"spring": {"type": "forceLink", "distance": +30.0, "iterations": 1},
# 		# 	"charge": {"type": "forceManyBody", "strength": -30.0, "distanceMin": 1, "distanceMax": np.inf},
# 		# 	"center": {"type": "forceCenter", "x": 0.0, "y": 0.0},
# 		# }
# 		# alpha: 1,
# 		# force: { // < name > : { enabled: < boolean >, type: < force type >, params: { < force parameters > } }
# 		# 	charge: { enabled: true, type: "forceManyBody", params: _default_manybody_params },
# 		# 	link: { enabled: true, type: "forceLink", params: _default_link_params },
# 		# 	center: { enabled: true, type: "forceCenter", params: _default_center_params }
# 		# }

# 	@property
# 	def x(self):
# 		self.send({"type": "msg:sync_node_coordinates"})
# 		return self._x

# 	def center(self, fit_zoom: bool = False, x: float = None, y: float = None):
# 		msg = {"type": "msg:center", "fit": fit_zoom}
# 		msg["x"] = float(x) if x is not None else (self.width * self.scale / 2)
# 		msg["y"] = float(y) if y is not None else (self.height * self.scale / 2)
# 		self.send(msg)

# 	def manybody_force(
# 		self, name: str, strength: float = -30.0, theta: float = 0.90, distanceMin: float = 1.0, distanceMax: float = np.inf
# 	):
# 		params = dict(name=name, strength=strength, theta=theta, distanceMin=distanceMin, distanceMax=distanceMax)
# 		msg = {"type": "msg:apply_force", "force": "manyBody", "params": params}
# 		self.send(msg)

# 	def link_force(self, name: str, strength: float = -30.0, distance: float = None, iterations: int = 1):
# 		params = dict(name=name, strength=strength, distance=distance, iterations=iterations)
# 		msg = {"type": "msg:apply_force", "force": "link", "params": params}
# 		self.send(msg)

# 	def collide_force(self, name: str, strength: float = -30.0, radius: float = None, iterations: int = 1):
# 		params = dict(name=name, strength=strength, radius=radius, iterations=iterations)
# 		msg = {"type": "msg:apply_force", "force": "collide", "params": params}
# 		self.send(msg)
# 		return self

# 	def center_force(self, name: str, x: float, y: float = 0.0, strength: float = 1.0):
# 		params = dict(name=name, x=x, y=y, strength=strength)
# 		msg = {"type": "msg:apply_force", "force": "center", "params": params}
# 		self.send(msg)
# 		return self
