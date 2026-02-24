import { Graphics } from "pixi.js";
import { scaleLinear } from "d3-scale";

const endpoint_id = (endpoint) => {
  if (endpoint && typeof endpoint === "object") return endpoint.id;
  return endpoint;
};

const link_key = (link) => `${endpoint_id(link?.source)}::${endpoint_id(link?.target)}`;
const clone_node = (node) => ({ ...node });
const clone_link = (link) => ({ ...link, source: endpoint_id(link?.source), target: endpoint_id(link?.target) });
const to_array = (value) => (typeof value === "undefined" || value === null ? [] : Array.isArray(value) ? value : [value]);

const canonicalize_graph = (nodes, links) => {
  const node_seen = new Set();
  const clean_nodes = [];
  nodes.forEach((node) => {
    if (typeof node?.id === "undefined") return;
    if (node_seen.has(node.id)) return;
    node_seen.add(node.id);
    clean_nodes.push(clone_node(node));
  });

  const link_seen = new Set();
  const clean_links = [];
  links.forEach((link) => {
    const next = clone_link(link);
    const key = link_key(next);
    if (link_seen.has(key)) return;
    if (!node_seen.has(next.source) || !node_seen.has(next.target)) return;
    link_seen.add(key);
    clean_links.push(next);
  });
  return { nodes: clean_nodes, links: clean_links };
};

const normalize_edge_selector = (selector) => {
  if (typeof selector === "string") return selector;
  if (selector && typeof selector === "object") return `${endpoint_id(selector.source)}::${endpoint_id(selector.target)}`;
  return null;
};

const has_own_keys = (value) => !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;

const resolve_patch = (patch_or_fn, item) => {
  if (typeof patch_or_fn === "function") {
    const patch = patch_or_fn(item);
    return has_own_keys(patch) ? patch : null;
  }
  return has_own_keys(patch_or_fn) ? patch_or_fn : null;
};

const valid_mode = new Set(["union", "intersect", "first", "error", "list"]);
const resolve_mode = (options = {}, fallback = "union") => (valid_mode.has(options.mode) ? options.mode : fallback);

const intersect_sets = (sets) => {
  if (!sets.length) return new Set();
  const [head, ...tail] = sets;
  const out = new Set(head);
  tail.forEach((next) => {
    [...out].forEach((value) => {
      if (!next.has(value)) out.delete(value);
    });
  });
  return out;
};

const path_bfs = (host, source_id, target_id) => {
  if (typeof source_id === "undefined" || typeof target_id === "undefined") return [];
  if (source_id === target_id) return [source_id];
  const prev = new Map();
  const queue = [source_id];
  const seen = new Set([source_id]);
  while (queue.length) {
    const node = queue.shift();
    if (node === target_id) break;
    host.links.forEach((link) => {
      const s = endpoint_id(link.source);
      const t = endpoint_id(link.target);
      const neighbors = [];
      if (s === node) neighbors.push(t);
      if (t === node) neighbors.push(s);
      neighbors.forEach((next) => {
        if (!seen.has(next)) {
          seen.add(next);
          prev.set(next, node);
          queue.push(next);
        }
      });
    });
  }
  if (!seen.has(target_id)) return [];
  const path = [];
  let cursor = target_id;
  const guard = new Set();
  while (typeof cursor !== "undefined" && cursor !== null && !guard.has(cursor)) {
    guard.add(cursor);
    path.push(cursor);
    if (cursor === source_id) break;
    cursor = prev.get(cursor);
  }
  return path.includes(source_id) ? path : [];
};

