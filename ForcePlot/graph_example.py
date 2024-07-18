import numpy as np
import itertools as it
from bokeh.plotting import figure, show
from bokeh.models import Circle, GraphRenderer, Ellipse, MultiLine, StaticLayoutProvider, Scatter, MultiLine
from bokeh.palettes import Spectral8
from bokeh.io import output_notebook
output_notebook()

# %% 
## Configure the graph data 
N = 100
edges = np.array([(i,j) for (i,j) in it.combinations(range(N), 2) if np.random.uniform(size=1) <= 0.20])

## Figure + Graph renderer
p = figure(width=300, height=300, title="Graph demo")
g = GraphRenderer()

g.node_renderer.glyph = Scatter(size=8)
g.node_renderer.data_source.data = dict(
  index = np.arange(N),
  x = np.random.uniform(size=N, low=0, high=1),
  y = np.random.uniform(size=N, low=0, high=1)
)

g.edge_renderer.glyph = MultiLine()
g.edge_renderer.data_source.data = dict(
  start=edges[:,0], 
  end=edges[:,1]
)

node_data = g.node_renderer.data_source.data
g.layout_provider = StaticLayoutProvider(graph_layout = dict(zip(node_data['index'], zip(node_data['x'], node_data['y']))))

p.renderers.append(g)
show(p)

# Possible places for coordinates: 
# g.node_renderer.data_source.data 
# 




# %%
