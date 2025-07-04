// pixinet.js 
// Contains utilities for making PIXI-driven force-directed network 

// import * as PIXI from 'pixi.js';
import { Application, Graphics, Polygon, Text, Container, Ticker, GraphicsContext } from 'pixi.js'
import { Viewport } from 'pixi-viewport';
import { selection, select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { polygonContains } from 'd3-polygon';
import lasso from './lasso.js';
import { dispatch } from 'd3-dispatch';
import { assign, forOwn, map, remove, concat, filter, unionBy, pullAllBy, pullAllWith, intersectionWith, unionWith, differenceBy, differenceWith, transform, includes, isFunction, isEmpty, merge, flatMap, sum, fromPairs, reduce, sortedIndexBy } from 'lodash-es';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation, forceX, forceY } from 'd3-force';
import * as d3_force from 'd3-force';
import { json } from 'd3-fetch';
// import * as EventEmitter from 'eventemitter3';
// import { loadPyodide } from 'pyodide';

// Can also be passed into the renderer directly e.g `autoDetectRenderer({resolution: 1})`
// AbstractRenderer.defaultOptions.resolution = 5.0;

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

export const range = (arr, accessor) => { return [ minBy(arr, accessor), maxBy(arr, accessor)] }
export const identity = (val) => { return val; }
export const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args))) // why is this not standard...

// Makes linear scaling functions that take coordinates in [0, 1] -> [w, h] + inverse	
export const make_scale = (w, h) => {
	const scale_x = scaleLinear().domain([0, 1]).range([0, w]);
	const scale_y = scaleLinear().domain([0, 1]).range([0, h]);
	const scale_xy = (xy) => { return [scale_x(xy[0]), scale_y(xy[1])] }
	const invert_scale_xy = (xy) => { return [scale_x.invert(xy[0]), scale_x.invert(xy[1])] }
	return { scale: scale_xy, invert: invert_scale_xy };
}

export const NODE_STYLE = { 
	lineStyle: { size: 1.5, color: 0xFFFFFF },
	color: 0x650A5A,
	radius: 6,
	alpha: 1
}
export const LINE_STYLE = { lineWidth: 1, color: 0x000000, alpha: 1 }
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
// let _default_manybody_params = { strength: function() { return -30 }, distanceMin: 1, distanceMax: Infinity }
// let _default_center_params = { x: 0, y: 0 }
// export const default_sim_params = {
// 	alpha: 1, 
// 	force: { // < name > : { enabled: < boolean >, type: < force type >, params: { < force parameters > } }
// 	  charge: { enabled: true, type: "forceManyBody", params: _default_manybody_params },
// 	  spring: { enabled: true, type: "forceLink", params: _default_link_params },
// 	  center: { enabled: true, type: "forceCenter", params: _default_center_params }
// 	}
// };

const FORCE_PARAMS = {
  forceManyBody: ['strength', 'theta', 'distanceMin', 'distanceMax'],
  forceLink: ['distance', 'strength', 'iterations'],
  forceCenter: ['x', 'y'],
  forceCollide: ['radius', 'strength', 'iterations'],
  forceX: ['strength', 'x'],
  forceY: ['strength', 'y']
};

// Serializes the forces of a d3-force simulation or a given set of forces
// This is the opposite of the apply force, i.e. apply_force(sim, serialize_force(sim, ...)) is the identity 
// * @param  {[type]} 
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

// Given a node, export its node style
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

// Remove unused keys
export const clean = (obj) => {
  Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);
  return obj;
}

// Applies simulation settings a d3 force simulation
export const apply_sim = (sim, params) => {
	forOwn(params, function(value, key){
		if (key != "force"){ 
			console.log(key.toString() + " = " + value.toString())
			sim[key](value); 
		} 
	});
	return sim
}