const path_dijkstra = (host, source_id, target_id, weight_key = "weight") => {
  if (typeof source_id === "undefined" || typeof target_id === "undefined") return [];
  if (source_id === target_id) return [source_id];
  const nodes = host.nodes.map((n) => n.id);
  if (!nodes.includes(source_id) || !nodes.includes(target_id)) return [];
  const prev = new Map();
  const dist = new Map(nodes.map((id) => [id, Infinity]));
  const unvisited = new Set(nodes);
  dist.set(source_id, 0);
  while (unvisited.size) {
    let cur = null;
    let cur_dist = Infinity;
    unvisited.forEach((id) => {
      const d = dist.get(id);
      if (d < cur_dist) {
        cur = id;
        cur_dist = d;
      }
    });
    if (cur === null || cur === target_id) break;
    unvisited.delete(cur);
    host.links.forEach((link) => {
      const s = endpoint_id(link.source);
      const t = endpoint_id(link.target);
      const w = Number(link?.[weight_key]);
      const weight = Number.isFinite(w) && w > 0 ? w : 1;
      if (s === cur && unvisited.has(t) && cur_dist + weight < dist.get(t)) {
        dist.set(t, cur_dist + weight);
        prev.set(t, cur);
      }
      if (t === cur && unvisited.has(s) && cur_dist + weight < dist.get(s)) {
        dist.set(s, cur_dist + weight);
        prev.set(s, cur);
      }
    });
  }
  if (!Number.isFinite(dist.get(target_id))) return [];
  const path = [];
  let cursor = target_id;
  const guard = new Set();
  while (typeof cursor !== "undefined" && cursor !== null && !guard.has(cursor)) {
    guard.add(cursor);
    path.push(cursor);
    if (cursor === source_id) break;
    cursor = prev.get(cursor);
  }
  return path.includes(source_id) ? path : [];
};

const connected_component_ids = (host, seed_id) => {
  if (typeof seed_id === "undefined") return new Set();
  const visited = new Set([seed_id]);
  const queue = [seed_id];
  while (queue.length) {
    const node = queue.shift();
    host.links.forEach((link) => {
      const s = endpoint_id(link.source);
      const t = endpoint_id(link.target);
      if (s === node && !visited.has(t)) {
        visited.add(t);
        queue.push(t);
      }
      if (t === node && !visited.has(s)) {
        visited.add(s);
        queue.push(s);
      }
    });
  }
  return visited;
};

const GRAPH_NAMESPACE_SPEC = {
  graph: {
    nodes: { category: "select", fluent: true },
    edges: { category: "select", fluent: true },
    neighbors: { category: "traversal", fluent: true },
    subgraph: { category: "select", fluent: true },
    replace: { category: "mutator", fluent: true },
    merge: { category: "mutator", fluent: true },
    clear: { category: "mutator", fluent: true },
    normalize: { category: "mutator", fluent: true },
    validate: { category: "query", fluent: false },
    reindex: { category: "mutator", fluent: true },
    count: { category: "query", fluent: false },
    value: { category: "query", fluent: false },
    print: { category: "query", fluent: false },
  },
  nodes: {
    where: { category: "select", fluent: true },
    k_hop: { category: "traversal", fluent: true },
    neighbors: { category: "traversal", fluent: true },
    boundary: { category: "traversal", fluent: true },
    cut: { category: "traversal", fluent: true },
    any_path_to: { category: "traversal", fluent: true },
    shortest_path_to: { category: "traversal", fluent: true },
    components: { category: "traversal", fluent: true },
    edges: { category: "select", fluent: true },
    style: { category: "mutator", fluent: true },
    attr: { category: "mutator", fluent: true },
    remove: { category: "mutator", fluent: true },
    ids: { category: "query", fluent: false },
    count: { category: "query", fluent: false },
    to_array: { category: "query", fluent: false },
    to_object: { category: "query", fluent: false },
    value: { category: "query", fluent: false },
    print: { category: "query", fluent: false },
  },
  edges: {
    where: { category: "select", fluent: true },
    nodes: { category: "select", fluent: true },
    attr: { category: "mutator", fluent: true },
    remove: { category: "mutator", fluent: true },
    ids: { category: "query", fluent: false },
    count: { category: "query", fluent: false },
    to_array: { category: "query", fluent: false },
    to_object: { category: "query", fluent: false },
    value: { category: "query", fluent: false },
    print: { category: "query", fluent: false },
  },
};

