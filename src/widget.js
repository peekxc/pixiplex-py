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

async function start_pixi(width = 200, height = 200){
	const app = new pn.Application();
    var view = document.createElement('canvas');
	view.style.width = width + 'px'
	view.style.height = height + 'px'
	await app.init({ 
		canvas: view,
		width: width, height: height, 
		background: '#ededed', 
		// resizeTo: window,
		autoResize: true, 
        antialias: true,
        autoDensity: true, 
        resolution: 2*devicePixelRatio,
		autoStart: true // <- note the animation updates won't be immediate! 
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

// anyWidget requires a render() that renders and initializes dynamic updates for the widget
// @param {{ model: DOMWidgetModel, el: HTMLElement }} context
async function render({ model, el }) {

	// Initialize pixi w/ canvas view 
	const [app, vp] = await start_pixi(250, 250);
	//- pn.set_dpi(view, 288);

	// Add the canvas to the widget element
	el.appendChild(app.canvas);
    console.log("Canvas view: ");
    console.log(app.canvas);
    
    console.log("Widget element: ");
    console.log(el)
    
    console.log("pixiplex app: ");
    console.log(pn);

    console.log("viewport: ");
    console.log(vp)
   
    var graph = {
      "nodes": [
        {"id": "Myriel", "group": 1},
        {"id": "Napoleon", "group": 1},
        {"id": "Mlle.Baptistine", "group": 1},
        {"id": "Mme.Magloire", "group": 1},
        {"id": "CountessdeLo", "group": 1},
        {"id": "Geborand", "group": 1}
      ]
    }
    var nodes = pn.generate_node_graphics(graph.nodes);
    
    app.stage.addChild(vp);
    pn.stage_items(vp, nodes);

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

export default { render };
