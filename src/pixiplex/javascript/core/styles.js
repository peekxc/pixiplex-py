import { Container, Graphics, GraphicsContext } from "pixi.js";
import { fromPairs, flatMap, isEmpty } from "lodash-es";

import { clean, identity } from "./utils.js";

export const NODE_STYLE = {
  radius: 6,
  color: 0x650a5a,
  alpha: 1,
  lineStyle: { size: 1.5, color: 0xffffff },
};

const COMMUNITY_PALETTE = [0x4e79a7, 0xf28e2b, 0xe15759, 0x76b7b2, 0x59a14f, 0xedc948, 0xb07aa1, 0xff9da7, 0x9c755f, 0xbab0ab];

/**
 * Produces either a shared node style or per-node palette-driven styles.
 *
 * @param {Array<object>} nodes - Graph node records.
 * @param {object} [base=NODE_STYLE] - Base style for each node.
 * @returns {object|Array<object>} Shared style or per-node style array.
 */
export const default_node_styles = (nodes, base = NODE_STYLE) => {
  if (!nodes || nodes.length === 0) {
    return base;
  }
  const hasGroups = nodes.every((node) => typeof node.group !== "undefined" && node.group !== null);
  if (!hasGroups) {
    return base;
  }

  const groups = [...new Set(nodes.map((node) => node.group))].sort((a, b) => a - b);
  const groupColor = fromPairs(groups.map((group, i) => [group, COMMUNITY_PALETTE[i % COMMUNITY_PALETTE.length]]));
  return nodes.map((node) => ({ ...base, color: groupColor[node.group] }));
};

export const LINE_STYLE = { lineWidth: 1, color: 0x000000, alpha: 1 };

export const POLYGON_STYLE = {
  lineStyle: { size: 1.5, color: 0xffffff },
  color: 0x650a5a,
  alpha: 0.2,
};

/**
 * Reads a node graphic and returns a minimal style snapshot.
 *
 * @param {object} node - PIXI graphics node.
 * @returns {object} Normalized node style.
 */
export const current_ns = (node) => {
  const gd = node.graphicsData[0];
  let c_ns = {
    lineStyle: { size: gd.lineWidth, color: gd.lineColor },
    color: gd.fillColor,
    radius: gd.shape.radius,
    alpha: gd.fillAlpha,
  };
  c_ns.lineStyle = clean(c_ns.lineStyle);
  if (isEmpty(c_ns.lineStyle)) {
    delete c_ns.lineStyle;
  }
  return clean(c_ns);
};

/**
 * Resolves a node style with defaults filled from `NODE_STYLE`.
 *
 * @param {object} node - PIXI graphics node.
 * @returns {object} Fully populated node style.
 */
export const default_ns = (node) => {
  const c_ns = current_ns(node);
  const res = { ...NODE_STYLE, lineStyle: { ...NODE_STYLE.lineStyle } };
  if ("alpha" in c_ns) {
    res.alpha = c_ns.alpha;
  }
  if ("color" in c_ns) {
    res.color = c_ns.color;
  }
  if ("radius" in c_ns) {
    res.radius = c_ns.radius;
  }
  if (!isEmpty(c_ns.lineStyle) && "size" in c_ns.lineStyle) {
    res.lineStyle.size = c_ns.lineStyle.size;
  }
  if (!isEmpty(c_ns.lineStyle) && "color" in c_ns.lineStyle) {
    res.lineStyle.color = c_ns.lineStyle.color;
  }
  return res;
};

/**
 * Applies node styles to one or many node graphics.
 *
 * @param {Array<object>} nodes - Node graphics to update.
 * @param {object|Array<object>} ns - One shared style or per-node styles.
 * @returns {void}
 */
export const build_nodes = (nodes, ns) => {
  if (ns.constructor === Array && ns.length === nodes.length) {
    nodes.forEach((node, i) => {
      node.context = new GraphicsContext()
        .circle(0, 0, ns[i].radius)
        .stroke({ width: ns[i].lineStyle.size, color: ns[i].lineStyle.color })
        .fill({ color: ns[i].color, alpha: ns[i].alpha });
    });
  } else if (ns.constructor === Object) {
    const ns_context = new GraphicsContext()
      .circle(0, 0, ns.radius)
      .stroke({ width: ns.lineStyle.size, color: ns.lineStyle.color })
      .fill({ color: ns.color, alpha: ns.alpha });
    nodes.forEach((node) => {
      node.clear();
      node.context = ns_context;
    });
  } else {
    console.log("Failed to apply node styling.");
  }
};

/**
 * Draws links using either grouped or per-link graphics handles.
 *
 * @param {Array<object>} links - Link records with `source` and `target` positions.
 * @param {object|Array<object>} link_gfx - Grouped Graphics or per-link Graphics array.
 * @param {object|Array<object>} ls - Link style(s).
 * @returns {number} Number of edges redrawn.
 */
