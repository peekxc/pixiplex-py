import { MeshSimple, Texture } from "pixi.js";

import { NODE_STYLE, Pixiplex, default_node_styles, scale_nodes } from "../../src/pixiplex/javascript/pixinet.js";
import { installRendererRuntime } from "./pixiplex_renderer_runtime.js";

/**
 * Default logical line width used when no edge style width is provided.
 */
const DEFAULT_EDGE_WIDTH = 1;

/**
 * Writes quad UVs for one primitive slot.
 *
 * @param {Float32Array} uvs - UV buffer.
 * @param {number} quadIndex - Target quad index.
 * @returns {void}
 */
const writeQuadUVs = (uvs, quadIndex) => {
  const o = quadIndex * 8;
  uvs[o] = 0;
  uvs[o + 1] = 0;
  uvs[o + 2] = 1;
  uvs[o + 3] = 0;
  uvs[o + 4] = 1;
  uvs[o + 5] = 1;
  uvs[o + 6] = 0;
  uvs[o + 7] = 1;
};

/**
 * Writes quad triangle indices for one primitive slot.
 *
 * @param {Uint32Array} indices - Index buffer.
 * @param {number} quadIndex - Target quad index.
 * @returns {void}
 */
const writeQuadIndices = (indices, quadIndex) => {
  const v = quadIndex * 4;
  const o = quadIndex * 6;
  indices[o] = v;
  indices[o + 1] = v + 1;
  indices[o + 2] = v + 2;
  indices[o + 3] = v;
  indices[o + 4] = v + 2;
  indices[o + 5] = v + 3;
};

/**
 * Renderer backend that draws nodes and edges using PIXI Mesh primitives.
 */
class MeshPrimitiveRenderer {
  /**
   * @param {object} pixiplex - Host Pixiplex instance.
   */
  constructor(pixiplex) {
    this.pixiplex = pixiplex;
    this.sim_nodes = [];
    this.node_styles = NODE_STYLE;
    this.edge_mesh = null;
    this.node_mesh = null;
    this.edge_vertices = new Float32Array(0);
    this.edge_uvs = new Float32Array(0);
    this.edge_indices = new Uint32Array(0);
    this.node_vertices = new Float32Array(0);
    this.node_uvs = new Float32Array(0);
    this.node_indices = new Uint32Array(0);
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
   * Ensures edge mesh buffers are allocated for current link count.
   *
   * @param {number} linkCount - Number of links.
   * @returns {void}
   */
  _ensureEdgeCapacity(linkCount) {
    const vertexFloats = linkCount * 8;
    const indexCount = linkCount * 6;
    if (this.edge_vertices.length === vertexFloats) {
      return;
    }
    this.edge_vertices = new Float32Array(vertexFloats);
    this.edge_uvs = new Float32Array(vertexFloats);
    this.edge_indices = new Uint32Array(indexCount);
    for (let i = 0; i < linkCount; i += 1) {
      writeQuadUVs(this.edge_uvs, i);
      writeQuadIndices(this.edge_indices, i);
    }

    this.edge_mesh = new MeshSimple({
      texture: Texture.WHITE,
      vertices: this.edge_vertices,
      uvs: this.edge_uvs,
      indices: this.edge_indices,
    });
  }

  /**
   * Ensures node mesh buffers are allocated for current node count.
   *
   * @param {number} nodeCount - Number of nodes.
   * @returns {void}
   */
  _ensureNodeCapacity(nodeCount) {
    const vertexFloats = nodeCount * 8;
    const indexCount = nodeCount * 6;
    if (this.node_vertices.length === vertexFloats) {
      return;
    }
    this.node_vertices = new Float32Array(vertexFloats);
    this.node_uvs = new Float32Array(vertexFloats);
    this.node_indices = new Uint32Array(indexCount);
    for (let i = 0; i < nodeCount; i += 1) {
      writeQuadUVs(this.node_uvs, i);
      writeQuadIndices(this.node_indices, i);
    }

    this.node_mesh = new MeshSimple({
      texture: Texture.WHITE,
      vertices: this.node_vertices,
      uvs: this.node_uvs,
      indices: this.node_indices,
    });
  }

  /**
   * Updates edge quad vertices from current simulation positions.
   *
   * @returns {void}
   */
  _updateEdgeVertices() {
    const links = this.pixiplex.links;
    const lineWidth = this.pixiplex.line_style?.lineWidth ?? DEFAULT_EDGE_WIDTH;
    const halfWidth = Math.max(0.5, lineWidth) * 0.5;

    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      const sx = link.source.x;
      const sy = link.source.y;
      const tx = link.target.x;
      const ty = link.target.y;
      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const ox = nx * halfWidth;
      const oy = ny * halfWidth;

      const o = i * 8;
      this.edge_vertices[o] = sx - ox;
      this.edge_vertices[o + 1] = sy - oy;
      this.edge_vertices[o + 2] = sx + ox;
      this.edge_vertices[o + 3] = sy + oy;
      this.edge_vertices[o + 4] = tx + ox;
      this.edge_vertices[o + 5] = ty + oy;
      this.edge_vertices[o + 6] = tx - ox;
      this.edge_vertices[o + 7] = ty - oy;
    }
    this.edge_mesh?.geometry.getBuffer("aPosition").update();
  }

