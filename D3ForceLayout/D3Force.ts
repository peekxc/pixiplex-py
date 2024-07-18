import * as p from "core/properties"
import {LayoutProvider} from "models/graphs/layout_provider"
import {ColumnDataSource} from "models/sources/column_data_source"
import type {Arrayable} from "core/types"

// Declare now, will be instantiated during the page load
declare function d3(...args: any[]): any 

export namespace D3ForceLayout {
  export type Attrs = p.AttrsOf< Props >
  export type Props = LayoutProvider.Props & {
    iterations: p.Property< number >
    linkDistance: p.Property< number >
    linkStrength: p.Property< number >
    charge: p.Property< number >
  } & {
    node_source: p.Property< ColumnDataSource > 
    edge_source: p.Property< ColumnDataSource >
  }
}

export interface D3ForceLayout extends D3ForceLayout.Attrs {}

export class D3ForceLayout extends LayoutProvider {
  declare properties: D3ForceLayout.Props
  declare simulation: any

  constructor(attrs?: Partial< D3ForceLayout.Attrs >) {
    super(attrs)
    console.log("Running constructor")
    console.log(this)
    console.log("d3-force:")
    console.log(d3)
    const nodes = Array.from({length: 10}, (_,i) => ({index:i, obj: _}))
    
    // @ts-ignore
    this.simulation = d3.forceSimulation(nodes) 
    // this.node_data 
    // Array.from({length: 10}, (_,i) => ({index:i, obj: _}))
  }

  initialize(): void {
    super.initialize();
    console.log("Running initializer")
    console.log(this)
  }
  
  static init_D3ForceLayout(): void {
    this.define< D3ForceLayout.Props >(({Int, Number, Ref}) => ({ // Ref
      iterations:    [ Int, 50 ],
      linkDistance:  [ Number, 20 ],
      linkStrength:  [ Number, 1 ],
      charge:        [ Number, -30 ], 
      node_source:   [ Ref(ColumnDataSource) ],
      edge_source:   [ Ref(ColumnDataSource) ]
    }))
  }

  // Just extract the current coordinates from the DataSource
  get_node_coordinates(node_source: ColumnDataSource): [Arrayable< number >, Arrayable< number >] {
    return [new Float64Array(node_source.data.x), new Float64Array(node_source.data.y)]
  }

  get_edge_coordinates(edge_source: ColumnDataSource): [Arrayable< number >[], Arrayable< number >[]] {
    // return [edge_source.data.xs,edge_source.data.ys]
    // const data = dict(edge_source.data)
    console.log("Edge source:")
    console.log(edge_source)
  
    // const xs: Float32Array[] = [new Float32Array(10)]
    // const ys: Float32Array[] = [new Float32Array(10)]
    const S = edge_source.data.start
    // const E = edge_source.data.end
    const xs : number[][] = Array(S.length).fill([0, 0]);
    const ys : number[][] = Array(S.length).fill([0, 0]);
    for (let i = 0; i < edge_source.data.start.length; ++i) {
      // xs.push([S[i], E[i]])
      xs.push([0,0])
      ys.push([0,0])
    }
    return [xs, ys]
  }

  tick(): [Arrayable< number >, Arrayable< number >] {
    console.log("get_layout() called")
    console.log(this)
    const xs = new Float64Array(10)
    const ys = new Float64Array(10)
    // const graph_source = this.graph_source
    // const nodes = graph_source.data.index.map((id: string, i: number) => ({
    //   id,
    //   x: graph_source.data.x[i] || Math.random() * 100,
    //   y: graph_source.data.y[i] || Math.random() * 100,
    // }))
    // const links = graph_source.data.start.map((start: string, i: number) => ({
    //   source: start,
    //   target: graph_source.data.end[i],
    // }))
    // graph_source.change.emit()
    return [xs, ys]
  }
}