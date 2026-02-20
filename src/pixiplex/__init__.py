"""pixiplex library."""

__version__ = "0.0.1"
import json
from pathlib import Path
from .pixinet import EdgeStyle, ForceConfig, NodeStyle, Pixinet


def load_les_miserables():
    import numpy as np

    OUTPUT_DIR = Path(__file__).parent / "static" / "data"

    data = json.loads(Path(OUTPUT_DIR / "les_miserables.json").read_text())
    node_ids = np.unique([n["id"] for n in data["nodes"]])
    src_ids = np.array([e["source"] for e in data["links"]])
    tgt_ids = np.array([e["target"] for e in data["links"]])

    src_ids = np.searchsorted(node_ids, src_ids)
    tgt_ids = np.searchsorted(node_ids, tgt_ids)
    node_ids = np.searchsorted(node_ids, node_ids)
    edgelist = np.c_[src_ids, tgt_ids]

    return node_ids, edgelist
