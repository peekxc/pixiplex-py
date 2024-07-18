import numpy as np
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, GraphRenderer, Circle, MultiLine, Button
from bokeh.plotting import figure, show
from bokeh.palettes import Spectral4
from bokeh.models import CustomJS
from bokeh.events import ButtonClick
from bokeh.util.compiler import TypeScript, JavaScript
from pathlib import Path
from bokeh.models import LayoutProvider
from bokeh.core.properties import Int, Float, Instance

# Assume D3ForceLayout is properly imported from the compiled TypeScript
CODE = Path('/Users/mpiekenbrock/pixiplex-py/D3Force.ts').read_text()
# CODE = Path('/Users/mpiekenbrock/pixiplex-py/D3Force.js').read_text()

# Create a Bokeh model for D3ForceLayout
class D3ForceLayout(LayoutProvider):
	__javascript__ = [
		"https://unpkg.com/d3-force@3.0.0/dist/d3-force.min.js",
		"https://unpkg.com/d3-quadtree@3.0.1/dist/d3-quadtree.min.js",
		"https://unpkg.com/d3-timer@3.0.1/dist/d3-timer.min.js",
		"https://unpkg.com/d3-dispatch@3.0.1/dist/d3-dispatch.min.js"
	]
	__implementation__ = TypeScript(CODE)
	# __implementation__ = JavaScript(CODE)
	# graph_source = Instance(ColumnDataSource, default=ColumnDataSource({}))
	iterations = Int(default=50)
	linkDistance = Float(default=20)
	linkStrength = Float(default=1)
	charge = Float(default=-30)
	node_source = Instance(ColumnDataSource)
	edge_source = Instance(ColumnDataSource)
	def __init__(self, **kwargs):
		super().__init__(**kwargs) # initializes properties above
		self.iterations = 50
		self.linkDistance = 20

		# self.graph_source = ColumnDataSource(data={})


node_indices = np.arange(10)
node_data = ColumnDataSource({
	'index': list(node_indices),
	'name': [str(i) for i in node_indices],
	'x': list(np.random.uniform(size=len(node_indices), low=-1, high=1)),  # Initial x positions
	'y': list(np.random.uniform(size=len(node_indices), low=-1, high=1)),  # Initial y positions
})

edge_data = ColumnDataSource({
	'start': [0]*len(node_indices),
	'end': list(node_indices),
})

p = figure(
	title="Interactive D3 Force-Directed Graph", 
	x_range=(-1, 1), y_range=(-1, 1),
	tools="pan,wheel_zoom,box_zoom,reset,save", 
	toolbar_location="above"
)

# Create D3ForceLayout
# graph_data_source = ColumnDataSource({ 'nodes': list(node_indices) })
g = GraphRenderer()
g.node_renderer = p.circle('x', 'y', size=10, fill_color=Spectral4[0], source=node_data, line_width=0.5, line_color='black')
g.edge_renderer = p.multi_line('start', 'end', line_color=Spectral4[1], line_alpha=0.8, line_width=1, source=edge_data)

# Graph 
node_src = ColumnDataSource(dict(x=[], y=[]))
d3_layout = D3ForceLayout(
	iterations=50, linkDistance=20, linkStrength=1, charge=-30, 
	node_source=node_src, 
	edge_source=node_src
)
g.layout_provider = d3_layout
p.renderers.append(g)

# Create a button to trigger layout updates
update_button = Button(label="Update Layout", button_type="primary")
update_callback = CustomJS(args=dict(layout=d3_layout), code="""
	layout.get_layout()
""")
update_button.js_on_event(ButtonClick, update_callback)


show(column(p, update_button))