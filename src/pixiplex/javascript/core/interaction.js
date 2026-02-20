import { select } from "d3-selection";
import { polygonContains } from "d3-polygon";
import { dispatch } from "d3-dispatch";
import { Container } from "pixi.js";

import { identity } from "./utils.js";

/**
 * Registers viewport events that restart/stop a tick loop dispatcher.
 *
 * @param {object} tick_dispatcher - Dispatcher with `restart` and `stop` events.
 * @param {object} vp - Pixi viewport instance emitting interaction events.
 * @param {Function} [predicate] - Stop condition evaluated on `moved-end`.
 * @returns {void}
 */
export const register_tick_stops = (tick_dispatcher, vp, predicate = function () { return true; }) => {
  vp.on("clicked", () => tick_dispatcher.call("restart"));
  vp.on("drag-start", () => tick_dispatcher.call("restart"));
  vp.on("pinch-start", () => tick_dispatcher.call("restart"));
  vp.on("moved", () => tick_dispatcher.call("restart"));
  vp.on("zoomed", () => tick_dispatcher.call("restart"));
  vp.on("moved-end", () => {
    if (predicate()) {
      tick_dispatcher.call("stop");
    }
  });
};

/**
 * Creates a drag dispatcher for a PIXI display object.
 *
 * @param {object} node - PIXI display object that emits pointer events.
 * @returns {object} D3 dispatcher with `start`, `dragging`, and `end` events.
 */
export const drag_dispatcher = (node) => {
  const dsp = dispatch("start", "end", "dragging");
  node.on("pointerdown", function (e) {
    dsp.call("start", node, e);
  });
  node.on("pointerup", function (e) {
    dsp.call("end", node, e);
  });
  node.on("pointermove", function (e) {
    if (this.dragging) {
      const coords = this.data.getLocalPosition(this.parent);
      dsp.call("dragging", node, e, coords);
    }
  });
  return dsp;
};

/**
 * Adds PIXI-native drag handlers to a drag dispatcher.
 *
 * @param {object} pixi_obj - Interactive PIXI display object.
 * @returns {Function} Dispatcher enhancer.
 */
export const pixi_drag = (pixi_obj) => {
  if (!pixi_obj.interactive) {
    pixi_obj.interactive = true;
  }
  return function (dispatcher) {
    dispatcher
      .on("start.pixi", function (e) {
        if (this.parent.pausePlugin) {
          this.parent.pausePlugin("drag");
        }
        Object.assign(this, { data: e.data, alpha: 0.8, dragging: true });
      })
      .on("end.pixi", function () {
        if (this.parent.resumePlugin) {
          this.parent.resumePlugin("drag");
        }
        Object.assign(this, { data: null, alpha: 1, dragging: false });
      })
      .on("dragging.pixi", function (e, coords) {
        this.x = coords.x;
        this.y = coords.y;
      });
    return dispatcher;
  };
};

/**
 * Adds d3-force drag pinning behavior to a drag dispatcher.
 *
 * @param {object} sim - d3-force simulation instance.
 * @returns {Function} Dispatcher enhancer.
 */
export const force_drag = (sim) => {
  return function (dispatcher) {
    dispatcher
      .on("start.force", function () {
        sim.alphaTarget(0.3).restart();
        this.fx = this.x;
        this.fy = this.y;
      })
      .on("dragging.force", function (e, coords) {
        this.fx = coords.x;
        this.fy = coords.y;
      })
      .on("end.force", function () {
        if (!this.dragging) {
          sim.alphaTarget(0);
        }
        this.fx = null;
        this.fy = null;
      });
    return dispatcher;
  };
};

/**
 * Returns a resize helper that updates renderer and optional viewport sizes.
 *
 * @param {object} app - PIXI application instance.
 * @param {object|null} [vp=null] - Optional viewport instance to resize first.
 * @returns {Function} Resize callback.
 */
export const enable_resize = (app, vp = null) => {
  app.renderer.autoResize = true;
  const parent = app.canvas.parentNode;
  const _resize = (w = parent.clientWidth, h = parent.clientHeight) => {
    if (vp) {
      vp.resize(w, h);
    }
    app.renderer.resize(w, h);
  };
  return _resize;
};

/**
 * Enables lasso selection over a visualization root node.
 *
 * @param {string} visRootID - DOM id of the visualization container.
 * @returns {object} Dispatcher with `start` and `selected` events.
 */
export const enable_lasso = (visRootID) => {
  const dispatcher = dispatch("start", "selected");

  const visRoot = select(`#${visRootID}`);
  const interaction_svg = visRoot
    .append("svg")
    .attr("id", "selection_svg")
    .attr("width", visRoot.style("width"))
    .attr("height", visRoot.style("height"))
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0)
    .style("display", "none");

  // NOTE: lasso factory is expected to be globally available in legacy flows.
  const lassoInstance = lasso();
  let local_nodes = null;

  lassoInstance.on("end", (lassoPolygon) => {
    interaction_svg.style("display", "none");
    const selected_nodes = local_nodes.filter((node) => polygonContains(lassoPolygon, [node.x, node.y]));
    local_nodes = null;
    dispatcher.call("selected", this, selected_nodes);
  });

  dispatcher.on("start", (nodes) => {
    local_nodes = nodes;
    interaction_svg.style("display", "inline");
    lassoInstance(interaction_svg);
  });

  return dispatcher;
};

/**
 * Groups items in a PIXI container.
 *
 * @param {Array<unknown>} items - Items to add to the container.
 * @param {Function} [acc=identity] - Accessor returning display objects.
 * @returns {Container} Container containing all mapped items.
 */
export const group_items = (items, acc = identity) => {
  const group = new Container();
  items.forEach((item) => {
    group.addChild(acc(item));
  });
  return group;
};
