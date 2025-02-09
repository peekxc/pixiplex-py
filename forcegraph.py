# %%
import json
from pathlib import Path

import numpy as np
from pixiplex import Pixinet, load_les_miserables

# %%
node_ids, edgelist = load_les_miserables()
p = Pixinet(node_ids, edgelist, width=350, height=350)
p

# %%
p.node_color = ["0xff0000"] * len(node_ids)

# %%
from bokeh.plotting import figure, show
from bokeh.io import output_notebook

output_notebook()

p = figure(width=350, height=350)
p.scatter([0, 1, 2, 3, 4], [0, 1, 2, 3, 4])
show(p)
