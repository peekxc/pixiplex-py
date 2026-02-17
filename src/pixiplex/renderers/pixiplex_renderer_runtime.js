import { d3_force, isEmpty } from "../pixinet.js";

// Shared renderer contract is documented in:
// src/pixiplex/renderers/pixiplex_renderer.types.ts

/**
 * Returns the renderer currently installed on the host instance.
 *
 * @param {object} pixiplex - Host instance.
 * @returns {object} Installed renderer implementation.
 */
const ensureRenderer = (pixiplex) => {
  if (!pixiplex._renderer) {
    throw new Error("Renderer runtime missing renderer instance");
  }
  return pixiplex._renderer;
};

/**
 * Recenters simulation nodes in world coordinates.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @param {Array<object>} simNodes - Mutable simulation nodes with x/y fields.
 * @param {boolean} [fit=true] - Whether to call viewport fit after recentering.
 * @param {number} [x] - Optional center x in user coordinates.
 * @param {number} [y] - Optional center y in user coordinates.
 * @returns {void}
 */
const centerSimulationNodes = (pixiplex, simNodes, fit = true, x = undefined, y = undefined) => {
  if (!simNodes || simNodes.length === 0) {
    return;
  }
  const meanX = simNodes.reduce((acc, node) => acc + node.x, 0) / simNodes.length;
  const meanY = simNodes.reduce((acc, node) => acc + node.y, 0) / simNodes.length;

  pixiplex.sim?.stop();
  const cX = typeof x !== "undefined" ? x * pixiplex.scale : pixiplex.vp.worldWidth / 2;
  const cY = typeof y !== "undefined" ? y * pixiplex.scale : pixiplex.vp.worldHeight / 2;

  for (let i = 0; i < simNodes.length; i += 1) {
    simNodes[i].x -= meanX;
    simNodes[i].y -= meanY;
    simNodes[i].x += cX;
    simNodes[i].y += cY;
  }

  if (fit) {
    pixiplex.vp.fit();
  }
  pixiplex.sim?.restart();
};

/**
 * Shared runtime method mixin installed onto a Pixiplex host.
 *
 * Methods here delegate renderer-specific work to the installed renderer
 * while centralizing lifecycle, simulation, and interaction wiring.
 */
