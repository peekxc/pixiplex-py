// pixinet.js 
// Contains utilities for making PIXI-driven force-directed network 

// import * as PIXI from 'pixi.js';
import { Application, Graphics, Polygon, Text, Container, Ticker, GraphicsContext } from 'pixi.js'
import { Viewport } from 'pixi-viewport';

import { selection } from 'd3-selection';
import * as d3_force from 'd3-force';
// import lasso from './lasso.js';
import { assign, forOwn, map, remove, concat, filter, unionBy, pullAllBy, pullAllWith, intersectionWith, unionWith, differenceBy, differenceWith, transform, includes, isFunction, isEmpty, merge, flatMap, sum, fromPairs, sortedIndexBy } from 'lodash-es';

import { combinations, range, identity, compose, clean, read_text_file } from './core/utils.js';
import { make_scale, scale_nodes, resolve_links, remove_nodes, insert_nodes, create_graph_namespace } from './core/graph.js';
import { NODE_STYLE, LINE_STYLE, POLYGON_STYLE, default_node_styles, current_ns, default_ns, build_nodes, build_links, generate_links_graphics, generate_polygon_graphics, generate_node_graphics, generate_links_graphic, build_polygon, build_polygons } from './core/styles.js';
import { apply_sim, serialize_force, FORCE_PARAMS, force_sim } from './core/simulation.js';
import { register_ticker, clear_stage, add_items, enable_interactive, disable_interactive, make_group } from './core/viewport.js';
import { register_tick_stops, drag_dispatcher, pixi_drag, force_drag, enable_resize, enable_lasso, group_items } from './core/interaction.js';
// import * as EventEmitter from 'eventemitter3';
// import { loadPyodide } from 'pyodide';
// Can also be passed into the renderer directly e.g `autoDetectRenderer({resolution: 1})`
// AbstractRenderer.defaultOptions.resolution = 5.0;

export {
	combinations,
	range,
	identity,
	compose,
	clean,
	serialize_force,
	FORCE_PARAMS,
	make_scale,
	scale_nodes,
	resolve_links,
	remove_nodes,
	insert_nodes,
	create_graph_namespace,
	NODE_STYLE,
	LINE_STYLE,
	POLYGON_STYLE,
	default_node_styles,
	current_ns,
	default_ns,
	build_nodes,
	build_links,
	generate_node_graphics,
	generate_links_graphic,
	generate_links_graphics,
	generate_polygon_graphics,
	build_polygon,
	build_polygons,
	apply_sim,
	force_sim,
	register_ticker,
	clear_stage,
	add_items,
	enable_interactive,
	disable_interactive,
	make_group,
	register_tick_stops,
	drag_dispatcher,
	pixi_drag,
	force_drag,
	enable_resize,
	enable_lasso,
	group_items,
	read_text_file,
};

