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

async function initialize({ model }){
	console.log("--- Initializing widget ---")
	// Initialize pixi w/ canvas view 
	// const [app, vp] = await new_pixi(model.get("width"), model.get("height"));
	window.pn = pn; 
	this.pp = new pn.Pixiplex(model.get("width"), model.get("height"), 1.5);
	// await this.pp.initialize_application();
	// this.pp.app.resize(model.get("width"), model.get("height"))

	// this.pp.initialize_viewport();
	// this.pp.init_ticker();	
	// await pp.initialize_graph("data/les_miserables.json");
}

// anyWidget requires a render() that renders and initializes dynamic updates for the widget
// @param {{ model: DOMWidgetModel, el: HTMLElement }} context
async function render({ model, el }) {

	// Build the graph
	window.model = model;
	const nodes = model.get('node_ids').map((node_id) => { return {'id' : node_id} });
	const src_ids = model.get('src_ids');
	const tgt_ids = model.get('tgt_ids');
	const links = src_ids.map((s, i) => { return { 'source': s, 'target': tgt_ids[i] }; });

	// Default initialization + append canvas
	await this.pp.default_init(nodes, links);	
	window.pp = this.pp;
	el.appendChild(this.pp.app.canvas);

	// Setter callbacks
	model.on("change:node_color", () => {
		this.pp.build_nodes
	});


	model.on("msg:custom", (msg) => {
		console.log("Custom msg called");
		console.log(msg);
		
		if (msg.type == "msg:sync_node_coordinates"){
			model.set('_x', this.pp.nodes.map((node) => node.x));
			model.set('_y', this.pp.nodes.map((node) => node.y));
			model.save_changes();
		}
		else if (msg.type == "msg:center"){
			this.pp.center_graph(msg['fit'], msg['x'], msg['y']);
		} 
		else if (msg.type == "msg:init_graph"){

			console.log("initializing graph");
			
			// this.pp.initialize_graph_data(nodes, links);
			// pn.add_items(this.pp.vp, [this.pp.links_gfx]); // add links to stage
			// pn.add_items(this.pp.vp, this.pp.nodes_gfx);   // add nodes to stage
			// this.pp.ticker.add((ticker) => {
			// 	pn.update_links(this.pp.links, this.pp.links_gfx);
			// });

			// // Add the viewport, then start the ticker
			// this.pp.app.stage.addChild(this.pp.vp);
			// this.pp.ticker.start();
			
			// model.nodes = model.get('node_ids').map((node_id) => { return {'id' : node_id} });
			// this.pp.scale_nodes(model.nodes, WIDTH, HEIGHT); // this must happen before the node graphics are generated
			// nodes_gfx = this.pp.generate_node_graphics(model.nodes);
			// console.log(nodes_gfx)
			
			// pn.add_items(pp.vp, pp.nodes_gfx);   // add nodes to stage

			// this.pp.add_items(this.pp.vp, this.pp.nodes_gfx);   // add nodes to stage

		} else if (msg.type == "msg:init_force"){
			pp.init_force();
			pp.enable_force();
		} else if (msg.type == "msg:enable_force"){
			pp.enable_force();
			// Add force dragging emitter callbacks
			// this.pp.default_force_settings(sim, app, nodes_gfx, links);
			// nodes_gfx.forEach((node) => {
			// 	this.pp.compose(this.pp.pixi_drag(node), this.pp.force_drag(sim))(this.pp.drag_dispatcher(node));
			// });
		} else if (msg.type == "msg:center_graph"){
			this.pp.center_graph(false); // fit
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
