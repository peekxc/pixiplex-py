import numpy as np
import json
from pathlib import Path

data = json.loads(Path("/Users/mpiekenbrock/Downloads/miserables.json").read_text())

# from scipy.sparse import sparray, csc_array, find

node_ids = np.unique([n["id"] for n in data["nodes"]])
src_ids = np.array([e["source"] for e in data["links"]])
tgt_ids = np.array([e["target"] for e in data["links"]])

src_ids = np.searchsorted(node_ids, src_ids)
tgt_ids = np.searchsorted(node_ids, tgt_ids)
node_ids = np.searchsorted(node_ids, node_ids)

edgelist = np.c_[src_ids, tgt_ids]
