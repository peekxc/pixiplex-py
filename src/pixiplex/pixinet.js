// pixinet.js 
// Contains utilities for making PIXI-driven force-directed network 

// import * as PIXI from 'pixi.js';
import { Application, Graphics, Polygon, Text, Container, Ticker, GraphicsContext } from 'pixi.js'
import { Viewport } from 'pixi-viewport';
import { selection, select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { polygonContains } from 'd3-polygon';
// import lasso from './lasso.js';
import { dispatch } from 'd3-dispatch';
import { assign, forOwn, map, remove, concat, filter, unionBy, pullAllBy, pullAllWith, intersectionWith, unionWith, differenceBy, differenceWith, transform, includes, isFunction, isEmpty, merge, flatMap, sum, fromPairs, reduce, sortedIndexBy } from 'lodash-es';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation, forceX, forceY } from 'd3-force';
import * as d3_force from 'd3-force';
import { json } from 'd3-fetch';
// import * as EventEmitter from 'eventemitter3';
// import { loadPyodide } from 'pyodide';

// Can also be passed into the renderer directly e.g `autoDetectRenderer({resolution: 1})`
// AbstractRenderer.defaultOptions.resolution = 5.0;

/**
 * Generates all k-combinations of n elements
 * @function
 * @param {number} n - Total number of elements
 * @param {number} k - Size of each combination
 * @returns {Array<Array<number>>} Array of all possible k-combinations
 */
export const combinations = (n, k) => {
  const result= [];
  const combos = [];
  const recurse = start => {
    if (combos.length + (n - start + 1) < k) { return }
    recurse(start + 1);
    combos.push(start);
		if(combos.length === k) { result.push(combos.slice()); }
		else if(combos.length + (n - start + 2) >= k){ recurse(start + 1); }
    combos.pop();     
  }
  recurse(1, combos);
  return result;
}

/**
 * Finds the range (min and max) of an array using an accessor function
 * @function
 * @param {Array} arr - Input array
 * @param {Function} accessor - Function to extract values for comparison
 * @returns {Array} Array containing [min, max] values
 */
export const range = (arr, accessor) => { return [ minBy(arr, accessor), maxBy(arr, accessor)] }

/**
 * Identity function that returns the input value unchanged
 * @function
 * @param {*} val - Input value
 * @returns {*} The same input value
 */
export const identity = (val) => { return val; }

/**
 * Composes multiple functions into a single function, applying them right-to-left
 * @function
 * @param {...Function} fns - Functions to compose
 * @returns {Function} Composed function
 */
export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args))) // why is this not standard...

/**
 * Creates scaling functions for coordinate transformation between normalized [0,1] and pixel coordinates
 * @function
 * @param {number} w - Width in pixels
 * @param {number} h - Height in pixels
 * @returns {Object} Object containing scale and invert functions
 */
export const make_scale = (w, h) => {
	const scale_x = scaleLinear().domain([0, 1]).range([0, w]);
	const scale_y = scaleLinear().domain([0, 1]).range([0, h]);
	const scale_xy = (xy) => { return [scale_x(xy[0]), scale_y(xy[1])] }
	const invert_scale_xy = (xy) => { return [scale_x.invert(xy[0]), scale_y.invert(xy[1])] }
	return { scale: scale_xy, invert: invert_scale_xy };
}

/** Default styling configuration for network nodes */
export const NODE_STYLE = { 
	radius: 6,
	color: 0x650A5A,
	alpha: 1,
	lineStyle: { size: 1.5, color: 0xFFFFFF }
}

const COMMUNITY_PALETTE = [
	0x4e79a7,
	0xf28e2b,
	0xe15759,
	0x76b7b2,
	0x59a14f,
	0xedc948,
	0xb07aa1,
	0xff9da7,
	0x9c755f,
	0xbab0ab,
];

export const default_node_styles = (nodes, base = NODE_STYLE) => {
	if (!nodes || nodes.length === 0){ return base; }
	const hasGroups = nodes.every((node) => typeof node.group !== "undefined" && node.group !== null);
	if (!hasGroups){ return base; }

	const groups = [...new Set(nodes.map((node) => node.group))].sort((a, b) => a - b);
	const groupColor = fromPairs(groups.map((group, i) => [group, COMMUNITY_PALETTE[i % COMMUNITY_PALETTE.length]]));
	return nodes.map((node) => ({ ...base, color: groupColor[node.group] }));
}

/** Default styling configuration for network links/edges */
export const LINE_STYLE = { lineWidth: 1, color: 0x000000, alpha: 1 }

/** Default styling configuration for polygons */
export const POLYGON_STYLE = {
	lineStyle: { size: 1.5, color: 0xFFFFFF },
	color: 0x650A5A,
	alpha: 0.20
}

// Parameter for all forces
let _default_link_params = {
	distance: 30,
	iterations: 1, 
	id: function(d){ return d.id; } 
};

/** Maps force types to their configurable parameters */
const FORCE_PARAMS = {
  forceManyBody: ['strength', 'theta', 'distanceMin', 'distanceMax'],
  forceLink: ['distance', 'strength', 'iterations'],
  forceCenter: ['x', 'y'],
  forceCollide: ['radius', 'strength', 'iterations'],
  forceX: ['strength', 'x'],
  forceY: ['strength', 'y'],
  forceRadial: ['radius', 'x', 'y', 'strength']
};

/**
 * Serializes force parameters from a D3 force simulation
 * @function
 * @param {Object} sim - D3 force simulation object
 * @param {Array<string>} force_names - Names of forces to serialize
 * @param {Array<string>} force_types - Types of forces corresponding to names
 * @returns {Object} Serialized force configuration
 */
export const serialize_force = (sim, force_names, force_types) => {
	const _force_params = force_names.map((force_name, i) => {
		const force_type = force_types[i];
		const force = sim.force(force_name);
		const params = FORCE_PARAMS[force_type] || [];
		// console.log(force_name, force_type, params);
		const serialized_params = reduce(params, (result, param) => { 
			result[param] = force[param]();
			return result; 
		}, {});
		return [force_name, { enabled: true, type: force_type, params : serialized_params }];
	});
	return fromPairs(_force_params);
}

/**
 * Extracts current node styling from a PIXI Graphics object
 * @function
 * @param {Graphics} node - PIXI Graphics object representing a node
 * @returns {Object} Current node style configuration
 */
