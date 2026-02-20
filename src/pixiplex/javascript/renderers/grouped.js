import { Graphics } from "pixi.js";

import { NODE_STYLE, Pixiplex, default_node_styles, scale_nodes } from "../pixinet.js";
import { install_renderer_runtime } from "./runtime.js";

/**
 * Fallback stroke style used when a node style omits lineStyle.
 */
const FALLBACK_LINE_STYLE = { size: 0, color: 0xffffff };

/**
 * Renderer backend that batches all nodes and edges into grouped PIXI Graphics objects.
 */
class GroupedNodeRenderer {
  /**
   * @param {object} pixiplex - Host Pixiplex instance.
   */
  constructor(pixiplex) {
    this.pixiplex = pixiplex;
    this.sim_nodes = [];
    this.node_styles = NODE_STYLE;
    this.node_graphics = new Graphics();
    this.edge_graphics = new Graphics();
    this._nodeFillStyle = { color: NODE_STYLE.color, alpha: NODE_STYLE.alpha };
    this._nodeStrokeStyle = { width: 0, color: 0xffffff };
    this._edgeStrokeStyle = { width: 1, color: 0x000000, alpha: 1 };
  }

  /**
   * Resolves the effective style for a node index.
   *
   * @param {number} i - Node index.
   * @returns {object} Resolved style object.
   */
  _resolve_style(i) {
    if (Array.isArray(this.node_styles)) {
      return this.node_styles[i] || NODE_STYLE;
    }
    return this.node_styles || NODE_STYLE;
  }

  /**
   * Draws all nodes into one shared Graphics object.
   *
   * @returns {void}
   */
  _draw_nodes() {
    this.node_graphics.clear();
    for (let i = 0; i < this.sim_nodes.length; i += 1) {
      const node = this.sim_nodes[i];
      const style = this._resolve_style(i);
      const radius = style.radius ?? NODE_STYLE.radius;
      const color = style.color ?? NODE_STYLE.color;
      const alpha = style.alpha ?? NODE_STYLE.alpha;
      const lineStyle = style.lineStyle || FALLBACK_LINE_STYLE;

      this._nodeFillStyle.color = color;
      this._nodeFillStyle.alpha = alpha;
      this.node_graphics.circle(node.x, node.y, radius).fill(this._nodeFillStyle);
      if ((lineStyle.size ?? 0) > 0) {
        this._nodeStrokeStyle.width = lineStyle.size;
        this._nodeStrokeStyle.color = lineStyle.color ?? 0xffffff;
        this.node_graphics
          .circle(node.x, node.y, radius)
          .stroke(this._nodeStrokeStyle);
      }
    }
  }

  /**
   * Draws all edges into one shared Graphics object.
   *
   * @returns {number} Number of redrawn edges.
   */
  _draw_edges() {
    const lineWidth = this.pixiplex.line_style?.lineWidth ?? 1;
    const lineColor = this.pixiplex.line_style?.color ?? 0x000000;
    const lineAlpha = this.pixiplex.line_style?.alpha ?? 1;
    const links = this.pixiplex.links;

    const styleChanged =
      this.edge_graphics.__lineWidth !== lineWidth ||
      this.edge_graphics.__lineColor !== lineColor ||
      this.edge_graphics.__lineAlpha !== lineAlpha;

    let moved = false;
    if (!styleChanged) {
      for (let i = 0; i < links.length; i += 1) {
        const link = links[i];
        if (
          link.__sx !== link.source.x ||
          link.__sy !== link.source.y ||
          link.__tx !== link.target.x ||
          link.__ty !== link.target.y
        ) {
          moved = true;
          break;
        }
      }
    }

    if (!styleChanged && !moved) {
      return 0;
    }

    this.edge_graphics.clear();
    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      this.edge_graphics.moveTo(link.source.x, link.source.y).lineTo(link.target.x, link.target.y);
      link.__sx = link.source.x;
      link.__sy = link.source.y;
      link.__tx = link.target.x;
      link.__ty = link.target.y;
    }
    this._edgeStrokeStyle.width = lineWidth;
    this._edgeStrokeStyle.color = lineColor;
    this._edgeStrokeStyle.alpha = lineAlpha;
    this.edge_graphics.stroke(this._edgeStrokeStyle);

