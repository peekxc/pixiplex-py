import numpy as np
from pathlib import Path
from bokeh.core.properties import Instance, String
from bokeh.models import ColumnDataSource, LayoutDOM, Scatter, Plot
from bokeh.models import DataRenderer
from bokeh.plotting import figure, show
from bokeh.util.compiler import TypeScript
from bokeh.core.properties import String, Instance, Array, Float, ColumnData
from bokeh.models import UIElement, Slider, Scatter

# from bokeh.io import output_notebook
# output_notebook()
CODE = Path('/Users/mpiekenbrock/pixiplex-py/ForcePlot.js').read_text()

class ForcePlot(LayoutDOM):
  __javascript__ = "https://unpkg.com/d3-force@3.0.0/dist/d3-force.min.js"
  __implementation__ = CODE
  x = Array(Float)
  y = Array(Float)
  my_source = Instance(ColumnDataSource)
  plot = Instance(Plot) 
  
  def __init__(self, x: np.ndarray, y: np.ndarray, plot, **kwargs):
    super().__init__(**kwargs) # initializes properties above
    self.my_source = ColumnDataSource(data=dict(x=x, y=y))
    self.x = x 
    self.y = y
    self.plot = plot
    self.plot.scatter(x="x", y="y", color='blue', source=self.my_source)

x = np.random.uniform(size=100)
y = np.random.uniform(size=100)
p = figure(width=300, height=300)
p.scatter(x=x, y=y, color='blue')

force_plot = ForcePlot(x=x, y=y, plot=p)

show(force_plot)

force_plot.data_source

dir(force_plot.plot)

# xx, yy = np.meshgrid(x, y)
# xx = xx.ravel()
# yy = yy.ravel()
# value = np.sin(xx / 50) * np.cos(yy / 50) * 50 + 50

# source = ColumnDataSource(data=dict(x=xx, y=yy, z=value))

# surface = Surface3d(x="x", y="y", z="z", data_source=source, width=600, height=600)
