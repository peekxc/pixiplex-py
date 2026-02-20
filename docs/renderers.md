# Renderer Interface

`pixiplex` now uses a shared renderer runtime so different draw backends can plug into the same force/drag/init lifecycle.

Renderer implementations live under:

- `src/pixiplex/javascript/renderers/`

The interface contract is defined in:

- `src/pixiplex/javascript/renderers/interface.ts`

## Renderer Contract

Each renderer should implement `PixiplexRenderer`:

```ts
interface PixiplexRenderer {
  init(nodes: GraphNode[], links: GraphLink[]): void;
  draw(): number;
  get_simulation_nodes(): GraphNode[];
  set_node_styles(styles: NodeStyle | NodeStyle[]): void;

  add_to_viewport?(viewport: RendererViewportLike): void;
  attach_to_view?(): void;
  resize?(width: number, height: number): void;
  pick_node?(worldX: number, worldY: number): GraphNode | null;
  get_node_graphics?(): RendererGraphicsLike;
  get_link_graphics?(): RendererGraphicsLike;
  destroy?(): void;
}
```

Required methods:

- `init`, `draw`, `get_simulation_nodes`, `set_node_styles`

Optional hooks used by specific backends:

- `add_to_viewport`: PIXI display-object renderers
- `attach_to_view`: DOM/canvas overlay renderers (e.g. raw WebGL)
- `resize`: renderer-owned surface updates
- `pick_node`: world-space hit testing for drag mode
- `get_node_graphics` / `get_link_graphics`: compatibility handles for legacy controls
- `destroy`: cleanup of renderer-owned resources during mode switch

## Shared Runtime

The runtime installer in `src/pixiplex/javascript/renderers/runtime.js` provides shared behavior for:

- `init_all(...)`
- force simulation setup
- drag handling
- centering logic
- node style updates

A renderer plugin installs this once:

```js
import { install_renderer_runtime } from "./runtime.js";

export const enable_my_renderer = (pixiplex) => {
  const renderer = new MyRenderer(pixiplex);
  return install_renderer_runtime(pixiplex, renderer, "__my_renderer");
};
```

## Built-in Renderers

- Individual graphics renderer: `src/pixiplex/javascript/renderers/individual.js`
- Grouped PIXI graphics renderer: `src/pixiplex/javascript/renderers/grouped.js`
- Mesh primitives renderer: `src/pixiplex/javascript/renderers/mesh.js`
- WebGL primitives renderer: `src/pixiplex/javascript/renderers/webgl.js`

## Demo Render Modes

The demo supports three modes via URL query:

- `?renderMode=per-node-graphics`
- `?renderMode=grouped-nodes`
- `?renderMode=mesh-primitives`
- `?renderMode=webgl-primitives`

You can also switch modes from the demo UI button.
