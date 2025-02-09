import param
import numpy as np
import panel as pn
from pixiplex import PixinetPanel, load_les_miserables

pn.extension()


node_ids, edgelist = load_les_miserables()
p = PixinetPanel(node_ids, edgelist, width=350, height=350)

node_color_button = pn.widgets.Button(name="Node color")
node_scale_slider = pn.widgets.FloatSlider(name="Node scale", start=0.10, end=10.0, step=0.10, value=1.0)

force_manybody_distance_slider = pn.widgets.FloatSlider(name="Distance", start=1.0, end=100.0, step=1.0, value=30.0)


def update_node_color(event):
	p.node_color = ["0xff0000"] * len(p.node_ids)


def update_force_distance(event: float):
	# print(event)
	p.forces["spring"]["distance"] = event
	p.send({"type": "msg:apply_forces", "params": p.forces})


pn.bind(update_node_color, node_color_button, watch=True)
pn.bind(update_force_distance, force_manybody_distance_slider, watch=True)

# fmt: off
pn.Row(
	pn.Column(
		node_color_button, 
		node_scale_slider,
		force_manybody_distance_slider
	), 
	p
).servable()
# fmt: on

# pn.Column(button, p).servable()


# class ForceDashboard(pn.viewable.Viewer):
# 	node_scale = pn.widgets.FloatSlider(name="Node scale", start=0.10, end=10.0, step=0.10, value=1.0)

# 	@param.depends("node_scale")
# 	def plot(self):
# 		return p

# 	def __panel__(self):
# 		# button = pn.widgets.Button(name="Click me", button_type="primary")
# 		# return pn.Row(pn.Param(self, width=300, name="Plot Settings"), self.plot)
# 		pn.Row(p)
# 		return p.servable()