// Update force parameters: TODO add to separate methods
// assign(this?.force_params?.center?.params, { x: this.width / 2, y: this.height / 2 });
// assign(this?.force_params?.spring?.params, { links: this.links });
// export const async load_json_graph(json_path){
// 	return json(json_path).then((graph) => {
// 		[graph.nodes, graph.links]; 
// 	});
// }

// Scales node .x, .y coordinates to the given width w and height h.
// If nodes have no intrinsic coordinates, they are given random positions.
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

// Creates a D3-dispatcher that 
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
	ticker.maxFPS = 30; // TODO: make configurable
	ticker.add((ticker) => {
		dispatcher.call("tick", this);
	});
	// function animate(time){
	// 	ticker.update(time);
	// 	app.renderer.render(stage);
	// 	if (!end_loop) { requestAnimationFrame(animate); }
	// 	dispatcher.call("tick", this);
	// 	// console.log(time)
	// }
	// dispatcher.on('animate', animate);
	
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

export const clear_stage = (stage) => {
	for (var i = stage.children.length - 1; i >= 0; i--) {	
		stage.removeChild(stage.children[i]);
	};
}

// Recreates node Graphics objects
export const generate_node_graphics = (nodes) => {
	return map(nodes, (node) => { return Object.assign(build_node(new Graphics()), node); });
} 
// Generate link Graphics object
export const generate_links_graphic = () => { 
	return(new Graphics());
}
export const generate_polygon_graphics = (polygons) => {
	return _.map(polygons, (polygon) => { polygon.gfx = new Graphics(); return polygon; });
}

// Draws the nodes according to the current style, which can be a single single style or a style per-node
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

// Draw Links according to a given styling, or default style otherwise
// If the supplied line style is an array, draw links with individual styles.
// otherwise if the supplied link style is an object, draws all links with that style.
export const build_links = (links, link_gfx, ls) => {
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
		links.forEach((link) => { 
			const { source, target } = link;
			link_gfx.moveTo(source.x, source.y).lineTo(target.x, target.y)
		});
		link_gfx.stroke({ width: ls.lineWidth, color: ls.color });
	}
}

// ------------ Polygon draw methods ------------
export const _build_polygon = (polygon, poly_gfx) => {
	if (polygon.nodes){ polygon.points = flatMap(polygon.nodes, (node) => { return [node.x, node.y]; }); }
	poly_gfx.drawPolygon(polygon);
} 
export const build_polygon = (polygon, poly_gfx, ps = polygon_style) => {
	poly_gfx.clear();
	poly_gfx.beginFill(ps.color);
	_build_polygon(polygon, poly_gfx);
	poly_gfx.endFill();
}
export const build_polygons = (polygons, ps = polygon_style) => {
	if (ps.constructor === Array && ps.length == polygons.length){
		polygons.forEach((poly, i) => { build_polygon(poly, poly.gfx, Object.assign(polygon_style, ps[i])) });
	} // o.w. draw every polygon with specified style
	else if (ps.constructor == Object){
		polygons.forEach((poly) => { build_polygon(poly, poly.gfx, ps) });
	}
}


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

// Enables / Disables interactivity of Graphics items 
export const enable_interactive = (arr, acc = identity) => { arr.forEach((item) => { acc(item).interactive = true }) }
export const disable_interactive = (arr, acc = identity) => { arr.forEach((item) => { acc(item).interactive = false }) }


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