export const current_ns = (node) => {
	const gd = node.graphicsData[0]
	let c_ns = { 
		lineStyle: { size: gd.lineWidth, color: gd.lineColor },
		color: gd.fillColor,
		radius: gd.shape.radius,
		alpha: gd.fillAlpha
	};
	c_ns.lineStyle = clean(c_ns.lineStyle)
	if (isEmpty(c_ns.lineStyle)){ delete c_ns.lineStyle; }
	return clean(c_ns)
}

/**
 * Creates a default node style based on current node properties
 * @function
 * @param {Graphics} node - PIXI Graphics object representing a node
 * @returns {Object} Default node style configuration
 */
export const default_ns = (node) => {
	let c_ns = current_ns(node);
	let res = NODE_STYLE;
	if ("alpha" in c_ns){ res.alpha = c_ns.alpha; }
	if ("color" in c_ns){ res.color = c_ns.color; }
	if ("radius" in c_ns){ res.radius = c_ns.radius; }
	if (!isEmpty(c_ns.lineStyle) && "size" in c_ns.lineStyle){ res.lineStyle.size = c_ns.lineStyle.size; }
	if (!isEmpty(c_ns.lineStyle) && "color" in c_ns.lineStyle){ res.lineStyle.color = c_ns.lineStyle.color; }
	return res;
}

/**
 * Removes null and undefined properties from an object
 * @function
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object with null/undefined properties removed
 */
export const clean = (obj) => {
  Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);
  return obj;
}

/**
 * Applies simulation parameters to a D3 force simulation
 * @function
 * @param {Object} sim - D3 force simulation object
 * @param {Object} params - Parameters to apply to the simulation
 * @returns {Object} Modified simulation object
 */
export const apply_sim = (sim, params) => {
	forOwn(params, function(value, key){
		if (key != "force"){ 
			console.log(key.toString() + " = " + value.toString())
			sim[key](value); 
		} 
	});
	return sim
}

/**
 * Scales node coordinates to fit within specified dimensions
 * @function
 * @param {Array} nodes - Array of node objects
 * @param {number} w - Target width
 * @param {number} h - Target height
 * @returns {Array} Array of nodes with scaled coordinates
 */
export const scale_nodes = (nodes, w, h) => {
	// let scale_f = make_scale(w, h);
	nodes.forEach((node) => { 
		if (!('x' in node)){ node.x = Math.random(); }
		if (!('y' in node)){ node.y = Math.random(); }
		// let xy = scale_f.scale([node.x, node.y])
		node.x = node.x * w; node.y = node.y * h;
	});
	return nodes;
}

/**
 * Creates a ticker system with D3 event dispatcher for animation control
 * @function
 * @param {Application} app - PIXI Application instance
 * @param {Container} stage - PIXI Container for the scene
 * @returns {Array} Array containing [ticker, dispatcher]
 */
export const register_ticker = (app, stage) => {
	
	// D3 dispatcher
	let dispatcher = dispatch("tick", "animate", "stop", "restart");
	let end_loop = false; 
	
	// The main animation loop: if not stopped, requests the next animation frame, renders the children in the stage, 
	// and then dispatches a 'tick' callback to the D3 registered dispatcher
	// let ticker = app.ticker;
	const ticker = Ticker.shared;
	ticker.autoStart = false;
	ticker.stop();
	ticker.maxFPS = 60; // TODO: make configurable
	ticker.add((ticker) => {
		dispatcher.call("tick", this);
	});
	
	// Optional minor dispatch that stops the animation frame requests
	dispatcher.on('stop', function(){ 
		end_loop = true; 
		ticker.stop();
		console.log('ticker stopped'); 
	});

	// Optional minor dispatch that restarts the animation frame requests
	dispatcher.on('restart', function(){ 
		end_loop = false; 
		// dispatcher.call('animate');
		ticker.start();
	});
	return [ticker, dispatcher];
}

/**
 * Removes all children from a PIXI Container
 * @function
 * @param {Container} stage - PIXI Container to clear
 */
export const clear_stage = (stage) => {
	for (var i = stage.children.length - 1; i >= 0; i--) {	
		stage.removeChild(stage.children[i]);
	};
}

/**
 * Creates PIXI Graphics objects for network nodes
 * @function
 * @param {Array} nodes - Array of node data objects
 * @returns {Array} Array of PIXI Graphics objects with node properties
 */
export const generate_node_graphics = (nodes) => {
	return map(nodes, (node) => { return Object.assign(build_node(new Graphics()), node); });
} 

/**
 * Creates a PIXI Graphics object for rendering network links
 * @function
 * @returns {Graphics} PIXI Graphics object for drawing links
 */
export const generate_links_graphic = () => { 
	return(new Graphics());
}

/**
 * Creates per-link PIXI Graphics objects for incremental edge redraws
 * @function
 * @param {Array} links - Array of link objects with source/target node references
 * @returns {Array<Graphics>} Array of PIXI Graphics objects, one per edge
 */
export const generate_links_graphics = (links) => {
	return links.map(() => new Graphics());
}

/**
 * Creates PIXI Graphics objects for polygon overlays
 * @function
 * @param {Array} polygons - Array of polygon data objects
 * @returns {Array} Array of polygon objects with attached Graphics instances
 */
export const generate_polygon_graphics = (polygons) => {
	return _.map(polygons, (polygon) => { polygon.gfx = new Graphics(); return polygon; });
}

/**
 * Applies visual styling to network nodes using PIXI Graphics
 * @function
 * @param {Array} nodes - Array of node Graphics objects
 * @param {Object|Array} ns - Node style configuration (single object or array of styles)
 */
export const build_nodes = (nodes, ns) => {
	if (ns.constructor === Array && ns.length == nodes.length){
		nodes.forEach((node, i) => { 
			// node.clear(); // this might be shared! 
			node.context = new GraphicsContext()
				.circle(0, 0, ns[i].radius)
				.stroke({ width: ns[i].lineStyle.size, color: ns[i].lineStyle.color })
				.fill({ color: ns[i].color, alpha: ns[i].alpha})
			;
		});
	} else if (ns.constructor == Object){
		// https://pixijs.com/8.x/guides/components/graphics#the-graphicscontext
		// const ns_new = merge(NODE_STYLE, ns); // TODO: this replaces default_ns
		let ns_context = new GraphicsContext()
			.circle(0, 0, ns.radius)
			.stroke({ width: ns.lineStyle.size, color: ns.lineStyle.color })
			.fill({ color: ns.color, alpha: ns.alpha})
		;
		nodes.forEach((node) => { node.clear(); node.context = ns_context; });
		// nodes.forEach((node) => { build_node(node, ns_new) });
	} else {
		console.log("Failed to apply node styling.")
	}
}

