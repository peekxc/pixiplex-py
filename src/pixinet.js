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
import { assign, forOwn, map, remove, concat, filter, unionBy, pullAllBy, pullAllWith, intersectionWith, unionWith, differenceBy, differenceWith, transform, includes, isFunction, isEmpty, merge, flatMap, sum } from 'lodash-es';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation, forceX, forceY } from 'd3-force';
import * as d3_force from 'd3-force';
// import * as EventEmitter from 'eventemitter3';

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

const node_style = { 
	lineStyle: { size: 1.5, color: 0xFFFFFF },
	color: 0x650A5A,
	radius: 6,
	alpha: 1
}
const line_style = { lineWidth: 1, color: 0x000000, alpha: 1 }
const polygon_style = {
	lineStyle: { size: 1.5, color: 0xFFFFFF },
	color: 0x650A5A,
	alpha: 0.20
}

// Parameter for all forces
let default_link_params = { 
	distance: 30,
	iterations: 1, 
	id: function(d){ return d.id; } 
};
let default_manybody_params = { strength: function() { return -30 }, distanceMin: 1, distanceMax: Infinity }
let default_center_params = { x: 0, y: 0 }
const default_sim_params = {
	alpha: 1, 
	force: { // < name > : { enabled: < boolean >, type: < force type >, params: { < force parameters > } }
	  charge: { enabled: true, type: "forceManyBody", params: default_manybody_params },
	  link: { enabled: true, type: "forceLink", params: default_link_params },
	  center: { enabled: true, type: "forceCenter", params: default_center_params }
	}
};

// Given a node, export its node style
export const current_ns = (node) => {
	let gd = node.graphicsData[0]
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
	let res = node_style;
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

// Meta-function for applying force settings on a d3 force simulation object
export const apply_force = (sim, params) => {
	forOwn(params, function(settings, forcename){
		if (settings.enabled){
			sim.force(forcename, d3_force[settings.type]()); // set up default force
			forOwn(settings.params, function(param_value, param_name){
				console.log(forcename.toString() + ": " + param_name.toString() + " = " + param_value.toString())
				sim.force(forcename)[param_name](param_value);
			})
		}
	})
	return sim
}

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
	})
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