    this.edge_graphics.__lineWidth = lineWidth;
    this.edge_graphics.__lineColor = lineColor;
    this.edge_graphics.__lineAlpha = lineAlpha;
    return links.length;
  }

  /**
   * Initializes grouped node/edge graphics and link endpoint resolution.
   *
   * @param {Array<object>} nodes - Graph nodes.
   * @param {Array<object>} links - Graph links.
   * @returns {void}
   */
  init(nodes, links) {
    scale_nodes(nodes, this.pixiplex.width, this.pixiplex.height);
    this.sim_nodes = nodes.map((node) => ({ ...node }));
    this.node_styles = default_node_styles(this.sim_nodes, this.pixiplex.node_style || NODE_STYLE);

    const idMap = new Map(this.sim_nodes.map((node, i) => [node.id, i]));
    links.forEach((link) => {
      if (!(link.source && typeof link.source === "object")) {
        link.source = this.sim_nodes[idMap.get(link.source)];
      }
      if (!(link.target && typeof link.target === "object")) {
        link.target = this.sim_nodes[idMap.get(link.target)];
      }
    });

    this._draw_edges();
    this._draw_nodes();
  }

  /**
   * @param {object} viewport - PIXI viewport.
   * @returns {void}
   */
  add_to_viewport(viewport) {
    viewport.addChild(this.edge_graphics);
    viewport.addChild(this.node_graphics);
  }

  /**
   * Draws one frame for grouped nodes and edges.
   *
   * @returns {number} Number of redrawn edges.
   */
  draw() {
    const redrawn = this._draw_edges();
    this._draw_nodes();
    return redrawn;
  }

  /**
   * Applies a node style update and redraws grouped node geometry.
   *
   * @param {object|Array<object>} styles - One shared style or per-node styles.
   * @returns {void}
   */
  set_node_styles(styles) {
    this.node_styles = styles;
    this._draw_nodes();
  }

  /**
   * @returns {Array<object>} Simulation node objects.
   */
  get_simulation_nodes() {
    return this.sim_nodes;
  }

  /**
   * Finds the nearest node in world coordinates for drag picking.
   *
   * @param {number} worldX - World-space x coordinate.
   * @param {number} worldY - World-space y coordinate.
   * @returns {object|null} Picked node or null.
   */
  pick_node(worldX, worldY) {
    let nearest = null;
    let nearestDist2 = Infinity;

    for (let i = 0; i < this.sim_nodes.length; i += 1) {
      const node = this.sim_nodes[i];
      const style = this._resolve_style(i);
      const radius = style.radius ?? NODE_STYLE.radius;
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const dist2 = dx * dx + dy * dy;
      const maxDist = radius + 6;
      if (dist2 <= maxDist * maxDist && dist2 < nearestDist2) {
        nearest = node;
        nearestDist2 = dist2;
      }
    }

    return nearest;
  }

  /**
   * @returns {null} Grouped renderer does not expose per-node graphics.
   */
  get_node_graphics() {
    return null;
  }

  /**
   * @returns {object} Shared edge graphics object.
   */
  get_link_graphics() {
    return this.edge_graphics;
  }
}

/**
 * Installs the grouped PIXI renderer on a Pixiplex instance.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @returns {object} The same host instance.
 */
export const enable_grouped_renderer = (pixiplex) => {
  const renderer = new GroupedNodeRenderer(pixiplex);
  return install_renderer_runtime(pixiplex, renderer, "__grouped_nodes_renderer");
};

/**
 * Backward-compatible alias for grouped renderer installer.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @returns {object} The same host instance.
 */
export const enable_grouped_node_renderer = enable_grouped_renderer;

/**
 * Pixiplex subclass preconfigured with the grouped renderer backend.
 */
class PixiplexGrouped extends Pixiplex {
  /**
   * Convenience class wrapper that installs the grouped renderer runtime.
   *
   * @param {Array<object>} [nodes=[]] - Graph node records.
   * @param {Array<object>} [links=[]] - Graph edge records.
   * @param {number} [width=250] - Canvas width.
   * @param {number} [height=250] - Canvas height.
   * @param {number} [scale=2.0] - Internal world scale multiplier.
   * @param {object} [forces={}] - d3-force configuration map.
   */
  constructor(nodes = [], links = [], width = 250, height = 250, scale = 2.0, forces = {}) {
    super(nodes, links, width, height, scale, forces);
    enable_grouped_renderer(this);
  }
}

export { GroupedNodeRenderer, PixiplexGrouped };