/**
 * Renders network links/edges using PIXI Graphics
 * @function
 * @param {Array} links - Array of link objects with source and target nodes
 * @param {Graphics} link_gfx - PIXI Graphics object for drawing links
 * @param {Object|Array} ls - Link style configuration
 */
export const build_links = (links, link_gfx, ls) => {
	if (link_gfx.constructor === Array){
		if (ls.constructor !== Object){
			console.log("Failed to apply link styling.");
			return 0;
		}
		let redrawn = 0;
		const alpha = (ls.alpha === undefined) ? 1 : ls.alpha;
		const strokeStyle = { width: ls.lineWidth, color: ls.color, alpha };
		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			const gfx = link_gfx[i];
			const source = link.source;
			const target = link.target;
			const styleChanged =
				gfx.__lineWidth !== ls.lineWidth ||
				gfx.__lineColor !== ls.color ||
				gfx.__lineAlpha !== alpha;
			const moved =
				gfx.__sx !== source.x ||
				gfx.__sy !== source.y ||
				gfx.__tx !== target.x ||
				gfx.__ty !== target.y;

			if (!styleChanged && !moved){
				continue;
			}
			redrawn += 1;

			gfx.clear();
			gfx
				.moveTo(source.x, source.y)
				.lineTo(target.x, target.y)
				.stroke(strokeStyle);

			gfx.__lineWidth = ls.lineWidth;
			gfx.__lineColor = ls.color;
			gfx.__lineAlpha = alpha;
			gfx.__sx = source.x;
			gfx.__sy = source.y;
			gfx.__tx = target.x;
			gfx.__ty = target.y;
		}
		return redrawn;
	}

	if (ls.constructor === Array && ls.length == links.length){
		// console.log("Drawing lines as arrays")
		links.forEach((link, i) => { 
			const { source, target } = link;
			link_gfx
				.moveTo(source.x, source.y)
				.lineTo(target.x, target.y)
				.stroke({ width: ls.lineWidth, color: ls.color });
		});
	} // o.w. draw every link with specified style
	else if (ls.constructor == Object){
		// TODO: make this as optimized as possible
		link_gfx.clear();
		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			const source = link.source;
			const target = link.target;
			link_gfx.moveTo(source.x, source.y).lineTo(target.x, target.y)
		}
		link_gfx.stroke({ width: ls.lineWidth, color: ls.color, alpha: (ls.alpha === undefined) ? 1 : ls.alpha });
		return links.length;
	}
	return 0;
}

/**
 * Internal helper function for drawing polygon shapes
 * @function
 * @param {Object} polygon - Polygon object with points or nodes
 * @param {Graphics} poly_gfx - PIXI Graphics object for drawing
 * @private
 */
export const _build_polygon = (polygon, poly_gfx) => {
	if (polygon.nodes){ polygon.points = flatMap(polygon.nodes, (node) => { return [node.x, node.y]; }); }
	poly_gfx.drawPolygon(polygon);
} 

/**
 * Renders a single polygon with specified styling
 * @function
 * @param {Object} polygon - Polygon object to render
 * @param {Graphics} poly_gfx - PIXI Graphics object for drawing
 * @param {Object} ps - Polygon style configuration
 */
export const build_polygon = (polygon, poly_gfx, ps = polygon_style) => {
	poly_gfx.clear();
	poly_gfx.beginFill(ps.color);
	_build_polygon(polygon, poly_gfx);
	poly_gfx.endFill();
}

/**
 * Renders multiple polygons with styling
 * @function
 * @param {Array} polygons - Array of polygon objects
 * @param {Object|Array} ps - Polygon style configuration
 */
export const build_polygons = (polygons, ps = polygon_style) => {
	if (ps.constructor === Array && ps.length == polygons.length){
		polygons.forEach((poly, i) => { build_polygon(poly, poly.gfx, Object.assign(polygon_style, ps[i])) });
	} // o.w. draw every polygon with specified style
	else if (ps.constructor == Object){
		polygons.forEach((poly) => { build_polygon(poly, poly.gfx, ps) });
	}
}

/**
 * Registers viewport interaction events to control animation ticker
 * @function
 * @param {Object} tick_dispatcher - D3 dispatcher for tick events
 * @param {Viewport} vp - PIXI Viewport instance
 * @param {Function} predicate - Condition function for stopping animation
 */
export const register_tick_stops = (tick_dispatcher, vp, predicate = function(){ return true; }) => {
	vp.on('clicked', () => tick_dispatcher.call('restart'))
	vp.on('drag-start', () => tick_dispatcher.call('restart'))
	vp.on('pinch-start', () => tick_dispatcher.call('restart'))
	vp.on('moved', () => tick_dispatcher.call('restart'))
	vp.on('zoomed', () => 	tick_dispatcher.call('restart'))
	vp.on('moved-end', () => {
		if (predicate()){
			tick_dispatcher.call('stop')
		}
	}) // only stop if viewport is completely still
}

/**
 * Enables interactive behavior for an array of PIXI objects
 * @function
 * @param {Array} arr - Array of PIXI objects
 * @param {Function} acc - Accessor function to get the interactive object
 */
export const enable_interactive = (arr, acc = identity) => { arr.forEach((item) => { acc(item).interactive = true }) }

/**
 * Disables interactive behavior for an array of PIXI objects
 * @function
 * @param {Array} arr - Array of PIXI objects
 * @param {Function} acc - Accessor function to get the interactive object
 */
export const disable_interactive = (arr, acc = identity) => { arr.forEach((item) => { acc(item).interactive = false }) }

/**
 * Creates a D3 dispatcher for drag events on a PIXI object
 * @function
 * @param {Object} node - PIXI object to make draggable
 * @returns {Object} D3 dispatcher for drag events
 */
export const drag_dispatcher = (node) => {
	let dsp = dispatch("start", "end", "dragging");
	node.on('pointerdown', function(e){ 
		console.log("Drag dispatch pointerdown");
		dsp.call('start', node, e) 
	});
	node.on('pointerup', function(e){ dsp.call('end', node, e) });
	node.on('pointermove', function(e){
		if (this.dragging){
			console.log("Dragging");
			let coords = this.data.getLocalPosition(this.parent);
			dsp.call('dragging', node, e, coords);
		}
	});
	return dsp;
}

