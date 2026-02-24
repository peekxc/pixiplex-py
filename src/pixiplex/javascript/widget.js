import * as pn from "./pixinet.js";

export const WIDGET_MESSAGES = {
  SYNC_MODEL: "msg:sync_model",
  SYNC_NODE_COORDINATES: "msg:sync_node_coordinates",
  CENTER: "msg:center",
};

const to_array = (value) => (Array.isArray(value) ? value : []);

const sync_coordinates = (model, pp) => {
  const nodes = Array.isArray(pp.nodes_gfx) ? pp.nodes_gfx : pp.nodes;
  model.set("_x", nodes.map((node) => Number(node.x) || 0));
  model.set("_y", nodes.map((node) => Number(node.y) || 0));
  model.save_changes();
};

const normalize_node_style = (style = null) => {
  if (!style || typeof style !== "object") return null;
  const lineStyle = style.lineStyle && typeof style.lineStyle === "object"
    ? {
        size: Number(style.lineStyle.size ?? style.lineStyle.width ?? 1.5),
        color: style.lineStyle.color ?? 0xffffff,
      }
    : { size: Number(style.line_size ?? 1.5), color: style.line_color ?? 0xffffff };

  return {
    radius: Number(style.radius ?? 6),
    color: style.color ?? 0x650a5a,
    alpha: Number(style.alpha ?? 1),
    lineStyle,
  };
};

const normalize_line_style = (style = null) => {
  if (!style || typeof style !== "object") return null;
  return {
    lineWidth: Number(style.lineWidth ?? style.line_width ?? 1),
    color: style.color ?? 0x000000,
    alpha: Number(style.alpha ?? 1),
  };
};

const apply_node_style = (pp, style) => {
  const normalized = normalize_node_style(style);
  if (!normalized) return;
  pp.node_style = normalized;
  if (Array.isArray(pp.nodes_gfx)) {
    pn.build_nodes(pp.nodes_gfx, pn.default_node_styles(pp.nodes_gfx, pp.node_style));
  }
};

const apply_line_style = (pp, style) => {
  const normalized = normalize_line_style(style);
  if (!normalized) return;
  pp.line_style = normalized;
  if (pp.links_gfx) {
    pn.build_links(pp.links, pp.links_gfx, pp.line_style);
  }
};

const sync_model = (model, pp) => {
  sync_coordinates(model, pp);
  model.set("nodes", to_array(pp.nodes));
  model.set("links", to_array(pp.links));
  model.save_changes();
};

async function initialize() {
  window.pn = pn;
}

async function render({ model, el }) {
  const nodes = to_array(model.get("nodes"));
  const links = to_array(model.get("links"));
  const pp = new pn.Pixiplex(
    nodes,
    links,
    model.get("width"),
    model.get("height"),
    model.get("scale"),
    model.get("forces") || {},
  );

  apply_node_style(pp, model.get("node_style"));
  apply_line_style(pp, model.get("line_style"));

  await pp.init_all();
  window.pp = pp;
  el.appendChild(pp.view);

  pp.sim?.on("end", () => sync_coordinates(model, pp));

  const apply_graph_data = (center = false) => {
    pp.set_graph_data(to_array(model.get("nodes")), to_array(model.get("links")), {
      center,
      drag: false,
    });
  };

  model.on("change:nodes", () => apply_graph_data(false));
  model.on("change:links", () => apply_graph_data(false));
  model.on("change:forces", () => pp.set_forces(model.get("forces") || {}));
  model.on("change:node_style", () => apply_node_style(pp, model.get("node_style")));
  model.on("change:line_style", () => apply_line_style(pp, model.get("line_style")));

  model.on("change:width", () => {
    pp.width = Number(model.get("width")) || pp.width;
    pp.view.style.width = `${pp.width}px`;
  });
  model.on("change:height", () => {
    pp.height = Number(model.get("height")) || pp.height;
    pp.view.style.height = `${pp.height}px`;
  });
  model.on("change:scale", () => {
    pp.scale = Number(model.get("scale")) || pp.scale;
  });

  model.on("msg:custom", (msg) => {
    if (msg.type === WIDGET_MESSAGES.SYNC_MODEL) {
      sync_model(model, pp);
    } else if (msg.type === WIDGET_MESSAGES.SYNC_NODE_COORDINATES) {
      sync_coordinates(model, pp);
    } else if (msg.type === WIDGET_MESSAGES.CENTER) {
      pp.center_graph(msg.fit, msg.x, msg.y);
    }
  });
}

export default { initialize, render };
