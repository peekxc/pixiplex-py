import * as pn from "./pixinet.js"

function sync_coordinates(model, pp){
	model.set('_x', pp.nodes.map((node) => node.x));
	model.set('_y', pp.nodes.map((node) => node.y));
	model.save_changes()
}

async function initialize({ model }){
	console.log("--- Initializing widget ---")
	console.log(model.get("width"), model.get("height"));
	// Initialize pixi w/ canvas view 
	// const [app, vp] = await new_pixi(model.get("width"), model.get("height"));
	window.pn = pn; 
	// pp = new pn.Pixiplex(model.get("width"), model.get("height"), model.get("scale"));
	// await pp.initialize_application();
	// pp.app.resize(model.get("width"), model.get("height"))

	// pp.initialize_viewport();
	// pp.init_ticker();	
	// await pp.initialize_graph("data/les_miserables.json");
}

// anyWidget requires a render() that renders and initializes dynamic updates for the widget
// @param {{ model: DOMWidgetModel, el: HTMLElement }} context
async function render({ model, el }) {

	let pp = new pn.Pixiplex(model.get("width"), model.get("height"), model.get("scale"));

	// Build the graph
	window.model = model;
	const nodes = model.get('node_ids').map((node_id) => { return {'id' : node_id} });
	const src_ids = model.get('src_ids');
	const tgt_ids = model.get('tgt_ids');
	const links = src_ids.map((s, i) => { return { 'source': s, 'target': tgt_ids[i] }; });

	// Default initialization + append canvas
	await pp.default_init(nodes, links);	
	window.pp = pp;
	el.appendChild(pp.app.canvas);

	// Add callback to sync coordinates when the simulation ends
	pp.sim?.on("end", () => sync_coordinates(model, pp));

	// Traitlet attribute setter callbacks
	model.on("change:node_color", () => {
		console.log("Node color callback called");
		const node_color = model.get("node_color");
		const ns = pp.nodes.map((node, i) => ({ ...pp.node_style, color: node_color[i] }));
		pn.build_nodes(pp.nodes_gfx, ns);
	});

	model.on("change:node_value", () => {
		console.log(`Value ${model.get("node_value")} change callback called`);
	});

	model.on("change:forces", () => {
		console.log("Node forces change callback called");
		const forces = model.get("forces");
		console.log(forces);
		apply_force(pp.sim, forces);
	});

	model.on("msg:custom", (msg) => {
		console.log("Custom msg called");
		console.log(msg);
		
		if (msg.type == "msg:synchronize"){
			model.set('_x', pp.nodes.map((node) => node.x));
			model.set('_y', pp.nodes.map((node) => node.y));

			// TODO: collect the force parameters into a a dictionary 
			// model.set('forces', pp.nodes.map((node) => node.x));
			// model.set('_y', pp.nodes.map((node) => node.y));
			model.save_changes();
		}
		else if (msg.type == "msg:sync_node_coordinates"){
			model.set('_x', pp.nodes.map((node) => node.x));
			model.set('_y', pp.nodes.map((node) => node.y));
			model.save_changes();
		}
		else if (msg.type == "msg:center"){
			pp.center_graph(msg['fit'], msg['x'], msg['y']);
		} 
		else if (msg.type == "msg:apply_forces"){
			// const forces = model.get("forces");
			// console.log(forces);
			pn.apply_force(pp.sim, msg['params']);
		}
		else if (msg.type == "msg:init_force"){
			pp.init_force();
			pp.enable_force();
		} 
		else if (msg.type == "msg:enable_force"){
			pp.enable_force();
		} 
		else {
			console.log("Invalid message: ", msg);
		}
	})
}

export default { initialize, render };