/**
 * Creates a PIXI drag handler function that can be composed with dispatchers
 * @function
 * @param {Object} pixi_obj - PIXI object to enable dragging on
 * @returns {Function} Drag handler function
 */
export const pixi_drag = (pixi_obj) => {
	if (!pixi_obj.interactive){ pixi_obj.interactive = true; }
	return function(dispatcher){
		dispatcher.on('start.pixi', function(e){
			if (this.parent.pausePlugin){ this.parent.pausePlugin("drag") };
			Object.assign(this, { data: e.data, alpha: 0.8, dragging: true });
		}).on('end.pixi', function(e){
			if (this.parent.resumePlugin){ this.parent.resumePlugin("drag") }
			Object.assign(this, { data: null, alpha: 1, dragging: false });
		}).on('dragging.pixi', function(e, coords){
			this.x = coords.x, this.y = coords.y;
		});
		return dispatcher;
	}
}

/**
 * Creates a force simulation drag handler for physics-based dragging
 * @function
 * @param {Object} sim - D3 force simulation instance
 * @returns {Function} Force drag handler function
 */
export const force_drag = (sim) => {
	return function(dispatcher){
		dispatcher.on("start.force", function(e){ 
			sim.alphaTarget(0.3).restart();
			this.fx = this.x; this.fy = this.y; 
		}).on("dragging.force", function(e, coords){
			this.fx = coords.x; this.fy = coords.y; 
		}).on("end.force", function(e){
			if (!this.dragging) { sim.alphaTarget(0); }
			this.fx = null; this.fy = null; 
		});
		return dispatcher;
	}
}

/**
 * Adds array of items to a PIXI Container using an accessor function
 * @function
 * @param {Container} container - PIXI Container to add items to
 * @param {Array} arr - Array of items to add
 * @param {Function} acc - Accessor function to get the displayable object
 */
export const add_items = (container, arr, acc = identity) => { 
	arr.forEach((item) => { container.addChild(acc(item)) }); 
}

/**
 * Inserts new nodes into existing node array, creating Graphics objects
 * @function
 * @param {Array} nodes - Existing array of node Graphics objects
 * @param {Array} new_nodes - Array of new node data objects
 * @returns {Array} Combined array of node Graphics objects
 */
export const insert_nodes = (nodes, new_nodes) => {
	let ins_nodes = generate_node_graphics(differenceBy(new_nodes, nodes, 'id'));
	return concat(nodes, ins_nodes);
}

/**
 * Removes nodes and associated links from the network
 * @function
 * @param {Array} node_ids - Array of node IDs to remove
 * @param {Array} nodes - Array of node objects
 * @param {Array} links - Array of link objects
 * @param {Container} stage - PIXI Container to remove visual elements from
 */
export const remove_nodes = (node_ids, nodes, links, stage) => {
	remove(links, (link) => {
		return (includes(node_ids, link.source.id) || includes(node_ids, link.target.id));
	});
	let removed_nodes = remove(nodes, (node) => { return includes(node_ids, node.id); });
	removed_nodes.forEach((node) => { stage.removeChild(node) });
}

/**
 * Creates a PIXI Container group from an array of nodes
 * @function
 * @param {Array} nodes - Array of node objects to group
 * @returns {Container} PIXI Container containing all nodes
 */
export const make_group = (nodes) => {
	let container = new Container();
	nodes.forEach((node) => { container.addChild(node); });
	// container.interactive = true; 
	return(container);
}

/**
 * Creates a new D3 force simulation instance
 * @function
 * @returns {Object} D3 force simulation object
 */
export const force_sim = () => { return forceSimulation() }

/**
 * Enables automatic resizing for PIXI application and viewport
 * @function
 * @param {Application} app - PIXI Application instance
 * @param {Viewport} vp - PIXI Viewport instance (optional)
 * @returns {Function} Resize function
 */
export const enable_resize = (app, vp = null) => {
	app.renderer.autoResize = true;
	const parent = app.canvas.parentNode; // view => canvas in v8
	const _resize = (w = parent.clientWidth, h = parent.clientHeight) => {
		console.log("calling resize");
		if (vp){ vp.resize(w, h); }
		app.renderer.resize(w, h);
	}
	return(_resize);
}

/**
 * Resolves link references by replacing node IDs with Graphics objects
 * @function
 * @param {Array} nodes - Array of node Graphics objects
 * @param {Array} links - Array of link objects with source/target IDs
 */
export const resolve_links = (nodes, links) => {
	const id_map = fromPairs(nodes.map((node, i) => { return [node.id, i]; }));
	links.forEach((link) => {
		link.source = link.source instanceof Graphics ? link.source : nodes[id_map[link.source]];
		link.target = link.target instanceof Graphics ? link.target : nodes[id_map[link.target]];
	});
}

/**
 * Enables lasso selection functionality for network nodes
 * @function
 * @param {string} visRootID - ID of the root visualization element
 * @returns {Object} D3 dispatcher for lasso selection events
 */
export const enable_lasso = (visRootID) => {
	// const screenScale = window.devicePixelRatio || 1;
	let dispatcher = dispatch("start", "selected");

	const visRoot = select('#'+visRootID);
	// console.log(visRoot);
	var interaction_svg = visRoot.append('svg')
		.attr('id', 'selection_svg')
		.attr('width', visRoot.style("width"))
		.attr('height', visRoot.style("height"))
		.style('position', 'absolute')
		.style('top', 0)
		.style('left', 0)
		.style('display', 'none');

	// Make new lasso instance
	var lassoInstance = lasso();
	let local_nodes = null; 
	// console.log(lassoInstance);
	
	// Register handler for when the lasso is ended. Dispatch to 'selected'. 
	lassoInstance.on('end', function(lassoPolygon){
		interaction_svg.style('display', 'none');
		console.log(local_nodes);
		const selected_nodes = local_nodes.filter((node) => {
			let xy = [ node.x, node.y ];
			return polygonContains(lassoPolygon, xy);
		});
		local_nodes = null; 
		dispatcher.call("selected", this, selected_nodes);
	});

	// Register listener for 'start' on dispatcher
	dispatcher.on("start", function(nodes){
		local_nodes = nodes;
		interaction_svg.style('display', 'inline');
		lassoInstance(interaction_svg);
	});
	
	return(dispatcher);
}

/**
 * Groups items into a PIXI Container using an accessor function
 * @param {Array} items - Array of items to group
 * @param {Function} acc - Accessor function to get displayable objects
 * @returns {Container} PIXI Container containing all items
 */
