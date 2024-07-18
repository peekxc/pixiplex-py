import * as p from "core/properties";
import { LayoutProvider } from "models/graphs/layout_provider";
import { ColumnDataSource } from "models/sources/column_data_source";
export declare namespace D3ForceLayout {
    type Attrs = p.AttrsOf<Props>;
    type Props = LayoutProvider.Props & {
        graph_source: p.Property<ColumnDataSource>;
        iterations: p.Property<number>;
        linkDistance: p.Property<number>;
        linkStrength: p.Property<number>;
        charge: p.Property<number>;
    };
}
export interface D3ForceLayout extends D3ForceLayout.Attrs {
}
export declare class D3ForceLayout extends LayoutProvider {
    properties: D3ForceLayout.Props;
    constructor(attrs?: Partial<D3ForceLayout.Attrs>);
    static init_D3ForceLayout(): void;
    get_node_coordinates(node_source: ColumnDataSource): [Float64Array, Float64Array];
    get_edge_coordinates(edge_source: ColumnDataSource): [Float64Array, Float64Array, Float64Array, Float64Array];
    get_layout(): [number[], number[]];
}
//# sourceMappingURL=D3Force.d.ts.map