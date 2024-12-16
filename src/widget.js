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
	const app = new pn.Application();
	var view = document.createElement('canvas');
	view.style.width = width + 'px'
	view.style.height = height + 'px'
	await app.init({ 
		canvas: view,
		width: width, height: height, 
		background: '#ededed', 
		// resizeTo: window,
		sharedTicker: true, 
		autoResize: true, 
		antialias: true,
		autoDensity: true, 
		resolution: 1.2*devicePixelRatio,
		autoStart: false // <- note the animation updates won't be immediate! 
	});

	// Viewport
	var vp = pn.create_viewport(app, width, height);
	const sc = 3.0;
	var vp_params = {
		clampZoom: { minWidth: width/sc, maxWidth: width*sc, minHeight: height/sc, maxHeight: height*sc }
	}
	// Clamp gets rid of panning !.clamp({ direction: 'all'})
	vp
		.drag({wheel: false})
		.wheel({percent: 1e-3, interrupt: true })
		// .clamp({direction: 'all'})
		.clampZoom(vp_params.clampZoom)
		.decelerate()
	;

	// Enable dynamic resizing
	const resize = pn.enable_resize(app, vp);
	window.addEventListener('resize', resize); 	// Listen for window resize events

	// Disable regular window scrolling when hovered over canvas
	view.onwheel = function(event){ event.preventDefault(); };
	view.onmousewheel = function(event){ event.preventDefault(); };
	return [app, vp];
}

function on_x_change() {
	let x_new = model.get("x");
	console.log(`The 'x' changed to: ${x_new}`);
}

async function initialize({ model }){
	console.log("--- Initializing widget ---")
	// Initialize pixi w/ canvas view 
	const [app, vp] = await new_pixi(model.get("width"), model.get("height"));
	this.app = app
	this.vp = vp
}

// anyWidget requires a render() that renders and initializes dynamic updates for the widget
// @param {{ model: DOMWidgetModel, el: HTMLElement }} context
async function render({ model, el }) {
	console.log("this: ");
	console.log(this);

	const WIDTH = this.app.canvas.clientWidth;
	const HEIGHT = this.app.canvas.clientHeight;

	console.log("model: ");
	console.log(model);

	el.appendChild(this.app.canvas);
	this.app.stage.addChild(this.vp);

	//- pn.set_dpi(view, 288);

	// Add the canvas to the widget element
	console.log("Canvas view: ");
	console.log(this.app.canvas);
	
	console.log("Widget element: ");
	console.log(el)
	
	console.log("pixiplex app: ");
	console.log(pn);

	console.log("viewport: ");
	console.log(this.vp)

	model.on("msg:custom", (msg) => {
		console.log("Custom msg called");
		console.log(msg);
		
		if (msg.type == "msg:init_nodes"){
			console.log("initializing nodes")
			model.nodes = model.get('node_ids').map((node_id) => { return {'id' : node_id} });
			pn.scale_nodes(model.nodes, WIDTH, HEIGHT); // this must happen before the node graphics are generated
			nodes_gfx = pn.generate_node_graphics(model.nodes);
			console.log(nodes_gfx)

		} else if (msg.type == "msg:init_links"){
			// Generate link graphics first
			links_gfx = pn.generate_links_graphic();
			console.log(links_gfx);	
		
			// Assign actual source and target node references
			pn.resolve_links(nodes_gfx, links);
			console.log("links: ")
			console.log(links)
			pn.draw_links(links, links_gfx);

		} else if (msg.type == "msg:init_force"){
			model.sim = pn.force_sim();
			model.sim.stop();
			model.sim.alpha(1.0); // no restart needed
			dispatcher.on("tick", function(){ sim.tick(); });
		} else if (msg.type == "msg:enable_force"){
			// Add force dragging emitter callbacks
			pn.default_force_settings(sim, app, nodes_gfx, links);
			nodes_gfx.forEach((node) => {
				pn.compose(pn.pixi_drag(node), pn.force_drag(sim))(pn.drag_dispatcher(node));
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
