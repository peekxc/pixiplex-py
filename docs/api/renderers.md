
## centerSimulationNodes {#centerSimulationNodes .hide}
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


## GroupedNodeRenderer {#GroupedNodeRenderer .hide}
<p class="mkapi-object mkapi-page-source" id=GroupedNodeRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">GroupedNodeRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that batches all nodes and edges into grouped PIXI Graphics objects.</p>
</div>
## IndividualNodeRenderer {#IndividualNodeRenderer .hide}
<p class="mkapi-object mkapi-page-source" id=IndividualNodeRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">IndividualNodeRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that draws one PIXI Graphics object per node.</p>
</div>
## MeshPrimitiveRenderer {#MeshPrimitiveRenderer .hide}
<p class="mkapi-object mkapi-page-source" id=MeshPrimitiveRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">MeshPrimitiveRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that draws nodes and edges using PIXI Mesh primitives.</p>
</div>
## WebGLPrimitiveRenderer {#WebGLPrimitiveRenderer .hide}
<p class="mkapi-object mkapi-page-source" id=WebGLPrimitiveRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">WebGLPrimitiveRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that draws nodes and edges with a dedicated WebGL2 canvas.</p>
</div>






