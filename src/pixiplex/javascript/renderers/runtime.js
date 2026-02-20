import { isEmpty } from "lodash-es";
import { d3_force } from "../core/simulation.js";

// Shared renderer contract is documented in:
// src/pixiplex/javascript/renderers/interface.ts

/**
 * Returns the renderer currently installed on the host instance.
 *
 * @param {object} pixiplex - Host instance.
 * @returns {object} Installed renderer implementation.
 */
const ensure_renderer = (pixiplex) => {
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
const center_simulation_nodes = (pixiplex, simNodes, fit = true, x = undefined, y = undefined) => {
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
const runtime_methods = {
  /**
   * Returns the active renderer implementation.
   *
   * @returns {object} Active renderer.
   */
  _get_renderer() {
    return ensure_renderer(this);
  },

  /**
   * Initializes renderer graphics and exposes compatibility handles.
   *
   * @param {Array<object>} nodes - Graph node records.
   * @param {Array<object>} links - Graph edge records.
   * @returns {Array<unknown>} Tuple of node graphics and link graphics handles.
   */
  _init_graphics(nodes, links) {
    const renderer = this._get_renderer();
    renderer.init(nodes, links);
    this.nodes_gfx = typeof renderer.get_node_graphics === "function" ? renderer.get_node_graphics() : null;
    this.links_gfx = typeof renderer.get_link_graphics === "function" ? renderer.get_link_graphics() : null;
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

      const renderer = this._get_renderer();
      renderer.init(this.nodes, this.links);
      if (typeof renderer.add_to_viewport === "function") {
        renderer.add_to_viewport(this.vp);
      }
      if (typeof renderer.attach_to_view === "function") {
        renderer.attach_to_view();
      }
      if (typeof renderer.resize === "function") {
        renderer.resize(this.width, this.height);
      }

      this.nodes_gfx = typeof renderer.get_node_graphics === "function" ? renderer.get_node_graphics() : null;
      this.links_gfx = typeof renderer.get_link_graphics === "function" ? renderer.get_link_graphics() : null;

      this.ticker.add(() => {
        this.perf_stats.edgesRedrawn = renderer.draw();
      });

      this._init_force();
      this.ticker.start();

      if (drag) {  this.set_drag_enabled(true);  }
      if (center) {  this.center_graph(true);  }
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
    const renderer = this._get_renderer();
    if (!Object.hasOwn(this, "sim")) {
      this.sim = d3_force.forceSimulation(renderer.get_simulation_nodes());
      this.sim.stop();
      this.sim.alpha(1.0);
      this.sim.alphaMin(0.001);
      this.sim.alphaDecay(1 - Math.pow(this.sim.alphaMin(), 1 / 300));
      this.sim.velocityDecay(0.4);
    }

    if (!isEmpty(this.forces)) {
      this.apply_force(this.forces);
    }
    this.set_force_enabled(true);
  },

  /**
   * Enables or disables force simulation updates on ticker events.
   *
   * @param {boolean} [enabled=true] - Whether force ticks should be active.
   * @returns {boolean} Current enabled flag.
   */
  set_force_enabled(enabled = true) {
    if (!this.sim || !this.dispatcher) {
      return false;
    }
    if (!enabled) {
      this.dispatcher.on("tick.force", null);
      this.sim.alphaTarget?.(0);
      return false;
    }

    this.dispatcher.on("tick.force", () => {
      this.sim.tick();
      const settled = this.sim.alpha() <= (this.sim.alphaMin() + 0.0025);
      if (settled) {
        this.set_force_enabled(false);
        this.sim.stop();
      }
    });
    return true;
  },

  /**
   * Applies node styles through the active renderer.
   *
   * @param {object|Array<object>} styles - One shared style or per-node styles.
   * @returns {void}
   */
  set_node_styles(styles) {
    this._get_renderer().set_node_styles(styles);
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
    const renderer = this._get_renderer();
    center_simulation_nodes(this, renderer.get_simulation_nodes(), fit, x, y);
    renderer.draw();
  },

  /**
   * Enables or disables node drag interactions using renderer pick logic.
   *
   * @param {boolean} [enabled=true] - Whether drag handlers should be active.
   * @returns {boolean} Current enabled flag.
   */
  set_drag_enabled(enabled = true) {
    const renderer = this._get_renderer();
    const sim_nodes = renderer.get_simulation_nodes();
    if (!enabled) {
      if (!this._drag_enabled || !this._drag_handlers) {
        return false;
      }
      this.vp.off("pointerdown", this._drag_handlers.on_pointer_down);
      this.vp.off("pointermove", this._drag_handlers.on_pointer_move);
      this.vp.off("pointerup", this._drag_handlers.on_pointer_up);
      this.vp.off("pointerupoutside", this._drag_handlers.on_pointer_up);
      if (this._drag_target) {
        this._drag_target.fx = null;
        this._drag_target.fy = null;
        this._drag_target = null;
      }
      this._drag_enabled = false;
      return false;
    }

    if (!sim_nodes.length || this._drag_enabled || typeof renderer.pick_node !== "function") {
      return sim_nodes.length > 0;
    }

    if (!this._drag_handlers) {
      const viewport = this.vp;
      const sim = this.sim;

      const on_pointer_move = (event) => {
        if (!this._drag_target) {
          return;
        }
        const local = viewport.toLocal(event.global);
        this._drag_target.x = local.x;
        this._drag_target.y = local.y;
        this._drag_target.fx = local.x;
        this._drag_target.fy = local.y;
      };

      const on_pointer_down = (event) => {
        const local = viewport.toLocal(event.global);
        const picked = renderer.pick_node(local.x, local.y);
        if (!picked) {
          return;
        }
        viewport.plugins.get("drag")?.pause();
        this.set_force_enabled(true);
        this._drag_target = picked;
        this._drag_target.fx = this._drag_target.x;
        this._drag_target.fy = this._drag_target.y;
        sim?.alphaTarget(0.3)?.restart();
      };

      const on_pointer_up = () => {
        if (!this._drag_target) {
          return;
        }
        sim?.alphaTarget(0);
        this._drag_target.fx = null;
        this._drag_target.fy = null;
        this._drag_target = null;
        viewport.plugins.get("drag")?.resume();
      };

      this._drag_handlers = { on_pointer_down, on_pointer_move, on_pointer_up };
    }

    this.vp.interactive = true;
    this.vp.on("pointerdown", this._drag_handlers.on_pointer_down);
    this.vp.on("pointermove", this._drag_handlers.on_pointer_move);
    this.vp.on("pointerup", this._drag_handlers.on_pointer_up);
    this.vp.on("pointerupoutside", this._drag_handlers.on_pointer_up);
    this._drag_enabled = true;
    return true;
  },
};

/**
 * Installs the shared renderer runtime methods on a Pixiplex instance.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @param {object} renderer - Renderer implementation matching the shared interface.
 * @param {string|null} [runtime_flag=null] - Optional marker property to set on the host.
 * @returns {object} The same Pixiplex instance with runtime methods installed.
 */
export const install_renderer_runtime = (pixiplex, renderer, runtime_flag = null) => {
  if (!pixiplex || typeof pixiplex !== "object") {
    throw new Error("install_renderer_runtime expects a Pixiplex instance");
  }
  if (pixiplex._init_state !== "idle") {
    throw new Error("Renderer runtime must be installed before init()");
  }

  pixiplex._renderer = renderer;
  if (runtime_flag) {
    pixiplex[runtime_flag] = true;
  }
  Object.assign(pixiplex, runtime_methods);
  return pixiplex;
};

/**
 * Utility export for callers that need standalone centering behavior.
 */
export { center_simulation_nodes };
