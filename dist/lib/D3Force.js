import { LayoutProvider } from "models/graphs/layout_provider";
import { ColumnDataSource } from "models/sources/column_data_source";
// import {forceSimulation, forceLink, forceCenter, forceManyBody} from "https://unpkg.com/d3-force@3.0.0/dist/d3-force.min.js"
import { forceSimulation, forceLink, forceCenter, forceManyBody } from "https://cdn.skypack.dev/d3-force@3";
class D3ForceLayout extends LayoutProvider {
    static __name__ = "D3ForceLayout";
    properties;
    constructor(attrs) {
        super(attrs);
        const url = "https://cdnjs.cloudflare.com/ajax/libs/vis/4.16.1/vis.min.js";
        const script = document.createElement("script");
        script.onload = () => this._init();
        script.async = false;
        script.src = url;
        document.head.appendChild(script);
    }
    static init_D3ForceLayout() {
        this.define(({ Int, Number, Ref }) => ({
            graph_source: [Ref(ColumnDataSource)],
            iterations: [Int, 50],
            linkDistance: [Number, 20],
            linkStrength: [Number, 1],
            charge: [Number, -30],
        }));
    }
    get_node_coordinates(node_source) {
        return [new Float64Array(node_source.data.x), new Float64Array(node_source.data.y)];
    }
    get_edge_coordinates(edge_source) {
        const start = edge_source.data.start;
        const end = edge_source.data.end;
        const x0 = start.map((i) => this.graph_source.data.x[this.graph_source.data.index.indexOf(i)]);
        const y0 = start.map((i) => this.graph_source.data.y[this.graph_source.data.index.indexOf(i)]);
        const x1 = end.map((i) => this.graph_source.data.x[this.graph_source.data.index.indexOf(i)]);
        const y1 = end.map((i) => this.graph_source.data.y[this.graph_source.data.index.indexOf(i)]);
        return [x0, y0, x1, y1];
    }
    get_layout() {
        const graph_source = this.graph_source;
        const nodes = graph_source.data.index.map((id, i) => ({
            id,
            x: graph_source.data.x[i] || Math.random() * 100,
            y: graph_source.data.y[i] || Math.random() * 100,
        }));
        const links = graph_source.data.start.map((start, i) => ({
            source: start,
            target: graph_source.data.end[i],
        }));
        const simulation = forceSimulation(nodes)
            .force("link", forceLink(links).id((d) => d.id).distance(this.linkDistance).strength(this.linkStrength))
            .force("charge", forceManyBody().strength(this.charge))
            .force("center", forceCenter(0, 0))
            .stop();
        for (let i = 0; i < this.iterations; ++i) {
            simulation.tick();
        }
        const xs = new Float64Array(nodes.length);
        const ys = new Float64Array(nodes.length);
        for (let i = 0; i < nodes.length; ++i) {
            xs[i] = nodes[i].x;
            ys[i] = nodes[i].y;
        }
        graph_source.data.x = xs;
        graph_source.data.y = ys;
        graph_source.change.emit();
        return [xs, ys];
    }
}
export { D3ForceLayout };
//# sourceMappingURL=D3Force.js.map