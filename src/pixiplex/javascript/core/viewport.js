import { Container, Ticker } from "pixi.js";
import { dispatch } from "d3-dispatch";
import { identity } from "./utils.js";

/**
 * Creates and wires a shared ticker with lifecycle dispatch events.
 *
 * @param {object} app - PIXI application instance.
 * @param {object} stage - Root stage container (reserved for future usage).
 * @returns {Array<object>} Tuple of ticker and dispatcher.
 */
export const register_ticker = (app, stage) => {
  let end_loop = false;
  const dispatcher = dispatch("tick", "animate", "stop", "restart");
  const ticker = Ticker.shared;
  ticker.autoStart = false;
  ticker.stop();
  ticker.maxFPS = 60;
  ticker.add(() => {
    dispatcher.call("tick", this);
  });

  dispatcher.on("stop", () => {
    end_loop = true;
    ticker.stop();
    console.log("ticker stopped");
  });

  dispatcher.on("restart", () => {
    end_loop = false;
    ticker.start();
  });
  return [ticker, dispatcher];
};

/**
 * Removes all children from a PIXI stage/container.
 *
 * @param {object} stage - PIXI container to clear.
 * @returns {void}
 */
export const clear_stage = (stage) => {
  for (let i = stage.children.length - 1; i >= 0; i--) {
    stage.removeChild(stage.children[i]);
  }
};

/**
 * Adds mapped items to a container.
 *
 * @param {object} container - Target PIXI container.
 * @param {Array<unknown>} arr - Items to add.
 * @param {Function} [acc=identity] - Accessor returning a display object.
 * @returns {void}
 */
export const add_items = (container, arr, acc = identity) => {
  arr.forEach((item) => {
    container.addChild(acc(item));
  });
};

/**
 * Enables interactivity on mapped items.
 *
 * @param {Array<unknown>} arr - Items to update.
 * @param {Function} [acc=identity] - Accessor returning a PIXI object.
 * @returns {void}
 */
export const enable_interactive = (arr, acc = identity) => {
  arr.forEach((item) => {
    acc(item).interactive = true;
  });
};

/**
 * Disables interactivity on mapped items.
 *
 * @param {Array<unknown>} arr - Items to update.
 * @param {Function} [acc=identity] - Accessor returning a PIXI object.
 * @returns {void}
 */
export const disable_interactive = (arr, acc = identity) => {
  arr.forEach((item) => {
    acc(item).interactive = false;
  });
};

/**
 * Builds a PIXI container containing all provided nodes.
 *
 * @param {Array<object>} nodes - Display objects to add.
 * @returns {Container} Newly created group container.
 */
export const make_group = (nodes) => {
  const container = new Container();
  nodes.forEach((node) => {
    container.addChild(node);
  });
  return container;
};
