import { bench, describe } from "vitest";

import { combinations, serialize_force } from "../pixiplex/javascript/pixinet.js";
import * as d3_force from "d3-force";

describe("pixinet benchmarks", () => {
  bench("combinations(120,2)", () => {
    combinations(120, 2);
  });

  bench("serialize 3 forces (500 nodes)", () => {
    const nodes = Array.from({ length: 500 }, (_, id) => ({ id }));
    const links = Array.from({ length: 800 }, (_, i) => ({ source: i % 500, target: (i * 7 + 13) % 500 }));

    const sim = d3_force
      .forceSimulation(nodes)
      .force("center", d3_force.forceCenter(600, 400))
      .force("spring", d3_force.forceLink(links).id((d) => d.id).distance(30).strength(0.08))
      .force("charge", d3_force.forceManyBody().strength(-35));

    sim.stop();

    serialize_force(sim, ["center", "spring", "charge"], ["forceCenter", "forceLink", "forceManyBody"]);
  });
});