export const graph_namespace_composability = (options = {}) => {
  const scopes = Object.keys(GRAPH_NAMESPACE_SPEC);
  const methods = scopes.flatMap((scope) =>
    Object.keys(GRAPH_NAMESPACE_SPEC[scope]).map((name) => ({ scope, name, ...GRAPH_NAMESPACE_SPEC[scope][name] })),
  );
  const fluent_methods = methods.filter((method) => method.fluent);
  const categories = methods.reduce((acc, method) => {
    acc[method.category] = (acc[method.category] || 0) + 1;
    return acc;
  }, {});
  const max_pairs = methods.length * methods.length;
  const reachable_pairs = fluent_methods.length * methods.length;
  const score = max_pairs === 0 ? 0 : reachable_pairs / max_pairs;
  const report = {
    total_methods: methods.length,
    fluent_methods: fluent_methods.length,
    query_methods: methods.length - fluent_methods.length,
    categories,
    reachable_pairs,
    max_pairs,
    composability_score: score,
    composability_percent: Number((score * 100).toFixed(2)),
  };
  if (options.detailed) report.method_spec = GRAPH_NAMESPACE_SPEC;
  if (options.print && typeof console !== "undefined") {
    console.log("[pixiplex graph namespace composability]", report);
  }
  return report;
};

const apply_node_styles = (host, node_ids, patch_or_fn) => {
  if (!node_ids?.length) return false;
  const scope = new Set(node_ids);
  let changed = false;
  host.nodes = host.nodes.map((node) => {
    if (!scope.has(node.id)) return node;
    const patch = resolve_patch(patch_or_fn, node);
    if (!patch) return node;
    changed = true;
    return { ...node, style: { ...(node.style || {}), ...(patch || {}) } };
  });
  if (changed && Array.isArray(host.nodes_gfx) && typeof host.set_node_styles === "function") {
    const by_id = new Map(host.nodes.map((node) => [node.id, node]));
    host.set_node_styles(host.nodes_gfx.map((gfx_node) => ({ ...(host.node_style || {}), ...((by_id.get(gfx_node.id) || {}).style || {}) })));
  }
  return changed;
};

const apply_node_attrs = (host, node_ids, patch_or_fn) => {
  if (!node_ids?.length) return false;
  const scope = new Set(node_ids);
  let changed = false;
  host.nodes = host.nodes.map((node) => {
    if (!scope.has(node.id)) return node;
    const patch = resolve_patch(patch_or_fn, node);
    if (!patch) return node;
    changed = true;
    return { ...node, ...(patch || {}) };
  });
  return changed;
};

const apply_edge_attrs = (host, edge_keys, patch_or_fn) => {
  if (!edge_keys?.length) return false;
  const scope = new Set(edge_keys);
  let changed = false;
  host.links = host.links.map((link) => {
    if (!scope.has(link_key(link))) return link;
    const patch = resolve_patch(patch_or_fn, link);
    if (!patch) return link;
    changed = true;
    return { ...link, ...(patch || {}) };
  });
  return changed;
};

class NodeSelection {
  constructor(graph_view, node_ids) {
    this.graph_view = graph_view;
    const valid_ids = new Set(graph_view.host.nodes.map((node) => node.id));
    this.node_ids = new Set(to_array(node_ids).filter((id) => valid_ids.has(id)));
  }

  _nodes() {
    return this.graph_view.host.nodes.filter((node) => this.node_ids.has(node.id));
  }

  where(predicate = () => true) {
    return new NodeSelection(this.graph_view, this._nodes().filter((node) => predicate(node)).map((node) => node.id));
  }

  k_hop(k = 1, options = {}) {
    const direction = options.direction || "both";
    const include_seeds = options.include_seeds ?? true;
    const visited = new Set(include_seeds ? [...this.node_ids] : []);
    let frontier = new Set(this.node_ids);
    for (let hop = 0; hop < Math.max(0, k); hop += 1) {
      const next_frontier = new Set();
      this.graph_view.host.links.forEach((link) => {
        const s = endpoint_id(link.source);
        const t = endpoint_id(link.target);
        if ((direction === "both" || direction === "out") && frontier.has(s) && !visited.has(t)) {
          visited.add(t);
          next_frontier.add(t);
        }
        if ((direction === "both" || direction === "in") && frontier.has(t) && !visited.has(s)) {
          visited.add(s);
          next_frontier.add(s);
        }
      });
      frontier = next_frontier;
      if (!frontier.size) break;
    }
    return new NodeSelection(this.graph_view, [...visited]);
  }