// Enable PIXI dragging for a given PIXI object. The object could be any DisplayObject, 
// e.g. a graphics object or a container. Returns a dispatcher which can be used to add  
// event listeners to the start, end, and during drag events 
// const enable_drag = (dispatcher, pixi_obj) => {
// 	if (!pixi_obj.interactive){ pixi_obj.interactive = true; }
// 	let dispatcher = dispatch("start", "end", "dragging");
// 	pixi_obj.on('pointerdown', function(e){
// 		// ticker.call('restart');
// 		if (this.parent.pausePlugin){ this.parent.pausePlugin("drag") };
// 		Object.assign(this, { data: e.data, alpha: 0.8, dragging: true });
// 		dispatcher.call("start", this);
// 	}).on('pointerup', function(e){
// 		//console.log('pointerup' + e);
// 		// ticker.call('stop');
// 		if (this.parent.resumePlugin){ this.parent.resumePlugin("drag") }
// 		Object.assign(this, { data: null, alpha: 1, dragging: false });
// 		dispatcher.call("end", this);
// 	}).on('pointermove', function(){
// 		if (this.dragging) {
// 			let ncoords = this.data.getLocalPosition(this.parent);
// 			// console.log(this);
// 			this.x = ncoords.x, this.y = ncoords.y;
// 			dispatcher.call("dragging", this, ncoords);
// 		}
// 	});
// 	return(dispatcher);
// }

// Enable regular pixi dragging, but attaches standard force-based drag callbacks as well. 
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

// ---- PIXI Application stuff ----

// The stage is simply a Container that is the root of the scene graph. 
// Every child of the stage container will be rendered every frame. 
// By adding our sprite to the stage, we tell PixiJS's renderer we want to draw it.

// Adds all items in 'arr' to 'stage'. 
// Accesses elements w/ 'accessor' once before adding (not on tick)
export const add_items = (container, arr, acc = identity) => { 
	arr.forEach((item) => { container.addChild(acc(item)) }); 
}

export const insert_nodes = (nodes, new_nodes) => {
	let ins_nodes = generate_node_graphics(differenceBy(new_nodes, nodes, 'id'));
	return concat(nodes, ins_nodes);
}

// ---- Updating node / link arrays -----
export const remove_nodes = (node_ids, nodes, links, stage) => {
	remove(links, (link) => {
		return (includes(node_ids, link.source.id) || includes(node_ids, link.target.id));
	});
	let removed_nodes = remove(nodes, (node) => { return includes(node_ids, node.id); });
	removed_nodes.forEach((node) => { stage.removeChild(node) });
}


// ---- Access and setting node/link properties ----

export const make_group = (nodes) => {
	let container = new Container();
	nodes.forEach((node) => { container.addChild(node); });
	// container.interactive = true; 
	return(container);
}

// Creates a new d3 force simulation 
export const force_sim = () => { return forceSimulation() }

// Applies default settings to force simulation
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

// Resolves link source and target nodes, replacing .source and .target ids with node graphics
// TODO: remap node indices to 0...n-1, then use log(n) search on the link resolution
export const resolve_links = (nodes, links) => {
	const id_map = fromPairs(nodes.map((node, i) => { return [node.id, i]; }));
	links.forEach((link) => {
		link.source = link.source instanceof Graphics ? link.source : nodes[id_map[link.source]];
		link.target = link.target instanceof Graphics ? link.target : nodes[id_map[link.target]];
	});
}

// Attach lasso to interaction SVG
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
	// lassoInstance.on('start', function(lassoPolygon){
	// 	// Reset node colors ? 
	// 	dispatcher.call("start");
	// })
	
	return(dispatcher);
}

// const start_lasso = (nodes, svg_el) => {
// 	svg_el.style('display', 'inline');

// 	// Reset selected points when starting a new polygon
// 	const handleLassoStart = (lassoPolygon) => {
// 		// console.log(lassoPolygon);
// 		// highlight_nodes([]);
// 	}
// 	// Lasso end function
// 	const handleLassoEnd = (lassoPolygon) => {
// 		svg_el.style('display', 'none');
// 		const selected_nodes = nodes.filter((node) => {
// 			let xy = [ node.x, node.y ];
// 			return polygonContains(lassoPolygon, xy);
// 		});
// 		return(selected_nodes);
// 	}
// 	console.log(lasso)
// 	var lassoInstance = lasso().on('start', handleLassoStart).on('end', handleLassoEnd);
// 	lassoInstance(svg_el);		
// }

// Puts a list of items accessed by 'acc' into a container
export const group_items = (items, acc = identity) => {
	let group = new Container();
	items.forEach((item) => { group.addChild(acc(item)); });
	return group;
}

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

