"""Anywidget-backed Pixinet widget host class."""

from __future__ import annotations

import json
import pathlib
from typing import Any, Optional

import traitlets
from numpy.typing import ArrayLike

from .forces import ForceConfig
from .styles import EdgeStyle, NodeStyle

try:
    import anywidget
except (
    ModuleNotFoundError
):  # pragma: no cover - fallback for non-widget test environments
    anywidget = None


class _FallbackAnyWidget(traitlets.HasTraits):
    def send(self, _msg: dict[str, Any]) -> None:
        return None


AnyWidgetBase = anywidget.AnyWidget if anywidget is not None else _FallbackAnyWidget

OUTPUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "static"


def _normalize_nodes_links(
    nodes: Optional[list[dict[str, Any]]],
    links: Optional[list[dict[str, Any]]],
    node_ids: Optional[ArrayLike],
    edgelist: Optional[ArrayLike],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if nodes is not None or links is not None:
        return list(nodes or []), list(links or [])

    normalized_nodes = [
        {"id": int(node_id)}
        for node_id in (list(node_ids) if node_ids is not None else [])
    ]
    if edgelist is None:
        return normalized_nodes, []

    normalized_links = [
        {"source": int(edge[0]), "target": int(edge[1])} for edge in list(edgelist)
    ]
    return normalized_nodes, normalized_links


class Pixinet(AnyWidgetBase):
    """Python host for the Pixi/d3 force-directed graph widget."""

    _esm = OUTPUT_DIR / "widget.js"
    _css = OUTPUT_DIR / "widget.css"

    scale = traitlets.Float(2.0).tag(sync=True)
    width = traitlets.Int(250).tag(sync=True)
    height = traitlets.Int(250).tag(sync=True)

    nodes = traitlets.List(trait=traitlets.Dict()).tag(sync=True)
    links = traitlets.List(trait=traitlets.Dict()).tag(sync=True)

    _x = traitlets.List(trait=traitlets.Float()).tag(sync=True)
    _y = traitlets.List(trait=traitlets.Float()).tag(sync=True)

    node_style = traitlets.Instance(NodeStyle).tag(sync=True, to_json=NodeStyle.as_dict)
    line_style = traitlets.Instance(EdgeStyle).tag(sync=True, to_json=EdgeStyle.as_dict)
    forces = traitlets.Instance(ForceConfig).tag(sync=True, to_json=ForceConfig.as_dict)

    def __init__(
        self,
        node_ids: Optional[ArrayLike] = None,
        edgelist: Optional[ArrayLike] = None,
        *,
        nodes: Optional[list[dict[str, Any]]] = None,
        links: Optional[list[dict[str, Any]]] = None,
        width: int = 250,
        height: int = 250,
        scale: float = 2.0,
        forces: Optional[ForceConfig] = None,
        node_style: Optional[NodeStyle] = None,
        line_style: Optional[EdgeStyle] = None,
    ) -> None:
        super().__init__()
        normalized_nodes, normalized_links = _normalize_nodes_links(
            nodes=nodes, links=links, node_ids=node_ids, edgelist=edgelist
        )
        self.width = width
        self.height = height
        self.scale = scale
        self.nodes = normalized_nodes
        self.links = normalized_links
        self.forces = ForceConfig() if forces is None else forces
        self.node_style = NodeStyle() if node_style is None else node_style
        self.line_style = EdgeStyle() if line_style is None else line_style

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

    @property
    def graph(self) -> dict[str, list[dict[str, Any]]]:
        return {"nodes": list(self.nodes), "links": list(self.links)}

    def embed_html(self, path: pathlib.Path):
        import ipywidgets.embed

        ipywidgets.embed.embed_minimal_html(
            str(path.resolve()), views=[self], drop_defaults=False
        )

    def embed_state(self, path: pathlib.Path = None):
        from ipywidgets.embed import embed_data

        return embed_data(self)

    def to_standalone_html(
        self,
        path: pathlib.Path | str,
        *,
        inline_js: bool = True,
        title: str = "Pixiplex Export",
    ) -> pathlib.Path:
        path = pathlib.Path(path)
        pixinet_js = (OUTPUT_DIR / "pixinet.js").read_text()
        graph_json = json.dumps(self.graph)
        forces_json = json.dumps(ForceConfig.as_dict(self.forces, widget=self))
        node_style_json = json.dumps(NodeStyle.as_dict(self.node_style, widget=self))
        line_style_json = json.dumps(EdgeStyle.as_dict(self.line_style, widget=self))

        if inline_js:
            module_block = f"""
<script type=\"module\">
{pixinet_js}
const graph = {graph_json};
const pp = new Pixiplex(graph.nodes, graph.links, {self.width}, {self.height}, {self.scale}, {forces_json});
pp.node_style = {node_style_json};
pp.line_style = {line_style_json};
await pp.init_all();
document.getElementById("pixiplex_container").appendChild(pp.view);
window.pp = pp;
</script>
"""
        else:
            module_block = f"""
<script type=\"module\">
import {{ Pixiplex }} from "./pixinet.js";
const graph = {graph_json};
const pp = new Pixiplex(graph.nodes, graph.links, {self.width}, {self.height}, {self.scale}, {forces_json});
pp.node_style = {node_style_json};
pp.line_style = {line_style_json};
await pp.init_all();
document.getElementById("pixiplex_container").appendChild(pp.view);
window.pp = pp;
</script>
"""

        html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{title}</title>
  <style>
    html, body {{ margin: 0; padding: 0; }}
    #pixiplex_container {{ width: {self.width}px; height: {self.height}px; overflow: hidden; }}
  </style>
</head>
<body>
  <div id=\"pixiplex_container\"></div>
  {module_block}
</body>
</html>
"""
        path.write_text(html)
        return path

    def embed_raw(self, path: pathlib.Path | str):
        return self.to_standalone_html(path)
