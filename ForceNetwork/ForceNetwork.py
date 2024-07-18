import numpy as np
from pathlib import Path
from bokeh.core.properties import Instance, String
from bokeh.models import ColumnDataSource, LayoutDOM, Scatter, Plot
from bokeh.models import DataRenderer
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript, JavaScript
from bokeh.core.properties import String, Instance, Array, Float, ColumnData
from bokeh.models import UIElement, Slider, Scatter

# from bokeh.io import output_notebook
# output_notebook()
CODE = Path('/Users/mpiekenbrock/pixiplex-py/ForceNetwork/ForceNetwork.ts').read_text()

class ForceNetwork(LayoutDOM):
  __javascript__ = [
		"https://unpkg.com/d3-force@3.0.0/dist/d3-force.min.js",
		"https://unpkg.com/d3-quadtree@3.0.1/dist/d3-quadtree.min.js",
		"https://unpkg.com/d3-timer@3.0.1/dist/d3-timer.min.js",
		"https://unpkg.com/d3-dispatch@3.0.1/dist/d3-dispatch.min.js"
	]
  __implementation__ = TypeScript(CODE)
  node_source = Instance(ColumnDataSource) # x, y, id
  edge_source = Instance(ColumnDataSource) # i, j 
  plot = Instance(Plot) 
  
  def __init__(self, x: np.ndarray, y: np.ndarray, **kwargs):
    super().__init__(**kwargs) # initializes properties above
    assert len(x) == len(y), "Must have same length"
    self.node_source = ColumnDataSource(data=dict(x=x, y=y, id=np.arange(len(x))))
    I = np.arange(len(x))
    J = np.random.choice(I, size=len(I))
    self.edge_source = ColumnDataSource(data=dict(I=I, J=J))
    self.plot = figure(width=300, height=300)
    self.plot.scatter(x="x", y="y", color='blue', source=self.node_source)

x = np.random.uniform(size=100)
y = np.random.uniform(size=100)
p = figure(width=300, height=300)
p.scatter(x=x, y=y, color='blue')

force_plot = ForceNetwork(x=x, y=y)

show(force_plot)

# force_plot.edge_source
# force_plot.node_source.data

# dir(force_plot.plot)

# xx, yy = np.meshgrid(x, y)
# xx = xx.ravel()
# yy = yy.ravel()
# value = np.sin(xx / 50) * np.cos(yy / 50) * 50 + 50

# source = ColumnDataSource(data=dict(x=xx, y=yy, z=value))

# surface = Surface3d(x="x", y="y", z="z", data_source=source, width=600, height=600)
