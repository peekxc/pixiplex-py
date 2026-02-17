
## ensureRenderer {#ensureRenderer }
<p class="mkapi-object mkapi-page-source" id=ensureRenderer>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">ensureRenderer</span>(
	
	<span class="mkapi-arg">pixiplex</span>: <span class="mkapi-ann">object</span>
	)
	 -> 
			<span class="mkapi-ann">object</span>
</p>
<div class="mkapi-document"> 
	<p>Returns the renderer currently installed on the host instance.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">pixiplex</span> <span class="mkapi-dash">—</span> Host instance. </li>
		</ul>
		</div>
		</p>
</div>
## centerSimulationNodes {#centerSimulationNodes }
<p class="mkapi-object mkapi-page-source" id=centerSimulationNodes>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">centerSimulationNodes</span>(
	
	<span class="mkapi-arg">pixiplex</span>: <span class="mkapi-ann">object</span>
, 
	<span class="mkapi-arg">simNodes</span>: <span class="mkapi-ann">Array.&lt;object&gt;</span>
, 
	<span class="mkapi-arg">fit</span>: <span class="mkapi-ann">boolean</span> = <span class="mkapi-default">true</span>
, 
	<span class="mkapi-arg">x</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">y</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Recenters simulation nodes in world coordinates.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">pixiplex</span> <span class="mkapi-dash">—</span> Pixiplex host instance. </li>
			<li> <span class="mkapi-item-name mkapi-arg">simNodes</span> <span class="mkapi-dash">—</span> Mutable simulation nodes with x/y fields. </li>
			<li> <span class="mkapi-item-name mkapi-arg">fit</span> <span class="mkapi-dash">—</span> Whether to call viewport fit after recentering. </li>
			<li> <span class="mkapi-item-name mkapi-arg">x</span> <span class="mkapi-dash">—</span> Optional center x in user coordinates. </li>
			<li> <span class="mkapi-item-name mkapi-arg">y</span> <span class="mkapi-dash">—</span> Optional center y in user coordinates. </li>
		</ul>
		</div>
		</p>
</div>
## _getRenderer {#_getRenderer }
<p class="mkapi-object mkapi-page-source" id=_getRenderer>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_getRenderer</span>(
)
	 -> 
			<span class="mkapi-ann">object</span>
</p>
<div class="mkapi-document"> 
	<p>Returns the active renderer implementation.</p>
</div>
## _init_graphics {#_init_graphics }
<p class="mkapi-object mkapi-page-source" id=_init_graphics>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_init_graphics</span>(
	
	<span class="mkapi-arg">nodes</span>: <span class="mkapi-ann">Array.&lt;object&gt;</span>
, 
	<span class="mkapi-arg">links</span>: <span class="mkapi-ann">Array.&lt;object&gt;</span>
	)
	 -> 
			<span class="mkapi-ann">Array.&lt;unknown&gt;</span>
</p>
<div class="mkapi-document"> 
	<p>Initializes renderer graphics and exposes compatibility handles.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">nodes</span> <span class="mkapi-dash">—</span> Graph node records. </li>
			<li> <span class="mkapi-item-name mkapi-arg">links</span> <span class="mkapi-dash">—</span> Graph edge records. </li>
		</ul>
		</div>
		</p>
</div>
## init_all {#init_all }
<p class="mkapi-object mkapi-page-source" id=init_all>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">init_all</span>(
	
	<span class="mkapi-arg">drag</span>: <span class="mkapi-ann">boolean</span> = <span class="mkapi-default">true</span>
, 
	<span class="mkapi-arg">center</span>: <span class="mkapi-ann">boolean</span> = <span class="mkapi-default">true</span>
	)
	 -> 
			<span class="mkapi-ann">Promise.&lt;object&gt;</span>
</p>
<div class="mkapi-document"> 
	<p>Initializes application, renderer, ticker, and simulation lifecycle.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">drag</span> <span class="mkapi-dash">—</span> Whether to enable drag interactions. </li>
			<li> <span class="mkapi-item-name mkapi-arg">center</span> <span class="mkapi-dash">—</span> Whether to center the graph after init. </li>
		</ul>
		</div>
		</p>
</div>
## _init_force {#_init_force }
<p class="mkapi-object mkapi-page-source" id=_init_force>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_init_force</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Initializes d3-force simulation with renderer simulation nodes.</p>
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
	<p>Applies node styles through the active renderer.</p>
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
## center_graph {#center_graph }
<p class="mkapi-object mkapi-page-source" id=center_graph>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">center_graph</span>(
	
	<span class="mkapi-arg">fit</span>: <span class="mkapi-ann">boolean</span> = <span class="mkapi-default">true</span>
, 
	<span class="mkapi-arg">x</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">y</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Recenters simulation nodes and requests a redraw.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">fit</span> <span class="mkapi-dash">—</span> Whether to fit viewport bounds. </li>
			<li> <span class="mkapi-item-name mkapi-arg">x</span> <span class="mkapi-dash">—</span> Optional center x coordinate. </li>
			<li> <span class="mkapi-item-name mkapi-arg">y</span> <span class="mkapi-dash">—</span> Optional center y coordinate. </li>
		</ul>
		</div>
		</p>
</div>
## enable_drag {#enable_drag }
<p class="mkapi-object mkapi-page-source" id=enable_drag>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">enable_drag</span>(
)
	 -> 
			<span class="mkapi-ann">boolean</span>
</p>
<div class="mkapi-document"> 
	<p>Enables node drag interactions using renderer pick logic.</p>
</div>
## disable_drag {#disable_drag }
<p class="mkapi-object mkapi-page-source" id=disable_drag>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">disable_drag</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Disables node drag interactions and clears drag state.</p>
</div>