  neighbors(k = 1, options = {}) {
    const shell = options.shell ?? false;
    if (!shell) return this.k_hop(k, options);
    const hops = Math.max(0, k);
    if (hops === 0) return new NodeSelection(this.graph_view, this.ids());
    const direction = options.direction || "both";
    let frontier = new Set(this.node_ids);
    const visited = new Set(this.node_ids);
    for (let hop = 0; hop < hops; hop += 1) {
      const next_frontier = new Set();
      this.graph_view.host.links.forEach((link) => {
        const s = endpoint_id(link.source);
        const t = endpoint_id(link.target);
        if ((direction === "both" || direction === "out") && frontier.has(s) && !visited.has(t)) {
          visited.add(t);
          next_frontier.add(t);
        }
        if ((direction === "both" || direction === "in") && frontier.has(t) && !visited.has(s)) {
          visited.add(s);
          next_frontier.add(s);
        }
      });
      frontier = next_frontier;
      if (!frontier.size) break;
    }
    return new NodeSelection(this.graph_view, [...frontier]);
  }

  boundary(options = {}) {
    const direction = options.direction || "both";
    const keys = this.graph_view.host.links
      .filter((link) => {
        const s = endpoint_id(link.source);
        const t = endpoint_id(link.target);
        const s_in = this.node_ids.has(s);
        const t_in = this.node_ids.has(t);
        if (direction === "out") return s_in && !t_in;
        if (direction === "in") return !s_in && t_in;
        return (s_in && !t_in) || (!s_in && t_in);
      })
      .map((link) => link_key(link));
    return new EdgeSelection(this.graph_view, keys);
  }

  cut(other = undefined, options = {}) {
    if (typeof other === "undefined" || other === null) return this.boundary(options);
    const rhs_ids = new Set(
      other instanceof NodeSelection
        ? other.ids()
        : other instanceof EdgeSelection
          ? other.nodes(options).ids()
          : [],
    );
    const lhs_ids = this.node_ids;
    const direction = options.direction || "both";
    const keys = this.graph_view.host.links
      .filter((link) => {
        const s = endpoint_id(link.source);
        const t = endpoint_id(link.target);
        if (direction === "out") return lhs_ids.has(s) && rhs_ids.has(t);
        if (direction === "in") return lhs_ids.has(t) && rhs_ids.has(s);
        return (lhs_ids.has(s) && rhs_ids.has(t)) || (lhs_ids.has(t) && rhs_ids.has(s));
      })
      .map((link) => link_key(link));
    return new EdgeSelection(this.graph_view, keys);
  }

  _apply_mode_node_sets(node_sets, mode) {
    if (mode === "list") {
      return node_sets.map((item) => new NodeSelection(this.graph_view, [...item]));
    }
    if (!node_sets.length) return new NodeSelection(this.graph_view, []);
    if (mode === "first") return new NodeSelection(this.graph_view, [...node_sets[0]]);
    if (mode === "intersect") return new NodeSelection(this.graph_view, [...intersect_sets(node_sets)]);
    const ids = new Set();
    node_sets.forEach((item) => item.forEach((id) => ids.add(id)));
    return new NodeSelection(this.graph_view, [...ids]);
  }

  any_path_to(target_id, options = {}) {
    const mode = resolve_mode(options, "first");
    const seeds = this.ids();
    if (mode === "error" && seeds.length > 1) {
      throw new Error("any_path_to(mode='error') requires a single seed node");
    }
    const target_valid = new Set(this.graph_view.host.nodes.map((node) => node.id)).has(target_id);
    if (!target_valid) return mode === "list" ? [] : new NodeSelection(this.graph_view, []);
    const node_sets = seeds.map((seed_id) => new Set(path_bfs(this.graph_view.host, seed_id, target_id)));
    return this._apply_mode_node_sets(node_sets, mode);
  }

