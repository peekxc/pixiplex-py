import pathlib

import numpy as np

from pixiplex import load_les_miserables
from pixiplex.pixinet import ForceConfig, Pixinet


def _small_graph():
    node_ids = np.array([0, 1, 2, 3, 4, 5])
    edgelist = np.array(
        [[0, 1], [0, 2], [2, 3], [1, 3], [3, 5], [1, 4], [4, 5]], dtype=np.int64
    )
    return node_ids, edgelist


def test_load_les_miserables_has_expected_structure():
    node_ids, edgelist = load_les_miserables()

    assert node_ids.ndim == 1
    assert edgelist.ndim == 2
    assert edgelist.shape[1] == 2
    assert len(node_ids) > 10
    assert len(edgelist) > 10
    assert node_ids.min() == 0
    assert node_ids.max() == len(node_ids) - 1


def test_pixinet_initialization_populates_traitlets():
    node_ids, edgelist = _small_graph()
    widget = Pixinet(node_ids=node_ids, edgelist=edgelist, width=400, height=300)

    assert widget.width == 400
    assert widget.height == 300
    assert widget.nodes == [
        {"id": 0},
        {"id": 1},
        {"id": 2},
        {"id": 3},
        {"id": 4},
        {"id": 5},
    ]
    assert widget.links == [
        {"source": 0, "target": 1},
        {"source": 0, "target": 2},
        {"source": 2, "target": 3},
        {"source": 1, "target": 3},
        {"source": 3, "target": 5},
        {"source": 1, "target": 4},
        {"source": 4, "target": 5},
    ]


def test_force_config_serializes_with_expected_keys():
    forces = (
        ForceConfig()
        .center(x=30, y=40)
        .link(distance=45, strength=0.25)
        .many_body(strength=-60, distance_max=float("inf"))
        .x(strength=0.02)
        .y(strength=0.03)
    )

    serialized = ForceConfig.as_dict(forces, widget=None)

    assert set(serialized) == {"center", "link", "charge", "x", "y"}
    assert serialized["center"]["type"] == "forceCenter"
    assert serialized["link"]["params"]["distance"] == 45
    assert serialized["link"]["params"]["strength"] == 0.25
    assert serialized["charge"]["params"]["distanceMax"] is None


def test_center_sends_expected_message(monkeypatch):
    node_ids, edgelist = _small_graph()
    widget = Pixinet(node_ids=node_ids, edgelist=edgelist, width=400, height=300)
    sent = []

    def _capture(msg):
        sent.append(msg)

    monkeypatch.setattr(widget, "send", _capture)
    widget.center(fit_zoom=True, x=10, y=15)

    assert sent == [{"type": "msg:center", "fit": True, "x": 10.0, "y": 15.0}]


def test_embed_raw_writes_minimal_html(tmp_path):
    node_ids, edgelist = _small_graph()
    widget = Pixinet(node_ids=node_ids, edgelist=edgelist)
    out_path = pathlib.Path(tmp_path) / "embed.html"

    widget.embed_raw(out_path)
    content = out_path.read_text()

    assert "pixiplex_container" in content
    assert "new Pixiplex" in content
    assert "const graph =" in content
