import "uno.css";
import * as pn from "../src/pixiplex/pixinet.js";
import { enableGroupedRenderer, enableIndividualRenderer, enableMeshRenderer, enableWebGLPrimitiveRenderer } from "../src/pixiplex/renderers.js";
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

const cloneGraphData = (sourceGraph) => ({
  nodes: sourceGraph.nodes.map((node) => ({ ...node })),
  links: sourceGraph.links.map((link) => ({
    ...link,
    source: typeof link.source === "object" ? link.source.id : link.source,
    target: typeof link.target === "object" ? link.target.id : link.target,
  })),
});

const createPixiplexForMode = (mode) => {
  const graphData = cloneGraphData(graph);
  const instance = new pn.Pixiplex(graphData.nodes, graphData.links, 1200, 800, 2.0);

  if (mode === "grouped-nodes") {
    enableGroupedRenderer(instance);
  } else if (mode === "mesh-primitives") {
    enableMeshRenderer(instance);
  } else if (mode === "webgl-primitives") {
    enableWebGLPrimitiveRenderer(instance);
  } else {
    enableIndividualRenderer(instance);
  }
  return instance;
};

let pp = createPixiplexForMode(currentRenderMode);

const getNextMode = (mode) => {
  const currentIndex = modeOrder.indexOf(mode);
  return modeOrder[(currentIndex + 1) % modeOrder.length];
};

const updateRenderModeUrl = (mode) => {
  const nextParams = new URLSearchParams(window.location.search);
  nextParams.set("renderMode", mode);
  nextParams.delete("groupedNodes");
  const query = nextParams.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
};

const updateRenderModeButton = () => {
  if (!toggleRenderModeButton) {
    return;
  }
  const targetMode = getNextMode(currentRenderMode);
  toggleRenderModeButton.textContent = `Switch render mode (${targetMode})`;
};

window.pp = pp;
const perfHud = document.getElementById("perf_hud");

const BASE_LINE_STYLE = { ...pn.LINE_STYLE };
const getBaseNodeStyles = () => pn.default_node_styles(pp.nodes, pn.NODE_STYLE);

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

const setBadgeState = (el, label, isOn) => {
  el.textContent = `${label}: ${isOn ? "on" : "off"}`;
  el.classList.toggle("bg-emerald-100", isOn);
  el.classList.toggle("text-emerald-800", isOn);
  el.classList.toggle("bg-slate-200", !isOn);
  el.classList.toggle("text-slate-700", !isOn);
};

const setToggleButtonState = (el, isOn) => {
  el.classList.toggle("bg-emerald-700", isOn);
  el.classList.toggle("hover:bg-emerald-600", isOn);
  el.classList.toggle("ring-2", isOn);
  el.classList.toggle("ring-emerald-200", isOn);
  el.classList.toggle("bg-indigo-700", !isOn);
  el.classList.toggle("hover:bg-indigo-600", !isOn);
  el.classList.toggle("ring-0", !isOn);
};

