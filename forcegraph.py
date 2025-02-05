# %%
import numpy as np
from numpy.typing import ArrayLike
import json
from traitlets import observe
from pathlib import Path
import traitlets
import anywidget

# %%


widget = Widget(node_ids, edgelist, width=350, height=350)
widget

# %%
widget.center(True)