export const group_items = (items, acc = identity) => {
	let group = new Container();
	items.forEach((item) => { group.addChild(acc(item)); });
	return group;
}

/**
 * Reads a text file asynchronously using XMLHttpRequest
 * @param {string} file - Path to the file to read
 * @param {Function} callback - Callback function to handle file contents
 */
export const readTextFile = (file, callback) => {
	var rawFile = new XMLHttpRequest();
	rawFile.overrideMimeType("application/json");
	rawFile.open("GET", file, true);
	rawFile.onreadystatechange = function() {
		if (rawFile.readyState === 4 && rawFile.status == "200") {
			callback(rawFile.responseText);
		}
	}
	rawFile.send(null);
}

/**
 * Creates a new Pixiplex network visualization instance
 * @class
 */
class Pixiplex {
	/**
	 * Creates a new Pixiplex network visualization instance
	 * @constructor 
	 * @param {Array} nodes - Array of node data objects
	 * @param {Array} links - Array of link data objects
	 * @param {number} width - Canvas width in pixels
	 * @param {number} height - Canvas height in pixels
	 * @param {number} scale - Scaling factor for the viewport
	 * @param {Object} forces - Configuration for physics forces
	 */
	constructor(nodes = [], links = [], width = 250, height = 250, scale = 2.0, forces = {}){
		this.width = width
		this.height = height
		this.scale = scale
		this.nodes = nodes
		this.links = links
		this.polygons = null
		this.nodes_gfx = null
		this.links_gfx = null
		this.polygons_gfx = null;
		this.degree = Array(nodes.length).fill(0);
		// this.degree = {}
		this.links.forEach(link => {
				this.degree[link.source.id] = this.degree[link.source.id] + 1;
				this.degree[link.target.id] = this.degree[link.target.id] + 1;
		});
		this.node_style = NODE_STYLE; // optional; nodes with track their styles internally
		this.line_style = LINE_STYLE;	// mandatory, lines are redrawn using this 
		this.polygon_style = POLYGON_STYLE;
		
		this.forces = forces;
		this.perf_stats = { edgesRedrawn: 0 };
		this.force_registry = {};
		this._drag_enabled = false;
		this._drag_target = null;
		this._drag_handlers = null;
		this.performance_mode = false;
		this._init_state = "idle";
		this._init_promise = null;
		this._init_error = null;
	}

	_register_force(name, type){
		this.force_registry[name] = type;
	}

	remove_force(name){
		this.sim?.force(name, null);
		delete this.force_registry[name];
	}

	get_force_snapshot(){
		if (!this.sim){ return []; }
		return Object.entries(this.force_registry).map(([name, type]) => {
			const force = this.sim.force(name);
			const active = typeof force !== "undefined" && force !== null;
			const params = {};
			if (active){
				(FORCE_PARAMS[type] || []).forEach((param) => {
					const getter = force[param];
					params[param] = (typeof getter === "function") ? getter.call(force) : undefined;
				});
			}
			return { name, type, active, params };
		});
	}

	/**
	 * Initializes the visualization with PIXI application, viewport, and force simulation
	 * @async
	 * @method init
	 * @memberof Pixiplex
	 * @param {boolean} drag - Whether to enable node dragging
	 * @param {boolean} center - Whether to center the graph initially
	 */
	async init(drag = true, center = true){
		return this.init_all(drag, center);
	}

	/**
	 * Initializes the visualization with PIXI application, viewport, and force simulation
	 * @async
	 * @method init_all
	 * @memberof Pixiplex
	 * @param {boolean} drag - Whether to enable node dragging
	 * @param {boolean} center - Whether to center the graph initially
	 */
	async init_all(drag = true, center = true){
			if (this._init_state === "ready"){ return this; }
			if (this._init_state === "initializing" && this._init_promise){ return this._init_promise; }

			this._init_state = "initializing";
			this._init_error = null;
			this._init_promise = (async () => {
				// Pixi & viewport related initializations
				await this._init_application();
				this._init_viewport();
				this._init_ticker();
		
				// Rendering & graph related initializations
				this._init_graphics(this.nodes, this.links)
				add_items(this.vp, this.links_gfx); // add links to viewport
				add_items(this.vp, this.nodes_gfx);   // add nodes to viewport
				this.ticker.add((ticker) => {
					this.perf_stats.edgesRedrawn = build_links(this.links, this.links_gfx, this.line_style);
				});
				this._init_force();
				
				// Runtime initializations
				this.ticker.start();
				if (drag) { this.enable_drag(); }
				if (center) { this.center_graph(true); }
				this._init_state = "ready";
				return this;
			})().catch((err) => {
				this._init_state = "failed";
				this._init_error = err;
				throw err;
			});

			return this._init_promise;
	}

	/**
 * Initializes the PixiJS application with specified rendering parameters
 * @async
 * @method
 * @memberof Pixiplex
 * @param {Object} options - Additional application configuration options
 * @param {number} options.width - Canvas width override
 * @param {number} options.height - Canvas height override
 * @param {boolean} options.antialias - Enable antialiasing
 * @param {number} options.backgroundColor - Background color as hex value
 * @param {number} options.resolution - Pixel density ratio for high-DPI displays
 * @param {boolean} options.transparent - Enable canvas transparency
 * @param {boolean} options.autoResize - Enable automatic canvas resizing
 * @param {boolean} options.forceCanvas - Force canvas rendering over WebGL
 * @param {boolean} options.autoStart - Enable automatic ticker start
 * @param {boolean} options.autoDensity - Enable automatic density adjustment
 * @param {boolean} options.failIfMajorPerformanceCaveat - Fail if major performance issues detected
 * @returns {Promise<void>}
 */
	async _init_application(options){
		// this.view = document.createElement('canvas');
		// this.view.width = this.width;
		// this.view.height = this.height;
		// this.view.style.width = this.width + 'px'
		// this.view.style.height = this.height + 'px'
		// set_dpi(this.view, 288);
		// console.log(this.view.width);
		this.pixel_ratio = Math.min(devicePixelRatio || 1, 1.5);
		let app_params = {
			// canvas: this.view,
			width: this.width,  // NOTE: this is preferred over making own canvas!
			height: this.height,
			antialias: true, 
			backgroundColor: 0xededed, 
			resolution: this.pixel_ratio,  // NOTE: world coordinate calculations are affected by resolution!
			preference: "webgl",
			// resolution: 1.0,
			sharedTicker: true, // 
			transparent: true,
			autoResize: false, // might be needed for resolution 
			// resizeTo: this.view,
			forceCanvas: false, // NOTE: this can force CPU? 
			autoStart: false, // <- note the animation updates won't be immediate! 
			autoDensity: true,  // this acts as autoResize
			failIfMajorPerformanceCaveat: false
		}

		let resolved_app = null;
		const attempt_configs = [
			assign({}, app_params, options),
			assign({}, app_params, options, { antialias: false, resolution: 1, powerPreference: "low-power" }),
		];

		for (let i = 0; i < attempt_configs.length; i++){
			const app = new Application();
			try {
				await app.init(attempt_configs[i]);
				resolved_app = app;
				break;
			} catch (err){
				console.warn(`Pixiplex: renderer init attempt ${i + 1} failed`, err);
				try { app.destroy(); } catch (_) {}
			}
		}

		if (!resolved_app){
			throw new Error("Pixiplex failed to initialize renderer");
		}

		this.app = resolved_app;
		this.view = this.app.canvas
		this.view.style.width = `${this.width}px`;
		this.view.style.height = `${this.height}px`;
		this.view.style.left = "0px";
		this.view.style.top = "0px";
		this.view.style.display = "block";
		// this.view.width = this.width
		// this.view.height = this.height
		this.view.onwheel = function(event){ event.preventDefault(); };
		this.view.onmousewheel = function(event){ event.preventDefault(); };
	}