  shortest_path_to(target_id, options = {}) {
    const mode = resolve_mode(options, "first");
    const seeds = this.ids();
    if (mode === "error" && seeds.length > 1) {
      throw new Error("shortest_path_to(mode='error') requires a single seed node");
    }
    const target_valid = new Set(this.graph_view.host.nodes.map((node) => node.id)).has(target_id);
    if (!target_valid) return mode === "list" ? [] : new NodeSelection(this.graph_view, []);
    const weighted = options.weighted ?? false;
    const weight_key = options.weight_key || "weight";
    const node_sets = seeds.map((seed_id) => new Set(weighted
      ? path_dijkstra(this.graph_view.host, seed_id, target_id, weight_key)
      : path_bfs(this.graph_view.host, seed_id, target_id)));
    return this._apply_mode_node_sets(node_sets, mode);
  }

  components(options = {}) {
    const mode = resolve_mode(options, "union");
    const seeds = this.ids();
    if (mode === "error" && seeds.length > 1) {
      throw new Error("components(mode='error') requires a single seed node");
    }
    const comps = seeds.map((seed_id) => connected_component_ids(this.graph_view.host, seed_id));
    return this._apply_mode_node_sets(comps, mode);
  }

  edges(options = {}) {
    const direction = options.direction || "both";
    const relation = options.relation || "incident";
    const keys = this.graph_view.host.links
      .filter((link) => {
        const s = endpoint_id(link.source);
        const t = endpoint_id(link.target);
        if (relation === "induced") return this.node_ids.has(s) && this.node_ids.has(t);
        if (direction === "out") return this.node_ids.has(s);
        if (direction === "in") return this.node_ids.has(t);
        return this.node_ids.has(s) || this.node_ids.has(t);
      })
      .map((link) => link_key(link));
    return new EdgeSelection(this.graph_view, keys);
  }

  style(patch_or_fn) {
    if (typeof patch_or_fn === "undefined" || patch_or_fn === null) return this;
    apply_node_styles(this.graph_view.host, [...this.node_ids], patch_or_fn);
    return this;
  }

  attr(patch_or_fn) {
    if (typeof patch_or_fn === "undefined" || patch_or_fn === null) return this;
    apply_node_attrs(this.graph_view.host, [...this.node_ids], patch_or_fn);
    return this;
  }

  remove(options = {}) {
    if (!this.node_ids.size) return this.graph_view;
    this.graph_view.host.set_graph_data(
      this.graph_view.host.nodes.filter((node) => !this.node_ids.has(node.id)).map(clone_node),
      this.graph_view.host.links.map(clone_link).filter((link) => !this.node_ids.has(endpoint_id(link.source)) && !this.node_ids.has(endpoint_id(link.target))),
      { center: false, ...options },
    );
    return this.graph_view;
  }

  ids() { return [...this.node_ids]; }

  count() {
    const link_count = this.graph_view.host.links.filter((link) => this.node_ids.has(endpoint_id(link.source)) && this.node_ids.has(endpoint_id(link.target))).length;
    return { nodes: this.node_ids.size, links: link_count };
  }

  to_array() {
    return this._nodes().map(clone_node);
  }

  to_object() {
    const nodes = this.to_array();
    const node_set = new Set(nodes.map((node) => node.id));
    const links = this.graph_view.host.links.filter((link) => node_set.has(endpoint_id(link.source)) && node_set.has(endpoint_id(link.target))).map(clone_link);
    return { nodes, links };
  }

  value() {
    return this.to_object();
  }

  print(options = {}) {
    const payload = this.value();
    console.log(`[pixiplex nodes.print] nodes=${payload.nodes.length} links=${payload.links.length}`);
    if (options.table) {
      console.table(payload.nodes);
      console.table(payload.links);
    } else {
      console.log(payload);
    }
    return payload;
  }

}

class EdgeSelection {
  constructor(graph_view, edge_keys) {
    this.graph_view = graph_view;
    const valid_keys = new Set(graph_view.host.links.map((link) => link_key(link)));
    this.edge_keys = new Set(to_array(edge_keys).filter((key) => valid_keys.has(key)));
  }

  _links() {
    return this.graph_view.host.links.filter((link) => this.edge_keys.has(link_key(link)));
  }

