import {LayoutProvider} from "models/graphs/layout_provider"

export class D3ForceLayout extends LayoutProvider {
  constructor(attrs) {
    super(attrs);
    console.log("Initializing layout constructor");
    console.log(this);
    console.log("d3-force:");
    console.log(d3);
    const nodes = Array.from({ length: 10 }, (_, i) => ({ index: i, obj: _ }));
    this.simulation = d3.forceSimulation(nodes); // @ts-ignore
    // Array.from({length: 10}, (_,i) => ({index:i, obj: _}))
  }

  static init_D3ForceLayout() {
    this.define(({ Int, Number }) => ({
      iterations: [Int, 50],
      linkDistance: [Number, 20],
      linkStrength: [Number, 1],
      charge: [Number, -30]
    }));
  }

  // Just extract the current coordinates from the DataSource
  get_node_coordinates(node_source) {
    return [new Float64Array(node_source.data.x), new Float64Array(node_source.data.y)];
  }
  
  get_edge_coordinates(edge_source) {
    // return [edge_source.data.xs,edge_source.data.ys]
    // const data = dict(edge_source.data)
    console.log("Edge source:");
    console.log(edge_source);
    // const xs: Float32Array[] = [new Float32Array(10)]
    // const ys: Float32Array[] = [new Float32Array(10)]
    const S = edge_source.data.start;
    // const E = edge_source.data.end
    const xs = Array(S.length).fill([0, 0]);
    const ys = Array(S.length).fill([0, 0]);
    for (let i = 0; i < edge_source.data.start.length; ++i) {
      // xs.push([S[i], E[i]])
      xs.push([0, 0]);
      ys.push([0, 0]);
    }
    return [xs, ys];
  }
}
