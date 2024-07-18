import { LayoutDOM, LayoutDOMView } from "models/layouts/layout_dom";
import { Plot } from "models/plots/plot";
import { ColumnDataSource } from "models/sources/column_data_source";
import * as p from "core/properties";
declare namespace force {
    class ForcePlot {
        constructor(el: HTMLElement | DocumentFragment, data: object);
    }
    class ForceData {
        add(data: unknown): void;
    }
}
export declare class ForcePlotView extends LayoutDOMView {
    model: ForcePlot;
    plot_div: HTMLDivElement;
    initialize(): void;
    render(): Promise<void>;
    private render_plot;
    get child_models(): LayoutDOM[];
    private _init_listeners;
    get_data(): force.ForceData;
}
export declare namespace ForcePlot {
    type Attrs = p.AttrsOf<Props>;
    type Props = LayoutDOM.Props & {
        x: p.Property<p.ArraySpec>;
        y: p.Property<p.ArraySpec>;
        data_source: p.Property<ColumnDataSource>;
        plot: p.Property<Plot>;
    };
}
export interface ForcePlot extends ForcePlot.Attrs {
}
export declare class ForcePlot extends LayoutDOM {
    properties: ForcePlot.Props;
    __view_type__: ForcePlotView;
    constructor(attrs?: Partial<ForcePlot.Attrs>);
    static __name__: string;
}
export {};
//# sourceMappingURL=ForcePlot.d.ts.map