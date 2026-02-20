import { maxBy, minBy } from "lodash-es";

/**
 * Generates all k-combinations of n elements.
 * @param {number} n - Total element count (1-indexed source set).
 * @param {number} k - Combination size to select.
 * @returns {Array<Array<number>>}
 */
export const combinations = (n, k) => {
  const result = [];
  const combos = [];
  const recurse = (start) => {
    if (combos.length + (n - start + 1) < k) {
      return;
    }
    recurse(start + 1);
    combos.push(start);
    if (combos.length === k) {
      result.push(combos.slice());
    } else if (combos.length + (n - start + 2) >= k) {
      recurse(start + 1);
    }
    combos.pop();
  };
  recurse(1);
  return result;
};


/**
 * Loads a text file over XHR and invokes a callback with the response body.
 *
 * @param {string} file - URL/path to load.
 * @param {Function} callback - Callback invoked with file contents.
 * @returns {void}
 */
export const read_text_file = (file, callback) => {
  const rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4 && rawFile.status === "200") {
      callback(rawFile.responseText);
    }
  };
  rawFile.send(null);
};


/**
 * Finds [min, max] using an accessor.
 * @param {Array<unknown>} arr - Input values.
 * @param {Function} accessor - Value selector used for comparisons.
 * @returns {Array<unknown>}
 */
export const range = (arr, accessor) => [minBy(arr, accessor), maxBy(arr, accessor)];

/**
 * Identity function.
 * @param {unknown} val - Value to return unchanged.
 * @returns {unknown}
 */
export const identity = (val) => val;

/**
 * Composes functions right-to-left.
 * @param  {...Function} fns - Functions to compose.
 * @returns {Function}
 */
export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));

/**
 * Removes null/undefined values from object.
 * @param {Record<string, unknown>} obj - Object to clean in place.
 * @returns {Record<string, unknown>}
 */
export const clean = (obj) => {
  Object.keys(obj).forEach((key) => obj[key] == null && delete obj[key]);
  return obj;
};
