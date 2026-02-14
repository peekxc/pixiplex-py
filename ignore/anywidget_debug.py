import anywidget
import traitlets


class CounterWidget(anywidget.AnyWidget):
	_esm = """
    function render({ model, el }) {
      let button = document.createElement("button");
      button.innerHTML = `count is ${model.get("value")}`;
      model.on("change:value", () => {
				console.log("Value change callback called");
				button.innerHTML = `count is ${model.get("value")}`;
      });
			model.on("change:vlist", () => {
				console.log("Value list change callback called");
				const values = model.get("vlist");
      });
      el.classList.add("counter-widget");
      el.appendChild(button);
    }
    export default { render };
    """
	_css = """
    .counter-widget button { color: white; font-size: 1.75rem; background-color: #ea580c; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; }
    .counter-widget button:hover { background-color: #9a3412; }
    """
	value = traitlets.Int(default_value=0).tag(sync=True)
	vlist = traitlets.List(default_value=[0, 0, 0, 0]).tag(sync=True)


c = CounterWidget()
c.vlist = [0, 1, 2, 3]
