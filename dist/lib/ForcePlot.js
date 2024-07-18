// TODO: 
// see: https://github.com/dmarx/panel/blob/681c6167a7d58a667cc824de98d0c09a7ee5b575/panel/models/trend.ts#L4
// see: https://github.com/keul/bokeh/blob/d62d2bfd17c2c4fdcb93a20c24e233b846a1ad9d/bokehjs/src/lib/models/widgets/tables/data_table.ts#L21
// maybe just mimick the graph renderer
// https://github.com/jarrodmillman/bokeh/blob/fc1ebb032f01c581a249eeba6c7488d106b510e6/bokehjs/src/lib/models/renderers/graph_renderer.ts#L8
// import {forceSimulation, forceCollide, forceManyBody, forceY, forceX} from "https://cdn.skypack.dev/d3-force@3"
import { LayoutDOM, LayoutDOMView } from "models/layouts/layout_dom";
// import {DataRenderer, DataRendererView} from "./data_renderer"
// import type {GlyphRendererView} from "./glyph_renderer"
// import {GlyphRenderer} from "./glyph_renderer"
// import {Line} from 'models/glyphs/line';
// import {LinearAxis} from 'models/axes/linear_axis'
import { Plot } from "models/plots/plot";
// import {Figure} from "models/plots/figure"
// import {Grid} from 'models/grids/grid'
import { div } from "core/dom";
import { build_view } from "core/build_views";
// import { Ref } from "core/util/refs"
import { ColumnDataSource } from "models/sources/column_data_source";
// LayoutDOMView
// DataRendererView
class ForcePlotView extends LayoutDOMView {
    static __name__ = "ForcePlotView";
    // private _plot: force.ForcePlot
    initialize() {
        super.initialize();
        console.log("Initializing....");
        console.log(this);
        // Log the plot
        console.log("ForcePlotView's model: ");
        console.log(this.model);
        this.el.style.width = '500px';
        this.el.style.height = '500px';
        // this.el.style['background-color'] = 'lightgray'
        this.plot_div = div({ style: 'height: 100%; width: 100%' });
        this.el.appendChild(this.plot_div);
        // Attach listeners
        this._init_listeners();
    }
    async render() {
        super.render();
        await this.render_plot();
    }
    async render_plot() {
        const plot_view = await build_view(this.model.plot); // {parent: this.el}
        console.log("build view of figure: ");
        console.log(plot_view);
        this.plot_div.innerHTML = '';
        plot_view.render_to(this.plot_div);
    }
    // This is key: send the plot as the child model 
    get child_models() {
        return [this.model.plot];
    }
    // Connect listeners
    _init_listeners() {
        console.log("initializing on-change connections");
        // this._plot = new force.ForcePlot(this.shadow_el, this.get_data())
        this.connect(this.model.data_source.change, () => {
            // Set a listener that changes on data source change event
            // this._plot.setData(this.get_data())
            console.log("Model data source changed!");
            // console.log(this._plot)
        });
    }
    // This is the callback executed when the Bokeh data has an change. Its basic
    // function is to adapt the Bokeh data source to the vis.js DataSet format.
    get_data() {
        const data = new force.ForceData();
        console.log("hello data");
        const source = this.model.data_source;
        for (let i = 0; i < source.get_length(); i++) {
            data.add({
                x: source.data['x'][i],
                y: source.data['y'][i]
            });
        }
        return data;
    }
}
export { ForcePlotView };
class ForcePlot extends LayoutDOM {
    constructor(attrs) {
        super(attrs);
        console.log("Begin constructing ForcePlot");
    }
    static __name__ = "ForcePlot";
    static {
        this.prototype.default_view = ForcePlotView;
        this.define(({ Any, Ref }) => ({
            x: [Any],
            y: [Any],
            // plot: [Ref(Plot), () => new Figure()]
            data_source: [Ref(ColumnDataSource)],
            plot: [Ref(Plot)],
        }));
    }
}
export { ForcePlot };
//# sourceMappingURL=ForcePlot.js.map