	/**
	 * Creates and configures a viewport for handling pan, zoom, and drag interactions
	 * Uses pixi-viewport library for managing world-to-screen coordinate transformations
	 * @async
	 * @returns {Promise<Viewport>} The configured viewport instance
	 */
	async _init_viewport(){
		if (Object.hasOwn(this, "app")){
			// const zoomScale = this.pixel_ratio * this.scale;
			const zoomScale = this.scale;
			this.vp = new Viewport({
				screenWidth: this.width, 
				screenHeight: this.height,
				worldWidth: zoomScale * this.width, 
				worldHeight: zoomScale * this.height,
				events: this.app.renderer.events,  // this changed; app must be initialized
				threshold: 10,  // number of pixels to move to trigger an input event 
				// stopPropagation: true, 
				// interaction: app.renderer.plugins.interaction
			});
			// this.vp = create_viewport(this.app, this.width, this.height, zoomScale * this.width, zoomScale * this.height);
			const vp_params = {
				clampZoom: { minWidth: this.width/zoomScale, maxWidth: this.width*zoomScale, minHeight: this.height/zoomScale, maxHeight: this.height*zoomScale }
			}
			// Clamp gets rid of panning !.clamp({ direction: 'all'})
			this.vp
				.drag({ wheel: false })
				.pinch()
				.wheel(1e-3)
				.clamp({ direction: 'all'})
				.clampZoom(vp_params.clampZoom)
				.decelerate();
			// this.vp.drag().wheel(1e-3).clamp({ direction: 'all'}).clampZoom(vp_params.clampZoom).decelerate();		
			this.app.stage.addChild(this.vp)
			return this.vp; 
		}
	}

	/**
	 * Initializes the PixiJS ticker and D3 event dispatcher for animation and event handling
	 * Registers the ticker with the application and viewport for synchronized updates
	 */
	_init_ticker(){
		const [ticker, dispatcher] = register_ticker(this.app, this.vp); // the (pixi) simulation tick
		this.ticker = ticker 				 // pixi.js ticker
		this.dispatcher = dispatcher // d3-dispatcher
	}

	/**
	 * Initializes graphics objects for nodes and links, applying styling and establishing references
	 * Scales node coordinates to fit viewport dimensions and resolves link source/target references
	 * @param {Array<Object>} nodes - Array of node objects with id, x, y properties
	 * @param {Array<Object>} links - Array of link objects with source, target references
	 * @returns {Array<Array>} Tuple containing [nodes_gfx, links_gfx] graphics arrays
	 */
	_init_graphics(nodes, links){
		if (Object.hasOwn(this, "nodes") && Object.hasOwn(this, "links")){
			// First: add (x,y) coordinates to nodes, if not given, and scale them by the width/height
			scale_nodes(nodes, this.width, this.height)
			// this.nodes_gfx = generate_node_graphics(nodes);
			
			// Merge new Graphics instances w/ node attributes, then 'build' by apply the styling
			this.nodes_gfx = map(nodes, (node) => { return assign(new Graphics(), node); })
			build_nodes(this.nodes_gfx, default_node_styles(this.nodes_gfx, this.node_style))
			
			// Populate the links with node graphic references	(used to be resolve_links)
			const id_map = fromPairs(this.nodes_gfx.map((node, i) => { return [node.id, i]; }));
			links.forEach((link) => {
				link.source = link.source instanceof Graphics ? link.source : this.nodes_gfx[id_map[link.source]];
				link.target = link.target instanceof Graphics ? link.target : this.nodes_gfx[id_map[link.target]];
			});
			this.links_gfx = generate_links_graphics(links);
			build_links(links, this.links_gfx, this.line_style);
		}
		return [this.nodes_gfx, this.links_gfx];
	}

	/**
	 * Initializes a D3 force simulation with the node graphics as simulation subjects
	 * Creates a stopped simulation with alpha set to 1.0 for manual control
	 * @param {Object} sim_options - Configuration options for the force simulation
	 */
	_init_force(sim_options){
		if (!Object.hasOwn(this, "sim")){ 
			console.log("Enabling force simulation");
			this.sim = forceSimulation(this.nodes_gfx); 
			this.sim.stop();
			this.sim.alpha(1.0); // no restart needed
			this.sim.alphaMin(0.001);
			this.sim.alphaDecay(1 - Math.pow(this.sim.alphaMin(), 1 / 300));
			this.sim.velocityDecay(0.4);
		}

		// Apply forces if they exist 
		console.log("applying forces", this.forces);
		if (!isEmpty(this.forces)){
			console.log(this.sim)
			this.apply_force(this.forces)
		} 

		// Apply default forces if not given
		// if (typeof sim_options == 'undefined'){ 
		// 	console.log("Using default force settings");
		// 	const c_x = (this.width * this.scale) / 2; 
		// 	const c_y = (this.height * this.scale) / 2; 
		// 	apply_sim(this.sim, default_sim_params)
		// 	apply_force(this.sim, default_sim_params.force)
		// 	this.sim.force('center').x(c_x).y(c_y);
		// 	this.sim.force('spring').links(this.links);
		// } else {
		// 	console.log("Applying force settings: ", sim_options);
		// 	apply_sim(this.sim, sim_options)
		// 	apply_force(this.sim, sim_options.force)
		// }
		this.enable_force();
	}