  /**
   * Updates node quad vertices from current simulation positions/styles.
   *
   * @returns {void}
   */
  _updateNodeVertices() {
    for (let i = 0; i < this.sim_nodes.length; i += 1) {
      const node = this.sim_nodes[i];
      const style = this._resolveStyle(i);
      const r = style.radius ?? NODE_STYLE.radius;
      const x0 = node.x - r;
      const y0 = node.y - r;
      const x1 = node.x + r;
      const y1 = node.y + r;

      const o = i * 8;
      this.node_vertices[o] = x0;
      this.node_vertices[o + 1] = y0;
      this.node_vertices[o + 2] = x1;
      this.node_vertices[o + 3] = y0;
      this.node_vertices[o + 4] = x1;
      this.node_vertices[o + 5] = y1;
      this.node_vertices[o + 6] = x0;
      this.node_vertices[o + 7] = y1;
    }
    this.node_mesh?.geometry.getBuffer("aPosition").update();
  }

  /**
   * Initializes mesh buffers and resolves link endpoints.
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

    this._ensureEdgeCapacity(links.length);
    this._ensureNodeCapacity(this.sim_nodes.length);

    this.edge_mesh.tint = this.pixiplex.line_style?.color ?? 0x000000;
    this.edge_mesh.alpha = this.pixiplex.line_style?.alpha ?? 1;
    this.node_mesh.tint = this.node_styles.color ?? NODE_STYLE.color;
    this.node_mesh.alpha = this.node_styles.alpha ?? NODE_STYLE.alpha;

    this._updateEdgeVertices();
    this._updateNodeVertices();
  }

  /**
   * @param {object} viewport - PIXI viewport.
   * @returns {void}
   */
  addToViewport(viewport) {
    viewport.addChild(this.edge_mesh);
    viewport.addChild(this.node_mesh);
  }

  /**
   * Draws one frame by updating edge/node mesh geometry buffers.
   *
   * @returns {number} Number of edges considered redrawn.
   */
  draw() {
    this.edge_mesh.tint = this.pixiplex.line_style?.color ?? 0x000000;
    this.edge_mesh.alpha = this.pixiplex.line_style?.alpha ?? 1;
    if (!Array.isArray(this.node_styles)) {
      this.node_mesh.tint = this.node_styles.color ?? NODE_STYLE.color;
      this.node_mesh.alpha = this.node_styles.alpha ?? NODE_STYLE.alpha;
    }
    this._updateEdgeVertices();
    this._updateNodeVertices();
    return this.pixiplex.links.length;
  }

  /**
   * Applies a node style update for future geometry updates.
   *
   * @param {object|Array<object>} styles - One shared style or per-node styles.
   * @returns {void}
   */
  setNodeStyles(styles) {
    this.node_styles = styles;
  }

  /**
   * @returns {Array<object>} Simulation node objects.
   */
  getSimulationNodes() {
    return this.sim_nodes;
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

    for (let i = 0; i < this.sim_nodes.length; i += 1) {
      const node = this.sim_nodes[i];
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
   * @returns {null} Mesh renderer does not expose per-node graphics.
   */
  getNodeGraphics() {
    return null;
  }

  /**
   * @returns {null} Mesh renderer does not expose link Graphics objects.
   */
  getLinkGraphics() {
    return null;
  }
}

/**
 * Installs the mesh primitives renderer on a Pixiplex instance.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @returns {object} The same host instance.
 */
export const enableMeshRenderer = (pixiplex) => {
  const renderer = new MeshPrimitiveRenderer(pixiplex);
  return installRendererRuntime(pixiplex, renderer, "__mesh_primitive_renderer");
};

/**
 * Pixiplex subclass preconfigured with the mesh primitives backend.
 */
class PixiplexMesh extends Pixiplex {
  /**
   * Convenience class wrapper that installs the mesh renderer runtime.
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
    enableMeshRenderer(this);
  }
}

export { MeshPrimitiveRenderer, PixiplexMesh };