class Pixiplex {
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

		this.node_style = NODE_STYLE; // optional; nodes with track their styles internally
		this.line_style = LINE_STYLE;	// mandatory, lines are redrawn using this 
		this.polygon_style = POLYGON_STYLE;
		
		// Default force parameters
		// < name > : { enabled: < boolean >, type: < force type >, params: { < force parameters > } }
		// this.force_params = default_sim_params.force;
		this.forces = forces;
		// 	charge: { enabled: true, type: "forceManyBody", params: { strength: function() { return -30 }, distanceMin: 1, distanceMax: Infinity } },
		// 	spring: { enabled: true, type: "forceLink", params: { distance: 30, iterations: 1, id: function(d){ return d.id; } } },
		// 	center: { enabled: true, type: "forceCenter", params: { x: 0, y: 0 } }
		// }
		// this.sim = null
		// this.sim_params = null // the force simulation + parameters
	}
	// Update force parameters: TODO add to separate methods
	// assign(this?.force_params?.center?.params, { x: this.width / 2, y: this.height / 2 });
	// assign(this?.force_params?.spring?.params, { links: this.links });

	async init(drag = true, center = true){
			// Pixi & viewport related initializations
			await this._init_application();
			this._init_viewport();
			this._init_ticker();
	
			// Rendering & graph related initializations
			// this.links = links; 
			// this.nodes = nodes;
			this._init_graphics(this.nodes, this.links)
			add_items(this.vp, [this.links_gfx]); // add links to viewport
			add_items(this.vp, this.nodes_gfx);   // add nodes to viewport
			this.ticker.add((ticker) => {
				build_links(this.links, this.links_gfx, this.line_style);
			});
			this._init_force();
			
			// Runtime initializations
			this.ticker.start();
			if (drag) { this.enable_drag(); }
			if (center) { this.center_graph(true); }
	}

	
	// Should be called once. Creates members: 
	// - app 
	// - view
	async _init_application(options){
		// this.view = document.createElement('canvas');
		// this.view.width = this.width;
		// this.view.height = this.height;
		// this.view.style.width = this.width + 'px'
		// this.view.style.height = this.height + 'px'
		// set_dpi(this.view, 288);
		// console.log(this.view.width);
		this.app = new Application();
		this.pixel_ratio = devicePixelRatio;
		// const ratio = 1.0;
		let app_params = {
			// canvas: this.view,
			width: this.width,  // NOTE: this is preferred over making own canvas!
			height: this.height,
			antialias: true, 
			backgroundColor: 0xededed, 
			resolution: this.pixel_ratio,  // NOTE: world coordinate calculations are affected by resolution!
			// resolution: 1.0,
			sharedTicker: true, // 
			transparent: true,
			autoResize: false, // might be needed for resolution 
			// resizeTo: this.view,
			forceCanvas: false, // NOTE: this can force CPU? 
			autoStart: false, // <- note the animation updates won't be immediate! 
			autoDensity: true,  // this acts as autoResize
			failIfMajorPerformanceCaveat: true
		}
		await this.app.init(assign(app_params, options));
		this.view = this.app.canvas
		this.view.style.width = this.width
		this.view.style.height = this.height
		this.view.style.left = 0
		this.view.style.top = 0
		// this.view.width = this.width
		// this.view.height = this.height
		this.view.onwheel = function(event){ event.preventDefault(); };
		this.view.onmousewheel = function(event){ event.preventDefault(); };
	}

	// Create a viewport to handle panning, dragging, etc.
	// for pixi v8, see: https://github.com/davidfig/pixi-viewport/issues/488. 
	// - vp 
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
	
	/** Initializes the pixi.js ticker and d3-dispatcher */
	_init_ticker(){
		const [ticker, dispatcher] = register_ticker(this.app, this.vp); // the (pixi) simulation tick
		this.ticker = ticker 				 // pixi.js ticker
		this.dispatcher = dispatcher // d3-dispatcher
	}

	
	// Initialize Graphics(); should be called after graph is initialized
	// Modifies the links in-place to point to nodes
	_init_graphics(nodes, links){
		if (Object.hasOwn(this, "nodes") && Object.hasOwn(this, "links")){
			// First: add (x,y) coordinates to nodes, if not given, and scale them by the width/height
			scale_nodes(nodes, this.width, this.height)
			// this.nodes_gfx = generate_node_graphics(nodes);
			
			// Merge new Graphics instances w/ node attributes, then 'build' by apply the styling
			this.nodes_gfx = map(nodes, (node) => { return assign(new Graphics(), node); })
			build_nodes(this.nodes_gfx, this.node_style)
			
			// Populate the links with node graphic references	(used to be resolve_links)
			const id_map = fromPairs(this.nodes_gfx.map((node, i) => { return [node.id, i]; }));
			links.forEach((link) => {
				link.source = link.source instanceof Graphics ? link.source : this.nodes_gfx[id_map[link.source]];
				link.target = link.target instanceof Graphics ? link.target : this.nodes_gfx[id_map[link.target]];
			});
			this.links_gfx = generate_links_graphic();
			build_links(links, this.links_gfx, this.line_style);
		}
		return [this.nodes_gfx, this.links_gfx];
	}

		/** Initializes an stopped, empty d3-force simulation. */
	_init_force(sim_options){
		if (!Object.hasOwn(this, "sim")){ 
			console.log("Enabling force simulation");
			this.sim = forceSimulation(this.nodes_gfx); 
			this.sim.stop();
			this.sim.alpha(1.0); // no restart needed
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
	};

	
	// sync_forces(fn){
	// 	const force_names = fn ? fn : Object.keys(this.forces); 
	// 	const force_types = map(this.forces, (value, key) => { return value.type; });
	// 	console.log(this.forces);
	// 	this.force_params = merge(this.forces, serialize_force(this.sim, force_names, force_types));
	// }

	// Register the dragging callbacks for the nodes
	enable_drag(){
		if (!Object.hasOwn(this, "nodes_gfx")){ return false; }

		// Make sure the viewport is interactive
		this.vp.interactive = true; 
		this.vp.visible = true; 
		// this.vp.hitArea = this.vp.getBounds();
		
		// From: https://pixijs.com/8.x/examples/events/dragging
		let dragTarget = null;
		let viewport = this.vp; 
		let dispatcher = this.dispatcher;
		let sim = this.sim;

		function onDragMove(event, node){
			// this == viewport
			if (dragTarget) {
				dragTarget.parent.toLocal(event.global, null, dragTarget.position);
				dragTarget.fx = dragTarget.position.x
				dragTarget.fy = dragTarget.position.y; 
				// dispatcher.call("dragging.force")
			}
		}
		function onDragStart(node){
			viewport.plugins.get("drag").pause();
			dragTarget = this;
			viewport.on('pointermove', onDragMove);
			
			// Force-related 
			dragTarget.fx = dragTarget.x; dragTarget.fy = dragTarget.y; 
			sim?.alphaTarget(0.3)?.restart();
			// dispatcher.call("start.force")
		}
    function onDragEnd(){
			if (dragTarget){
				sim?.alphaTarget(0);
				dragTarget.fx = null; dragTarget.fy = null; 

				viewport.off('pointermove', onDragMove);
				dragTarget = null;
			}
			// dispatcher.call("end.force")
			viewport.plugins.get("drag").resume();
    };

		// Attach a pointerdown event to every node and pointer up to the viewport
		this.vp.on('pointerup', onDragEnd);
    this.vp.on('pointerupoutside', onDragEnd);
		this.nodes_gfx.forEach((node) => {
			// compose(pixi_drag(node))(drag_dispatcher(node));
			node.interactive = true; 
			node.on("pointerdown", onDragStart, node);
		});
		return true;
	}

	disable_drag(){
		console.log("disabling drag");
		this.nodes_gfx.forEach((node) => {
			node.interactive = false; 
			// node.on("pointerdown", null);
		});
	}


	enable_force(){
		this.dispatcher.on("tick.force", () => {
			this.sim.tick(); 
		});
		// Attach dispatchers for force events
		// force_drag(this.sim)(this.dispatcher);
	}

	disable_force(){
		this.dispatcher.on("tick.force", null);
	}

	// TODO: debug centering, experiment w/ different kinds of recenterings
	// For w/e reasons, fit and moveCorner seem to apply to different coordinate systems?
	center_graph(fit = true, x = undefined, y = undefined){
		const num_nodes = this.nodes_gfx.length;
		const mean_x = sum(this.nodes_gfx.map((node) => { return node.x; })) / num_nodes;
		const mean_y = sum(this.nodes_gfx.map((node) => { return node.y; })) / num_nodes;
		console.log("Graph center: ", mean_x, mean_y);

		this.sim?.stop();
		const c_x = typeof x !== "undefined" ? x : (this.vp.worldWidth) / 2;
		const c_y = typeof y !== "undefined" ? y : (this.vp.worldHeight) / 2;
		for (let i = 0; i < this.nodes_gfx.length; i++) {
			this.nodes_gfx[i].position.x -= mean_x;
			this.nodes_gfx[i].position.y -= mean_y;
			this.nodes_gfx[i].position.x += c_x;
			this.nodes_gfx[i].position.y += c_y;
		}
		if (fit){
			this.vp.fit(false, this.width, this.height);
			// this.vp.moveCorner(this.width / this.scale, this.height / this.scale); // For w/e reason, moveCenter is bugged
		}
		this.vp.moveCenter(c_x, c_y);
		this.sim?.force('center')?.x(c_x).y(c_y);
		this.sim?.restart();
		// this.app.renderer.render(this.app.stage);
	}

	force_center(name = "center", x = undefined, y = undefined){
		const xc = (x === undefined) ? this.width / 2 : x; 
		const yc = (y === undefined) ? this.height / 2 : y; 
		this.sim.force(name, forceCenter(xc, yc)); // register the link force
	};

	force_link(name = "spring", distance = undefined, strength = undefined, iterations = undefined){
		let link_force = forceLink(this.links).id((d) => d.id);
		link_force.distance(distance || 30);
		if (strength !== undefined){
			link_force.strength(strength)
		}
		link_force.iterations(iterations || 1);
		this.sim.force(name, link_force); // register the link force
	};

	force_manybody(name = "charge", strength = undefined, theta = undefined, distanceMin = undefined, distanceMax = undefined){
		let nbody_force = forceManyBody();
		nbody_force.strength(strength || -30);
		nbody_force.theta(theta || 0.90);
		nbody_force.distanceMin(strength || 1.0);
		nbody_force.distanceMax(strength || Infinity);
		this.sim.force(name, nbody_force); // register the link force
	};

	// Meta-function for applying force settings on a d3 force simulation object
	apply_force(params){
		if (!Object.hasOwn(this, "sim")){ return false; }
		console.log("force params", params)
		forOwn(params, function(settings, force_name){
			console.log("Applying force simulation parameters")
			console.log(settings, force_name)
			force_enabled = Object.hasOwn(settings, "enabled") || settings.enabled
			if (!force_enabled){ return;}	
			if (settings.type == "forceCenter"){
				this.force_center(force_name, settings.x, settings.y);
			} else if (settings.type == "forceManyBody"){
				this.force_manybody(force_name, strength, theta, distanceMin, distanceMax);
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
		return sim
	}

	// // TODO: figure out how to do array 
	// node_radii(r){
	// 	const new_style = { ...NODE_STYLE, radius: r };
	// 	build_nodes(pp.nodes_gfx, new_style);
	// }

}


// export { select }
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