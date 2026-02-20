import * as pn from "./pixinet.js"


export const WIDGET_MESSAGES = {
	SYNC_MODEL: "msg:sync_model",
	SYNC_NODE_COORDINATES: "msg:sync_node_coordinates",
	CENTER: "msg:center",
};


function sync_coordinates(model, pp){
	model.set('_x', pp.nodes.map((node) => node.x));
	model.set('_y', pp.nodes.map((node) => node.y));
	model.save_changes()
}

function sync_model(model, pp){
	// pp.sync_forces(); // synchronizes d3-force force parameters to pp.force_params
	model.set('_x', pp.nodes.map((node) => node.x));
	model.set('_y', pp.nodes.map((node) => node.y));
	model.set('node_color', pp.nodes_gfx.map((node) => node.fillStyle.color.toString(16)));
	model.set('node_radii', pp.nodes_gfx.map((node) => node.width/2.0));
	console.log("Current pp Force params: ", pp.force_params);
	// model.set('forces', {
	// 	'charge' : { 'strength' : -30 } // todo: check this
	// });
	// model.set('forces', pp.force_params); // serialization error
	// console.log(model.get('forces'));
	// console.log("SAVING FORCES")
	// model.set('forces', { center: pp.force_params['center'], what: (a) => { return a; } });
	model.save_changes();
}

/**
 * Initializes browser-side widget globals.
 *
 * @param {{ model: object }} context - anywidget initialization context.
 * @param {object} context.model - Traitlet-backed model instance.
 * @returns {Promise<void>}
 */
async function initialize({ model }){
	console.log("--- Initializing widget ---")
	console.log(model.get("width"), model.get("height"));
	window.pn = pn; 
}

/**
 * Renders the widget and wires model -> scene synchronization callbacks.
 *
 * @param {{ model: object, el: HTMLElement }} context - anywidget render context.
 * @param {object} context.model - Traitlet-backed model instance.
 * @param {HTMLElement} context.el - Host DOM element.
 * @returns {Promise<void>}
 */
async function render({ model, el }) {

	// Build the graph from the model
	window.model = model;
	console.log("model: ", model);
	const nodes = model.get('node_ids').map((node_id) => { return {'id' : node_id} });
	const src_ids = model.get('src_ids');
	const tgt_ids = model.get('tgt_ids');
	const links = src_ids.map((s, i) => { return { 'source': s, 'target': tgt_ids[i] }; });

	// Initialize the base instance
	let pp = new pn.Pixiplex(nodes, links, model.get("width"), model.get("height"), model.get("scale"), model.get("forces"));
	await pp.init_all();	
	window.pp = pp;
	el.appendChild(pp.view);


	// Add callback to always synchronize coordinates to Python side when the simulation ends
	pp.sim?.on("end", () => sync_coordinates(model, pp));

	// Traitlet setter callbacks
	model.on("change:node_color", () => {
		console.log("Node color callback called");
		const node_color = model.get("node_color");
		const ns = pp.nodes.map((node, i) => ({ ...pp.node_style, color: node_color[i] }));
		pn.build_nodes(pp.nodes_gfx, ns);
	});

	model.on("change:node_radii", () => {
		console.log("Node radii callback called");
		const node_radii = model.get("node_radii");
		const ns = pp.nodes.map((node, i) => ({ ...pp.node_style, radius: node_radii[i] }));
		pn.build_nodes(pp.nodes_gfx, ns);
	});

	model.on("change:forces", () => {
		console.log("Forces callback called!");
		const forces = model.get("forces");
		console.log("Model forces: ", forces);
		pp.apply_force(forces);
	});

	model.on("msg:custom", (msg) => {
		if (msg.type == "msg:sync_model"){
			console.log("Syncing model forces")
			sync_model(model, pp);
			console.log("Model forces: ", model.forces, model.get("forces"))
		}
		else if (msg.type == "msg:sync_node_coordinates"){
			model.set('_x', pp.nodes.map((node) => node.x));
			model.set('_y', pp.nodes.map((node) => node.y));
			model.save_changes(); // NOTE: this is unreliable
		}
		else if (msg.type == "msg:center"){
			pp.center_graph(msg['fit'], msg['x'], msg['y']);
		} 
		else {
			console.log("Invalid message: ", msg);
		}
	})
}

export default { initialize, render };
