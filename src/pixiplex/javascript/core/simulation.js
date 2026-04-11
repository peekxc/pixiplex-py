import { forOwn, fromPairs, reduce } from "lodash-es";
import * as d3_force from "d3-force";
import { forceSimulation } from "d3-force";

/** Mapping from d3-force type names to serializable parameter getters. */
export const FORCE_PARAMS = {
  forceManyBody: ["strength", "theta", "distanceMin", "distanceMax"],
  forceLink: ["distance", "strength", "iterations"],
  forceCenter: ["x", "y"],
  forceCollide: ["radius", "strength", "iterations"],
  forceX: ["strength", "x"],
  forceY: ["strength", "y"],
  forceRadial: ["radius", "x", "y", "strength"],
};

/**
 * Serializes selected force instances and their tunable parameters.
 *
 * @param {object} sim - d3-force simulation instance.
 * @param {Array<string>} force_names - Force instance names registered on the simulation.
 * @param {Array<string>} force_types - d3-force constructor/type names aligned with `force_names`.
 * @returns {Record<string, {enabled: boolean, type: string, params: object}>}
 */
export const serialize_force = (sim, force_names, force_types) => {
  const _force_params = force_names.map((force_name, i) => {
    const force_type = force_types[i];
    const force = sim.force(force_name);
    const params = FORCE_PARAMS[force_type] || [];
    const serialized_params = reduce(
      params,
      (result, param) => {
        result[param] = force[param]();
        return result;
      },
      {},
    );
    return [force_name, { enabled: true, type: force_type, params: serialized_params }];
  });
  return fromPairs(_force_params);
};

/**
 * Applies top-level simulation properties from a key/value map.
 *
 * @param {object} sim - d3-force simulation instance.
 * @param {Record<string, unknown>} params - Simulation property map.
 * @returns {object} The same simulation instance.
 */
export const apply_sim = (sim, params) => {
  forOwn(params, (value, key) => {
    if (key !== "force") {
      console.log(`${key.toString()} = ${value.toString()}`);
      sim[key](value);
    }
  });
  return sim;
};

/**
 * Creates a new d3-force simulation instance.
 *
 * @returns {object} d3-force simulation.
 */
export const force_sim = () => forceSimulation();

export { d3_force };
