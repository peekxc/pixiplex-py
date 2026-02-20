
## initialize {#initialize }
<p class="mkapi-object mkapi-page-source" id=initialize>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">initialize</span>(
	
	<span class="mkapi-arg">context</span>: <span class="mkapi-ann">Object</span>
, 
	<span class="mkapi-arg">context.model</span>: <span class="mkapi-ann">object</span>
	)
	 -> 
			<span class="mkapi-ann">Promise.&lt;void&gt;</span>
</p>
<div class="mkapi-document"> 
	<p>Initializes browser-side widget globals.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">context</span> <span class="mkapi-dash">—</span> anywidget initialization context. </li>
			<li> <span class="mkapi-item-name mkapi-arg">context.model</span> <span class="mkapi-dash">—</span> Traitlet-backed model instance. </li>
		</ul>
		</div>
		</p>
</div>
## render {#render }
<p class="mkapi-object mkapi-page-source" id=render>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">render</span>(
	
	<span class="mkapi-arg">context</span>: <span class="mkapi-ann">Object</span>
, 
	<span class="mkapi-arg">context.model</span>: <span class="mkapi-ann">object</span>
, 
	<span class="mkapi-arg">context.el</span>: <span class="mkapi-ann">HTMLElement</span>
	)
	 -> 
			<span class="mkapi-ann">Promise.&lt;void&gt;</span>
</p>
<div class="mkapi-document"> 
	<p>Renders the widget and wires model -&gt; scene synchronization callbacks.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">context</span> <span class="mkapi-dash">—</span> anywidget render context. </li>
			<li> <span class="mkapi-item-name mkapi-arg">context.model</span> <span class="mkapi-dash">—</span> Traitlet-backed model instance. </li>
			<li> <span class="mkapi-item-name mkapi-arg">context.el</span> <span class="mkapi-dash">—</span> Host DOM element. </li>
		</ul>
		</div>
		</p>
</div>









