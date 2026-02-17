# Renderer TypeScript Types

Generated from `src/pixiplex/renderers/pixiplex_renderer.types.ts`.

## Exported Symbols

- `type` `GraphLink`
- `type` `GraphNode`
- `type` `LineStyle`
- `type` `NodeStyle`
- `interface` `PixiplexRenderer`
- `type` `RendererGraphicsLike`
- `interface` `RendererHost`
- `interface` `RendererInitOptions`
- `type` `RendererPerfStats`
- `type` `RendererPluginInstaller`
- `interface` `RendererSimulationLike`
- `interface` `RendererTickerLike`
- `interface` `RendererViewportLike`

## Source

```ts
export type GraphNode = {
  id: number | string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  [key: string]: unknown;
};

export type GraphLink<TNode extends GraphNode = GraphNode> = {
  source: number | string | TNode;
  target: number | string | TNode;
  [key: string]: unknown;
};

export type NodeStyle = {
  radius?: number;
  color?: number;
  alpha?: number;
  lineStyle?: {
    size?: number;
    color?: number;
  };
  [key: string]: unknown;
};

export type LineStyle = {
  lineWidth?: number;
  color?: number;
  alpha?: number;
  [key: string]: unknown;
};

export type RendererPerfStats = {
  edgesRedrawn?: number;
  nodesRedrawn?: number;
  drawCalls?: number;
  [key: string]: number | undefined;
};

export type RendererGraphicsLike = unknown;

export interface RendererInitOptions {
  drag?: boolean;
  center?: boolean;
}

export interface RendererViewportLike {
  worldWidth: number;
  worldHeight: number;
  fit: () => void;
  interactive?: boolean;
  toLocal: (global: unknown) => { x: number; y: number };
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  plugins: { get: (name: string) => { pause?: () => void; resume?: () => void } | undefined };
}

export interface RendererTickerLike {
  add: (fn: (...args: unknown[]) => void) => void;
  start: () => void;
  stop?: () => void;
}

export interface RendererSimulationLike {
  stop: () => void;
  restart?: () => void;
  alpha: (value?: number) => number | RendererSimulationLike;
  alphaMin: (value?: number) => number | RendererSimulationLike;
  alphaDecay: (value?: number) => number | RendererSimulationLike;
  velocityDecay: (value?: number) => number | RendererSimulationLike;
  alphaTarget?: (value: number) => RendererSimulationLike;
}

export interface PixiplexRenderer {
  /**
   * Prepare renderer data/objects and resolve graph references.
   * Called during host init and may be called again for mode switches.
   */
  init(nodes: GraphNode[], links: GraphLink[]): void;

  /**
   * Draw one frame. Return the number of edges redrawn.
   */
  draw(): number;

  /**
   * Return node objects used by d3-force simulation.
   */
  getSimulationNodes(): GraphNode[];

  /**
   * Apply node styles (single shared style or per-node style array).
   */
  setNodeStyles(styles: NodeStyle | NodeStyle[]): void;

  /**
   * Optional: attach PIXI display objects to viewport.
   */
  addToViewport?(viewport: RendererViewportLike): void;

  /**
   * Optional: attach renderer-owned DOM/canvas after host canvas mount.
   */
  attachToView?(): void;

  /**
   * Optional: resize renderer-owned resources.
   */
  resize?(width: number, height: number): void;

  /**
   * Optional: pick nearest simulation node in world space.
   */
  pickNode?(worldX: number, worldY: number): GraphNode | null;

  /**
   * Optional: expose node graphics handle for host compatibility.
   */
  getNodeGraphics?(): RendererGraphicsLike;

  /**
   * Optional: expose link graphics handle for host compatibility.
   */
  getLinkGraphics?(): RendererGraphicsLike;

  /**
   * Optional: cleanup renderer-owned resources (meshes, GL context handles, DOM nodes).
   */
  destroy?(): void;
}

export interface RendererHost {
  width: number;
  height: number;
  scale: number;
  pixel_ratio?: number;
  nodes: GraphNode[];
  links: GraphLink[];
  node_style: NodeStyle;
  line_style: LineStyle;
  perf_stats: RendererPerfStats;
  vp: RendererViewportLike;
  ticker?: RendererTickerLike;
  sim?: RendererSimulationLike;
  _renderer?: PixiplexRenderer;
}

export type RendererPluginInstaller = <T extends object>(
  pixiplex: T,
  renderer: PixiplexRenderer,
  runtimeFlag?: string | null,
) => T;
```
