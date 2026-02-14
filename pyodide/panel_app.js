importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js");

function sendPatch(patch, buffers, msg_id) {
  self.postMessage({
    type: 'patch',
    patch: patch,
    buffers: buffers
  })
}

async function startApplication() {
  console.log("Loading pyodide!");
  self.postMessage({type: 'status', msg: 'Loading pyodide'})
  self.pyodide = await loadPyodide();
  self.pyodide.globals.set("sendPatch", sendPatch);
  console.log("Loaded!");
  await self.pyodide.loadPackage("micropip");
  const env_spec = ['https://cdn.holoviz.org/panel/wheels/bokeh-3.6.2-py3-none-any.whl', 'https://cdn.holoviz.org/panel/1.6.0/dist/wheels/panel-1.6.0-py3-none-any.whl', 'pyodide-http==0.2.1', 'numpy', 'param', 'pixiplex']
  for (const pkg of env_spec) {
    let pkg_name;
    if (pkg.endsWith('.whl')) {
      pkg_name = pkg.split('/').slice(-1)[0].split('-')[0]
    } else {
      pkg_name = pkg
    }
    self.postMessage({type: 'status', msg: `Installing ${pkg_name}`})
    try {
      await self.pyodide.runPythonAsync(`
        import micropip
        await micropip.install('${pkg}');
      `);
    } catch(e) {
      console.log(e)
      self.postMessage({
	type: 'status',
	msg: `Error while installing ${pkg_name}`
      });
    }
  }
  console.log("Packages loaded!");
  self.postMessage({type: 'status', msg: 'Executing code'})
  const code = `
  \nimport asyncio\n\nfrom panel.io.pyodide import init_doc, write_doc\n\ninit_doc()\n\nimport param\nimport numpy as np\nimport panel as pn\nfrom pixiplex import PixinetPanel, load_les_miserables\n\npn.extension()\n\n\nnode_ids, edgelist = load_les_miserables()\np = PixinetPanel(node_ids, edgelist, width=350, height=350)\n\nnode_color_button = pn.widgets.Button(name="Node color")\nnode_scale_slider = pn.widgets.FloatSlider(name="Node scale", start=0.10, end=10.0, step=0.10, value=1.0)\n\nforce_manybody_distance_slider = pn.widgets.FloatSlider(name="Distance", start=1.0, end=100.0, step=1.0, value=30.0)\n\n\ndef update_node_color(event):\n\tp.node_color = ["0xff0000"] * len(p.node_ids)\n\n\ndef update_force_distance(event: float):\n\t# print(event)\n\tp.forces["spring"]["distance"] = event\n\tp.send({"type": "msg:apply_forces", "params": p.forces})\n\n\npn.bind(update_node_color, node_color_button, watch=True)\npn.bind(update_force_distance, force_manybody_distance_slider, watch=True)\n\n# fmt: off\npn.Row(\n\tpn.Column(\n\t\tnode_color_button, \n\t\tnode_scale_slider,\n\t\tforce_manybody_distance_slider\n\t), \n\tp\n).servable()\n# fmt: on\n\n# pn.Column(button, p).servable()\n\n\n# class ForceDashboard(pn.viewable.Viewer):\n# \tnode_scale = pn.widgets.FloatSlider(name="Node scale", start=0.10, end=10.0, step=0.10, value=1.0)\n\n# \t@param.depends("node_scale")\n# \tdef plot(self):\n# \t\treturn p\n\n# \tdef __panel__(self):\n# \t\t# button = pn.widgets.Button(name="Click me", button_type="primary")\n# \t\t# return pn.Row(pn.Param(self, width=300, name="Plot Settings"), self.plot)\n# \t\tpn.Row(p)\n# \t\treturn p.servable()\n\n\nawait write_doc()
  `

  try {
    const [docs_json, render_items, root_ids] = await self.pyodide.runPythonAsync(code)
    self.postMessage({
      type: 'render',
      docs_json: docs_json,
      render_items: render_items,
      root_ids: root_ids
    })
  } catch(e) {
    const traceback = `${e}`
    const tblines = traceback.split('\n')
    self.postMessage({
      type: 'status',
      msg: tblines[tblines.length-2]
    });
    throw e
  }
}

self.onmessage = async (event) => {
  const msg = event.data
  if (msg.type === 'rendered') {
    self.pyodide.runPythonAsync(`
    from panel.io.state import state
    from panel.io.pyodide import _link_docs_worker

    _link_docs_worker(state.curdoc, sendPatch, setter='js')
    `)
  } else if (msg.type === 'patch') {
    self.pyodide.globals.set('patch', msg.patch)
    self.pyodide.runPythonAsync(`
    from panel.io.pyodide import _convert_json_patch
    state.curdoc.apply_json_patch(_convert_json_patch(patch), setter='js')
    `)
    self.postMessage({type: 'idle'})
  } else if (msg.type === 'location') {
    self.pyodide.globals.set('location', msg.location)
    self.pyodide.runPythonAsync(`
    import json
    from panel.io.state import state
    from panel.util import edit_readonly
    if state.location:
        loc_data = json.loads(location)
        with edit_readonly(state.location):
            state.location.param.update({
                k: v for k, v in loc_data.items() if k in state.location.param
            })
    `)
  }
}

startApplication()