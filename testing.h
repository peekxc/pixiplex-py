
		<div id="pixiplex_container" style="position: relative; overflow: hidden; overflow-y: hidden; padding: 0; margin: 5px; border: 1px solid black; "></div>
		<script type="module">
		import * as pn from "./pixinet.js"
		const WORLD_WIDTH = 1000;
		const WORLD_HEIGHT = 1000;
		console.log("Pixel ratio: " + devicePixelRatio);
		const graph = await pn.json("data/les_miserables.json");
		const pp = new pn.Pixiplex(graph.nodes, graph.links, 1200, 800, 2.0);
		window.pp = pp; 
		await pp.init();
		document.getElementById("pixiplex_container").appendChild(pp.view);
		</script>
		