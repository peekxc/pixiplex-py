import { LayoutDOM, LayoutDOMView } from "models/layouts/layout_dom";
import { Plot } from "models/plots/plot";
// import { div } from "core/dom";
import { build_view } from "core/build_views";
import { ColumnDataSource } from "models/sources/column_data_source";
import * as p from "core/properties";

const d3 = (...args) => any;

class ForcePlotView extends LayoutDOMView {
  initialize() {
    super.initialize();
    console.log("Initializing....");
    console.log(this);

    // Log the plot
    console.log("ForcePlotView's model: ");
    console.log(this.model);
    this.el.style.width = '500px';
    this.el.style.height = '500px';

    this.plot_div = document.createElement('div');
    this.plot_div.style.height = '100%';
    this.plot_div.style.width = '100%';
    this.el.appendChild(this.plot_div);

    // Attach listeners
    this._init_listeners();
  }

  async render() {
    await super.render();
    await this.render_plot();
  }

  async render_plot() {
    const plot_view = await build_view(this.model.plot);
    console.log("build view of figure: ");
    console.log(plot_view);
    this.plot_div.innerHTML = '';
    plot_view.render_to(this.plot_div);
    console.log("d3: ");
    console.log(d3);
    this.run_simulation();
  }

  run_simulation() {
    const simulation = d3.forceSimulation([0, 1, 2, 3, 4, 5]);
    console.log(simulation);
  }

  get child_models() {
    return [this.model.plot];
  }

  _init_listeners() {
    console.log("initializing on-change connections");
    this.connect(this.model.my_source.change, () => {
      console.log("Model data source changed!");
    });
  }
}

export namespace ForcePlot {
  export type Attrs = p.AttrsOf< Props >
  export type Props = LayoutDOM.Props & {
    x: p.Property< p.ArraySpec >
    y: p.Property< p.ArraySpec >
    my_source: p.Property< ColumnDataSource >
    plot: p.Property< Plot >
  }
}

export interface ForcePlot extends ForcePlot.Attrs {}

export class ForcePlot extends LayoutDOM {
  declare properties: ForcePlot.Props
  declare __view_type__: ForcePlotView

  constructor(attrs?: Partial< ForcePlot.Attrs >) {
    super(attrs)
    console.log("Begin constructing ForcePlot")
  }
  static __name__ = "ForcePlot"
  static {
    this.prototype.default_view = ForcePlotView
    this.define< ForcePlot.Props >(({ Any, Ref }) => ({
      x:            [ Any ],
      y:            [ Any ],
      // plot: [Ref(Plot), () => new Figure()]
      my_source: [Ref(ColumnDataSource)], 
      plot: [Ref(Plot)],
    }))
  }
}