const setBinaryButtonState = (el, isOn, labels, classes) => {
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

const applySpringForce = () => {
  pp.force_link("spring", springDistance, useAutoSpringStrength ? undefined : springStrength, 1);
};

const applyChargeForce = () => {
  pp.force_manybody("charge", chargeStrength, 0.9, 1.0, Infinity);
};

const updateForceUI = () => {
  const centerOn = pp.sim.force("center") !== undefined;
  const linkOn = pp.sim.force("spring") !== undefined;
  const chargeOn = pp.sim.force("charge") !== undefined;
  setToggleButtonState(forceToggles.center, centerOn);
  setToggleButtonState(forceToggles.link, linkOn);
  setToggleButtonState(forceToggles.charge, chargeOn);
  setBadgeState(statusBadges.center, "center", centerOn);
  setBadgeState(statusBadges.link, "link", linkOn);
  setBadgeState(statusBadges.charge, "charge", chargeOn);
  renderForceInspector();
};

const updateInteractionUI = () => {
  setBadgeState(statusBadges.forceLoop, "force", forceLoopState.enabled);
  setBadgeState(statusBadges.drag, "drag", dragState.enabled);
  setBadgeState(statusBadges.perfMode, "perf", perfModeState.enabled);

  setBinaryButtonState(toggleButtons.forceLoop, forceLoopState.enabled, {
    on: "Force loop: on",
    off: "Force loop: off",
  }, {
    onBg: "bg-emerald-700",
    onHover: "hover:bg-emerald-600",
    offBg: "bg-slate-900",
    offHover: "hover:bg-slate-700",
  });

  setBinaryButtonState(toggleButtons.dragMode, dragState.enabled, {
    on: "Node drag: on",
    off: "Node drag: off",
  }, {
    onBg: "bg-emerald-700",
    onHover: "hover:bg-emerald-600",
    offBg: "bg-emerald-500",
    offHover: "hover:bg-emerald-400",
  });

  setBinaryButtonState(toggleButtons.perfMode, perfModeState.enabled, {
    on: "Performance mode: on",
    off: "Performance mode: off",
  }, {
    onBg: "bg-emerald-700",
    onHover: "hover:bg-emerald-600",
    offBg: "bg-cyan-700",
    offHover: "hover:bg-cyan-600",
  });
};

const detectRendererLabel = () => {
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

const updateRendererUI = () => {
  if (!statusBadges.renderer) {
    return;
  }
  statusBadges.renderer.textContent = `renderer: ${detectRendererLabel()} | ${currentRenderMode}`;
  if (renderModeBadge) {
    renderModeBadge.textContent = `canvas: ${currentRenderMode}`;
  }
  updateRenderModeButton();
};

const formatForceValue = (value) => {
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

const renderForceInspector = () => {
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
            .map(([name, value]) => `${name}=${formatForceValue(value)}`)
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

const updatePerfHud = () => {
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
    updateInteractionUI();
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

  requestAnimationFrame(updatePerfHud);
};

const reheat = (alpha = 0.8) => {
  pp.enable_force();
  forceLoopState.enabled = true;
  updateInteractionUI();
  pp.sim?.alpha(alpha);
  pp.sim?.restart();
};

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

const applyNodeStyles = (styles) => {
  if (typeof pp.set_node_styles === "function") {
    pp.set_node_styles(styles);
    return;
  }
  pn.build_nodes(pp.nodes_gfx, styles);
};

const destroyCurrentRenderer = () => {
  try {
    pp.disable_drag?.();
    pp.disable_force?.();
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

const mountRendererForMode = async (mode) => {
  const next = createPixiplexForMode(mode);
  pp = next;
  window.pp = pp;

  await pp.init();
  pnCont.appendChild(pp.view);
  if (typeof pp._renderer?.attachToView === "function") {
    pp._renderer.attachToView();
  }
  if (typeof pp._renderer?.resize === "function") {
    pp._renderer.resize(pp.width, pp.height);
  }

  resetDefaultForces();
  updateInteractionUI();
  updateForceUI();
  updateRendererUI();
};

const switchRenderMode = async (mode) => {
  if (mode === currentRenderMode) {
    return;
  }
  destroyCurrentRenderer();
  currentRenderMode = mode;
  updateRenderModeUrl(mode);
  await mountRendererForMode(mode);
};

if (toggleRenderModeButton) {
  toggleRenderModeButton.addEventListener("click", async () => {
    toggleRenderModeButton.disabled = true;
    try {
      await switchRenderMode(getNextMode(currentRenderMode));
    } finally {
      toggleRenderModeButton.disabled = false;
    }
  });
}

const resetDefaultForces = () => {
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
  applySpringForce();
  applyChargeForce();
  reheat(0.7);
  updateForceUI();
};

document.getElementById("toggle_force_loop").addEventListener("click", () => {
  if (forceLoopState.enabled) {
    pp.disable_force();
    forceLoopState.enabled = false;
  } else {
    pp.enable_force();
    forceLoopState.enabled = true;
  }
  updateInteractionUI();
});

document.getElementById("reheat_button").addEventListener("click", () => {
  reheat(0.95);
});

document.getElementById("pulse_charge_button").addEventListener("click", () => {
  pp.force_manybody("charge", -130, 0.9, 1.0, Infinity);
  reheat(1);
  updateForceUI();
  setTimeout(() => {
    applyChargeForce();
    reheat(0.6);
    updateForceUI();
  }, 1100);
});

document.getElementById("toggle_performance_mode").addEventListener("click", () => {
  perfModeState.enabled = !perfModeState.enabled;
  pp.set_performance_mode(perfModeState.enabled);
  updateInteractionUI();
  updateRendererUI();
});

document.getElementById("toggle_center_force").addEventListener("click", () => {
  if (pp.sim.force("center") === undefined) {
    pp.force_center("center");
    reheat(0.6);
    updateForceUI();
    return;
  }
  pp.remove_force("center");
  reheat(0.6);
  updateForceUI();
});

document.getElementById("toggle_link_force").addEventListener("click", () => {
  if (pp.sim.force("spring") === undefined) {
    applySpringForce();
    reheat(0.6);
    updateForceUI();
    return;
  }
  pp.remove_force("spring");
  reheat(0.6);
  updateForceUI();
});

document.getElementById("toggle_nbody_force").addEventListener("click", () => {
  if (pp.sim.force("charge") === undefined) {
    applyChargeForce();
    reheat(0.6);
    updateForceUI();
    return;
  }
  pp.remove_force("charge");
  reheat(0.6);
  updateForceUI();
});

document.getElementById("apply_xy_force_button").addEventListener("click", () => {
  pp.force_x("x", pp.width / 2, 0.06);
  pp.force_y("y", pp.height / 2, 0.06);
  reheat(0.8);
  updateForceUI();
});

document.getElementById("apply_radial_force_button").addEventListener("click", () => {
  pp.force_radial("radial", Math.min(pp.width, pp.height) / 3, pp.width / 2, pp.height / 2, 0.15);
  reheat(0.9);
  updateForceUI();
});

document.getElementById("reset_forces_button").addEventListener("click", () => {
  pp.remove_force("x");
  pp.remove_force("y");
  pp.remove_force("radial");
  resetDefaultForces();
  updateForceUI();
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

  const graphics = new pn.Graphics();
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
      const text = new pn.Text({ text: `(${j * n},${i * m})`, style: { fontSize: 12 } });
      text.x = j * n + 2;
      text.y = i * m + 2;
      pp.vp.addChild(text);
    }
  }
});

document.getElementById("toggle_drag_mode").addEventListener("click", () => {
  dragState.enabled = !dragState.enabled;
  if (dragState.enabled) {
    pp.enable_drag();
  } else {
    pp.disable_drag();
  }
  updateInteractionUI();
});

document.getElementById("change_node_color_button").addEventListener("click", () => {
  const ns = { ...pn.NODE_STYLE, color: 0xff7518, radius: 8 };
  applyNodeStyles(ns);
});

document.getElementById("change_node_colors_button").addEventListener("click", () => {
  const ns = pp.nodes.map((_, i) => ({ ...pn.NODE_STYLE, color: i % 2 === 0 ? 0xff7518 : 0x650a5a }));
  applyNodeStyles(ns);
});

document.getElementById("randomize_colors_button").addEventListener("click", () => {
  const ns = pp.nodes.map(() => ({ ...pn.NODE_STYLE, color: randomItem(palette) }));
  applyNodeStyles(ns);
});

document.getElementById("change_node_radius_button").addEventListener("click", () => {
  const ns = pp.nodes.map((_, i) => ({ ...pn.NODE_STYLE, radius: i < pp.nodes.length / 2 ? 5 : 10 }));
  applyNodeStyles(ns);
});

document.getElementById("change_node_radii_button").addEventListener("click", () => {
  applyNodeStyles({ ...pn.NODE_STYLE, radius: 10 });
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
  applyNodeStyles(getBaseNodeStyles());
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
  applySpringForce();
  reheat(0.45);
  updateForceUI();
});

document.getElementById("spring_strength_slider").addEventListener("input", (event) => {
  springStrength = Number(event.target.value);
  useAutoSpringStrength = false;
  springStrengthValue.textContent = springStrength.toFixed(2);
  applySpringForce();
  reheat(0.45);
  updateForceUI();
});

document.getElementById("charge_strength_slider").addEventListener("input", (event) => {
  chargeStrength = Number(event.target.value);
  chargeStrengthValue.textContent = `${chargeStrength}`;
  applyChargeForce();
  reheat(0.45);
  updateForceUI();
});

const startApp = async () => {
  try {
    await mountRendererForMode(currentRenderMode);
    requestAnimationFrame(updatePerfHud);
  } catch (error) {
    pnCont.innerHTML = `<div class="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">Failed to initialize Pixiplex renderer. Check browser console for details.<br/>${error?.message ?? error}</div>`;
    throw error;
  }
};

startApp();
