import anywidget
import traitlets
from shiny import App, reactive, render, ui
from shinywidgets import render_widget, output_widget

# for member in ["vint", "vstring", "vdict", "vlist", "vtuple"]:
# 	model.on("change:vdict", () => {
# 		console.log("Value dict change callback called");
# 	});


class CounterWidget(anywidget.AnyWidget):
	_esm = """
    function render({ model, el }) {
      let button = document.createElement("button");
      button.innerHTML = `count is ${model.get("value")}`;
      model.on("change:value", () => {
        console.log("Value change callback called");
        button.innerHTML = `count is ${model.get("value")}`;
      });
      model.on("change:vstring", () => {
        console.log("String change callback called");
      });
      model.on("change:vlist", () => {
        console.log("Value list change callback called");
        const vlist = model.get("vlist");
      });
      model.on("change:vdict", () => {
        console.log("Value dict change callback called");
        const vdict = model.get("vdict");
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
	vstring = traitlets.CUnicode().tag(sync=True)
	vlist = traitlets.List().tag(sync=True)
	vdict = traitlets.Dict().tag(sync=True)
	vtuple = traitlets.Tuple().tag(sync=True)
	vset = traitlets.Set().tag(sync=True)


app_ui = ui.page_fixed(
	ui.input_action_button("modify_int", "Modify int"),
	ui.input_action_button("modify_str", "Modify string"),
	ui.input_action_button("modify_list", "Modify list"),
	ui.input_action_button("modify_dict", "Modify dict"),
	ui.input_action_button("modify_tuple", "Modify tuple"),
	ui.input_action_button("modify_set", "Modify set"),
	# ui.output_ui("counter"),
	output_widget("counter"),
)


def server(input, output, session):
	@render_widget
	def counter():
		c = CounterWidget(value=0)
		return c

	@reactive.effect
	def modify_int():
		input.modify_int()  # dependency injection
		counter.widget.set_trait("value", counter.widget.value + 1)

	@reactive.effect
	def modify_str():
		input.modify_str()  # dependency injection
		counter.widget.set_trait("vstring", counter.widget.vstring + "a")

	@reactive.effect
	def modify_list():
		input.modify_list()  # dependency injection
		counter.widget.set_trait("vlist", [1, 2, 3, 4])

	@reactive.effect
	def modify_dict():
		input.modify_dict()  # dependency injection
		counter.widget.set_trait("vdict", {"a": [0, 1, 2, 3]})

	@reactive.effect
	def modify_tuple():
		input.modify_tuple()  # dependency injection
		counter.widget.set_trait("vtuple", (0, 1, 2, 3))


app = App(app_ui, server)