export const build_links = (links, link_gfx, ls) => {
  if (link_gfx.constructor === Array) {
    if (ls.constructor !== Object) {
      console.log("Failed to apply link styling.");
      return 0;
    }
    let redrawn = 0;
    const alpha = ls.alpha === undefined ? 1 : ls.alpha;
    const strokeStyle = { width: ls.lineWidth, color: ls.color, alpha };
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const gfx = link_gfx[i];
      const source = link.source;
      const target = link.target;
      const styleChanged = gfx.__lineWidth !== ls.lineWidth || gfx.__lineColor !== ls.color || gfx.__lineAlpha !== alpha;
      const moved = gfx.__sx !== source.x || gfx.__sy !== source.y || gfx.__tx !== target.x || gfx.__ty !== target.y;
      if (!styleChanged && !moved) {
        continue;
      }
      redrawn += 1;
      gfx.clear();
      gfx.moveTo(source.x, source.y).lineTo(target.x, target.y).stroke(strokeStyle);
      gfx.__lineWidth = ls.lineWidth;
      gfx.__lineColor = ls.color;
      gfx.__lineAlpha = alpha;
      gfx.__sx = source.x;
      gfx.__sy = source.y;
      gfx.__tx = target.x;
      gfx.__ty = target.y;
    }
    return redrawn;
  }

  if (ls.constructor === Array && ls.length === links.length) {
    links.forEach((link) => {
      const { source, target } = link;
      link_gfx.moveTo(source.x, source.y).lineTo(target.x, target.y).stroke({ width: ls.lineWidth, color: ls.color });
    });
  } else if (ls.constructor === Object) {
    link_gfx.clear();
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      link_gfx.moveTo(link.source.x, link.source.y).lineTo(link.target.x, link.target.y);
    }
    link_gfx.stroke({ width: ls.lineWidth, color: ls.color, alpha: ls.alpha === undefined ? 1 : ls.alpha });
    return links.length;
  }
  return 0;
};


/**
 * Draws a single polygon with the provided style.
 *
 * @param {object} polygon - Polygon record (`points` or `nodes` expected).
 * @param {object} poly_gfx - PIXI graphics target.
 * @param {object} [ps=POLYGON_STYLE] - Polygon style.
 * @returns {void}
 */
export const build_polygon = (polygon, poly_gfx, ps = POLYGON_STYLE) => {
  poly_gfx.clear();
  poly_gfx.beginFill(ps.color);
  if (polygon.nodes) {
    polygon.points = flatMap(polygon.nodes, (node) => [node.x, node.y]);
  }
  poly_gfx.drawPolygon(polygon);
  poly_gfx.endFill();
};

/**
 * Draws many polygons using shared or per-polygon styles.
 *
 * @param {Array<object>} polygons - Polygon records, each with a `gfx` target.
 * @param {object|Array<object>} [ps=POLYGON_STYLE] - Shared style or style array.
 * @returns {void}
 */
export const build_polygons = (polygons, ps = POLYGON_STYLE) => {
  if (ps.constructor === Array && ps.length === polygons.length) {
    polygons.forEach((poly, i) => {
      build_polygon(poly, poly.gfx, Object.assign(POLYGON_STYLE, ps[i]));
    });
  } else if (ps.constructor === Object) {
    polygons.forEach((poly) => {
      build_polygon(poly, poly.gfx, ps);
    });
  }
};

/**
 * Creates PIXI graphics-backed nodes from plain node records.
 *
 * @param {Array<object>} nodes - Source node records.
 * @returns {Array<object>} Graphics-backed node objects.
 */
export const generate_node_graphics = (nodes) => nodes.map((node) => Object.assign(new Graphics(), node));

/**
 * Creates one empty PIXI Graphics instance for grouped link rendering.
 *
 * @returns {Graphics} Graphics object used for links.
 */
export const generate_links_graphic = () => new Graphics();

/**
 * Creates one PIXI Graphics instance per link.
 *
 * @param {Array<object>} links - Link records.
 * @returns {Array<Graphics>} Per-link graphics array.
 */
export const generate_links_graphics = (links) => links.map(() => new Graphics());

/**
 * Attaches a `gfx` field to each polygon with a fresh Graphics object.
 *
 * @param {Array<object>} polygons - Polygon records.
 * @returns {Array<object>} Same polygons with `gfx` handles attached.
 */
export const generate_polygon_graphics = (polygons) =>
  polygons.map((polygon) => {
    polygon.gfx = new Graphics();
    return polygon;
  });



/**
 * Groups mapped items into a PIXI container.
 *
 * @param {Array<unknown>} items - Items to include.
 * @param {Function} [acc=identity] - Accessor returning display objects.
 * @returns {Container} Container containing all mapped children.
 */
export const group_items = (items, acc = identity) => {
  const group = new Container();
  items.forEach((item) => {
    group.addChild(acc(item));
  });
  return group;
};
