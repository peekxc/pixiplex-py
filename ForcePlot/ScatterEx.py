from bokeh.models import ColumnDataSource, LayoutDOM, Plot
from bokeh.util.compiler import TypeScript
from bokeh.core.properties import Instance
from bokeh.plotting import figure

from bokeh.io import output_notebook
output_notebook()

TS_CODE = """
import {ColumnDataSource} from "models/sources/column_data_source"
import {LinearAxis} from "models/axes/linear_axis"
import {PanTool, WheelZoomTool, SaveTool} from "models/tools"
import {LayoutDOM, LayoutDOMView} from "models/layouts/layout_dom"
import {Slider} from "models/widgets/slider"
import {Button} from "models/widgets/button"
import {Figure} from "models/plots/figure"
import {Circle} from "models/glyphs/circle"
import {Row} from "models/layouts/row"

export class CustomLayoutView extends LayoutDOMView {
    initialize(): void {
        super.initialize()
        const fig = this.model.figure

        const data_source = new ColumnDataSource({
            data: {x: [1, 2, 3, 4, 5], y: [6, 7, 2, 4, 5]}
        })

        const circle = new Circle({
            x: {field: "x"},
            y: {field: "y"},
            size: 10,
            fill_color: "blue"
        })

        fig.add_glyph(data_source, circle)

        const x_axis = new LinearAxis({axis_label: "X Axis"})
        const y_axis = new LinearAxis({axis_label: "Y Axis"})

        fig.add_layout(x_axis, "below")
        fig.add_layout(y_axis, "left")

        fig.add_tools(new PanTool(), new WheelZoomTool(), new SaveTool())

        // Create additional controls or widgets
        const slider = new Slider({value: 1, start: 1, end: 10, step: 1, title: "Slider"})
        const button = new Button({label: "Click Me"})

        // Arrange the figure and widgets in a layout
        const layout = new Row({
            children: [fig, slider, button]
        })

        this.set_layout(layout)
    }
}

export class CustomLayout extends LayoutDOM {
    static init_CustomLayout(): void {
        this.prototype.default_view = CustomLayoutView

        this.define<CustomLayout.Props>({
            figure: [p.Instance, () => figure({
                title: "Custom Scatter Plot",
                plot_width: 400,
                plot_height: 400,
                toolbar_location: "above"
            })],
        })
    }
}
"""

class CustomLayout(LayoutDOM):
    __implementation__ = TypeScript(TS_CODE)

    figure = Instance(Plot)
    
    def __init__(self, **kwargs):
      super().__init__(**kwargs)
      self.figure = figure(
          title="Custom Scatter Plot",
          width=400,
          height=400,
          toolbar_location="above"
      )
      self.figure.scatter([0,1,2,3,4], [0,1,2,3,4])

# Example usage
from bokeh.io import show
from bokeh.layouts import column

custom_layout = CustomLayout()

show(custom_layout)
