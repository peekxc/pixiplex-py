# Renderer Interface

`pixiplex` now uses a shared renderer runtime so different draw backends can plug into the same force/drag/init lifecycle.

Use the single renderer export surface at:

- `src/pixiplex/renderers.js`

The interface contract is defined in:

- `src/pixiplex/renderers/pixiplex_renderer.types.ts`

## Renderer Contract

Each renderer should implement `PixiplexRenderer`:

```ts
interface PixiplexRenderer {
  init(nodes: GraphNode[], links: GraphLink[]): void;
  draw(): number;
  getSimulationNodes(): GraphNode[];
  setNodeStyles(styles: NodeStyle | NodeStyle[]): void;

  addToViewport?(viewport: RendererViewportLike): void;
  attachToView?(): void;
  resize?(width: number, height: number): void;
  pickNode?(worldX: number, worldY: number): GraphNode | null;
  getNodeGraphics?(): RendererGraphicsLike;
  getLinkGraphics?(): RendererGraphicsLike;
  destroy?(): void;
}
```

Required methods:

- `init`, `draw`, `getSimulationNodes`, `setNodeStyles`

Optional hooks used by specific backends:

- `addToViewport`: PIXI display-object renderers
- `attachToView`: DOM/canvas overlay renderers (e.g. raw WebGL)
- `resize`: renderer-owned surface updates
- `pickNode`: world-space hit testing for drag mode
- `getNodeGraphics` / `getLinkGraphics`: compatibility handles for legacy controls
- `destroy`: cleanup of renderer-owned resources during mode switch

## Shared Runtime

The runtime installer in `src/pixiplex/renderers/pixiplex_renderer_runtime.js` provides shared behavior for:

- `init_all(...)`
- force simulation setup
- drag handling
- centering logic
- node style updates

A renderer plugin installs this once:

```js
import { installRendererRuntime } from "./renderers/pixiplex_renderer_runtime.js";

export const enableMyRenderer = (pixiplex) => {
  const renderer = new MyRenderer(pixiplex);
  return installRendererRuntime(pixiplex, renderer, "__my_renderer");
};
```

## Built-in Renderers

- Individual graphics renderer: `src/pixiplex/renderers/pixiplex_individual.js`
- Grouped PIXI graphics renderer: `src/pixiplex/renderers/pixiplex_grouped.js`
- Mesh primitives renderer: `src/pixiplex/renderers/pixiplex_mesh.js`
- WebGL primitives renderer: `src/pixiplex/renderers/pixiplex_webgl.js`

## Demo Render Modes

The demo supports three modes via URL query:

- `?renderMode=per-node-graphics`
- `?renderMode=grouped-nodes`
- `?renderMode=mesh-primitives`
- `?renderMode=webgl-primitives`

You can also switch modes from the demo UI button.
