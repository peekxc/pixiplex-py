import json
from pathlib import Path
from ipyforcegraph.graphs import ForceGraph
data = json.loads(Path("/Users/mpiekenbrock/Downloads/miserables.json").read_text())
fg2 = ForceGraph()
fg2.source.nodes, fg2.source.links = data["nodes"], data["links"]
fg2