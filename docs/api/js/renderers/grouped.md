
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
## _draw_nodes {#_draw_nodes }
<p class="mkapi-object mkapi-page-source" id=_draw_nodes>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_draw_nodes</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Draws all nodes into one shared Graphics object.</p>
</div>
## _draw_edges {#_draw_edges }
<p class="mkapi-object mkapi-page-source" id=_draw_edges>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_draw_edges</span>(
)
	 -> 
			<span class="mkapi-ann">number</span>
</p>
<div class="mkapi-document"> 
	<p>Draws all edges into one shared Graphics object.</p>
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
	<p>Initializes grouped node/edge graphics and link endpoint resolution.</p>
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
	<p>Draws one frame for grouped nodes and edges.</p>
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
	<p>Applies a node style update and redraws grouped node geometry.</p>
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
			<span class="mkapi-ann">object</span>
</p>




## GroupedNodeRenderer {#GroupedNodeRenderer }
<p class="mkapi-object mkapi-page-source" id=GroupedNodeRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">GroupedNodeRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that batches all nodes and edges into grouped PIXI Graphics objects.</p>
</div>
## PixiplexGrouped {#PixiplexGrouped }
<p class="mkapi-object mkapi-page-source" id=PixiplexGrouped>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">PixiplexGrouped</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Pixiplex subclass preconfigured with the grouped renderer backend.</p>
</div>





