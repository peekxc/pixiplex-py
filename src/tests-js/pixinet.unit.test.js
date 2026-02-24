import { describe, expect, test } from "vitest";

import {
  combinations,
  compose,
  default_node_styles,
  graph_namespace_composability,
  make_scale,
  Pixiplex,
  serialize_force,
} from "../pixiplex/javascript/pixinet.js";
import * as d3_force from "d3-force";

describe("pixinet core utilities", () => {
  test("combinations generates expected pairs", () => {
    const actual = combinations(4, 2).map((pair) => pair.join("-")).sort();
    const expected = [
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
      [3, 4],
    ]
      .map((pair) => pair.join("-"))
      .sort();
    expect(actual).toEqual(expected);
  });

  test("compose applies functions right-to-left", () => {
    const addOne = (x) => x + 1;
    const double = (x) => x * 2;
    const fn = compose(addOne, double);
    expect(fn(3)).toBe(7);
  });

  test("make_scale scales and inverts coordinates", () => {
    const { scale, invert } = make_scale(1000, 500);
    const scaled = scale([0.2, 0.8]);
    expect(scaled[0]).toBeCloseTo(200);
    expect(scaled[1]).toBeCloseTo(400);

    const inverted = invert(scaled);
    expect(inverted[0]).toBeCloseTo(0.2);
    expect(inverted[1]).toBeCloseTo(0.8);
  });

  test("serialize_force returns force config payload", () => {
    const nodes = [{ id: 0 }, { id: 1 }, { id: 2 }];
    const links = [{ source: 0, target: 1 }, { source: 1, target: 2 }];
    const sim = d3_force
      .forceSimulation(nodes)
      .force("center", d3_force.forceCenter(10, 20))
      .force("spring", d3_force.forceLink(links).id((d) => d.id).distance(42).strength(0.3).iterations(2))
      .force("charge", d3_force.forceManyBody().strength(-55).theta(0.8));

    sim.stop();

    const payload = serialize_force(sim, ["center", "spring", "charge"], ["forceCenter", "forceLink", "forceManyBody"]);

    expect(payload.center.type).toBe("forceCenter");
    expect(payload.center.params.x).toBeCloseTo(10);
    expect(payload.center.params.y).toBeCloseTo(20);

    expect(payload.spring.type).toBe("forceLink");
    expect(payload.spring.params.distance).toBeTypeOf("function");
    expect(payload.spring.params.strength).toBeTypeOf("function");
    expect(payload.spring.params.iterations).toBe(2);

    expect(payload.charge.type).toBe("forceManyBody");
    expect(payload.charge.params.strength).toBeTypeOf("function");
    expect(payload.charge.params.theta).toBeCloseTo(0.8);
  });

  test("default_node_styles colors grouped nodes", () => {
    const styles = default_node_styles(
      [
        { id: 0, group: 1 },
        { id: 1, group: 2 },
        { id: 2, group: 1 },
      ],
      { radius: 6, color: 0x123456, alpha: 1, lineStyle: { size: 1, color: 0xffffff } },
    );

    expect(Array.isArray(styles)).toBe(true);
    expect(styles[0].color).toBe(styles[2].color);
    expect(styles[0].color).not.toBe(styles[1].color);
  });

  test("graph namespace supports replace/merge/filter workflow", () => {
    const pp = new Pixiplex([], [], 640, 480, 1.0);
    pp.graph().replace({
      nodes: [{ id: 1, group: "a" }, { id: 2, group: "b" }],
      links: [{ source: 1, target: 2 }],
    });

    pp.graph().merge({
      nodes: [{ id: 3, group: "a" }],
      links: [{ source: 2, target: 3 }],
    });

    const counts = pp.graph().nodes().where((node) => node.group === "a").count();
    expect(counts.nodes).toBe(2);
    expect(pp.nodes.length).toBe(3);
    expect(pp.links.length).toBe(2);
  });

  test("graph() refreshes stale cached namespace objects", () => {
    const pp = new Pixiplex([], [], 640, 480, 1.0);
    pp._graph_api = { legacy: true };
    const graph = pp.graph();
    expect(typeof graph.nodes).toBe("function");
    expect(typeof graph.replace).toBe("function");
  });
});