// Create viewport
export const create_viewport = (app, sw, sh, ww=sw, wh=sh) => {
	var viewport = new Viewport({
		screenWidth: sw, 
		screenHeight: sh,
		worldWidth: ww, 
		worldHeight: wh,
		events: app.renderer.events,  // this changed; app must be initialized
		// stopPropagation: true, 
		// interaction: app.renderer.plugins.interaction
	});
	return(viewport);
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

// Simple function to color nodes w/ given style
// Stroke: https://pixijs.com/8.x/guides/migrations/v8
export const build_node = (node, ns = node_style) => {
	node.clear();
	node
		.circle(0, 0, ns.radius)
		.stroke({ width: ns.lineStyle.size, color: ns.lineStyle.color })
		.fill({ color: ns.color, alpha: ns.alpha})
		;
	return(node)
}

// lineStyle: { size: 1.5, color: 0xFFFFFF },
// color: 0x650A5A,
// radius: 6,
// alpha: 1
// export const update_node_style = (gfx, ns) => {
// 	var len = gfx.graphicsData.length;    
//   for (var i = 0; i < len; i++) {        
//     var data = gfx.graphicsData[i];
//     data.lineWidth = ns.lineWidth;        
//     data.lineColor = ns.color;        
//     data.alpha = ns.alpha;   
//     gfx.dirty++;        
//     gfx.clearDirty++;    
//   }   
// }

// export const set_node_style = (nodes, ns = node_style) => {
// 	if (ns.constructor === Array && ns.length == nodes.length){
// 		nodes.forEach((node, i) => { draw_node(node, Object.assign(node_style, ns[i])) })
// 	} else if (ns.constructor == Object){
// 		nodes.forEach((node) => { draw_node(node, Object.assign(node_style, ns)) })
// 	}
// }

// Draws the nodes according to the current style; adds them to 
export const build_nodes = (nodes, ns = node_style) => {
	if (ns.constructor === Array && ns.length == nodes.length){
		// console.log(ns[0])
		// console.log(default_ns(nodes[0]))
		// console.log(merge(default_ns(nodes[0]), ns[0]))
		nodes.forEach((node, i) => { build_node(node, merge(default_ns(node), ns[i])) })
	} else if (ns.constructor == Object){
		// https://pixijs.com/8.x/guides/components/graphics#the-graphicscontext
		let ns_new = merge(default_ns(node), ns);
		let ns_context = new GraphicsContext()
			.circle(0, 0, ns_new.radius)
			.stroke({ width: ns_new.lineStyle.size, color: ns_new.lineStyle.color })
			.fill({ color: ns_new.color, alpha: ns_new.alpha})
		;
		nodes.forEach((node) => { node.clear(); node.context = ns_context; });
		// nodes.forEach((node) => { build_node(node, ns_new) })
	}
}

// Optionally overrides the line style, then draws a single link. Does not call endFill. 
export const build_link = (link, link_gfx, ls = line_style) => {
	const { source, target } = link;
	link_gfx
		// .moveTo(source.x, source.y)
		// .lineTo(target.x, target.y)
		.stroke({ width: ls.lineWidth, color: ls.color });
	return(link)
}

// Draw Links according to a given styling, or default style otherwise
// If the supplied line style is an array, draw links with individual styles.
// otherwise if the supplied link style is an object, draws all links with that style.
export const build_links = (links, link_gfx, ls = line_style) => {
	if (ls.constructor === Array && ls.length == links.length){
		// console.log("Drawing lines as arrays")
		links.forEach((link, i) => { 
			build_link(link, link_gfx, merge(line_style, ls[i]));
		});
	} // o.w. draw every link with specified style
	else if (ls.constructor == Object){
		let new_ls = merge(line_style, ls);
		// link_gfx.clear();
		// links.forEach((link) => { 
		// 	const { source, target } = link;
		// 	link_gfx
		// 		.moveTo(source.x, source.y)
		// 		.lineTo(target.x, target.y)
		// 		// .stroke({ width: ls.lineWidth, color: ls.color })
		// });
		link_gfx.stroke({ width: new_ls.lineWidth, color: new_ls.color });
	}
}

// TODO: make this as optimized as possible
export const update_links = (links, link_gfx, ls = line_style) => {
	const new_ls = merge(line_style, ls);
	// const link_context = new GraphicsContext({ width: new_ls.lineWidth, color: new_ls.color });
	link_gfx.clear();
	links.forEach((link) => { 
		let { source, target } = link;
		link_gfx.moveTo(source.x, source.y).lineTo(target.x, target.y);
	});;
	link_gfx.stroke({ width: new_ls.lineWidth, color: new_ls.color });
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
// export const enable_drag = (dispatcher, pixi_obj) => {
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

// Update node.gfx positions w/ force node coordinates
export const update_node_coords = (nodes) => {
	let i, n = nodes.length;
	for (i = 0; i < n; ++i) {
		nodes[i].gfx.x = nodes[i].x;
		nodes[i].gfx.y = nodes[i].y;
	}
}

export const make_group = (nodes) => {
	let container = new Container();
	nodes.forEach((node) => { container.addChild(node); });
	// container.interactive = true; 
	return(container);
}

// Creates a new d3 force simulation 
export const force_sim = () => { return forceSimulation() }

// https://stackoverflow.com/questions/14488849/higher-dpi-graphics-with-html5-canvas
export const set_dpi = (canvas, dpi) => {
	// Set up CSS size.
	canvas.style.width = canvas.style.width || canvas.width + 'px';
	canvas.style.height = canvas.style.height || canvas.height + 'px';

	// Get size information.
	var scaleFactor = dpi / 96;
	var width = parseFloat(canvas.style.width);
	var height = parseFloat(canvas.style.height);

	// Backup the canvas contents.
	var oldScale = canvas.width / width;
	var backupScale = scaleFactor / oldScale;
	var backup = canvas.cloneNode(false);
	backup.getContext('2d').drawImage(canvas, 0, 0);

	// Resize the canvas.
	var ctx = canvas.getContext('2d');
	canvas.width = Math.ceil(width * scaleFactor);
	canvas.height = Math.ceil(height * scaleFactor);

	// Redraw the canvas image and scale future draws.
	ctx.setTransform(backupScale, 0, 0, backupScale, 0, 0);
	ctx.drawImage(backup, 0, 0);
	ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
}

// Applies default settings to force simulation
export function default_force_settings(sim, app, nodes, links){
	// console.log("arg len: "+arguments.length);
	// console.log(sim);
	if (arguments.length < 4){
		return default_sim_params;
	} else {
		const parent = app.canvas.parentNode;
		const width = parent.clientWidth, height = parent.clientHeight;
		let center = [ width/2, height/2 ]
		sim.nodes(nodes)
		apply_sim(sim, default_sim_params)
		apply_force(sim, default_sim_params.force)
		sim.force('center').x(center[0]).y(center[1]);
		sim.force('link').links(links);
	}
}

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

// Resolves link source and target nodes, replacing .source and .target integer ids with node graphics
export const resolve_links = (nodes, links) => {
	links.forEach((link) => {
		if (!(link.source instanceof Graphics)){
			link.source = nodes.find((node) => { return node.id == link.source });
		}
		if (!(link.target instanceof Graphics)){
			link.target = nodes.find((node) => { return node.id == link.target });
		}
	});
}

export const resolve_links_index = (nodes, links) => {
	links.forEach((link) => {
		link.source = nodes.findIndex((node) => { return node.id == link.source });
		link.target = nodes.findIndex((node) => { return node.id == link.target });
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

// export const start_lasso = (nodes, svg_el) => {
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
export const enable_drag_container = (container) => {
	container.interactive = true; 
	container.visible = true; 
	//console.log(container.getBounds());
	container.hitArea = container.getBounds();
	return(container);
}

// Puts a list of items accessed by 'acc' into a container
export const group_items = (items, acc = identity) => {
	let group = new Container();
	items.forEach((item) => { group.addChild(acc(item)); });
	return group;
}

class Pixiplex {
	constructor(width = 250, height = 250){
		this.width = width
		this.height = height
		this.nodes = null
		this.links = null
		this.polygons = null
		this.nodes_gfx = null
		this.links_gfx = null
		this.polygons_gfx = null;
		// this.sim = null
		// this.sim_params = null // the force simulation + parameters
	}
	
	// Should be called once. Creates members: 
	// - app 
	// - view
	async initialize_application(options){
		this.view = document.createElement('canvas');
		this.view.style.width = this.width + 'px'
		this.view.style.height = this.height + 'px'
		this.view.onwheel = function(event){ event.preventDefault(); };
		this.view.onmousewheel = function(event){ event.preventDefault(); };
		//- pn.set_dpi(view, 288);
		this.app = new Application();
		let app_params = {
			canvas: this.view,
			antialias: true, 
			backgroundColor: 0xffffff, 
			resolution: 1.2*devicePixelRatio, 
			//- resolution: 1.0,
			sharedTicker: true, 
			transparent: false,
			autoResize: true, 
			forceCanvas: false, // NOTE: this can force CPU? 
			autoStart: false // <- note the animation updates won't be immediate! 
		}
		await this.app.init(assign(app_params, options));
	}

	// Create a viewport to handle panning, dragging, etc.
	// for pixi v8, see: https://github.com/davidfig/pixi-viewport/issues/488. 
	// - vp 
	async initialize_viewport(){
		if (Object.hasOwn(this, "app")){
			this.vp = create_viewport(this.app, this.width, this.height);
			var vp_params = {
				clampZoom: { minWidth: this.width/5, maxWidth: this.width*5, minHeight: this.height/5, maxHeight: this.height*5 }
			}
			// Clam gets rid of panning !.clamp({ direction: 'all'})
			this.vp.drag().wheel(1e-3).clampZoom(vp_params.clampZoom).decelerate();		
			// this.app.stage.addChild(this.vp);
		}
	}
	
	// - ticker 
	// - dispatcher
	init_ticker(){
		const [ticker, dispatcher] = register_ticker(this.app, this.vp); // the (pixi) simulation tick
		this.ticker = ticker 				 // pixi.js ticker
		this.dispatcher = dispatcher // d3-dispatcher
	}

	
	// Initialize Graphics(); should be called after graph is initialized
	// Modifies the links in-place to point to nodes
	initialize_graphics(nodes, links){
		if (Object.hasOwn(this, "nodes") && Object.hasOwn(this, "links")){
			// First: add (x,y) coordinates to nodes, if not given, and scale them by the width/height
			scale_nodes(nodes, this.width, this.height)
			this.nodes_gfx = generate_node_graphics(nodes);
			
			// Populate the links with node graphic references
			resolve_links(this.nodes_gfx, links);
			this.links_gfx = generate_links_graphic();
			build_links(links, this.links_gfx);
		}
	}

	async initialize_graph(json_path){
		return d3.json(json_path).then((graph) => {
			// console.log(this)
			this.links = graph.links; 
			this.nodes = graph.nodes;
			this.initialize_graphics(this.nodes, this.links)
			console.log("nodes: ");
			console.log(this.nodes);
			console.log("links: ")
			console.log(this.links)
		});
	}

	// Register the dragging callbacks for the nodes
	enable_drag(){
		if (!Object.hasOwn(this, "nodes_gfx")){ return false; }

		// Make sure the viewport is interactive
		this.vp.interactive = true; 
		this.vp.visible = true; 
		this.vp.hitArea = this.vp.getBounds();
		
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


	enable_force(sim_options = {}){
		if (!Object.hasOwn(this, "sim")){ 
			console.log("Enabling force simulation");
			this.sim = forceSimulation(this.nodes_gfx); 
			this.sim.stop();
			this.sim.alpha(1.0); // no restart needed

			apply_sim(this.sim, default_sim_params)
			apply_force(this.sim, default_sim_params.force)
			this.sim.force('center').x(this.width / 2).y(this.height / 2);
			this.sim.force('link').links(this.links);
		} else {
			apply_sim(this.sim, sim_options)
			apply_force(this.sim, sim_options.force)
		}
		this.dispatcher.on("tick", () => { this.sim.tick(); })
		
		// Attach dispatchers for force events
		// force_drag(this.sim)(this.dispatcher);
	}

	disable_force(){
		this.dispatcher.on("tick", null);
	}

	// TODO: debug centering, experiment w/ different kinds of recenterings
	center_viewport(){
		const num_nodes = this.nodes_gfx.length;
		const mean_x = sum(this.nodes_gfx.map((node) => { return node.x; })) / num_nodes;
		const mean_y = sum(this.nodes_gfx.map((node) => { return node.y; })) / num_nodes;
		this.vp.moveCenter(mean_x, mean_y);
	}



}


export { select }
export { map, forOwn, remove, concat, filter, unionBy, unionWith, pullAllBy, pullAllWith, intersectionWith, differenceBy, differenceWith, transform, includes, isEmpty, merge, flatMap}
export { Application, Graphics, GraphicsContext, Polygon, Text, Ticker, Container }
export { Pixiplex }