	/**
	 * Enables drag interaction for all node graphics in the visualization
	 * Implements pointer-based dragging with viewport pause/resume and force simulation integration
	 * @returns {boolean} True if drag was successfully enabled, false if nodes_gfx not available
	 */
	enable_drag(){
		if (!Object.hasOwn(this, "nodes_gfx")){ return false; }
		if (this._drag_enabled){ return true; }

		// Make sure the viewport is interactive
		this.vp.interactive = true; 
		this.vp.visible = true; 
		// this.vp.hitArea = this.vp.getBounds();

		if (!this._drag_handlers){
			let viewport = this.vp;
			let sim = this.sim;

			const onDragMove = (event) => {
				if (this._drag_target) {
					this._drag_target.parent.toLocal(event.global, null, this._drag_target.position);
					this._drag_target.fx = this._drag_target.position.x;
					this._drag_target.fy = this._drag_target.position.y;
				}
			};

			const onDragStart = function(){
				viewport.plugins.get("drag").pause();
				this._pixiplex.enable_force();
				this._pixiplex._drag_target = this;
				viewport.on('pointermove', onDragMove);

				this._pixiplex._drag_target.fx = this._pixiplex._drag_target.x;
				this._pixiplex._drag_target.fy = this._pixiplex._drag_target.y;
				sim?.alphaTarget(0.3)?.restart();
			};

			const onDragEnd = () => {
				if (this._drag_target){
					sim?.alphaTarget(0);
					this._drag_target.fx = null;
					this._drag_target.fy = null;
					viewport.off('pointermove', onDragMove);
					this._drag_target = null;
				}
				viewport.plugins.get("drag").resume();
			};

			this._drag_handlers = { onDragStart, onDragMove, onDragEnd };
		}

		// Attach a pointerdown event to every node and pointer up to the viewport
		this.vp.on('pointerup', this._drag_handlers.onDragEnd);
		this.vp.on('pointerupoutside', this._drag_handlers.onDragEnd);
		this.nodes_gfx.forEach((node) => {
			node._pixiplex = this;
			node.interactive = true; 
			node.on("pointerdown", this._drag_handlers.onDragStart);
		});
		this._drag_enabled = true;
		return true;
	}

	/**
	 * Disables drag interaction for all node graphics
	 * Sets interactive property to false for all nodes
	 */
	disable_drag(){
		console.log("disabling drag");
		if (!this._drag_enabled){ return; }
		if (this._drag_handlers){
			this.vp.off('pointerup', this._drag_handlers.onDragEnd);
			this.vp.off('pointerupoutside', this._drag_handlers.onDragEnd);
			this.vp.off('pointermove', this._drag_handlers.onDragMove);
		}
		if (this._drag_target){
			this._drag_target.fx = null;
			this._drag_target.fy = null;
			this._drag_target = null;
		}
		this.nodes_gfx.forEach((node) => {
			if (this._drag_handlers){
				node.off("pointerdown", this._drag_handlers.onDragStart);
			}
			node.interactive = false; 
		});
		this._drag_enabled = false;
	}

	/**
	 * Enables force simulation by connecting the dispatcher tick event to simulation updates
	 */
	enable_force(){
		if (!Object.hasOwn(this, "sim")){ return; }
		this.dispatcher.on("tick.force", () => {
			this.sim.tick(); 
			const settled = this.sim.alpha() <= (this.sim.alphaMin() + 0.0025);
			if (settled){
				this.disable_force();
				this.sim.stop();
			}
		});
		// Attach dispatchers for force events
		// force_drag(this.sim)(this.dispatcher);
	}

	/**
	 * Disables force simulation by removing the tick event handler
	 */
	disable_force(){
		this.dispatcher.on("tick.force", null);
		this.sim?.alphaTarget(0);
	}

	set_performance_mode(enabled = true){
		this.performance_mode = enabled;
		if (this.ticker){
			this.ticker.maxFPS = enabled ? 30 : 60;
		}
		if (this.app?.renderer){
			const target_resolution = enabled ? 1 : this.pixel_ratio;
			if (this.app.renderer.resolution !== target_resolution){
				this.app.renderer.resolution = target_resolution;
				this.app.renderer.resize(this.width, this.height);
			}
		}
		if (this.app?.stage){
			this.app.stage.roundPixels = enabled;
		}
	}

	/**
	 * Centers the graph visualization by translating all nodes to the viewport center
	 * Optionally fits the graph to the viewport bounds and updates force simulation center
	 * @param {boolean} [fit=true] - Whether to fit the graph to viewport bounds
	 * @param {number} [x] - Custom x-coordinate for center (defaults to viewport center)
	 * @param {number} [y] - Custom y-coordinate for center (defaults to viewport center)
	 */
	center_graph(fit = true, x = undefined, y = undefined){
		const num_nodes = this.nodes_gfx.length;
		const mean_x = sum(this.nodes_gfx.map((node) => { return node.x; })) / num_nodes;
		const mean_y = sum(this.nodes_gfx.map((node) => { return node.y; })) / num_nodes;
		
		this.sim?.stop();
		// (x,y) as given should be scaled such that the user-viewed coordinates translate to world coordinates
		const c_x = typeof x !== "undefined" ? x * this.scale : (this.vp.worldWidth) / 2;
		const c_y = typeof y !== "undefined" ? y * this.scale : (this.vp.worldHeight) / 2;
		console.log("Centering graph center ", mean_x, mean_y, " to ", c_x, c_y);
		for (let i = 0; i < this.nodes_gfx.length; i++) {
			this.nodes_gfx[i].position.x -= mean_x;
			this.nodes_gfx[i].position.y -= mean_y;
			this.nodes_gfx[i].position.x += c_x;
			this.nodes_gfx[i].position.y += c_y;
		}
		if (fit){
			this.vp.fit();
			// this.vp.fit(false, this.width, this.height);
			// this.vp.moveCorner(this.width / this.scale, this.height / this.scale); // For w/e reason, moveCenter is bugged
		}
		// this.vp.moveCenter(c_x, c_y);
		// this.sim?.force('center')?.x(c_x).y(c_y);
		this.sim?.restart();
		// this.app.renderer.render(this.app.stage);
	}

