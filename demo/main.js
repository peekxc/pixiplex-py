import "uno.css";
import * as pn from "../src/pixiplex/javascript/pixinet.js";
import { Graphics, Text } from "pixi.js";
import { enable_grouped_renderer } from "../src/pixiplex/javascript/renderers/grouped.js";
import { enable_individual_renderer } from "../src/pixiplex/javascript/renderers/individual.js";
import { enable_mesh_renderer } from "../src/pixiplex/javascript/renderers/mesh.js";
import { enable_webgl_primitive_renderer } from "../src/pixiplex/javascript/renderers/webgl.js";
import graph from "../src/pixiplex/static/data/les_miserables.json";

window.pn = pn;

const pnCont = document.getElementById("pixiplex_container");
const renderModeBadge = document.getElementById("render_mode_badge");
const toggleRenderModeButton = document.getElementById("toggle_render_mode");
const searchParams = new URLSearchParams(window.location.search);
const groupedNodesFlag = searchParams.get("groupedNodes");
const modeParam = searchParams.get("renderMode");
let currentRenderMode = modeParam || "per-node-graphics";
if (!modeParam && (groupedNodesFlag === "1" || groupedNodesFlag === "true")) {
  currentRenderMode = "grouped-nodes";
}
const validModes = new Set(["per-node-graphics", "grouped-nodes", "mesh-primitives", "webgl-primitives"]);
if (!validModes.has(currentRenderMode)) {
  currentRenderMode = "per-node-graphics";
}

const modeOrder = ["per-node-graphics", "grouped-nodes", "mesh-primitives", "webgl-primitives"];

const clone_graph_data = (sourceGraph) => ({
  nodes: sourceGraph.nodes.map((node) => ({ ...node })),
  links: sourceGraph.links.map((link) => ({
    ...link,
    source: typeof link.source === "object" ? link.source.id : link.source,
    target: typeof link.target === "object" ? link.target.id : link.target,
  })),
});

const create_pixiplex_for_mode = (mode) => {
  const graphData = clone_graph_data(graph);
  const instance = new pn.Pixiplex(graphData.nodes, graphData.links, 1200, 800, 2.0);

  if (mode === "grouped-nodes") {
    enable_grouped_renderer(instance);
  } else if (mode === "mesh-primitives") {
    enable_mesh_renderer(instance);
  } else if (mode === "webgl-primitives") {
    enable_webgl_primitive_renderer(instance);
  } else {
    enable_individual_renderer(instance);
  }
  return instance;
};

let pp = create_pixiplex_for_mode(currentRenderMode);

const get_next_mode = (mode) => {
  const currentIndex = modeOrder.indexOf(mode);
  return modeOrder[(currentIndex + 1) % modeOrder.length];
};

const update_render_mode_url = (mode) => {
  const nextParams = new URLSearchParams(window.location.search);
  nextParams.set("renderMode", mode);
  nextParams.delete("groupedNodes");
  const query = nextParams.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
};

const update_render_mode_button = () => {
  if (!toggleRenderModeButton) {
    return;
  }
  const targetMode = get_next_mode(currentRenderMode);
  toggleRenderModeButton.textContent = `Switch render mode (${targetMode})`;
};

window.pp = pp;
const perfHud = document.getElementById("perf_hud");

const BASE_LINE_STYLE = { ...pn.LINE_STYLE };
const get_base_node_styles = () => pn.default_node_styles(pp.nodes, pn.NODE_STYLE);

const palette = [0x1d4ed8, 0x0f766e, 0xbe123c, 0x7e22ce, 0xea580c, 0x0369a1, 0x4f46e5, 0x166534];

const forceLoopState = { enabled: true };
const dragState = { enabled: false };
const perfModeState = { enabled: false };

const toggleButtons = {
  forceLoop: document.getElementById("toggle_force_loop"),
  dragMode: document.getElementById("toggle_drag_mode"),
  perfMode: document.getElementById("toggle_performance_mode"),
};

const forceToggles = {
  center: document.getElementById("toggle_center_force"),
  link: document.getElementById("toggle_link_force"),
  charge: document.getElementById("toggle_nbody_force"),
};

const statusBadges = {
  forceLoop: document.getElementById("status_force_loop"),
  drag: document.getElementById("status_drag"),
  center: document.getElementById("status_center_force"),
  link: document.getElementById("status_link_force"),
  charge: document.getElementById("status_charge_force"),
  perfMode: document.getElementById("status_perf_mode"),
  renderer: document.getElementById("status_renderer"),
};
const forceInspector = document.getElementById("force_inspector");
const graphApiCommandInput = document.getElementById("graph_api_command");
const graphApiHighlight = document.getElementById("graph_api_highlight");
const graphApiMethodChips = document.getElementById("graph_api_method_chips");
const graphApiChipTooltip = document.getElementById("graph_api_chip_tooltip");
const graphApiExecuteButton = document.getElementById("graph_api_execute");
const graphApiResult = document.getElementById("graph_api_result");
const graphApiLast = document.getElementById("graph_api_last");
const graphApiResetCommandButton = document.getElementById("graph_api_reset_command");

const default_graph_command = `pp.graph().replace({\n  nodes: [\n    { id: 101, group: "a", score: 0.95 },\n    { id: 102, group: "b", score: 0.55 },\n    { id: 103, group: "a", score: 0.25 }\n  ],\n  links: [\n    { source: 101, target: 102, weight: 0.8 },\n    { source: 102, target: 103, weight: 0.4 },\n    { source: 101, target: 103, weight: 0.9 }\n  ]\n}).nodes().where((n) => n.group === "a").count()`;

