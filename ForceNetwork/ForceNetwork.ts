// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LayoutDOM, LayoutDOMView } from "models/layouts/layout_dom";
import { Plot } from "models/plots/plot";
// import { div } from "core/dom";
// import { build_view } from "core/build_views";
import { ColumnDataSource } from "models/sources/column_data_source";
import * as p from "core/properties";

// const d3 = (...args) => any;

class ForceNetworkView extends LayoutDOMView {
  initialize() {
    super.initialize();
    console.log("Initializing....");
    console.log(this);

    // Log the plot
    console.log("ForceNetworkView's model: ");
    console.log(this.model);

    // this.plot_div = document.createElement('div');
    // this.plot_div.style.height = '100%';
    // this.plot_div.style.width = '100%';
    // this.el.appendChild(this.plot_div);

    // On-load start the simulation
    // const script = document.createElement("script")
    // script.onload = () => this._init_simulation()
    // script.async = false
    // document.head.appendChild(script)
    this._init_simulation()
    
    // Attach listeners
    this._init_listeners();
  }

  async render() {
    await super.render();
    await this.render_plot();
  }

  async render_plot() {
    // const plot_view = await build_view(this.model.plot);
    console.log("build view of figure: ");
    // console.log(plot_view);
    // this.plot_div.innerHTML = '';
    // plot_view.render_to(this.plot_div);
   
  }

  get child_models() {
    return [this.model.plot];
  }

  _init_listeners() {
    console.log("initializing on-change connections");
    this.connect(this.model.node_source.change, () => {
      console.log("Model node source changed!");
    });
  }
  _init_simulation(){
    console.log("d3: ");
    console.log(d3);
    console.log(this.model)
    // const {x, y, ids} = this.model.node_source.data;
    const IDS = this.model.node_source.data.id;
    const Y = this.model.node_source.data.y;
    const X = this.model.node_source.data.x;
    console.log("X: ")
    console.log(X)
    console.log("IDS: ")
    console.log(IDS)

    this.nodes = Array.from(IDS).map((id) => ({"id": id, "x": X[id], "y": Y[id]}))
    const simulation = d3.forceSimulation(this.nodes)
      .force('x', d3.forceX().strength(0.04).x(0))
      .force('y', d3.forceY().strength(0.04).y(0))
      .force('collision', d3.forceCollide().strength(0.6).radius(0.50))
    console.log("DATA: ")
    console.log(this.nodes)
    // simulation.stop();
    simulation.on("tick", () => {
      console.log(this.nodes[0].x)
      this.model.node_source.data.x = this.nodes.map(el => el.x);
      this.model.node_source.data.y = this.nodes.map(el => el.y);
      this.model.node_source.change.emit();
    });
    console.log(simulation);
  }

}

export namespace ForceNetwork {
  export type Attrs = p.AttrsOf< Props >
  export type Props = LayoutDOM.Props & {
    // x: p.Property< p.ArraySpec >
    // y: p.Property< p.ArraySpec >
    node_source: p.Property< ColumnDataSource >
    edge_source: p.Property< ColumnDataSource >
    plot: p.Property< Plot >
  }
}

export interface ForceNetwork extends ForceNetwork.Attrs {}

export class ForceNetwork extends LayoutDOM {
  declare properties: ForceNetwork.Props
  declare __view_type__: ForceNetworkView

  constructor(attrs?: Partial< ForceNetwork.Attrs >) {
    super(attrs)
    console.log("Begin constructing ForceNetwork")
  }
  static __name__ = "ForceNetwork"
  static {
    this.prototype.default_view = ForceNetworkView
    this.define< ForceNetwork.Props >(({ Ref }) => ({
      // x:            [ Any ],
      // y:            [ Any ],
      // plot: [Ref(Plot), () => new Figure()]
      node_source: [Ref(ColumnDataSource)], 
      edge_source: [Ref(ColumnDataSource)], 
      plot: [Ref(Plot)],
    }))
  }
}

