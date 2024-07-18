import numpy as np
from pathlib import Path
from bokeh.core.properties import Instance, String
from bokeh.models import ColumnDataSource, LayoutDOM, Scatter, Plot
from bokeh.models import GraphRenderer
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript
from bokeh.core.properties import String, Instance, Array, Float, ColumnData
from bokeh.models import UIElement, Slider, Scatter

x = np.random.uniform(size=100)
y = np.random.uniform(size=100)
node_source = ColumnDataSource({'x': x, 'y': y})
# node_source = ColumnDataSource()

p = figure(width=300, height=300)
p.graph(node_source=node_source)




# from bokeh.io import output_notebook
# output_notebook()
CODE = Path('/Users/mpiekenbrock/pixiplex-py/ForcePlot.ts').read_text()

class ForcePlot(LayoutDOM):
  __implementation__ = TypeScript(CODE)
  x = Array(Float)
  y = Array(Float)
  plot = Instance(Plot) 
  
  def __init__(self, **kwargs):
    super().__init__(**kwargs)
    self.plot = figure(width=300, height=300)
    self.plot.scatter(x=self.x, y=self.y, color='blue')

x = np.random.uniform(size=100)
y = np.random.uniform(size=100)
p = figure(width=300, height=300)
p.scatter(x=x, y=y, color='blue')

force_plot = ForcePlot(x=x, y=y, plot=p)

show(force_plot.plot)

# xx, yy = np.meshgrid(x, y)
# xx = xx.ravel()
# yy = yy.ravel()
# value = np.sin(xx / 50) * np.cos(yy / 50) * 50 + 50

# source = ColumnDataSource(data=dict(x=xx, y=yy, z=value))

# surface = Surface3d(x="x", y="y", z="z", data_source=source, width=600, height=600)
