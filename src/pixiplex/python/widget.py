"""Anywidget-backed Pixinet widget host class."""

from __future__ import annotations

import pathlib
from typing import Optional

import anywidget
import traitlets
from numpy.typing import ArrayLike

from .forces import ForceConfig
from .styles import NodeStyle

OUTPUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "static"


class Pixinet(anywidget.AnyWidget):
    """Python host for the Pixi/d3 force-directed graph widget."""

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

    node_color = traitlets.List(trait=traitlets.Unicode, default_value=[]).tag(
        sync=True
    )
    node_radii = traitlets.List(trait=traitlets.Float, default_value=[]).tag(sync=True)
    node_value = traitlets.Int(0).tag(sync=True)

    node_style = traitlets.Instance(NodeStyle).tag(sync=True, to_json=NodeStyle.as_dict)
    forces = traitlets.Instance(ForceConfig).tag(sync=True, to_json=ForceConfig.as_dict)

    def __init__(
        self,
        node_ids: ArrayLike,
        edgelist: ArrayLike,
        width: int = 250,
        height: int = 250,
        forces: Optional[ForceConfig] = None,
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

    def center(
        self, fit_zoom: bool = False, x: float | None = None, y: float | None = None
    ):
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

        ipywidgets.embed.embed_minimal_html(
            str(path.resolve()), views=[self], drop_defaults=False
        )

    def embed_state(self, path: pathlib.Path = None):
        from ipywidgets.embed import embed_data

        return embed_data(self)

    def embed_raw(self, path: pathlib.Path | str):
        import json

        path = pathlib.Path(path)
        graph = {}
        graph["nodes"] = [{"id": i} for i in self.node_ids]
        graph["links"] = [
            {"source": i, "target": j} for i, j in zip(self.src_ids, self.tgt_ids)
        ]
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
        path.write_text(html_template)