  where(predicate = () => true) {
    return new EdgeSelection(this.graph_view, this._links().filter((link) => predicate(link)).map((link) => link_key(link)));
  }

  nodes() {
    const ids = this._links().flatMap((link) => [endpoint_id(link.source), endpoint_id(link.target)]);
    return new NodeSelection(this.graph_view, [...new Set(ids)]);
  }

  attr(patch_or_fn) {
    if (typeof patch_or_fn === "undefined" || patch_or_fn === null) return this;
    apply_edge_attrs(this.graph_view.host, [...this.edge_keys], patch_or_fn);
    return this;
  }

  remove(options = {}) {
    if (!this.edge_keys.size) return this.graph_view;
    this.graph_view.host.set_graph_data(
      this.graph_view.host.nodes.map(clone_node),
      this.graph_view.host.links.map(clone_link).filter((link) => !this.edge_keys.has(link_key(link))),
      { center: false, ...options },
    );
    return this.graph_view;
  }

  ids() { return [...this.edge_keys]; }

  count() {
    const links = this._links();
    const node_ids = new Set(links.flatMap((link) => [endpoint_id(link.source), endpoint_id(link.target)]));
    return { nodes: node_ids.size, links: links.length };
  }

  to_array() {
    return this._links().map(clone_link);
  }

  to_object() {
    const links = this.to_array();
    const node_ids = new Set(links.flatMap((link) => [endpoint_id(link.source), endpoint_id(link.target)]));
    const nodes = this.graph_view.host.nodes.filter((node) => node_ids.has(node.id)).map(clone_node);
    return { nodes, links };
  }

  value() {
    return this.to_object();
  }

  print(options = {}) {
    const payload = this.value();
    console.log(`[pixiplex edges.print] nodes=${payload.nodes.length} links=${payload.links.length}`);
    if (options.table) {
      console.table(payload.nodes);
      console.table(payload.links);
    } else {
      console.log(payload);
    }
    return payload;
  }

}

class GraphView {
  constructor(host) {
    this.host = host;
  }

  nodes(ids = undefined) {
    return new NodeSelection(this, typeof ids === "undefined" ? this.host.nodes.map((node) => node.id) : to_array(ids));
  }

  edges(selectors = undefined) {
    if (typeof selectors === "undefined") return new EdgeSelection(this, this.host.links.map((link) => link_key(link)));
    return new EdgeSelection(this, to_array(selectors).map(normalize_edge_selector).filter(Boolean));
  }

  neighbors(seed_ids = [], k = 1, options = {}) { return this.nodes(seed_ids).k_hop(k, options); }

  subgraph(criteria = {}) {
    if (typeof criteria.node_ids !== "undefined") return this.nodes(criteria.node_ids);
    if (Array.isArray(criteria.groups)) return this.nodes().where((node) => criteria.groups.includes(node.group));
    if (typeof criteria.predicate === "function") return this.nodes().where(criteria.predicate);
    return this.nodes();
  }

  replace(data = {}, options = {}) {
    if (typeof data?.nodes === "undefined" && typeof data?.links === "undefined") return this;
    const next = canonicalize_graph(to_array(data.nodes), to_array(data.links));
    this.host.set_graph_data(next.nodes, next.links, { center: false, ...options });
    return this;
  }

  merge(data = {}, options = {}) {
    if (!to_array(data.nodes).length && !to_array(data.links).length) return this;
    const next = canonicalize_graph(this.host.nodes.concat(to_array(data.nodes)).map(clone_node), this.host.links.concat(to_array(data.links)).map(clone_link));
    this.host.set_graph_data(next.nodes, next.links, { center: false, ...options });
    return this;
  }

  clear(options = {}) {
    this.host.set_graph_data([], [], { center: false, ...options });
    return this;
  }

  normalize(options = {}) {
    const next = canonicalize_graph(this.host.nodes, this.host.links);
    this.host.set_graph_data(next.nodes, next.links, { center: false, ...options });
    return this;
  }

