import { describe, expect, test } from "vitest";

import {
  combinations,
  compose,
  default_node_styles,
  d3_force,
  make_scale,
  serialize_force,
} from "../pixiplex/pixinet.js";

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
});