describe("pixinet graph namespace", () => {
  const make_pp = () => {
    const pp = new Pixiplex([], [], 640, 480, 1.0);
    pp.graph().replace({
      nodes: [
        { id: 1, group: "a", score: 0.9 },
        { id: 2, group: "b", score: 0.6 },
        { id: 3, group: "a", score: 0.2 },
      ],
      links: [
        { source: 1, target: 2, weight: 0.8 },
        { source: 2, target: 3, weight: 0.3 },
        { source: 1, target: 3, weight: 0.9 },
      ],
    });
    return pp;
  };

  test("full-graph queries work via node selections", () => {
    const pp = make_pp();
    expect(pp.graph().nodes().count()).toEqual({ nodes: 3, links: 3 });
    expect(pp.graph().nodes().ids().sort()).toEqual([1, 2, 3]);
    expect(pp.graph().nodes().value().nodes.length).toBe(3);
  });

  test("node selection supports where, k-hop, attr, style, and remove", () => {
    const pp = make_pp();
    const selected = pp.graph().nodes().where((n) => n.group === "a");
    expect(selected.count()).toEqual({ nodes: 2, links: 1 });

    selected.attr({ flagged: true }).style({ color: 0xff00ff, radius: 12 });
    expect(pp.nodes.find((n) => n.id === 1)?.flagged).toBe(true);
    expect(pp.nodes.find((n) => n.id === 1)?.style?.color).toBe(0xff00ff);

    const hops = pp.graph().nodes([1]).k_hop(1).ids().sort();
    expect(hops).toEqual([1, 2, 3]);

    pp.graph().nodes([3]).remove();
    expect(pp.nodes.map((n) => n.id).sort()).toEqual([1, 2]);
  });

  test("edge selection supports where, attr, nodes, and remove", () => {
    const pp = make_pp();
    const heavy_edges = pp.graph().edges().where((l) => l.weight >= 0.8);
    expect(heavy_edges.count().links).toBe(2);

    heavy_edges.attr({ keep: true });
    expect(pp.links.filter((l) => l.keep).length).toBe(2);

    const incident = heavy_edges.nodes().ids().sort();
    expect(incident).toEqual([1, 2, 3]);

    heavy_edges.remove();
    expect(pp.links.length).toBe(1);
  });

  test("subgraph selection supports ids, groups, and predicates", () => {
    const pp = make_pp();
    expect(pp.graph().subgraph({ node_ids: 1 }).ids()).toEqual([1]);
    expect(pp.graph().subgraph({ groups: ["a"] }).ids().sort()).toEqual([1, 3]);
    expect(pp.graph().subgraph({ predicate: (n) => n.score > 0.5 }).ids().sort()).toEqual([1, 2]);
  });

  test("neighbors, paths, and components selectors work", () => {
    const pp = make_pp();
    expect(pp.graph().neighbors([1], 1).ids().sort()).toEqual([1, 2, 3]);
    expect(pp.graph().nodes([1]).neighbors(1).ids().sort()).toEqual([1, 2, 3]);
    expect(pp.graph().nodes([1]).neighbors(1, { shell: true }).ids().sort()).toEqual([2, 3]);
    expect(pp.graph().nodes([1]).any_path_to(3).ids().length).toBeGreaterThanOrEqual(2);
    expect(pp.graph().nodes([1]).shortest_path_to(3).ids().length).toBeGreaterThanOrEqual(2);
    expect(pp.graph().nodes([1]).components().count()).toEqual({ nodes: 3, links: 3 });
    expect(Array.isArray(pp.graph().nodes([1, 2]).components({ mode: "list" }))).toBe(true);
  });

  test("invalid node ids are discarded from selections", () => {
    const pp = make_pp();
    expect(pp.graph().nodes([1, 9999]).ids()).toEqual([1]);
    expect(pp.graph().nodes([9999]).count()).toEqual({ nodes: 0, links: 0 });
    expect(pp.graph().nodes([9999]).any_path_to(1).count()).toEqual({ nodes: 0, links: 0 });
  });

  test("boundary and cut return expected edge scopes", () => {
    const pp = make_pp();
    expect(pp.graph().nodes([1, 2]).boundary().count().links).toBe(2);
    expect(pp.graph().nodes([1]).cut(pp.graph().nodes([2])).count().links).toBe(1);
  });

  test("to_array and to_object expose selection payloads", () => {
    const pp = make_pp();
    const node_sel = pp.graph().nodes([1, 3]);
    const edge_sel = pp.graph().edges().where((e) => e.weight >= 0.8);

    expect(node_sel.to_array().map((n) => n.id).sort()).toEqual([1, 3]);
    expect(node_sel.to_object().nodes.length).toBe(2);
    expect(node_sel.to_object().links.length).toBe(1);
    expect(node_sel.value()).toEqual(node_sel.to_object());

    expect(edge_sel.to_array().length).toBe(2);
    expect(edge_sel.to_object().links.length).toBe(2);
    expect(edge_sel.to_object().nodes.length).toBe(3);
    expect(edge_sel.value()).toEqual(edge_sel.to_object());
  });

  test("empty style and attr patches are strict no-ops", () => {
    const pp = make_pp();
    const before_nodes = JSON.stringify(pp.nodes);
    const before_links = JSON.stringify(pp.links);

    pp.graph().nodes([1, 2]).style();
    pp.graph().nodes([1, 2]).style({});
    pp.graph().nodes([1, 2]).attr();
    pp.graph().nodes([1, 2]).attr({});
    pp.graph().edges().attr();
    pp.graph().edges().attr({});

    expect(JSON.stringify(pp.nodes)).toBe(before_nodes);
    expect(JSON.stringify(pp.links)).toBe(before_links);
  });

  test("merge, normalize, validate, and reindex mutate graph as expected", () => {
    const pp = make_pp();
    pp.graph().merge({ nodes: [{ id: 4 }], links: [{ source: 3, target: 4 }, { source: 3, target: 4 }] });
    expect(pp.nodes.map((n) => n.id).includes(4)).toBe(true);

    pp.graph().replace({
      nodes: [{ id: 1 }, { id: 1 }, { id: 2 }],
      links: [{ source: 1, target: 2 }, { source: 1, target: 2 }, { source: 2, target: 9 }],
    });
    pp.graph().normalize();
    expect(pp.nodes.length).toBe(2);
    expect(pp.links.length).toBe(1);

    pp.nodes = [{ id: 1 }, { id: 1 }];
    pp.links = [{ source: 1, target: 2 }];
    expect(pp.graph().validate().ok).toBe(false);

    pp.graph().replace({ nodes: [{ id: "b" }, { id: "a" }], links: [{ source: "a", target: "b" }] }).reindex({ offset: 10 });
    expect(pp.nodes.map((n) => n.id).sort()).toEqual([10, 11]);
  });

  test("root count/value/print and clear are available", () => {
    const pp = make_pp();
    expect(pp.graph().count()).toEqual({ nodes: 3, links: 3 });
    expect(pp.graph().value().nodes.length).toBe(3);
    expect(pp.graph().print().nodes.length).toBe(3);
    pp.graph().clear();
    expect(pp.graph().count()).toEqual({ nodes: 0, links: 0 });
  });

  test("print and composability helper return expected payloads", () => {
    const pp = make_pp();
    const payload = pp.graph().nodes([1, 3]).print();
    expect(payload.nodes.length).toBe(2);
    const report = graph_namespace_composability({ detailed: true });
    expect(report.total_methods).toBeGreaterThan(0);
    expect(report.method_spec).toBeTruthy();
  });

  test("useful graph chains execute without throwing", () => {
    const chains = [
      "pp.graph().count()",
      "pp.graph().nodes().count()",
      "pp.graph().nodes().ids().slice(0, 10)",
      "pp.graph().nodes().where((n) => n.group === 1).count()",
      "pp.graph().neighbors([1], 1).count()",
      "pp.graph().nodes([1]).neighbors(2).count()",
      "pp.graph().nodes([1]).neighbors(2, { shell: true }).count()",
      "pp.graph().nodes([1]).any_path_to(10).ids()",
      "pp.graph().nodes([1]).shortest_path_to(10).ids()",
      "pp.graph().nodes([1, 2]).components().count()",
      "pp.graph().nodes([1, 2]).components({ mode: \"list\" }).map((sel) => sel.count())",
      "pp.graph().subgraph({ groups: [1] }).count()",
      "pp.graph().nodes().where((n) => n.id % 2 === 0).attr({ even: true }).count()",
      "pp.graph().nodes().where((n) => n.group === 1).to_array().length",
      "pp.graph().nodes().where((n) => n.group === 1).to_object().nodes.length",
      "pp.graph().edges().where((e) => Number(e.weight || 0) > 1).attr({ heavy: true }).count()",
      "pp.graph().nodes([1]).edges().where((e) => Number(e.weight || 0) > 0).nodes().count()",
      "pp.graph().edges().where((e) => Number(e.weight || 0) > 1).to_array().length",
      "pp.graph().edges().where((e) => Number(e.weight || 0) > 1).to_object().links.length",
      "pp.graph().nodes([1, 2]).boundary().count()",
      "pp.graph().nodes([1, 2]).cut(pp.graph().nodes([3, 4])).count()",
      'pp.graph().merge({ nodes: [{ id: "temp-node" }], links: [] }).count()',
      'pp.graph().nodes(["temp-node"]).remove().count()',
      "pp.graph().clear().count()",
    ];

    chains.forEach((command) => {
      const pp = new Pixiplex([], [], 640, 480, 1.0);
      pp.graph().replace({
        nodes: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, group: (i % 3) + 1, score: i / 25 })),
        links: Array.from({ length: 40 }, (_, i) => ({ source: (i % 25) + 1, target: ((i * 7 + 3) % 25) + 1, weight: (i % 5) + 0.5 })),
      });
      expect(() => Function("pp", `\"use strict\"; return (${command});`)(pp)).not.toThrow();
    });
  });
});
