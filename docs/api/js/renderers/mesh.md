
## write_quad_uvs {#write_quad_uvs }
<p class="mkapi-object mkapi-page-source" id=write_quad_uvs>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">write_quad_uvs</span>(
	
	<span class="mkapi-arg">uvs</span>: <span class="mkapi-ann">Float32Array</span>
, 
	<span class="mkapi-arg">quadIndex</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Writes quad UVs for one primitive slot.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">uvs</span> <span class="mkapi-dash">—</span> UV buffer. </li>
			<li> <span class="mkapi-item-name mkapi-arg">quadIndex</span> <span class="mkapi-dash">—</span> Target quad index. </li>
		</ul>
		</div>
		</p>
</div>
## write_quad_indices {#write_quad_indices }
<p class="mkapi-object mkapi-page-source" id=write_quad_indices>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">write_quad_indices</span>(
	
	<span class="mkapi-arg">indices</span>: <span class="mkapi-ann">Uint32Array</span>
, 
	<span class="mkapi-arg">quadIndex</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Writes quad triangle indices for one primitive slot.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">indices</span> <span class="mkapi-dash">—</span> Index buffer. </li>
			<li> <span class="mkapi-item-name mkapi-arg">quadIndex</span> <span class="mkapi-dash">—</span> Target quad index. </li>
		</ul>
		</div>
		</p>
</div>
## _resolve_style {#_resolve_style }
<p class="mkapi-object mkapi-page-source" id=_resolve_style>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_resolve_style</span>(
	
	<span class="mkapi-arg">i</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">object</span>
</p>
<div class="mkapi-document"> 
	<p>Resolves the effective style for a node index.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">i</span> <span class="mkapi-dash">—</span> Node index. </li>
		</ul>
		</div>
		</p>
</div>
## _ensure_edge_capacity {#_ensure_edge_capacity }
<p class="mkapi-object mkapi-page-source" id=_ensure_edge_capacity>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_ensure_edge_capacity</span>(
	
	<span class="mkapi-arg">linkCount</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Ensures edge mesh buffers are allocated for current link count.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">linkCount</span> <span class="mkapi-dash">—</span> Number of links. </li>
		</ul>
		</div>
		</p>
</div>
## _ensure_node_capacity {#_ensure_node_capacity }
<p class="mkapi-object mkapi-page-source" id=_ensure_node_capacity>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_ensure_node_capacity</span>(
	
	<span class="mkapi-arg">nodeCount</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Ensures node mesh buffers are allocated for current node count.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">nodeCount</span> <span class="mkapi-dash">—</span> Number of nodes. </li>
		</ul>
		</div>
		</p>
</div>
## _update_edge_vertices {#_update_edge_vertices }
<p class="mkapi-object mkapi-page-source" id=_update_edge_vertices>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_update_edge_vertices</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Updates edge quad vertices from current simulation positions.</p>
</div>
## _update_node_vertices {#_update_node_vertices }
<p class="mkapi-object mkapi-page-source" id=_update_node_vertices>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_update_node_vertices</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Updates node quad vertices from current simulation positions/styles.</p>
</div>
## init {#init }
<p class="mkapi-object mkapi-page-source" id=init>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">init</span>(
	
	<span class="mkapi-arg">nodes</span>: <span class="mkapi-ann">Array.&lt;object&gt;</span>
, 
	<span class="mkapi-arg">links</span>: <span class="mkapi-ann">Array.&lt;object&gt;</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Initializes mesh buffers and resolves link endpoints.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">nodes</span> <span class="mkapi-dash">—</span> Graph nodes. </li>
			<li> <span class="mkapi-item-name mkapi-arg">links</span> <span class="mkapi-dash">—</span> Graph links. </li>
		</ul>
		</div>
		</p>
</div>
## add_to_viewport {#add_to_viewport }
<p class="mkapi-object mkapi-page-source" id=add_to_viewport>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">add_to_viewport</span>(
	
	<span class="mkapi-arg">viewport</span>: <span class="mkapi-ann">object</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
## draw {#draw }
<p class="mkapi-object mkapi-page-source" id=draw>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">draw</span>(
)
	 -> 
			<span class="mkapi-ann">number</span>
</p>
<div class="mkapi-document"> 
	<p>Draws one frame by updating edge/node mesh geometry buffers.</p>
</div>
## set_node_styles {#set_node_styles }
<p class="mkapi-object mkapi-page-source" id=set_node_styles>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">set_node_styles</span>(
	
	<span class="mkapi-arg">styles</span>: <span class="mkapi-ann">object | Array.&lt;object&gt;</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Applies a node style update for future geometry updates.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">styles</span> <span class="mkapi-dash">—</span> One shared style or per-node styles. </li>
		</ul>
		</div>
		</p>
</div>
## get_simulation_nodes {#get_simulation_nodes }
<p class="mkapi-object mkapi-page-source" id=get_simulation_nodes>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">get_simulation_nodes</span>(
)
	 -> 
			<span class="mkapi-ann">Array.&lt;object&gt;</span>
</p>
## pick_node {#pick_node }
<p class="mkapi-object mkapi-page-source" id=pick_node>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">pick_node</span>(
	
	<span class="mkapi-arg">worldX</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">worldY</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">object | null</span>
</p>
<div class="mkapi-document"> 
	<p>Finds the nearest node in world coordinates for drag picking.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">worldX</span> <span class="mkapi-dash">—</span> World-space x coordinate. </li>
			<li> <span class="mkapi-item-name mkapi-arg">worldY</span> <span class="mkapi-dash">—</span> World-space y coordinate. </li>
		</ul>
		</div>
		</p>
</div>
## get_node_graphics {#get_node_graphics }
<p class="mkapi-object mkapi-page-source" id=get_node_graphics>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">get_node_graphics</span>(
)
	 -> 
			<span class="mkapi-ann">null</span>
</p>
## get_link_graphics {#get_link_graphics }
<p class="mkapi-object mkapi-page-source" id=get_link_graphics>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">get_link_graphics</span>(
)
	 -> 
			<span class="mkapi-ann">null</span>
</p>




## MeshPrimitiveRenderer {#MeshPrimitiveRenderer }
<p class="mkapi-object mkapi-page-source" id=MeshPrimitiveRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">MeshPrimitiveRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that draws nodes and edges using PIXI Mesh primitives.</p>
</div>
## PixiplexMesh {#PixiplexMesh }
<p class="mkapi-object mkapi-page-source" id=PixiplexMesh>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">PixiplexMesh</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Pixiplex subclass preconfigured with the mesh primitives backend.</p>
</div>





