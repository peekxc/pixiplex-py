# %%
import json
from pathlib import Path

import numpy as np
from pixiplex import Pixinet, load_les_miserables

# %%
node_ids, edgelist = load_les_miserables()
p = Pixinet(node_ids, edgelist, width=350, height=350)
p

import json

## Good news is widget state is quite small
## Bad news is its just a specific format, might be better to have our own
json.dump(p.embed_state(), fp=open("widget_state.json", "w"))
state = p.embed_state()
list(state["manager_state"].keys())

data = p.embed_state()
html_template = """
<html>
  <head>

    <title>Widget export</title>

    <!-- Load RequireJS, used by the IPywidgets for dependency management -->
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js"
      integrity="sha256-Ae2Vz/4ePdIu6ZyI/5ZGsYnb+m0JlOmKPjt6XZ9JJkA="
      crossorigin="anonymous">
    </script>

    <!-- Load IPywidgets bundle for embedding. -->
    <script
      data-jupyter-widgets-cdn="https://unpkg.com/"
      data-jupyter-widgets-cdn-only
      src="https://cdn.jsdelivr.net/npm/@jupyter-widgets/html-manager@*/dist/embed-amd.js"
      crossorigin="anonymous">
    </script>

    <!-- The state of all the widget models on the page -->
    <script type="application/vnd.jupyter.widget-state+json">
      {manager_state}
    </script>
  </head>

  <body>

    <h1>Widget export</h1>

    <div id="first-slider-widget">
      <!-- This script tag will be replaced by the view's DOM tree -->
      <script type="application/vnd.jupyter.widget-view+json">
        {widget_views[0]}
      </script>
    </div>
  </body>
</html>
"""

manager_state = json.dumps(data["manager_state"])
widget_views = [json.dumps(view) for view in data["view_specs"]]
rendered_template = html_template.format(manager_state=manager_state, widget_views=widget_views)
with open("export.html", "w") as fp:
	fp.write(rendered_template)

import ipywidgets

ipywidgets.embed.embed_minimal_html("tmp.html", views=[p], drop_defaults=False)
# %%
p.node_color = ["0xff0000"] * len(node_ids)
p
p.node_color

# %%
from bokeh.plotting import figure, show
from bokeh.io import output_notebook

output_notebook()

p = figure(width=350, height=350)
p.scatter([0, 1, 2, 3, 4], [0, 1, 2, 3, 4])
show(p)
