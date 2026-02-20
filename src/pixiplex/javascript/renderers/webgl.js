import { Pixiplex, NODE_STYLE, scale_nodes } from "../pixinet.js";
import { install_renderer_runtime } from "./runtime.js";

/**
 * Fallback point diameter basis (in CSS pixels) used by WebGL node rendering.
 */
const DEFAULT_POINT_SIZE = 8;

/**
 * Vertex shader source for edge line segments.
 */
const LINE_VS = `#version 300 es
in vec2 a_position;
uniform vec2 u_resolution;
void main() {
  vec2 zeroToOne = a_position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
}`;

/**
 * Fragment shader source for edge line segments.
 */
const LINE_FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}`;

/**
 * Vertex shader source for node point sprites.
 */
const POINT_VS = `#version 300 es
in vec2 a_position;
uniform vec2 u_resolution;
uniform float u_pointSize;
void main() {
  vec2 zeroToOne = a_position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
  gl_PointSize = u_pointSize;
}`;

/**
 * Fragment shader source for anti-aliased circular point sprites.
 */
const POINT_FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center) * 2.0;
  float aa = fwidth(dist);
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, dist);
  if (alpha <= 0.001) {
    discard;
  }
  outColor = vec4(u_color.rgb, u_color.a * alpha);
}`;

/**
 * Sets a vec4 color uniform from packed hex + alpha values.
 *
 * @param {WebGL2RenderingContext} gl - WebGL2 context.
 * @param {WebGLUniformLocation|null} uniformLocation - Target uniform handle.
 * @param {number} hex - RGB packed as 0xRRGGBB.
 * @param {number} [alpha=1] - Alpha value in [0, 1].
 * @returns {void}
 */
const set_uniform_hex_color = (gl, uniformLocation, hex, alpha = 1) => {
  const h = Number(hex ?? 0x000000);
  const r = ((h >> 16) & 255) / 255;
  const g = ((h >> 8) & 255) / 255;
  const b = (h & 255) / 255;
  gl.uniform4f(uniformLocation, r, g, b, alpha);
};

/**
 * Compiles a shader source string.
 *
 * @param {WebGL2RenderingContext} gl - WebGL2 context.
 * @param {number} type - Shader type (`gl.VERTEX_SHADER` or `gl.FRAGMENT_SHADER`).
 * @param {string} source - GLSL source code.
 * @returns {WebGLShader} Compiled shader handle.
 */
const compile_shader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "unknown shader compile error";
    gl.deleteShader(shader);
    throw new Error(`WebGL shader compile failed: ${info}`);
  }
  return shader;
};

/**
 * Creates and links a WebGL program from vertex/fragment sources.
 *
 * @param {WebGL2RenderingContext} gl - WebGL2 context.
 * @param {string} vsSource - Vertex shader source.
 * @param {string} fsSource - Fragment shader source.
 * @returns {WebGLProgram} Linked program handle.
 */
const create_program = (gl, vsSource, fsSource) => {
  const vs = compile_shader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compile_shader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || "unknown program link error";
    gl.deleteProgram(program);
    throw new Error(`WebGL program link failed: ${info}`);
  }
  return program;
};

/**
 * Renderer backend that draws nodes and edges with a dedicated WebGL2 canvas.
 */
class WebGLPrimitiveRenderer {
  /**
   * @param {object} pixiplex - Host Pixiplex instance.
   */
  constructor(pixiplex) {
    this.pixiplex = pixiplex;
    this.sim_nodes = [];
    this.canvas = null;
    this.gl = null;
    this.lineProgram = null;
    this.pointProgram = null;
    this.lineBuffer = null;
    this.pointBuffer = null;
    this.linePosLoc = -1;
    this.pointPosLoc = -1;
    this.lineResolutionLoc = null;
    this.pointResolutionLoc = null;
    this.lineColorLoc = null;
    this.pointColorLoc = null;
    this.pointSizeLoc = null;
    this.node_style = null;
    this.pixelRatio = 1;
    this._lineVertices = new Float32Array(0);
    this._pointVertices = new Float32Array(0);
  }

  /**
   * Computes device pixel ratio used by this renderer.
   *
   * @returns {number} Pixel ratio clamped to [1, 2].
   */
  _get_pixel_ratio() {
    const pr = this.pixiplex.pixel_ratio || devicePixelRatio || 1;
    return Math.max(1, Math.min(2, pr));
  }

