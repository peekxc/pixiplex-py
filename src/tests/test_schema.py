import numpy as np
from jsonschema import validate
from pixiplex.pixinet import Pixinet


def test_schema():
	edgelist = np.array([[0, 1], [0, 2], [2, 3], [1, 3], [3, 5], [1, 4], [4, 5]])
	pn = Pixinet(node_ids=[0, 1, 2, 3, 4, 5], edgelist=edgelist)
	# pn.embed_state