// Parameter for all forces
let _default_link_params = {
	distance: 30,
	iterations: 1, 
	id: function(d){ return d.id; } 
};

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
		this._recompute_degree();
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
		this._graph_api = null;
	}

	graph(){
		const stale_graph_api = this._graph_api
			&& (
				typeof this._graph_api.nodes !== "function"
				|| typeof this._graph_api.edges !== "function"
				|| typeof this._graph_api.replace !== "function"
			);
		if (!this._graph_api || stale_graph_api){
			this._graph_api = create_graph_namespace(this);
		}
		return this._graph_api;
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

	_recompute_degree(){
		const max_id = this.nodes.reduce((acc, node) => {
			if (typeof node?.id === "number"){
				return Math.max(acc, node.id);
			}
			return acc;
		}, -1);
		this.degree = Array(Math.max(this.nodes.length, max_id + 1)).fill(0);
		this.links.forEach((link) => {
			const source_id = (link?.source && typeof link.source === "object") ? link.source.id : link?.source;
			const target_id = (link?.target && typeof link.target === "object") ? link.target.id : link?.target;
			if (typeof source_id === "number"){ this.degree[source_id] = (this.degree[source_id] || 0) + 1; }
			if (typeof target_id === "number"){ this.degree[target_id] = (this.degree[target_id] || 0) + 1; }
		});
	}

	_clear_graphics(){
		if (!this.vp){ return; }
		const remove_list = [];
		const collect = (item) => {
			if (!item){ return; }
			if (Array.isArray(item)){
				item.forEach((entry) => collect(entry));
				return;
			}
			remove_list.push(item);
		};
		collect(this.links_gfx);
		collect(this.nodes_gfx);
		remove_list.forEach((gfx) => {
			try { this.vp.removeChild(gfx); } catch (_) {}
			try { gfx.destroy?.(); } catch (_) {}
		});
		this.links_gfx = null;
		this.nodes_gfx = null;
	}

	_get_link_endpoint_id(link, key){
		const endpoint = link?.[key];
		if (endpoint && typeof endpoint === "object"){
			return endpoint.id;
		}
		return endpoint;
	}

	set_drag_enabled(enabled = true){
		if (!Object.hasOwn(this, "nodes_gfx")){ return false; }

		if (!enabled){
			if (!this._drag_enabled){ return false; }
			if (this._drag_handlers){
				this.vp.off('pointerup', this._drag_handlers.on_drag_end);
				this.vp.off('pointerupoutside', this._drag_handlers.on_drag_end);
				this.vp.off('pointermove', this._drag_handlers.on_drag_move);
			}
			if (this._drag_target){
				this._drag_target.fx = null;
				this._drag_target.fy = null;
				this._drag_target = null;
			}
			this.nodes_gfx.forEach((node) => {
				if (this._drag_handlers){
					node.off("pointerdown", this._drag_handlers.on_drag_start);
				}
				node.interactive = false;
			});
			this._drag_enabled = false;
			return false;
		}

		if (this._drag_enabled){ return true; }
		this.vp.interactive = true;
		this.vp.visible = true;

		if (!this._drag_handlers){
			let viewport = this.vp;
			let sim = this.sim;

			const on_drag_move = (event) => {
				if (this._drag_target) {
					this._drag_target.parent.toLocal(event.global, null, this._drag_target.position);
					this._drag_target.fx = this._drag_target.position.x;
					this._drag_target.fy = this._drag_target.position.y;
				}
			};

			const on_drag_start = function(){
				viewport.plugins.get("drag").pause();
				this._pixiplex.set_force_enabled(true);
				this._pixiplex._drag_target = this;
				viewport.on('pointermove', on_drag_move);

				this._pixiplex._drag_target.fx = this._pixiplex._drag_target.x;
				this._pixiplex._drag_target.fy = this._pixiplex._drag_target.y;
				sim?.alphaTarget(0.3)?.restart();
			};

			const on_drag_end = () => {
				if (this._drag_target){
					sim?.alphaTarget(0);
					this._drag_target.fx = null;
					this._drag_target.fy = null;
					viewport.off('pointermove', on_drag_move);
					this._drag_target = null;
				}
				viewport.plugins.get("drag").resume();
			};

			this._drag_handlers = { on_drag_start, on_drag_move, on_drag_end };
		}

		this.vp.on('pointerup', this._drag_handlers.on_drag_end);
		this.vp.on('pointerupoutside', this._drag_handlers.on_drag_end);
		this.nodes_gfx.forEach((node) => {
			node._pixiplex = this;
			node.interactive = true;
			node.on("pointerdown", this._drag_handlers.on_drag_start);
		});
		this._drag_enabled = true;
		return true;
	}

	set_force_enabled(enabled = true){
		if (!Object.hasOwn(this, "sim") || !this.dispatcher){ return false; }
		if (!enabled){
			this.dispatcher.on("tick.force", null);
			this.sim?.alphaTarget(0);
			return false;
		}

		this.dispatcher.on("tick.force", () => {
			this.sim.tick();
			const settled = this.sim.alpha() <= (this.sim.alphaMin() + 0.0025);
			if (settled){
				this.set_force_enabled(false);
				this.sim.stop();
			}
		});
		return true;
	}

	set_force(name, type_or_settings, params = {}, options = {}){
		if (!Object.hasOwn(this, "sim")){ return false; }
		let type = type_or_settings;
		let resolved_params = params;
		let enabled = options.enabled ?? true;

		if (type_or_settings && typeof type_or_settings === "object"){
			type = type_or_settings.type;
			enabled = type_or_settings.enabled ?? enabled;
			resolved_params = type_or_settings.params || type_or_settings;
		}

		if (!enabled){
			this.remove_force(name);
			return true;
		}

		if (type === "forceCenter"){
			this.force_center(name, resolved_params.x, resolved_params.y);
		} else if (type === "forceManyBody"){
			this.force_manybody(name, resolved_params.strength, resolved_params.theta, resolved_params.distanceMin, resolved_params.distanceMax);
		} else if (type === "forceLink"){
			this.force_link(name, resolved_params.distance, resolved_params.strength, resolved_params.iterations);
		} else if (type === "forceCollide"){
			this.force_collide(name, resolved_params.radius, resolved_params.strength, resolved_params.iterations);
		} else if (type === "forceRadial"){
			this.force_radial(name, resolved_params.radius, resolved_params.x, resolved_params.y, resolved_params.strength);
		} else if (type === "forceX"){
			this.force_x(name, resolved_params.x, resolved_params.strength);
		} else if (type === "forceY"){
			this.force_y(name, resolved_params.y, resolved_params.strength);
		} else {
			console.log("Unknown force type", type, "for", name);
			return false;
		}
		return true;
	}

	set_forces(force_map, options = {}){
		if (!Object.hasOwn(this, "sim")){ return false; }
		forOwn(force_map, (settings, force_name) => {
			if (settings && typeof settings === "object" && Object.hasOwn(settings, "type")){
				this.set_force(force_name, settings, settings.params || settings, options);
			} else {
				console.log("Invalid force config for", force_name, settings);
			}
		});
		return this.sim;
	}

	set_graph_data(nodes = [], links = [], options = {}){
		const clone = options.clone ?? true;
		const next_nodes = clone ? nodes.map((node) => ({ ...node })) : nodes;
		const next_links = clone
			? links.map((link) => ({
				...link,
				source: this._get_link_endpoint_id(link, "source"),
				target: this._get_link_endpoint_id(link, "target"),
			}))
			: links;

		this.nodes = next_nodes;
		this.links = next_links;
		this._recompute_degree();

		if (this._init_state !== "ready"){
			return this;
		}

		this.set_drag_enabled(false);
		this.set_force_enabled(false);
		this.sim?.stop();
		delete this.sim;
		this.force_registry = {};

		if (this._renderer && typeof this._renderer.destroy === "function"){
			try { this._renderer.destroy(); } catch (_) {}
		}

		this._clear_graphics();
		this._init_graphics(this.nodes, this.links);

		if (this._renderer && typeof this._renderer.add_to_viewport === "function"){
			this._renderer.add_to_viewport(this.vp);
		} else {
			add_items(this.vp, this.links_gfx);
			add_items(this.vp, this.nodes_gfx);
		}

		this._init_force();
		if (options.center ?? true){
			this.center_graph(true);
		}
		if (options.drag ?? false){
			this.set_drag_enabled(true);
		}
		return this;
	}

	patch_graph_data(patch = {}, options = {}){
		const {
			add_nodes = [],
			remove_node_ids = [],
			add_links = [],
			remove_links = [],
		} = patch;

		const remove_ids = new Set(remove_node_ids);
		const node_map = new Map(this.nodes.map((node) => [node.id, { ...node }]));
		remove_ids.forEach((id) => node_map.delete(id));
		add_nodes.forEach((node) => node_map.set(node.id, { ...node }));

		const to_key = (source, target) => `${source}::${target}`;
		const remove_link_keys = new Set(remove_links.map((link) =>
			to_key(this._get_link_endpoint_id(link, "source"), this._get_link_endpoint_id(link, "target"))
		));

		const next_links = this.links
			.map((link) => ({
				...link,
				source: this._get_link_endpoint_id(link, "source"),
				target: this._get_link_endpoint_id(link, "target"),
			}))
			.filter((link) => !remove_ids.has(link.source) && !remove_ids.has(link.target))
			.filter((link) => !remove_link_keys.has(to_key(link.source, link.target)));

		add_links.forEach((link) => {
			next_links.push({
				...link,
				source: this._get_link_endpoint_id(link, "source"),
				target: this._get_link_endpoint_id(link, "target"),
			});
		});

		return this.set_graph_data(Array.from(node_map.values()), next_links, options);
	}

	focus_nodes(node_ids = [], options = {}){
		if (!node_ids.length || !this.vp){ return false; }
		const id_set = new Set(node_ids);
		const sim_nodes = this._renderer && typeof this._renderer.get_simulation_nodes === "function"
			? this._renderer.get_simulation_nodes()
			: (this.nodes_gfx || []);
		const selected = sim_nodes.filter((node) => id_set.has(node.id));
		if (!selected.length){ return false; }

		const mean_x = sum(selected.map((node) => node.x)) / selected.length;
		const mean_y = sum(selected.map((node) => node.y)) / selected.length;
		const c_x = this.vp.worldWidth / 2;
		const c_y = this.vp.worldHeight / 2;

		this.sim?.stop();
		sim_nodes.forEach((node) => {
			node.x += (c_x - mean_x);
			node.y += (c_y - mean_y);
		});
		if (options.fit ?? true){
			this.vp.fit();
		}
		this.sim?.restart();
		return true;
	}

		destroy(){
		this.set_drag_enabled(false);
		this.set_force_enabled(false);
		this.sim?.stop();

		if (this._renderer && typeof this._renderer.destroy === "function"){
			try { this._renderer.destroy(); } catch (_) {}
		}

		if (this.ticker){
			try { this.ticker.stop(); } catch (_) {}
		}

		this._clear_graphics();

		if (this.app){
			try { this.app.destroy(true, { children: true }); } catch (_) {}
		}

		delete this.app;
		delete this.vp;
		delete this.view;
		delete this.ticker;
		delete this.dispatcher;
		delete this.sim;
		this._drag_target = null;
		this._drag_handlers = null;
		this._drag_enabled = false;
		this._init_state = "idle";
		this._init_promise = null;
		this._init_error = null;
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
				if (drag) { this.set_drag_enabled(true); }
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
			this.sim = d3_force.forceSimulation(this.nodes_gfx); 
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
		this.set_force_enabled(true);
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
		this.sim.force(name, d3_force.forceCenter(xc, yc)); // register the center force
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
		let link_force = d3_force.forceLink(this.links).id((d) => d.id);
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
		let nbody_force = d3_force.forceManyBody();
		nbody_force.strength(strength || -30);
		nbody_force.theta(theta || 0.90);
		nbody_force.distanceMin(distanceMin ?? 1.0);
		nbody_force.distanceMax(distanceMax ?? Infinity);
		this.sim.force(name, nbody_force); // register the link force
		this._register_force(name, "forceManyBody");
	}

	force_collide(name = "collide", radius = undefined, strength = undefined, iterations = undefined){
		let collide_force = d3_force.forceCollide(radius ?? 1.0);
		if (strength !== undefined){
			collide_force.strength(strength);
		}
		if (iterations !== undefined){
			collide_force.iterations(iterations);
		}
		this.sim.force(name, collide_force);
		this._register_force(name, "forceCollide");
	}

	force_x(name = "x", x = undefined, strength = undefined){
		let x_force = d3_force.forceX();
		x_force.x(x || this.width / 2);
		x_force.strength(strength || 0.1);
		this.sim.force(name, x_force);
		this._register_force(name, "forceX");
	}

	force_y(name = "y", y = undefined, strength = undefined){
		let y_force = d3_force.forceY();
		y_force.y(y || this.height / 2);
		y_force.strength(strength || 0.1);
		this.sim.force(name, y_force);
		this._register_force(name, "forceY");
	}

	force_radial(name = "ra", radius = undefined, x = undefined, y = undefined, strength = undefined){
		let radial_force = d3_force.forceRadial();
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
		return this.set_forces(params);
	}
}

// Export statements for utility functions and classes
export { Pixiplex }
// export { loadPyodide }


// link_force.strength(strength || )
	// forOwn(params, (param_value, param_name) => {
	// 	console.log(name.toString() + ": " + param_name.toString() + " = " + param_value.toString())
	// 	link_force[param_name](param_value);			
	// })
