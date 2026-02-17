
## writeQuadUVs {#writeQuadUVs }
<p class="mkapi-object mkapi-page-source" id=writeQuadUVs>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">writeQuadUVs</span>(
	
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
## writeQuadIndices {#writeQuadIndices }
<p class="mkapi-object mkapi-page-source" id=writeQuadIndices>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">writeQuadIndices</span>(
	
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
## _resolveStyle {#_resolveStyle }
<p class="mkapi-object mkapi-page-source" id=_resolveStyle>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_resolveStyle</span>(
	
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
## _ensureEdgeCapacity {#_ensureEdgeCapacity }
<p class="mkapi-object mkapi-page-source" id=_ensureEdgeCapacity>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_ensureEdgeCapacity</span>(
	
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
## _ensureNodeCapacity {#_ensureNodeCapacity }
<p class="mkapi-object mkapi-page-source" id=_ensureNodeCapacity>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_ensureNodeCapacity</span>(
	
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
## _updateEdgeVertices {#_updateEdgeVertices }
<p class="mkapi-object mkapi-page-source" id=_updateEdgeVertices>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_updateEdgeVertices</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Updates edge quad vertices from current simulation positions.</p>
</div>
## _updateNodeVertices {#_updateNodeVertices }
<p class="mkapi-object mkapi-page-source" id=_updateNodeVertices>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_updateNodeVertices</span>(
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
## addToViewport {#addToViewport }
<p class="mkapi-object mkapi-page-source" id=addToViewport>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">addToViewport</span>(
	
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
## setNodeStyles {#setNodeStyles }
<p class="mkapi-object mkapi-page-source" id=setNodeStyles>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">setNodeStyles</span>(
	
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
## getSimulationNodes {#getSimulationNodes }
<p class="mkapi-object mkapi-page-source" id=getSimulationNodes>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">getSimulationNodes</span>(
)
	 -> 
			<span class="mkapi-ann">Array.&lt;object&gt;</span>
</p>
## pickNode {#pickNode }
<p class="mkapi-object mkapi-page-source" id=pickNode>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">pickNode</span>(
	
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
## getNodeGraphics {#getNodeGraphics }
<p class="mkapi-object mkapi-page-source" id=getNodeGraphics>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">getNodeGraphics</span>(
)
	 -> 
			<span class="mkapi-ann">null</span>
</p>
## getLinkGraphics {#getLinkGraphics }
<p class="mkapi-object mkapi-page-source" id=getLinkGraphics>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">getLinkGraphics</span>(
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





