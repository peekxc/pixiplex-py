/**
 * Simulation node shape shared across renderer backends.
 */
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

/**
 * Graph link representation accepted by renderer backends.
 */
export type GraphLink<TNode extends GraphNode = GraphNode> = {
  source: number | string | TNode;
  target: number | string | TNode;
  [key: string]: unknown;
};

/**
 * Node visual style contract used by renderer style setters.
 */
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

/**
 * Edge visual style contract used by renderer draw paths.
 */
export type LineStyle = {
  lineWidth?: number;
  color?: number;
  alpha?: number;
  [key: string]: unknown;
};

/**
 * Runtime performance counters emitted by rendering loops.
 */
export type RendererPerfStats = {
  edgesRedrawn?: number;
  nodesRedrawn?: number;
  drawCalls?: number;
  [key: string]: number | undefined;
};

/**
 * Optional graphics handle type for renderer compatibility hooks.
 */
export type RendererGraphicsLike = unknown;

/**
 * Initialization behavior flags consumed by runtime init helpers.
 */
export interface RendererInitOptions {
  drag?: boolean;
  center?: boolean;
}

/**
 * Minimal viewport shape required by renderer runtime interactions.
 */
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

/**
 * Minimal ticker shape required by renderer runtime loops.
 */
export interface RendererTickerLike {
  add: (fn: (...args: unknown[]) => void) => void;
  start: () => void;
  stop?: () => void;
}

/**
 * Minimal d3-force simulation shape required by runtime logic.
 */
export interface RendererSimulationLike {
  stop: () => void;
  restart?: () => void;
  alpha: (value?: number) => number | RendererSimulationLike;
  alphaMin: (value?: number) => number | RendererSimulationLike;
  alphaDecay: (value?: number) => number | RendererSimulationLike;
  velocityDecay: (value?: number) => number | RendererSimulationLike;
  alphaTarget?: (value: number) => RendererSimulationLike;
}

/**
 * Shared renderer backend contract.
 */
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
  get_simulation_nodes(): GraphNode[];

  /**
   * Apply node styles (single shared style or per-node style array).
   */
  set_node_styles(styles: NodeStyle | NodeStyle[]): void;

  /**
   * Optional: attach PIXI display objects to viewport.
   */
  add_to_viewport?(viewport: RendererViewportLike): void;

  /**
   * Optional: attach renderer-owned DOM/canvas after host canvas mount.
   */
  attach_to_view?(): void;

  /**
   * Optional: resize renderer-owned resources.
   */
  resize?(width: number, height: number): void;

  /**
   * Optional: pick nearest simulation node in world space.
   */
  pick_node?(worldX: number, worldY: number): GraphNode | null;

  /**
   * Optional: expose node graphics handle for host compatibility.
   */
  get_node_graphics?(): RendererGraphicsLike;

  /**
   * Optional: expose link graphics handle for host compatibility.
   */
  get_link_graphics?(): RendererGraphicsLike;

  /**
   * Optional: cleanup renderer-owned resources (meshes, GL context handles, DOM nodes).
   */
  destroy?(): void;
}

/**
 * Host-side shape expected by renderer runtime installer.
 */
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

/**
 * Function signature for renderer plugin installers.
 */
export type RendererPluginInstaller = <T extends object>(
  pixiplex: T,
  renderer: PixiplexRenderer,
  runtimeFlag?: string | null,
) => T;
