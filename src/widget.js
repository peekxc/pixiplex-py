import * as pn from "./pixinet.js"

function sync_coordinates(model, pp){
	model.set('_x', pp.nodes.map((node) => node.x));
	model.set('_y', pp.nodes.map((node) => node.y));
	model.save_changes()
}

async function initialize({ model }){
	console.log("--- Initializing widget ---")
	// Initialize pixi w/ canvas view 
	// const [app, vp] = await new_pixi(model.get("width"), model.get("height"));
	window.pn = pn; 
	this.pp = new pn.Pixiplex(model.get("width"), model.get("height"), model.get("scale"));
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

	// Sync coordinates when the simulation ends
	this.pp.sim?.on("end", () => sync_coordinates(model, this.pp));

	// Traitlet attribute setter callbacks
	model.on("change:node_color", () => {
		const node_color = model.get("node_color");
		console.log(node_color);
		const ns = this.pp.nodes.map((node, i) => ({ ...this.pp.node_style, color: node_color[i] }));
		pn.build_nodes(this.pp.nodes_gfx, ns);
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
		else if (msg.type == "msg:init_force"){
			pp.init_force();
			pp.enable_force();
		} 
		else if (msg.type == "msg:enable_force"){
			pp.enable_force();
		} 
		else if (msg.type == "msg:"){

		}
	})
}

export default { initialize, render };
