## DOESNT WORK: bokeh needs LayoutDOM
import numpy as np

from bokeh.io import curdoc
from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, Slider, TextInput, widget
from bokeh.plotting import figure
from pixiplex import Pixinet, load_les_miserables
from ipywidgets_bokeh import IPyWidget

from bokeh.io import show
from bokeh.models import Button, CustomJS

button = Button(label="Change node color", button_type="success")
# button.js_on_event("button_click", CustomJS(code="console.log('button: click!', this.toString())"))

node_ids, edgelist = load_les_miserables()
p = Pixinet(node_ids, edgelist, width=350, height=350)

button.on_event("button_click", lambda: print("hello"))


## Set up callbacks
def update_node_color(attrname, old, new):
	p.node_color = list(np.repeat("0xff0000", len(node_ids)))


# ipw = IPyWidget(widget=p)

curdoc().add_root(row(button, p))
curdoc().title = "Sliders"