  /**
   * Initializes simulation nodes and resolves link endpoints.
   *
   * @param {Array<object>} nodes - Graph nodes.
   * @param {Array<object>} links - Graph links.
   * @returns {void}
   */
  init(nodes, links) {
    scale_nodes(nodes, this.pixiplex.width, this.pixiplex.height);
    this.sim_nodes = nodes.map((node) => ({ ...node }));

    const idMap = new Map(this.sim_nodes.map((node, i) => [node.id, i]));
    links.forEach((link) => {
      if (!(link.source && typeof link.source === "object")) {
        link.source = this.sim_nodes[idMap.get(link.source)];
      }
      if (!(link.target && typeof link.target === "object")) {
        link.target = this.sim_nodes[idMap.get(link.target)];
      }
    });
  }

  /**
   * Lazily creates the WebGL canvas/context and shader programs.
   *
   * @returns {void}
   */
  _ensure_canvas() {
    if (this.canvas) {
      return;
    }
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.canvas.style.width = `${this.pixiplex.width}px`;
    this.canvas.style.height = `${this.pixiplex.height}px`;
    this.pixelRatio = this._get_pixel_ratio();
    this.canvas.width = Math.max(1, Math.round(this.pixiplex.width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.round(this.pixiplex.height * this.pixelRatio));
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "2";

    this.gl = this.canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!this.gl) {
      throw new Error("WebGL2 not available for primitive renderer");
    }
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.lineProgram = create_program(this.gl, LINE_VS, LINE_FS);
    this.pointProgram = create_program(this.gl, POINT_VS, POINT_FS);

    this.linePosLoc = this.gl.getAttribLocation(this.lineProgram, "a_position");
    this.lineResolutionLoc = this.gl.getUniformLocation(this.lineProgram, "u_resolution");
    this.lineColorLoc = this.gl.getUniformLocation(this.lineProgram, "u_color");

    this.pointPosLoc = this.gl.getAttribLocation(this.pointProgram, "a_position");
    this.pointResolutionLoc = this.gl.getUniformLocation(this.pointProgram, "u_resolution");
    this.pointColorLoc = this.gl.getUniformLocation(this.pointProgram, "u_color");
    this.pointSizeLoc = this.gl.getUniformLocation(this.pointProgram, "u_pointSize");

    this.lineBuffer = this.gl.createBuffer();
    this.pointBuffer = this.gl.createBuffer();
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Attaches WebGL overlay canvas to the same DOM host as Pixi view.
   *
   * @returns {void}
   */
  attach_to_view() {
    this._ensure_canvas();
    const view = this.pixiplex.view;
    if (!view?.parentElement) {
      return;
    }
    const host = view.parentElement;
    host.style.position = host.style.position || "relative";

    view.style.position = "absolute";
    view.style.left = "0";
    view.style.top = "0";
    view.style.zIndex = "1";

    if (!host.contains(this.canvas)) {
      host.appendChild(this.canvas);
    }
  }

  /**
   * Resizes the WebGL canvas backing resolution and viewport.
   *
   * @param {number} width - CSS width.
   * @param {number} height - CSS height.
   * @returns {void}
   */
  resize(width, height) {
    if (!this.canvas || !this.gl) {
      return;
    }
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.pixelRatio = this._get_pixel_ratio();
    this.canvas.width = Math.max(1, Math.round(width * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.round(height * this.pixelRatio));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Applies node style values consumed by point rendering and picking.
   *
   * @param {object|Array<object>} style - One shared style or per-node styles.
   * @returns {void}
   */
  set_node_styles(style) {
    this.node_style = Array.isArray(style) ? style[0] : style;
  }

  /**
   * @returns {Array<object>} Simulation node objects.
   */
  get_simulation_nodes() {
    return this.sim_nodes;
  }

  /**
   * Finds the nearest node in world coordinates for drag picking.
   *
   * @param {number} worldX - World-space x coordinate.
   * @param {number} worldY - World-space y coordinate.
   * @returns {object|null} Picked node or null.
   */
  pick_node(worldX, worldY) {
    let nearest = null;
    let nearestDist2 = Infinity;
    const style = this.node_style || this.pixiplex.node_style || NODE_STYLE;
    const radius = style.radius ?? DEFAULT_POINT_SIZE / 2;

    for (let i = 0; i < this.sim_nodes.length; i += 1) {
      const node = this.sim_nodes[i];
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const dist2 = dx * dx + dy * dy;
      const maxDist = radius + 6;
      if (dist2 <= maxDist * maxDist && dist2 < nearestDist2) {
        nearest = node;
        nearestDist2 = dist2;
      }
    }
    return nearest;
  }

  /**
   * @returns {null} WebGL renderer does not expose per-node graphics.
   */
  get_node_graphics() {
    return null;
  }

  /**
   * @returns {null} WebGL renderer does not expose link Graphics objects.
   */
  get_link_graphics() {
    return null;
  }

  /**
   * Ensures reusable typed-array capacity for current graph sizes.
   *
   * @param {number} numLinks - Link count.
   * @param {number} numNodes - Node count.
   * @returns {void}
   */
  _ensure_capacity(numLinks, numNodes) {
    const lineFloatCount = numLinks * 4;
    if (this._lineVertices.length < lineFloatCount) {
      this._lineVertices = new Float32Array(lineFloatCount);
    }

    const pointFloatCount = numNodes * 2;
    if (this._pointVertices.length < pointFloatCount) {
      this._pointVertices = new Float32Array(pointFloatCount);
    }
  }

  /**
   * Draws one frame to WebGL and uploads transformed node/edge buffers.
   *
   * @returns {number} Number of edges drawn.
   */
  draw() {
    if (!this.gl || !this.pixiplex.vp) {
      return 0;
    }

    const gl = this.gl;
    const links = this.pixiplex.links;
    const nodes = this.sim_nodes;
    const transform = this.pixiplex.vp.worldTransform;
    const pixelRatio = this.pixelRatio || 1;
    this._ensure_capacity(links.length, nodes.length);

    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      const sx = (link.source.x * transform.a + link.source.y * transform.c + transform.tx) * pixelRatio;
      const sy = (link.source.x * transform.b + link.source.y * transform.d + transform.ty) * pixelRatio;
      const tx = (link.target.x * transform.a + link.target.y * transform.c + transform.tx) * pixelRatio;
      const ty = (link.target.x * transform.b + link.target.y * transform.d + transform.ty) * pixelRatio;
      const o = i * 4;
      this._lineVertices[o] = sx;
      this._lineVertices[o + 1] = sy;
      this._lineVertices[o + 2] = tx;
      this._lineVertices[o + 3] = ty;
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const x = (node.x * transform.a + node.y * transform.c + transform.tx) * pixelRatio;
      const y = (node.x * transform.b + node.y * transform.d + transform.ty) * pixelRatio;
      const o = i * 2;
      this._pointVertices[o] = x;
      this._pointVertices[o + 1] = y;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    const nodeStyle = this.node_style || this.pixiplex.node_style || NODE_STYLE;
    const pointSize = Math.max(1, (nodeStyle.radius ?? DEFAULT_POINT_SIZE / 2) * 2 * pixelRatio);

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.lineProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._lineVertices, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.linePosLoc);
    gl.vertexAttribPointer(this.linePosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.lineResolutionLoc, width, height);
    set_uniform_hex_color(gl, this.lineColorLoc, this.pixiplex.line_style?.color, this.pixiplex.line_style?.alpha ?? 1);
    gl.lineWidth(this.pixiplex.line_style?.lineWidth ?? 1);
    gl.drawArrays(gl.LINES, 0, links.length * 2);

    gl.useProgram(this.pointProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._pointVertices, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.pointPosLoc);
    gl.vertexAttribPointer(this.pointPosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.pointResolutionLoc, width, height);
    set_uniform_hex_color(gl, this.pointColorLoc, nodeStyle.color ?? NODE_STYLE.color, nodeStyle.alpha ?? NODE_STYLE.alpha);
    gl.uniform1f(this.pointSizeLoc, pointSize);
    gl.drawArrays(gl.POINTS, 0, nodes.length);

    return links.length;
  }
}

/**
 * Installs the WebGL primitives renderer on a Pixiplex instance.
 *
 * @param {object} pixiplex - Pixiplex host instance.
 * @returns {object} The same host instance.
 */
export const enable_webgl_primitive_renderer = (pixiplex) => {
  const renderer = new WebGLPrimitiveRenderer(pixiplex);
  return install_renderer_runtime(pixiplex, renderer, "__webgl_primitive_renderer");
};

/**
 * Pixiplex subclass preconfigured with the WebGL primitives backend.
 */
class PixiplexWebGL extends Pixiplex {
  /**
   * Convenience class wrapper that installs the WebGL renderer runtime.
   *
   * @param {Array<object>} [nodes=[]] - Graph node records.
   * @param {Array<object>} [links=[]] - Graph edge records.
   * @param {number} [width=250] - Canvas width.
   * @param {number} [height=250] - Canvas height.
   * @param {number} [scale=2.0] - Internal world scale multiplier.
   * @param {object} [forces={}] - d3-force configuration map.
   */
  constructor(nodes = [], links = [], width = 250, height = 250, scale = 2.0, forces = {}) {
    super(nodes, links, width, height, scale, forces);
    enable_webgl_primitive_renderer(this);
  }
}

export { WebGLPrimitiveRenderer, PixiplexWebGL };