const graph_namespace_methods = [
  "nodes",
  "edges",
  "where",
  "k_hop",
  "style",
  "attr",
  "remove",
  "set",
  "use",
  "clear_sets",
  "replace",
  "merge",
  "validate",
  "normalize",
  "neighbors",
  "path_between",
  "connected_component",
  "subgraph",
  "reindex",
  "ids",
  "count",
  "value",
  "print",
  "composability",
];

const shared_graph_update_options = [
  "clone?: boolean = true (deep-clone payload before apply)",
  "center?: boolean = true (recenters and fits after apply)",
  "drag?: boolean = false (enables drag after apply)",
];

const graph_namespace_docs = {
  set: {
    signature: "set(data = {}, options = {})",
    summary: "Replace the full graph using `{ nodes, links }`.",
    args: ["data.nodes: node array", "data.links: link array"],
    options: [
      ...shared_graph_update_options,
    ],
    returns: "fluent graph namespace",
  },
  patch: {
    signature: "patch(delta = {}, options = {})",
    summary: "Apply incremental graph updates.",
    args: ["delta: { add_nodes, remove_node_ids, add_links, remove_links }"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  clear: {
    signature: "clear(options = {})",
    summary: "Remove all nodes and links.",
    args: [],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  replace_nodes: {
    signature: "replace_nodes(nodes = [], options = {})",
    summary: "Replace node list and drop invalid links.",
    args: ["nodes: replacement node array"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  replace_links: {
    signature: "replace_links(links = [], options = {})",
    summary: "Replace links while preserving current nodes.",
    args: ["links: replacement link array"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  add_nodes: {
    signature: "add_nodes(nodes = [], options = {})",
    summary: "Add/update nodes by id.",
    args: ["nodes: nodes to merge by id (last write wins)"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  update_nodes: {
    signature: "update_nodes(patches = [], options = {})",
    summary: "Patch existing nodes by id.",
    args: ["patches: partial node objects with required id"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  remove_nodes: {
    signature: "remove_nodes(node_ids = [], options = {})",
    summary: "Remove nodes and incident links.",
    args: ["node_ids: ids to delete"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  add_links: {
    signature: "add_links(links = [], options = {})",
    summary: "Append links, canonicalize, dedupe, and validate endpoints.",
    args: ["links: links to append"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  update_links: {
    signature: "update_links(patches = [], options = {})",
    summary: "Patch links by source/target key.",
    args: ["patches: link patches keyed by source::target"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  remove_links: {
    signature: "remove_links(links = [], options = {})",
    summary: "Remove links matching source/target keys.",
    args: ["links: source/target selectors"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  merge: {
    signature: "merge(data = {}, options = {})",
    summary: "Merge nodes and links into the graph with dedupe.",
    args: ["data.nodes?: nodes to merge", "data.links?: links to append"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  snapshot: {
    signature: "snapshot(name = \"default\")",
    summary: "Store a deep clone of current graph state.",
    args: ["name: snapshot key"],
    returns: "fluent graph namespace",
  },
  restore: {
    signature: "restore(name = \"default\", options = {})",
    summary: "Restore a previously stored snapshot.",
    args: ["name: snapshot key"],
    options: [...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  validate: {
    signature: "validate()",
    summary: "Validate ids and link endpoint integrity.",
    args: [],
    returns: "{ ok: boolean, errors: string[] }",
  },
  normalize: {
    signature: "normalize(options = {})",
    summary: "Deduplicate nodes/links and remove invalid endpoints.",
    args: [],
    options: [
      "center?: boolean = false (normalize preserves current viewport by default)",
      "clone?: boolean = true (deep-clone payload before apply)",
      "drag?: boolean = false (enable drag handlers after apply)",
    ],
    returns: "fluent graph namespace",
  },
  select_all: {
    signature: "select_all()",
    summary: "Reset selection to the entire graph.",
    args: [],
    returns: "fluent graph namespace",
  },
  select_nodes_by_ids: {
    signature: "select_nodes_by_ids(node_ids, options = {})",
    summary: "Select nodes by explicit ids.",
    args: ["node_ids: id or id[]"],
    options: ["combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_nodes_by_attr: {
    signature: "select_nodes_by_attr(key, matcher, options = {})",
    summary: "Select nodes by attribute equality or matcher callback.",
    args: ["key: attribute name", "matcher: value or (value,node)=>boolean"],
    options: ["combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_nodes_where: {
    signature: "select_nodes_where(predicate, options = {})",
    summary: "Select nodes by predicate.",
    args: ["predicate: (node)=>boolean"],
    options: ["combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_links_by_attr: {
    signature: "select_links_by_attr(key, matcher, options = {})",
    summary: "Select links by attribute equality or matcher callback.",
    args: ["key: attribute name", "matcher: value or (value,link)=>boolean"],
    options: ["combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_links_where: {
    signature: "select_links_where(predicate, options = {})",
    summary: "Select links by predicate.",
    args: ["predicate: (link)=>boolean"],
    options: ["combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_neighbors: {
    signature: "select_neighbors(seed_ids, k = 1, options = {})",
    summary: "Select nodes within k hops from seed nodes.",
    args: ["seed_ids: id or id[]", "k: hop distance"],
    options: ["direction?: both | out | in = both", "include_seeds?: boolean = true", "combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_path_between: {
    signature: "select_path_between(source_id, target_id, options = {})",
    summary: "Select nodes/links along a path between source and target.",
    args: ["source_id: node id", "target_id: node id"],
    options: ["weighted?: boolean = false", "weight_key?: string = \"weight\"", "combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_connected_component: {
    signature: "select_connected_component(seed_id, options = {})",
    summary: "Select the connected component containing seed node.",
    args: ["seed_id: node id"],
    options: ["combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  select_subgraph: {
    signature: "select_subgraph(criteria = {}, options = {})",
    summary: "Select by `{ node_ids }`, `{ groups }`, or `{ predicate }`.",
    args: ["criteria.node_ids?: id[]", "criteria.groups?: group[]", "criteria.predicate?: (node)=>boolean"],
    options: ["combine?: replace | union | intersect | subtract = replace"],
    returns: "fluent graph namespace",
  },
  reindex: {
    signature: "reindex(options = {})",
    summary: "Renumber node ids and rewrite all link endpoints.",
    args: [],
    options: ["offset?: number = 0 (new id base)", ...shared_graph_update_options],
    returns: "fluent graph namespace",
  },
  node_color: {
    signature: "node_color(color, options = {})",
    summary: "Set node color for current scope or full graph.",
    args: ["color: number|string"],
    options: ["scope?: \"scope\" | \"all\" = \"scope\""],
    returns: "fluent graph namespace",
  },
  node_radius: {
    signature: "node_radius(radius, options = {})",
    summary: "Set node radius for current scope or full graph.",
    args: ["radius: number"],
    options: ["scope?: \"scope\" | \"all\" = \"scope\""],
    returns: "fluent graph namespace",
  },
  edge_width: {
    signature: "edge_width(line_width, options = {})",
    summary: "Set edge width for current scope or full graph.",
    args: ["line_width: number"],
    options: ["scope?: \"scope\" | \"all\" = \"scope\""],
    returns: "fluent graph namespace",
  },
  edge_color: {
    signature: "edge_color(color, options = {})",
    summary: "Set edge color for current scope or full graph.",
    args: ["color: number|string"],
    options: ["scope?: \"scope\" | \"all\" = \"scope\""],
    returns: "fluent graph namespace",
  },
  ids: {
    signature: "ids()",
    summary: "Return scoped node ids.",
    args: [],
    returns: "(number|string)[]",
  },
  count: {
    signature: "count()",
    summary: "Return scoped node/link counts.",
    args: [],
    returns: "{ nodes: number, links: number }",
  },
  value: {
    signature: "value()",
    summary: "Return deep-cloned scoped graph payload.",
    args: [],
    returns: "{ nodes: object[], links: object[] }",
  },
  print: {
    signature: "print(options = {})",
    summary: "Log and return scoped or full graph payload.",
    args: [],
    options: ["scope?: \"scope\" | \"all\" = \"scope\"", "table?: boolean = false (uses console.table)"],
    returns: "{ nodes: object[], links: object[] }",
  },
  composability: {
    signature: "composability(options = {})",
    summary: "Measure how chainable and expressive the graph namespace is.",
    args: [],
    options: ["detailed?: boolean = false (include method spec + transitions)", "print?: boolean = false (console.log report)"],
    returns: "{ composability_percent, reachable_pairs, categories, ... }",
  },
};

[
  "patch",
  "clear",
  "replace_nodes",
  "replace_links",
  "add_nodes",
  "update_nodes",
  "remove_nodes",
  "add_links",
  "update_links",
  "remove_links",
  "snapshot",
  "restore",
  "node_color",
  "node_radius",
  "edge_width",
  "edge_color",
].forEach((key) => {
  delete graph_namespace_docs[key];
});

Object.assign(graph_namespace_docs, {
  nodes: {
    signature: "nodes(ids?)",
    summary: "Start a node selection from all nodes or selected ids.",
    args: ["ids?: id or id[]"],
    returns: "NodeSelection",
  },
  edges: {
    signature: "edges(selectors?)",
    summary: "Start an edge selection from all edges or explicit keys.",
    args: ["selectors?: source::target key or { source, target }[]"],
    returns: "EdgeSelection",
  },
  where: {
    signature: "where(predicate)",
    summary: "Filter current node/edge selection by predicate.",
    args: ["predicate: (item)=>boolean"],
    returns: "selection",
  },
  k_hop: {
    signature: "k_hop(k = 1, options = {})",
    summary: "Expand node selection by hop distance.",
    args: ["k: hop count"],
    options: ["direction?: both | out | in = both", "include_seeds?: boolean = true"],
    returns: "NodeSelection",
  },
  style: {
    signature: "style(patch_or_fn)",
    summary: "Merge style fields into current selection.",
    args: ["patch_or_fn: object or (item)=>object"],
    returns: "selection",
  },
  attr: {
    signature: "attr(patch_or_fn)",
    summary: "Merge attributes into current selection.",
    args: ["patch_or_fn: object or (item)=>object"],
    returns: "selection",
  },
  remove: {
    signature: "remove(options = {})",
    summary: "Delete selected nodes or edges from the graph.",
    args: [],
    options: ["center?: boolean = false", "clone?: boolean = true", "drag?: boolean = false"],
    returns: "GraphView",
  },
  set: {
    signature: "set(name, selection) | set({ nodes, links })",
    summary: "Store named selection or replace graph data.",
    args: ["name: set key", "selection: NodeSelection | EdgeSelection"],
    options: [...shared_graph_update_options],
    returns: "GraphView",
  },
  use: {
    signature: "use(name)",
    summary: "Load a named selection set.",
    args: ["name: set key"],
    returns: "NodeSelection | EdgeSelection",
  },
  clear_sets: {
    signature: "clear_sets()",
    summary: "Clear all named selection sets.",
    args: [],
    returns: "GraphView",
  },
  replace: {
    signature: "replace(data = {}, options = {})",
    summary: "Replace full graph with canonicalized nodes and links.",
    args: ["data.nodes: node[]", "data.links: link[]"],
    options: [...shared_graph_update_options],
    returns: "GraphView",
  },
  merge: {
    signature: "merge(data = {}, options = {})",
    summary: "Merge nodes and links into existing graph with dedupe.",
    args: ["data.nodes?: node[]", "data.links?: link[]"],
    options: [...shared_graph_update_options],
    returns: "GraphView",
  },
  neighbors: {
    signature: "neighbors(seed_ids, k = 1, options = {})",
    summary: "Select nodes within k hops of seed ids.",
    args: ["seed_ids: id or id[]", "k: hop distance"],
    options: ["direction?: both | out | in = both", "include_seeds?: boolean = true"],
    returns: "NodeSelection",
  },
  path_between: {
    signature: "path_between(source_id, target_id, options = {})",
    summary: "Select nodes on a path between two nodes.",
    args: ["source_id: node id", "target_id: node id"],
    options: ["weighted?: boolean = false", "weight_key?: string = \"weight\""],
    returns: "NodeSelection",
  },
  connected_component: {
    signature: "connected_component(seed_id)",
    summary: "Select all nodes in the same connected component.",
    args: ["seed_id: node id"],
    returns: "NodeSelection",
  },
  subgraph: {
    signature: "subgraph(criteria = {})",
    summary: "Select by `{ node_ids }`, `{ groups }`, or `{ predicate }`.",
    args: ["criteria.node_ids?: id[]", "criteria.groups?: group[]", "criteria.predicate?: (node)=>boolean"],
    returns: "NodeSelection",
  },
  composability: {
    signature: "composability(options = {})",
    summary: "Measure how chainable and expressive the graph namespace is.",
    args: [],
    options: ["detailed?: boolean = false (include method spec)", "print?: boolean = false"],
    returns: "{ composability_percent, reachable_pairs, categories, ... }",
  },
});

const safe_stringify = (value) => {
  try {
    return JSON.stringify(value, (key, val) => {
      if (typeof val === "function") {
        return "[Function]";
      }
      if (val instanceof Error) {
        return { name: val.name, message: val.message, stack: val.stack };
      }
      return val;
    }, 2);
  } catch (_) {
    return String(value);
  }
};

const set_graph_api_status = (label, ok = true) => {
  if (!graphApiLast) {
    return;
  }
  graphApiLast.textContent = label;
  graphApiLast.classList.toggle("bg-emerald-100", ok);
  graphApiLast.classList.toggle("text-emerald-900", ok);
  graphApiLast.classList.toggle("bg-rose-100", !ok);
  graphApiLast.classList.toggle("text-rose-800", !ok);
};

const update_graph_api_result = (payload) => {
  if (!graphApiResult) {
    return;
  }
  graphApiResult.textContent = safe_stringify(payload);
};

const escape_html = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const highlight_js = (code) => {
  const token_regex = /(\/\/.*$)|(\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:pp|pn|true|false|null|undefined|return|const|let|new|typeof|instanceof|graph|set|patch|clear|replace_nodes|replace_links|add_nodes|update_nodes|remove_nodes|add_links|update_links|remove_links|merge|snapshot|restore|validate|normalize|select_all|select_nodes_by_ids|select_nodes_by_attr|select_nodes_where|select_links_by_attr|select_links_where|select_neighbors|select_path_between|select_connected_component|select_subgraph|reindex|node_color|node_radius|edge_width|edge_color|ids|count|value|print|composability|scope|table|detailed|combine|union|intersect|subtract|replace|direction|weighted|weight_key|include_seeds)\b)|([{}()[\].,;])/gm;
  let output = "";
  let cursor = 0;
  let match = token_regex.exec(code);
  while (match) {
    output += escape_html(code.slice(cursor, match.index));
    const token = match[0];
    if (match[1]) {
      output += `<span style="color:#64748b">${escape_html(token)}</span>`;
    } else if (match[2]) {
      output += `<span style="color:#fbbf24">${escape_html(token)}</span>`;
    } else if (match[3]) {
      output += `<span style="color:#fb7185">${escape_html(token)}</span>`;
    } else if (match[4]) {
      output += `<span style="color:#34d399">${escape_html(token)}</span>`;
    } else if (match[5]) {
      output += `<span style="color:#93c5fd">${escape_html(token)}</span>`;
    } else {
      output += escape_html(token);
    }
    cursor = match.index + token.length;
    match = token_regex.exec(code);
  }
  output += escape_html(code.slice(cursor));
  return output || " ";
};

const sync_graph_highlight = () => {
  if (!graphApiCommandInput || !graphApiHighlight) {
    return;
  }
  graphApiHighlight.innerHTML = highlight_js(graphApiCommandInput.value);
  graphApiHighlight.scrollTop = graphApiCommandInput.scrollTop;
  graphApiHighlight.scrollLeft = graphApiCommandInput.scrollLeft;
};

const highlight_signature = (signature) => highlight_js(signature);

const show_chip_tooltip = (method_name, event) => {
  if (!graphApiChipTooltip) {
    return;
  }
  const doc = graph_namespace_docs[method_name];
  if (!doc) {
    graphApiChipTooltip.classList.add("hidden");
    return;
  }
  const args_markup = (doc.args || [])
    .map((line) => `<div style="margin-top:2px;color:#cbd5e1;">- ${escape_html(line)}</div>`)
    .join("");
  const options_markup = (doc.options || [])
    .map((line) => `<div style="margin-top:2px;color:#bfdbfe;">- ${escape_html(line)}</div>`)
    .join("");
  graphApiChipTooltip.innerHTML = `
    <div style="color:#7dd3fc;margin-bottom:4px;">graph().${highlight_signature(doc.signature)}</div>
    <div style="color:#e2e8f0;">${escape_html(doc.summary)}</div>
    ${args_markup ? `<div style="margin-top:6px;color:#86efac;">args:${args_markup}</div>` : ""}
    ${options_markup ? `<div style="margin-top:6px;color:#93c5fd;">options:${options_markup}</div>` : ""}
    ${doc.returns ? `<div style="margin-top:6px;color:#fcd34d;">returns: ${escape_html(doc.returns)}</div>` : ""}
  `;
  graphApiChipTooltip.classList.remove("hidden");

  const offset_x = 12;
  const offset_y = 14;
  let left = event.clientX + offset_x;
  let top = event.clientY + offset_y;
  const rect = graphApiChipTooltip.getBoundingClientRect();
  if (left + rect.width > window.innerWidth - 8) {
    left = window.innerWidth - rect.width - 8;
  }
  if (top + rect.height > window.innerHeight - 8) {
    top = event.clientY - rect.height - 8;
  }
  graphApiChipTooltip.style.left = `${Math.max(8, left)}px`;
  graphApiChipTooltip.style.top = `${Math.max(8, top)}px`;
};

const hide_chip_tooltip = () => {
  if (!graphApiChipTooltip) {
    return;
  }
  graphApiChipTooltip.classList.add("hidden");
};

const insert_command_snippet = (snippet) => {
  if (!graphApiCommandInput) {
    return;
  }
  const start = graphApiCommandInput.selectionStart ?? graphApiCommandInput.value.length;
  const end = graphApiCommandInput.selectionEnd ?? graphApiCommandInput.value.length;
  const source = graphApiCommandInput.value;
  graphApiCommandInput.value = `${source.slice(0, start)}${snippet}${source.slice(end)}`;
  const cursor = start + snippet.length;
  graphApiCommandInput.selectionStart = cursor;
  graphApiCommandInput.selectionEnd = cursor;
  graphApiCommandInput.focus();
  sync_graph_highlight();
};

const execute_graph_method = () => {
  if (!graphApiCommandInput) {
    return;
  }
  const command = graphApiCommandInput.value.trim();
  if (!command) {
    set_graph_api_status("Command is empty", false);
    return;
  }
  try {
    let result;
    try {
      result = Function("pp", "pn", `\"use strict\"; return (${command});`)(pp, pn);
    } catch (_) {
      result = Function("pp", "pn", `\"use strict\"; ${command}`)(pp, pn);
    }
    const total_count = { nodes: pp.nodes.length, links: pp.links.length };
    set_graph_api_status(`Executed command | total nodes=${total_count.nodes} links=${total_count.links}`);
    if (result === pp.graph()) {
      const scope_count = pp.graph().count();
      update_graph_api_result({
        fluent: true,
        scope_count,
        total_count,
      });
      return;
    }
    update_graph_api_result(result);
  } catch (error) {
    set_graph_api_status(`Command error: ${error.message}`, false);
    update_graph_api_result({ error: error.message, stack: error.stack });
  }
};

const setup_graph_api_lab = () => {
  if (!graphApiCommandInput || !graphApiExecuteButton) {
    return;
  }

  graphApiCommandInput.value = default_graph_command;
  sync_graph_highlight();
  graphApiCommandInput.addEventListener("input", sync_graph_highlight);
  graphApiCommandInput.addEventListener("scroll", sync_graph_highlight);
  graphApiCommandInput.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }
    event.preventDefault();
    const start = graphApiCommandInput.selectionStart;
    const end = graphApiCommandInput.selectionEnd;
    const src = graphApiCommandInput.value;
    graphApiCommandInput.value = `${src.slice(0, start)}  ${src.slice(end)}`;
    graphApiCommandInput.selectionStart = graphApiCommandInput.selectionEnd = start + 2;
    sync_graph_highlight();
  });

  graphApiExecuteButton.addEventListener("click", execute_graph_method);

  if (graphApiMethodChips) {
    graph_namespace_methods.forEach((name) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = name;
      chip.className = "rounded-sm bg-slate-200 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-300";
      chip.addEventListener("click", () => {
        insert_command_snippet(`.${name}()`);
      });
      chip.addEventListener("mouseenter", (event) => show_chip_tooltip(name, event));
      chip.addEventListener("mousemove", (event) => show_chip_tooltip(name, event));
      chip.addEventListener("mouseleave", hide_chip_tooltip);
      graphApiMethodChips.appendChild(chip);
    });
  }

  if (graphApiResetCommandButton) {
    graphApiResetCommandButton.addEventListener("click", () => {
      graphApiCommandInput.value = default_graph_command;
      sync_graph_highlight();
    });
  }

  set_graph_api_status("Ready.");
  update_graph_api_result({ hint: "Edit the command and click Execute command." });
};

const set_badge_state = (el, label, isOn) => {
  el.textContent = `${label}: ${isOn ? "on" : "off"}`;
  el.classList.toggle("bg-emerald-100", isOn);
  el.classList.toggle("text-emerald-800", isOn);
  el.classList.toggle("bg-slate-200", !isOn);
  el.classList.toggle("text-slate-700", !isOn);
};

const set_toggle_button_state = (el, isOn) => {
  el.classList.toggle("bg-emerald-700", isOn);
  el.classList.toggle("hover:bg-emerald-600", isOn);
  el.classList.toggle("ring-2", isOn);
  el.classList.toggle("ring-emerald-200", isOn);
  el.classList.toggle("bg-indigo-700", !isOn);
  el.classList.toggle("hover:bg-indigo-600", !isOn);
  el.classList.toggle("ring-0", !isOn);
};

const set_binary_button_state = (el, isOn, labels, classes) => {
  el.textContent = isOn ? labels.on : labels.off;
  el.classList.toggle(classes.onBg, isOn);
  el.classList.toggle(classes.onHover, isOn);
  el.classList.toggle(classes.offBg, !isOn);
  el.classList.toggle(classes.offHover, !isOn);
  el.classList.toggle("ring-2", isOn);
  el.classList.toggle("ring-emerald-200", isOn);
};

let springDistance = 30;
let springStrength = 0.15;
let useAutoSpringStrength = true;
let chargeStrength = -30;

const springDistanceValue = document.getElementById("spring_distance_value");
const springStrengthValue = document.getElementById("spring_strength_value");
const chargeStrengthValue = document.getElementById("charge_strength_value");

const apply_spring_force = () => {
  pp.force_link("spring", springDistance, useAutoSpringStrength ? undefined : springStrength, 1);
};

const apply_charge_force = () => {
  pp.force_manybody("charge", chargeStrength, 0.9, 1.0, Infinity);
};

const update_force_ui = () => {
  const centerOn = pp.sim.force("center") !== undefined;
  const linkOn = pp.sim.force("spring") !== undefined;
  const chargeOn = pp.sim.force("charge") !== undefined;
  set_toggle_button_state(forceToggles.center, centerOn);
  set_toggle_button_state(forceToggles.link, linkOn);
  set_toggle_button_state(forceToggles.charge, chargeOn);
  set_badge_state(statusBadges.center, "center", centerOn);
  set_badge_state(statusBadges.link, "link", linkOn);
  set_badge_state(statusBadges.charge, "charge", chargeOn);
  render_force_inspector();
};

const update_interaction_ui = () => {
  set_badge_state(statusBadges.forceLoop, "force", forceLoopState.enabled);
  set_badge_state(statusBadges.drag, "drag", dragState.enabled);
  set_badge_state(statusBadges.perfMode, "perf", perfModeState.enabled);

  set_binary_button_state(toggleButtons.forceLoop, forceLoopState.enabled, {
    on: "Force loop: on",
    off: "Force loop: off",
  }, {
    onBg: "bg-emerald-700",
    onHover: "hover:bg-emerald-600",
    offBg: "bg-slate-900",
    offHover: "hover:bg-slate-700",
  });

  set_binary_button_state(toggleButtons.dragMode, dragState.enabled, {
    on: "Node drag: on",
    off: "Node drag: off",
  }, {
    onBg: "bg-emerald-700",
    onHover: "hover:bg-emerald-600",
    offBg: "bg-emerald-500",
    offHover: "hover:bg-emerald-400",
  });

  set_binary_button_state(toggleButtons.perfMode, perfModeState.enabled, {
    on: "Performance mode: on",
    off: "Performance mode: off",
  }, {
    onBg: "bg-emerald-700",
    onHover: "hover:bg-emerald-600",
    offBg: "bg-cyan-700",
    offHover: "hover:bg-cyan-600",
  });
};

const detect_renderer_label = () => {
  const name = pp.app?.renderer?.config?.name ?? "Unknown";
  const low = name.toLowerCase();
  if (low.includes("webgpu")) {
    return "WebGPU";
  }
  if (low.includes("webgl")) {
    return "WebGL";
  }
  if (low.includes("canvas")) {
    return "Canvas";
  }
  return name;
};

const update_renderer_ui = () => {
  if (!statusBadges.renderer) {
    return;
  }
  statusBadges.renderer.textContent = `renderer: ${detect_renderer_label()} | ${currentRenderMode}`;
  if (renderModeBadge) {
    renderModeBadge.textContent = `canvas: ${currentRenderMode}`;
  }
  update_render_mode_button();
};

const format_force_value = (value) => {
  if (typeof value === "function") {
    return "fn";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(3).replace(/\.000$/, "") : `${value}`;
  }
  if (typeof value === "undefined") {
    return "-";
  }
  return `${value}`;
};

const render_force_inspector = () => {
  if (!forceInspector || !pp.sim) {
    return;
  }

  const snapshot = pp.get_force_snapshot();
  if (snapshot.length === 0) {
    forceInspector.innerHTML = '<div class="rounded-md bg-slate-100 px-2 py-1 text-slate-500">no stored forces</div>';
    return;
  }

  const rows = snapshot
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const params = entry.active
        ? Object.entries(entry.params)
            .map(([name, value]) => `${name}=${format_force_value(value)}`)
            .join(" ")
        : "inactive";

      const tone = entry.active ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-500";
      return `<div class="mb-1 rounded-md ${tone} px-2 py-1"><span class="font-semibold">${entry.name}</span> ${entry.active ? "[on]" : "[off]"} <span class="opacity-75">${entry.type}</span> ${params}</div>`;
    });

  forceInspector.innerHTML = rows.join("");
};

let lastPerfTs = performance.now();
let perfFrames = 0;
let perfAccumMs = 0;

const update_perf_hud = () => {
  if (!perfHud) {
    return;
  }

  const now = performance.now();
  const frameMs = now - lastPerfTs;
  lastPerfTs = now;
  perfFrames += 1;
  perfAccumMs += frameMs;

  if (forceLoopState.enabled && pp.sim && pp.sim.alpha() <= (pp.sim.alphaMin() + 0.0025)) {
    forceLoopState.enabled = false;
    update_interaction_ui();
  }

  if (perfAccumMs >= 250) {
    const avgFrameMs = perfAccumMs / perfFrames;
    const fps = 1000 / avgFrameMs;
    const alpha = pp.sim ? pp.sim.alpha() : 0;
    const edgesRedrawn = pp.perf_stats?.edgesRedrawn ?? 0;
    perfHud.innerHTML = `
      <div>fps: ${fps.toFixed(1)}</div>
      <div>frame ms: ${avgFrameMs.toFixed(2)}</div>
      <div>sim alpha: ${alpha.toFixed(4)}</div>
      <div>edges redrawn: ${edgesRedrawn}</div>
    `;
    perfFrames = 0;
    perfAccumMs = 0;
  }

  requestAnimationFrame(update_perf_hud);
};

const reheat = (alpha = 0.8) => {
  pp.set_force_enabled(true);
  forceLoopState.enabled = true;
  update_interaction_ui();
  pp.sim?.alpha(alpha);
  pp.sim?.restart();
};

const random_item = (items) => items[Math.floor(Math.random() * items.length)];

const apply_node_styles = (styles) => {
  if (typeof pp.set_node_styles === "function") {
    pp.set_node_styles(styles);
    return;
  }
  pn.build_nodes(pp.nodes_gfx, styles);
};

const destroy_current_renderer = () => {
  try {
    pp.set_drag_enabled?.(false);
    pp.set_force_enabled?.(false);
    pp.sim?.stop?.();
    pp.ticker?.stop?.();
  } catch (_) {
    // best effort cleanup before replacing renderer
  }

  if (typeof pp._renderer?.destroy === "function") {
    try {
      pp._renderer.destroy();
    } catch (_) {
      // non-fatal cleanup path
    }
  }

  if (pp.app) {
    try {
      pp.app.destroy();
    } catch (_) {
      // app may already be destroyed
    }
  }
  pnCont.innerHTML = "";
};

const mount_renderer_for_mode = async (mode) => {
  const next = create_pixiplex_for_mode(mode);
  pp = next;
  window.pp = pp;

  await pp.init();
  pnCont.appendChild(pp.view);
  if (typeof pp._renderer?.attach_to_view === "function") {
    pp._renderer.attach_to_view();
  }
  if (typeof pp._renderer?.resize === "function") {
    pp._renderer.resize(pp.width, pp.height);
  }

  reset_default_forces();
  update_interaction_ui();
  update_force_ui();
  update_renderer_ui();
};

const switch_render_mode = async (mode) => {
  if (mode === currentRenderMode) {
    return;
  }
  destroy_current_renderer();
  currentRenderMode = mode;
  update_render_mode_url(mode);
  await mount_renderer_for_mode(mode);
};

if (toggleRenderModeButton) {
  toggleRenderModeButton.addEventListener("click", async () => {
    toggleRenderModeButton.disabled = true;
    try {
      await switch_render_mode(get_next_mode(currentRenderMode));
    } finally {
      toggleRenderModeButton.disabled = false;
    }
  });
}

const reset_default_forces = () => {
  springDistance = 30;
  springStrength = 0.15;
  useAutoSpringStrength = true;
  chargeStrength = -30;
  springDistanceValue.textContent = `${springDistance}`;
  springStrengthValue.textContent = "auto";
  chargeStrengthValue.textContent = `${chargeStrength}`;
  document.getElementById("spring_distance_slider").value = `${springDistance}`;
  document.getElementById("spring_strength_slider").value = `${springStrength}`;
  document.getElementById("charge_strength_slider").value = `${chargeStrength}`;
  pp.force_center("center");
  apply_spring_force();
  apply_charge_force();
  reheat(0.7);
  update_force_ui();
};

document.getElementById("toggle_force_loop").addEventListener("click", () => {
  if (forceLoopState.enabled) {
    pp.set_force_enabled(false);
    forceLoopState.enabled = false;
  } else {
    pp.set_force_enabled(true);
    forceLoopState.enabled = true;
  }
  update_interaction_ui();
});

document.getElementById("reheat_button").addEventListener("click", () => {
  reheat(0.95);
});

document.getElementById("pulse_charge_button").addEventListener("click", () => {
  pp.force_manybody("charge", -130, 0.9, 1.0, Infinity);
  reheat(1);
  update_force_ui();
  setTimeout(() => {
    apply_charge_force();
    reheat(0.6);
    update_force_ui();
  }, 1100);
});

document.getElementById("toggle_performance_mode").addEventListener("click", () => {
  perfModeState.enabled = !perfModeState.enabled;
  pp.set_performance_mode(perfModeState.enabled);
  update_interaction_ui();
  update_renderer_ui();
});

document.getElementById("toggle_center_force").addEventListener("click", () => {
  if (pp.sim.force("center") === undefined) {
    pp.force_center("center");
    reheat(0.6);
    update_force_ui();
    return;
  }
  pp.remove_force("center");
  reheat(0.6);
  update_force_ui();
});

document.getElementById("toggle_link_force").addEventListener("click", () => {
  if (pp.sim.force("spring") === undefined) {
    apply_spring_force();
    reheat(0.6);
    update_force_ui();
    return;
  }
  pp.remove_force("spring");
  reheat(0.6);
  update_force_ui();
});

document.getElementById("toggle_nbody_force").addEventListener("click", () => {
  if (pp.sim.force("charge") === undefined) {
    apply_charge_force();
    reheat(0.6);
    update_force_ui();
    return;
  }
  pp.remove_force("charge");
  reheat(0.6);
  update_force_ui();
});

document.getElementById("apply_xy_force_button").addEventListener("click", () => {
  pp.force_x("x", pp.width / 2, 0.06);
  pp.force_y("y", pp.height / 2, 0.06);
  reheat(0.8);
  update_force_ui();
});

document.getElementById("apply_radial_force_button").addEventListener("click", () => {
  pp.force_radial("radial", Math.min(pp.width, pp.height) / 3, pp.width / 2, pp.height / 2, 0.15);
  reheat(0.9);
  update_force_ui();
});

document.getElementById("reset_forces_button").addEventListener("click", () => {
  pp.remove_force("x");
  pp.remove_force("y");
  pp.remove_force("radial");
  reset_default_forces();
  update_force_ui();
});

document.getElementById("center_button").addEventListener("click", () => {
  pp.center_graph(true);
});

document.getElementById("fit_only_button").addEventListener("click", () => {
  pp.vp.fit();
});

document.getElementById("draw_grid_button").addEventListener("click", () => {
  const n = 100;
  const m = 100;
  const rows = Math.floor(pp.height / m);
  const cols = Math.floor(pp.width / n);

  const graphics = new Graphics();
  pp.vp.addChild(graphics);

  for (let i = 0; i <= rows; i += 1) {
    graphics.moveTo(0, i * m);
    graphics.lineTo(pp.width, i * m);
    graphics.stroke({ width: 2, color: 0x000000 });
  }

  for (let j = 0; j <= cols; j += 1) {
    graphics.moveTo(j * n, 0);
    graphics.lineTo(j * n, pp.height);
    graphics.stroke({ width: 2, color: 0x000000 });
  }

  for (let i = 0; i <= rows; i += 1) {
    for (let j = 0; j <= cols; j += 1) {
      const text = new Text({ text: `(${j * n},${i * m})`, style: { fontSize: 12 } });
      text.x = j * n + 2;
      text.y = i * m + 2;
      pp.vp.addChild(text);
    }
  }
});

document.getElementById("toggle_drag_mode").addEventListener("click", () => {
  dragState.enabled = !dragState.enabled;
  if (dragState.enabled) {
    pp.set_drag_enabled(true);
  } else {
    pp.set_drag_enabled(false);
  }
  update_interaction_ui();
});

document.getElementById("change_node_color_button").addEventListener("click", () => {
  const ns = { ...pn.NODE_STYLE, color: 0xff7518, radius: 8 };
  apply_node_styles(ns);
});

document.getElementById("change_node_colors_button").addEventListener("click", () => {
  const ns = pp.nodes.map((_, i) => ({ ...pn.NODE_STYLE, color: i % 2 === 0 ? 0xff7518 : 0x650a5a }));
  apply_node_styles(ns);
});

document.getElementById("randomize_colors_button").addEventListener("click", () => {
  const ns = pp.nodes.map(() => ({ ...pn.NODE_STYLE, color: random_item(palette) }));
  apply_node_styles(ns);
});

document.getElementById("change_node_radius_button").addEventListener("click", () => {
  const ns = pp.nodes.map((_, i) => ({ ...pn.NODE_STYLE, radius: i < pp.nodes.length / 2 ? 5 : 10 }));
  apply_node_styles(ns);
});

document.getElementById("change_node_radii_button").addEventListener("click", () => {
  apply_node_styles({ ...pn.NODE_STYLE, radius: 10 });
});

document.getElementById("change_link_width_button").addEventListener("click", () => {
  pp.line_style = { ...pn.LINE_STYLE, lineWidth: 3 };
  if (pp.links_gfx) {
    pn.build_links(pp.links, pp.links_gfx, pp.line_style);
  }
});

document.getElementById("change_link_color_button").addEventListener("click", () => {
  pp.line_style = { ...pn.LINE_STYLE, color: 0x00ff88 };
  if (pp.links_gfx) {
    pn.build_links(pp.links, pp.links_gfx, pp.line_style);
  }
});

document.getElementById("shuffle_positions_button").addEventListener("click", () => {
  const width = pp.width * pp.scale;
  const height = pp.height * pp.scale;
  pp.nodes.forEach((node) => {
    node.x = Math.random() * width;
    node.y = Math.random() * height;
  });
  reheat(0.9);
});

document.getElementById("reset_styles_button").addEventListener("click", () => {
  apply_node_styles(get_base_node_styles());
  pp.line_style = { ...BASE_LINE_STYLE };
  if (pp.links_gfx) {
    pn.build_links(pp.links, pp.links_gfx, pp.line_style);
  }
});

document.getElementById("lasso_button").addEventListener("click", () => {
  console.log("lasso clicked");
});

document.getElementById("enable_weak_tree").addEventListener("click", () => {
  pp.dispatcher.on("tick", () => {
    const k = 10 * pp.sim.alpha();
    pp.links.forEach((link) => {
      link.source.y -= k;
      link.target.y += k;
    });
    pp.sim.tick();
  });
  pp.sim?.alpha(0.35);
});

document.getElementById("spring_distance_slider").addEventListener("input", (event) => {
  springDistance = Number(event.target.value);
  springDistanceValue.textContent = `${springDistance}`;
  apply_spring_force();
  reheat(0.45);
  update_force_ui();
});

document.getElementById("spring_strength_slider").addEventListener("input", (event) => {
  springStrength = Number(event.target.value);
  useAutoSpringStrength = false;
  springStrengthValue.textContent = springStrength.toFixed(2);
  apply_spring_force();
  reheat(0.45);
  update_force_ui();
});

document.getElementById("charge_strength_slider").addEventListener("input", (event) => {
  chargeStrength = Number(event.target.value);
  chargeStrengthValue.textContent = `${chargeStrength}`;
  apply_charge_force();
  reheat(0.45);
  update_force_ui();
});

const start_app = async () => {
  try {
    await mount_renderer_for_mode(currentRenderMode);
    requestAnimationFrame(update_perf_hud);
  } catch (error) {
    pnCont.innerHTML = `<div class="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">Failed to initialize Pixiplex renderer. Check browser console for details.<br/>${error?.message ?? error}</div>`;
    throw error;
  }
};

setup_graph_api_lab();
start_app();
