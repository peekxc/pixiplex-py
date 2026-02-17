
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
## _applyNodeStyles {#_applyNodeStyles }
<p class="mkapi-object mkapi-page-source" id=_applyNodeStyles>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_applyNodeStyles</span>(
	
	<span class="mkapi-arg">styles</span>: <span class="mkapi-ann">object | Array.&lt;object&gt;</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Applies node styles to each per-node Graphics object.</p>
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
	<p>Initializes node/link graphics and binds links to graphics-backed nodes.</p>
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
<div class="mkapi-document"> 
	<p>Attaches link and node graphics to the viewport.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">viewport</span> <span class="mkapi-dash">—</span> PIXI viewport. </li>
		</ul>
		</div>
		</p>
</div>
## draw {#draw }
<p class="mkapi-object mkapi-page-source" id=draw>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">draw</span>(
)
	 -> 
			<span class="mkapi-ann">number</span>
</p>
<div class="mkapi-document"> 
	<p>Draws a frame by redrawing links as needed.</p>
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
	<p>Applies a node style update for future draws/interactions.</p>
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
			<span class="mkapi-ann">Array.&lt;object&gt;</span>
</p>
## getLinkGraphics {#getLinkGraphics }
<p class="mkapi-object mkapi-page-source" id=getLinkGraphics>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">getLinkGraphics</span>(
)
	 -> 
			<span class="mkapi-ann">Array.&lt;object&gt;</span>
</p>


## IndividualNodeRenderer {#IndividualNodeRenderer }
<p class="mkapi-object mkapi-page-source" id=IndividualNodeRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">IndividualNodeRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that draws one PIXI Graphics object per node.</p>
</div>
## PixiplexIndividual {#PixiplexIndividual }
<p class="mkapi-object mkapi-page-source" id=PixiplexIndividual>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">PixiplexIndividual</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Pixiplex subclass preconfigured with the per-node renderer backend.</p>
</div>