  validate() {
    const errors = [];
    const ids = new Set();
    this.host.nodes.forEach((node, idx) => {
      if (typeof node?.id === "undefined") { errors.push(`node[${idx}] missing id`); return; }
      if (ids.has(node.id)) { errors.push(`duplicate node id: ${node.id}`); return; }
      ids.add(node.id);
    });
    this.host.links.forEach((link, idx) => {
      const source = endpoint_id(link.source);
      const target = endpoint_id(link.target);
      if (!ids.has(source) || !ids.has(target)) errors.push(`link[${idx}] references unknown endpoint(s): ${source} -> ${target}`);
    });
    return { ok: errors.length === 0, errors };
  }

  reindex(options = {}) {
    const offset = options.offset || 0;
    const sorted = this.host.nodes.map(clone_node).sort((a, b) => `${a.id}`.localeCompare(`${b.id}`));
    const id_map = new Map(sorted.map((node, idx) => [node.id, idx + offset]));
    const next_nodes = sorted.map((node) => ({ ...node, id: id_map.get(node.id) }));
    const next_links = this.host.links.map((link) => ({ ...clone_link(link), source: id_map.get(endpoint_id(link.source)), target: id_map.get(endpoint_id(link.target)) }));
    this.host.set_graph_data(next_nodes, next_links, { center: false, ...options });
    return this;
  }

  count() {
    return { nodes: this.host.nodes.length, links: this.host.links.length };
  }

  value() {
    return {
      nodes: this.host.nodes.map(clone_node),
      links: this.host.links.map(clone_link),
    };
  }

  print(options = {}) {
    const payload = this.value();
    console.log(`[pixiplex graph.print] nodes=${payload.nodes.length} links=${payload.links.length}`);
    if (options.table) {
      console.table(payload.nodes);
      console.table(payload.links);
    } else {
      console.log(payload);
    }
    return payload;
  }
}

/**
 * Creates a graph namespace builder for fluent graph operations.
 * @param {object} host - Pixiplex host instance.
 * @returns {GraphView} Graph API view.
 */
export const create_graph_namespace = (host) => {
  return new GraphView(host);
};

export const make_scale = (width, height) => {
  const x_scale = scaleLinear().domain([0, 1]).range([0, width]);
  const y_scale = scaleLinear().domain([0, 1]).range([0, height]);
  return {
    scale: (point) => [x_scale(point[0]), y_scale(point[1])],
    invert: (point) => [x_scale.invert(point[0]), y_scale.invert(point[1])],
  };
};

export const scale_nodes = (nodes, width, height) => {
  nodes.forEach((node) => {
    if (!("x" in node)) node.x = Math.random();
    if (!("y" in node)) node.y = Math.random();
    node.x *= width;
    node.y *= height;
  });
  return nodes;
};

export const resolve_links = (nodes, links) => {
  const id_to_index = Object.fromEntries(nodes.map((node, idx) => [node.id, idx]));
  links.forEach((link) => {
    link.source = link.source instanceof Graphics ? link.source : nodes[id_to_index[link.source]];
    link.target = link.target instanceof Graphics ? link.target : nodes[id_to_index[link.target]];
  });
};

export const insert_nodes = (existing_nodes, candidate_nodes, mapper = null) => {
  const seen = new Set(existing_nodes.map((node) => node.id));
  const to_add = candidate_nodes.filter((node) => !seen.has(node.id));
  const map_nodes = mapper || ((nodes) => nodes.map((node) => Object.assign(new Graphics(), node)));
  return existing_nodes.concat(map_nodes(to_add));
};

export const remove_nodes = (remove_ids, nodes, links, container) => {
  const id_set = new Set(remove_ids);
  const next_links = links.filter((link) => !id_set.has(link.source?.id ?? link.source) && !id_set.has(link.target?.id ?? link.target));
  links.splice(0, links.length, ...next_links);

  const removed_nodes = nodes.filter((node) => id_set.has(node.id));
  const next_nodes = nodes.filter((node) => !id_set.has(node.id));
  nodes.splice(0, nodes.length, ...next_nodes);

  if (container && typeof container.removeChild === "function") {
    removed_nodes.forEach((node) => container.removeChild(node));
  }
};
