// import "./widget.css";
// import { Application, Sprite, Assets } from 'pixi.js';
// import { selection, select } from 'd3-selection';
// import { scaleLinear } from 'd3-scale';
// import { polygonContains } from 'd3-polygon';
// import { dispatch } from 'd3-dispatch';
// import { forOwn, map, remove, concat, filter, unionBy, pullAllBy, pullAllWith, intersectionWith, unionWith, differenceBy, differenceWith, transform, includes, isFunction, isEmpty, merge, flatMap } from 'lodash-es';
// import { forceCenter, forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation, forceX, forceY } from 'd3-force';
// import * as d3_force from 'd3-force';
// import * as EventEmitter from 'eventemitter3';
// import 'src/pixinet.js';
import * as pn from "./pixinet.js"

async function new_pixi(width = 200, height = 200){
	// const app = new pn.Application();
	// var view = document.createElement('canvas');
	// view.style.width = width + 'px'
	// view.style.height = height + 'px'
	// await app.init({ 
	// 	canvas: view,
	// 	width: width, height: height, 
	// 	background: '#ededed', 
	// 	// resizeTo: window,
	// 	sharedTicker: true, 
	// 	autoResize: true, 
	// 	antialias: true,
	// 	autoDensity: true, 
	// 	resolution: 1.2*devicePixelRatio,
	// 	autoStart: false // <- note the animation updates won't be immediate! 
	// });

	// // Viewport
	// var vp = pn.create_viewport(app, width, height);
	// const sc = 3.0;
	// var vp_params = {
	// 	clampZoom: { minWidth: width/sc, maxWidth: width*sc, minHeight: height/sc, maxHeight: height*sc }
	// }
	// // Clamp gets rid of panning !.clamp({ direction: 'all'})
	// vp
	// 	.drag({wheel: false})
	// 	.wheel({percent: 1e-3, interrupt: true })
	// 	// .clamp({direction: 'all'})
	// 	.clampZoom(vp_params.clampZoom)
	// 	.decelerate()
	// ;

	// Enable dynamic resizing
	// const resize = pn.enable_resize(app, vp);
	// window.addEventListener('resize', resize); 	// Listen for window resize events

	// // Disable regular window scrolling when hovered over canvas
	// view.onwheel = function(event){ event.preventDefault(); };
	// view.onmousewheel = function(event){ event.preventDefault(); };
	// return [app, vp];
}

function on_x_change() {
	let x_new = model.get("x");
	console.log(`The 'x' changed to: ${x_new}`);
}

async function initialize({ model }){
	console.log("--- Initializing widget ---")
	// Initialize pixi w/ canvas view 
	// const [app, vp] = await new_pixi(model.get("width"), model.get("height"));
	window.pn = pn; 
	this.pp = new pn.Pixiplex(model.get("width"), model.get("height"), 1.0);
	await this.pp.initialize_application();
	// this.pp.app.resize(model.get("width"), model.get("height"))
	this.pp.app.resize(model.get("width"), model.get("height"));

	this.pp.initialize_viewport();
	this.pp.init_ticker();
	
	// await pp.initialize_graph("data/les_miserables.json");
}

// anyWidget requires a render() that renders and initializes dynamic updates for the widget
// @param {{ model: DOMWidgetModel, el: HTMLElement }} context
async function render({ model, el }) {
	console.log("this: ");
	console.log(this);
	window.model = model;

	console.log("pp");
	console.log(this.pp);
	window.pp = this.pp;

	console.log("app");
	console.log(this.pp.app);

	console.log("model: ");
	console.log(model);

	console.log("the damned canvas")
	console.log(this.pp.app.canvas);
	// this.pp.app.canvas.width = 400;
	// this.pp.app.canvas.height = 400;
	el.appendChild(this.pp.app.canvas);
	
	// await this.pp.initialize_graph("data/les_miserables.json");
	// this.pp.ticker.add((ticker) => {
	// 	pn.update_links(pp.links, pp.links_gfx);
	// });
	// pn.add_items(this.pp.vp, [this.pp.links_gfx]); // add links to stage
	// pn.add_items(this.pp.vp, this.pp.nodes_gfx);   // add nodes to stage

	model.on("msg:custom", (msg) => {
		console.log("Custom msg called");
		console.log(msg);
		
		if (msg.type == "msg:init_graph"){
			console.log("initializing graph");
			const nodes = model.get('node_ids').map((node_id) => { return {'id' : node_id} });
			const src_ids = model.get('src_ids');
			const tgt_ids = model.get('tgt_ids');
			const links = src_ids.map((s, i) => { return { 'source': s, 'target': tgt_ids[i] }; });
			this.pp.initialize_graph_data(nodes, links);
			pn.add_items(this.pp.vp, [this.pp.links_gfx]); // add links to stage
			pn.add_items(this.pp.vp, this.pp.nodes_gfx);   // add nodes to stage
			this.pp.ticker.add((ticker) => {
				pn.update_links(this.pp.links, this.pp.links_gfx);
			});
			console.log("stage: ")
			console.log(this.pp.app.stage);

			// Add the viewport, then start the ticker
			this.pp.app.stage.addChild(this.pp.vp);
			this.pp.ticker.start();
			
			// model.nodes = model.get('node_ids').map((node_id) => { return {'id' : node_id} });
			// this.pp.scale_nodes(model.nodes, WIDTH, HEIGHT); // this must happen before the node graphics are generated
			// nodes_gfx = this.pp.generate_node_graphics(model.nodes);
			// console.log(nodes_gfx)
			
			// pn.add_items(pp.vp, pp.nodes_gfx);   // add nodes to stage

			// this.pp.add_items(this.pp.vp, this.pp.nodes_gfx);   // add nodes to stage

		} else if (msg.type == "msg:init_force"){
			pp.init_force();
			pp.enable_force();
		} else if (msg.type == "msg:init_force"){
			model.sim = pn.force_sim();
			model.sim.stop();
			model.sim.alpha(1.0); // no restart needed
			dispatcher.on("tick", function(){ sim.tick(); });
		} else if (msg.type == "msg:enable_force"){
			// Add force dragging emitter callbacks
			this.pp.default_force_settings(sim, app, nodes_gfx, links);
			nodes_gfx.forEach((node) => {
				this.pp.compose(this.pp.pixi_drag(node), this.pp.force_drag(sim))(this.pp.drag_dispatcher(node));
			});
		}
	})


	// console.log("Model: ");
	// console.log(model)
	// console.log("el: ");
	// console.log(el)

	// const app = await start_pixi(200, 200);
	// console.log("app: ");
	// console.log(app)
	
	// el.appendChild(app.canvas);
	// model.on("change:my_value", on_change);

	// // TODO make logging div 
	// const logDiv = document.createElement("div");
	// logDiv.style.cssText = "max-height: 100px; overflow-y: auto; border: 1px solid black; padding: 5px;";
	// el.appendChild(logDiv);
}

export default { initialize, render };
