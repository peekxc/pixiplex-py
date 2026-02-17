import { Graphics, GraphicsContext } from "pixi.js";

import { NODE_STYLE, Pixiplex, add_items, build_links, default_node_styles, scale_nodes } from "../pixinet.js";
import { installRendererRuntime } from "./pixiplex_renderer_runtime.js";

/**
 * Renderer backend that draws one PIXI Graphics object per node.
 */
class IndividualNodeRenderer {
  /**
   * @param {object} pixiplex - Host Pixiplex instance.
   */
  constructor(pixiplex) {
    this.pixiplex = pixiplex;
    this.node_styles = NODE_STYLE;
    this.nodes = [];
    this.links = [];
    this.node_graphics = [];
    this.link_graphics = [];
  }

  /**
   * Resolves the effective style for a node index.
   *
   * @param {number} i - Node index.
   * @returns {object} Resolved style object.
   */
  _resolveStyle(i) {
    if (Array.isArray(this.node_styles)) {
      return this.node_styles[i] || NODE_STYLE;
    }
    return this.node_styles || NODE_STYLE;
  }

  /**
   * Applies node styles to each per-node Graphics object.
   *
   * @param {object|Array<object>} styles - One shared style or per-node styles.
   * @returns {void}
   */
  _applyNodeStyles(styles) {
    this.node_styles = styles;
    for (let i = 0; i < this.node_graphics.length; i += 1) {
      const style = this._resolveStyle(i);
      const lineStyle = style.lineStyle || NODE_STYLE.lineStyle;
      this.node_graphics[i].clear();
      this.node_graphics[i].context = new GraphicsContext()
        .circle(0, 0, style.radius ?? NODE_STYLE.radius)
        .stroke({ width: lineStyle.size ?? NODE_STYLE.lineStyle.size, color: lineStyle.color ?? NODE_STYLE.lineStyle.color })
        .fill({ color: style.color ?? NODE_STYLE.color, alpha: style.alpha ?? NODE_STYLE.alpha });
    }
  }

  /**
   * Initializes node/link graphics and binds links to graphics-backed nodes.
   *
   * @param {Array<object>} nodes - Graph nodes.
   * @param {Array<object>} links - Graph links.
   * @returns {void}
   */
  init(nodes, links) {
    this.nodes = nodes;
    this.links = links;

    scale_nodes(nodes, this.pixiplex.width, this.pixiplex.height);
    this.node_graphics = nodes.map((node) => Object.assign(new Graphics(), node));
    this.node_styles = default_node_styles(this.node_graphics, this.pixiplex.node_style || NODE_STYLE);
    this._applyNodeStyles(this.node_styles);

    const idMap = new Map(this.node_graphics.map((node, i) => [node.id, i]));
    links.forEach((link) => {
      if (!(link.source instanceof Graphics)) {
        link.source = this.node_graphics[idMap.get(link.source)];
      }
      if (!(link.target instanceof Graphics)) {
        link.target = this.node_graphics[idMap.get(link.target)];
      }
    });

    this.link_graphics = links.map(() => new Graphics());
    build_links(links, this.link_graphics, this.pixiplex.line_style);

    this.pixiplex.nodes_gfx = this.node_graphics;
    this.pixiplex.links_gfx = this.link_graphics;
  }

  /**
   * Attaches link and node graphics to the viewport.
   *
   * @param {object} viewport - PIXI viewport.
   * @returns {void}
   */
  addToViewport(viewport) {
    add_items(viewport, this.link_graphics);
    add_items(viewport, this.node_graphics);
  }

  /**
   * Draws a frame by redrawing links as needed.
   *
   * @returns {number} Number of edges redrawn.
   */
  draw() {
    return build_links(this.links, this.link_graphics, this.pixiplex.line_style);
  }

  /**
   * Applies a node style update for future draws/interactions.
   *
   * @param {object|Array<object>} styles - One shared style or per-node styles.
   * @returns {void}
   */
  setNodeStyles(styles) {
    this._applyNodeStyles(styles);
  }

  /**
   * @returns {Array<object>} Simulation node objects.
   */
  getSimulationNodes() {
    return this.node_graphics;
  }

  /**
   * Finds the nearest node in world coordinates for drag picking.
   *
   * @param {number} worldX - World-space x coordinate.
   * @param {number} worldY - World-space y coordinate.
   * @returns {object|null} Picked node or null.
   */
  pickNode(worldX, worldY) {
    let nearest = null;
    let nearestDist2 = Infinity;

    for (let i = 0; i < this.node_graphics.length; i += 1) {
      const node = this.node_graphics[i];
      const style = this._resolveStyle(i);
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
   * @returns {Array<object>} Node graphics array.
   */
  getNodeGraphics() {
    return this.node_graphics;
  }

  /**
   * @returns {Array<object>} Link graphics array.
   */
  getLinkGraphics() {
    return this.link_graphics;
  }
}

/**
 * Installs the per-node PIXI renderer on a Pixiplex instance.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @returns {object} The same host instance.
 */
export const enableIndividualRenderer = (pixiplex) => {
  const renderer = new IndividualNodeRenderer(pixiplex);
  return installRendererRuntime(pixiplex, renderer, "__individual_renderer");
};

/**
 * Pixiplex subclass preconfigured with the per-node renderer backend.
 */
class PixiplexIndividual extends Pixiplex {
  /**
   * Convenience class wrapper that installs the individual renderer runtime.
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
    enableIndividualRenderer(this);
  }
}

export { IndividualNodeRenderer, PixiplexIndividual };
