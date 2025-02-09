"""pixiplex/pixninet.py"""

import pathlib
import traitlets
import anywidget
import numpy as np
from numpy.typing import ArrayLike

OUTPUT_DIR = pathlib.Path(__file__).parent / "static"


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
	node_radii = traitlets.List(trait=traitlets.Unicode, default_value=[]).tag(sync=True)
	node_value = traitlets.Int(0).tag(sync=True)

	# node_color = traitlets.List(trait=traitlets.Unicode).tag(sync=True)

	forces = traitlets.Dict(key_trait=traitlets.Unicode)  # value_trait=traitlets.Dict(value_trait=),

	def __init__(self, node_ids: ArrayLike, edgelist: ArrayLike, width: int = 250, height: int = 250) -> None:
		super().__init__()
		self.width = width
		self.height = height
		self.node_ids = list(node_ids)
		self.src_ids = list(edgelist[:, 0])
		self.tgt_ids = list(edgelist[:, 1])
		self.forces = {
			"spring": {"distance": +30.0, "iterations": 1},
			"charge": {"strength": -30.0, "distanceMin": 1, "distanceMax": np.inf},
			"center": {"x": 0.0, "y": 0.0},
		}

	@property
	def x(self):
		self.send({"type": "msg:sync_node_coordinates"})
		return self._x

	# @x.setter
	# def x(self, value: ArrayLike):
	# 	value = np.atleast_1d(value).astype(np.float32).ravel()
	# 	assert len(value) == len(self.node_ids)
	# 	self._x = value

	def center(self, fit_zoom: bool = False, x: float = None, y: float = None):
		msg = {"type": "msg:center", "fit": fit_zoom}
		msg["x"] = float(x) if x is not None else (self.width * self.scale / 2)
		msg["y"] = float(y) if y is not None else (self.height * self.scale / 2)
		self.send(msg)

	def manybody_force(
		self, name: str, strength: float = -30.0, theta: float = 0.90, distanceMin: float = 1.0, distanceMax: float = np.inf
	):
		params = dict(name=name, strength=strength, theta=theta, distanceMin=distanceMin, distanceMax=distanceMax)
		msg = {"type": "msg:apply_force", "force": "manyBody", "params": params}
		self.send(msg)

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


import param
from panel.custom import AnyWidgetComponent


class PixinetPanel(AnyWidgetComponent):
	_esm = OUTPUT_DIR / "widget.js"
	_css = OUTPUT_DIR / "widget.css"

	scale = param.Number(2.0)
	width = param.Integer(400)
	height = param.Integer(400)

	node_ids = param.List(item_type=int)
	src_ids = param.List(item_type=int)
	tgt_ids = param.List(item_type=int)

	_x = param.List(item_type=float)
	_y = param.List(item_type=float)

	node_color = param.List(item_type=str)
	node_radii = param.List(item_type=str)
	node_value = param.Integer(0)
	forces = param.Dict()  # value_trait=traitlets.Dict(value_trait=),

	def __init__(self, node_ids: ArrayLike, edgelist: ArrayLike, width: int = 250, height: int = 250) -> None:
		super().__init__()
		self.width = width
		self.height = height
		self.node_ids = list(map(int, node_ids))
		self.src_ids = list(map(int, edgelist[:, 0]))
		self.tgt_ids = list(map(int, edgelist[:, 1]))
		self.forces = {
			"spring": {"type": "forceManyBody", "distance": +30.0, "iterations": 1},
			"charge": {"type": "forceLink", "strength": -30.0, "distanceMin": 1, "distanceMax": np.inf},
			"center": {"type": "forceCenter", "x": 0.0, "y": 0.0},
		}
		# alpha: 1,
		# force: { // < name > : { enabled: < boolean >, type: < force type >, params: { < force parameters > } }
		# 	charge: { enabled: true, type: "forceManyBody", params: _default_manybody_params },
		# 	link: { enabled: true, type: "forceLink", params: _default_link_params },
		# 	center: { enabled: true, type: "forceCenter", params: _default_center_params }
		# }

	@property
	def x(self):
		self.send({"type": "msg:sync_node_coordinates"})
		return self._x

	def center(self, fit_zoom: bool = False, x: float = None, y: float = None):
		msg = {"type": "msg:center", "fit": fit_zoom}
		msg["x"] = float(x) if x is not None else (self.width * self.scale / 2)
		msg["y"] = float(y) if y is not None else (self.height * self.scale / 2)
		self.send(msg)

	def manybody_force(
		self, name: str, strength: float = -30.0, theta: float = 0.90, distanceMin: float = 1.0, distanceMax: float = np.inf
	):
		params = dict(name=name, strength=strength, theta=theta, distanceMin=distanceMin, distanceMax=distanceMax)
		msg = {"type": "msg:apply_force", "force": "manyBody", "params": params}
		self.send(msg)

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