const runtimeMethods = {
  /**
   * Returns the active renderer implementation.
   *
   * @returns {object} Active renderer.
   */
  _getRenderer() {
    return ensureRenderer(this);
  },

  /**
   * Initializes renderer graphics and exposes compatibility handles.
   *
   * @param {Array<object>} nodes - Graph node records.
   * @param {Array<object>} links - Graph edge records.
   * @returns {Array<unknown>} Tuple of node graphics and link graphics handles.
   */
  _init_graphics(nodes, links) {
    const renderer = this._getRenderer();
    renderer.init(nodes, links);
    this.nodes_gfx = typeof renderer.getNodeGraphics === "function" ? renderer.getNodeGraphics() : null;
    this.links_gfx = typeof renderer.getLinkGraphics === "function" ? renderer.getLinkGraphics() : null;
    return [this.nodes_gfx, this.links_gfx];
  },

  /**
   * Initializes application, renderer, ticker, and simulation lifecycle.
   *
   * @param {boolean} [drag=true] - Whether to enable drag interactions.
   * @param {boolean} [center=true] - Whether to center the graph after init.
   * @returns {Promise<object>} Resolves with the host instance.
   */
  async init_all(drag = true, center = true) {
    if (this._init_state === "ready") {
      return this;
    }
    if (this._init_state === "initializing" && this._init_promise) {
      return this._init_promise;
    }

    this._init_state = "initializing";
    this._init_error = null;
    this._init_promise = (async () => {
      await this._init_application();
      this._init_viewport();
      this._init_ticker();

      const renderer = this._getRenderer();
      renderer.init(this.nodes, this.links);
      if (typeof renderer.addToViewport === "function") {
        renderer.addToViewport(this.vp);
      }
      if (typeof renderer.attachToView === "function") {
        renderer.attachToView();
      }
      if (typeof renderer.resize === "function") {
        renderer.resize(this.width, this.height);
      }

      this.nodes_gfx = typeof renderer.getNodeGraphics === "function" ? renderer.getNodeGraphics() : null;
      this.links_gfx = typeof renderer.getLinkGraphics === "function" ? renderer.getLinkGraphics() : null;

      this.ticker.add(() => {
        this.perf_stats.edgesRedrawn = renderer.draw();
      });

      this._init_force();
      this.ticker.start();

      if (drag) {
        this.enable_drag();
      }
      if (center) {
        this.center_graph(true);
      }

      this._init_state = "ready";
      return this;
    })().catch((err) => {
      this._init_state = "failed";
      this._init_error = err;
      throw err;
    });

    return this._init_promise;
  },

  /**
   * Initializes d3-force simulation with renderer simulation nodes.
   *
   * @returns {void}
   */
  _init_force() {
    const renderer = this._getRenderer();
    if (!Object.hasOwn(this, "sim")) {
      this.sim = d3_force.forceSimulation(renderer.getSimulationNodes());
      this.sim.stop();
      this.sim.alpha(1.0);
      this.sim.alphaMin(0.001);
      this.sim.alphaDecay(1 - Math.pow(this.sim.alphaMin(), 1 / 300));
      this.sim.velocityDecay(0.4);
    }

    if (!isEmpty(this.forces)) {
      this.apply_force(this.forces);
    }
    this.enable_force();
  },

  /**
   * Applies node styles through the active renderer.
   *
   * @param {object|Array<object>} styles - One shared style or per-node styles.
   * @returns {void}
   */
  set_node_styles(styles) {
    this._getRenderer().setNodeStyles(styles);
  },

  /**
   * Recenters simulation nodes and requests a redraw.
   *
   * @param {boolean} [fit=true] - Whether to fit viewport bounds.
   * @param {number} [x] - Optional center x coordinate.
   * @param {number} [y] - Optional center y coordinate.
   * @returns {void}
   */
  center_graph(fit = true, x = undefined, y = undefined) {
    const renderer = this._getRenderer();
    centerSimulationNodes(this, renderer.getSimulationNodes(), fit, x, y);
    renderer.draw();
  },

  /**
   * Enables node drag interactions using renderer pick logic.
   *
   * @returns {boolean} True when drag handlers are active.
   */
  enable_drag() {
    const renderer = this._getRenderer();
    const simNodes = renderer.getSimulationNodes();
    if (!simNodes.length || this._drag_enabled || typeof renderer.pickNode !== "function") {
      return simNodes.length > 0;
    }

    if (!this._drag_handlers) {
      const viewport = this.vp;
      const sim = this.sim;

      const onPointerMove = (event) => {
        if (!this._drag_target) {
          return;
        }
        const local = viewport.toLocal(event.global);
        this._drag_target.x = local.x;
        this._drag_target.y = local.y;
        this._drag_target.fx = local.x;
        this._drag_target.fy = local.y;
      };

      const onPointerDown = (event) => {
        const local = viewport.toLocal(event.global);
        const picked = renderer.pickNode(local.x, local.y);
        if (!picked) {
          return;
        }
        viewport.plugins.get("drag")?.pause();
        this.enable_force();
        this._drag_target = picked;
        this._drag_target.fx = this._drag_target.x;
        this._drag_target.fy = this._drag_target.y;
        sim?.alphaTarget(0.3)?.restart();
      };

      const onPointerUp = () => {
        if (!this._drag_target) {
          return;
        }
        sim?.alphaTarget(0);
        this._drag_target.fx = null;
        this._drag_target.fy = null;
        this._drag_target = null;
        viewport.plugins.get("drag")?.resume();
      };

      this._drag_handlers = { onPointerDown, onPointerMove, onPointerUp };
    }

    this.vp.interactive = true;
    this.vp.on("pointerdown", this._drag_handlers.onPointerDown);
    this.vp.on("pointermove", this._drag_handlers.onPointerMove);
    this.vp.on("pointerup", this._drag_handlers.onPointerUp);
    this.vp.on("pointerupoutside", this._drag_handlers.onPointerUp);
    this._drag_enabled = true;
    return true;
  },

  /**
   * Disables node drag interactions and clears drag state.
   *
   * @returns {void}
   */
  disable_drag() {
    if (!this._drag_enabled || !this._drag_handlers) {
      return;
    }
    this.vp.off("pointerdown", this._drag_handlers.onPointerDown);
    this.vp.off("pointermove", this._drag_handlers.onPointerMove);
    this.vp.off("pointerup", this._drag_handlers.onPointerUp);
    this.vp.off("pointerupoutside", this._drag_handlers.onPointerUp);
    if (this._drag_target) {
      this._drag_target.fx = null;
      this._drag_target.fy = null;
      this._drag_target = null;
    }
    this._drag_enabled = false;
  },
};

/**
 * Installs the shared renderer runtime methods on a Pixiplex instance.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @param {object} renderer - Renderer implementation matching the shared interface.
 * @param {string|null} [runtimeFlag=null] - Optional marker property to set on the host.
 * @returns {object} The same Pixiplex instance with runtime methods installed.
 */
export const installRendererRuntime = (pixiplex, renderer, runtimeFlag = null) => {
  if (!pixiplex || typeof pixiplex !== "object") {
    throw new Error("installRendererRuntime expects a Pixiplex instance");
  }
  if (pixiplex._init_state !== "idle") {
    throw new Error("Renderer runtime must be installed before init()");
  }

  pixiplex._renderer = renderer;
  if (runtimeFlag) {
    pixiplex[runtimeFlag] = true;
  }
  Object.assign(pixiplex, runtimeMethods);
  return pixiplex;
};

/**
 * Utility export for callers that need standalone centering behavior.
 */
export { centerSimulationNodes };