	/**
	 * Adds a centering force to the simulation that pulls nodes toward a specified point
	 * @param {string} [name="center"] - Name identifier for the force
	 * @param {number} [x] - X-coordinate for center point (defaults to viewport center)
	 * @param {number} [y] - Y-coordinate for center point (defaults to viewport center)
	 */
	force_center(name = "center", x = undefined, y = undefined){
		console.log("making center force", this, x, y);
		const xc = (x === undefined) ? this.width * this.scale / 2 : x; 
		const yc = (y === undefined) ? this.height * this.scale / 2 : y; 
		console.log("centering at: ", xc, yc);
		this.sim.force(name, forceCenter(xc, yc)); // register the link force
		this._register_force(name, "forceCenter");
	}

	/**
	 * Adds a spring force to the simulation that maintains desired distances between linked nodes
	 * @param {string} [name="spring"] - Name of the link force.
	 * @param {number} [distance] - Desired distance between linked nodes.
	 * @param {number} [strength] - Strength of the link force.
	 * @param {number} [iterations] - Number of iterations for the link force calculation.
	 */
	force_link(name = "spring", distance = undefined, strength = undefined, iterations = undefined){
		let link_force = forceLink(this.links).id((d) => d.id);
		link_force.distance(distance || 30);
		// link_force.strength(strength || ((link) => { 1 / Math.min(this.degree[link.source.id], this.degree[link.target.id]) }));
		if (strength !== undefined){
			link_force.strength(strength)
		}
		link_force.iterations(iterations || 1);
		this.sim.force(name, link_force); // register the link force
		this._register_force(name, "forceLink");
	}

	/**
	 * Adds a many-body force to the simulation that simulates attractive or repulsive forces between all nodes
	 * @param {string} [name="charge"] - Name identifier for the force
	 * @param {number} [strength] - Strength of the force (negative for repulsion, positive for attraction)
	 * @param {number} [theta] - Barnes-Hut approximation parameter for performance optimization
	 * @param {number} [distanceMin] - Minimum distance for force calculation
	 * @param {number} [distanceMax] - Maximum distance for force calculation
	 */
	force_manybody(name = "charge", strength = undefined, theta = undefined, distanceMin = undefined, distanceMax = undefined){
		let nbody_force = forceManyBody();
		nbody_force.strength(strength || -30);
		nbody_force.theta(theta || 0.90);
		nbody_force.distanceMin(distanceMin ?? 1.0);
		nbody_force.distanceMax(distanceMax ?? Infinity);
		this.sim.force(name, nbody_force); // register the link force
		this._register_force(name, "forceManyBody");
	}

	force_x(name = "x", x = undefined, strength = undefined){
		let x_force = forceX();
		x_force.x(x || this.width / 2);
		x_force.strength(strength || 0.1);
		this.sim.force(name, x_force);
		this._register_force(name, "forceX");
	}

	force_y(name = "y", y = undefined, strength = undefined){
		let y_force = forceY();
		y_force.y(y || this.height / 2);
		y_force.strength(strength || 0.1);
		this.sim.force(name, y_force);
		this._register_force(name, "forceY");
	}

	force_radial(name = "ra", radius = undefined, x = undefined, y = undefined, strength = undefined){
		let radial_force = forceRadial();
		radial_force.radius(radius || 1.0);
		radial_force.x(x || this.width / 2);
		radial_force.y(y || this.height / 2);
		radial_force.strength(strength || 0.1)
		this.sim.force(name, radial_force);
		this._register_force(name, "forceRadial");
	}

	/**
	 * Applies force configuration parameters to the simulation
	 * Parses force settings object and applies appropriate force types with their parameters
	 * @param {Object} params - Force configuration object with force names as keys
	 * @param {Object} params.forceName - Individual force configuration
	 * @param {string} params.forceName.type - Type of force (e.g., "forceCenter", "forceManyBody")
	 * @param {boolean} params.forceName.enabled - Whether the force is enabled
	 * @returns {boolean} False if simulation not available, simulation object otherwise
	 */
	apply_force(params){
		if (!Object.hasOwn(this, "sim")){ return false; }
		console.log("force params", params)
		forOwn(params, (settings, force_name) => {
			console.log("Applying force simulation parameters", this)
			console.log("Force settings", settings, force_name)
			// const force_enabled = Object.hasOwn(settings, "enabled") || settings.enabled
			// if (!force_enabled){ return;}	
			if (settings.type == "forceCenter"){
				this.force_center(force_name, settings.x, settings.y);
			} else if (settings.type == "forceManyBody"){
				const { strength, theta, distanceMin, distanceMax } = settings;
				this.force_manybody(force_name, strength, theta, distanceMin, distanceMax);
			} else if (settings.type == "forceLink"){
				const { distance, strength, iterations } = settings;
				this.force_link(force_name, distance, strength, iterations);
			} else if (settings.type == "forceCollide"){
				const { radius, strength, iterations } = settings;
				this.force_collide(force_name, radius, strength, iterations);
			} else if (settings.type == "forceRadial"){
				const { radius, x, y, strength } = settings;
				this.force_radial(force_name, radius, x, y, strength);
			} else if (settings.type == "forceX"){
				const { x, strength } = settings;
				this.force_x(force_name, x, strength);
			} else if (settings.type == "forceY"){
				const { y, strength } = settings;
				this.force_y(force_name, y, strength);
			} else {
				console.log("Unknown force settings: ", settings);
				return false; 
			}
			
				// settings.params
				// // Sets up force with default setting
				// this.sim.force(forcename, d3_force[settings.type]());
				
				// // Apply the given parameter settings
				// forOwn(settings.params, function(param_value, param_name){
				// 	console.log(forcename.toString() + ": " + param_name.toString() + " = " + param_value.toString())
				// 	this.sim.force(forcename)[param_name](param_value);			
				// })
		})
		return this.sim;
	}
}

// Export statements for utility functions and classes
export { map, forOwn, remove, concat, filter, unionBy, unionWith, pullAllBy, pullAllWith, intersectionWith, differenceBy, differenceWith, transform, includes, isEmpty, merge, flatMap}
export { Application, Graphics, GraphicsContext, Polygon, Text, Ticker, Container, Viewport }
export { Pixiplex }
export { json }
export { d3_force }
// export { loadPyodide }


// link_force.strength(strength || )
	// forOwn(params, (param_value, param_name) => {
	// 	console.log(name.toString() + ": " + param_name.toString() + " = " + param_value.toString())
	// 	link_force[param_name](param_value);			
	// })
