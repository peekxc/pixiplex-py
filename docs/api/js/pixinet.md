
## _init_application {#_init_application }
<p class="mkapi-object mkapi-page-source" id=_init_application>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_init_application</span>(
	
	<span class="mkapi-arg">options</span>: <span class="mkapi-ann">Object</span>
, 
	<span class="mkapi-arg">options.width</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">options.height</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">options.antialias</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">options.backgroundColor</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">options.resolution</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">options.transparent</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">options.autoResize</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">options.forceCanvas</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">options.autoStart</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">options.autoDensity</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">options.failIfMajorPerformanceCaveat</span>: <span class="mkapi-ann">boolean</span>
	)
	 -> 
			<span class="mkapi-ann">Promise.&lt;void&gt;</span>
</p>
<div class="mkapi-document"> 
	<p>Initializes the PixiJS application with specified rendering parameters</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">options</span> <span class="mkapi-dash">—</span> Additional application configuration options </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.width</span> <span class="mkapi-dash">—</span> Canvas width override </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.height</span> <span class="mkapi-dash">—</span> Canvas height override </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.antialias</span> <span class="mkapi-dash">—</span> Enable antialiasing </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.backgroundColor</span> <span class="mkapi-dash">—</span> Background color as hex value </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.resolution</span> <span class="mkapi-dash">—</span> Pixel density ratio for high-DPI displays </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.transparent</span> <span class="mkapi-dash">—</span> Enable canvas transparency </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.autoResize</span> <span class="mkapi-dash">—</span> Enable automatic canvas resizing </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.forceCanvas</span> <span class="mkapi-dash">—</span> Force canvas rendering over WebGL </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.autoStart</span> <span class="mkapi-dash">—</span> Enable automatic ticker start </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.autoDensity</span> <span class="mkapi-dash">—</span> Enable automatic density adjustment </li>
			<li> <span class="mkapi-item-name mkapi-arg">options.failIfMajorPerformanceCaveat</span> <span class="mkapi-dash">—</span> Fail if major performance issues detected </li>
		</ul>
		</div>
		</p>
</div>
## _init_viewport {#_init_viewport }
<p class="mkapi-object mkapi-page-source" id=_init_viewport>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_init_viewport</span>(
)
	 -> 
			<span class="mkapi-ann">Promise.&lt;Viewport&gt;</span>
</p>
<div class="mkapi-document"> 
	<p>Creates and configures a viewport for handling pan, zoom, and drag interactions
Uses pixi-viewport library for managing world-to-screen coordinate transformations</p>
</div>
## _init_ticker {#_init_ticker }
<p class="mkapi-object mkapi-page-source" id=_init_ticker>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_init_ticker</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Initializes the PixiJS ticker and D3 event dispatcher for animation and event handling
Registers the ticker with the application and viewport for synchronized updates</p>
</div>
## _init_graphics {#_init_graphics }
<p class="mkapi-object mkapi-page-source" id=_init_graphics>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_init_graphics</span>(
	
	<span class="mkapi-arg">nodes</span>: <span class="mkapi-ann">Array.&lt;Object&gt;</span>
, 
	<span class="mkapi-arg">links</span>: <span class="mkapi-ann">Array.&lt;Object&gt;</span>
	)
	 -> 
			<span class="mkapi-ann">Array.&lt;Array&gt;</span>
</p>
<div class="mkapi-document"> 
	<p>Initializes graphics objects for nodes and links, applying styling and establishing references
Scales node coordinates to fit viewport dimensions and resolves link source/target references</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">nodes</span> <span class="mkapi-dash">—</span> Array of node objects with id, x, y properties </li>
			<li> <span class="mkapi-item-name mkapi-arg">links</span> <span class="mkapi-dash">—</span> Array of link objects with source, target references </li>
		</ul>
		</div>
		</p>
</div>
## _init_force {#_init_force }
<p class="mkapi-object mkapi-page-source" id=_init_force>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_init_force</span>(
	
	<span class="mkapi-arg">sim_options</span>: <span class="mkapi-ann">Object</span>
	)
	</p>
<div class="mkapi-document"> 
	<p>Initializes a D3 force simulation with the node graphics as simulation subjects
Creates a stopped simulation with alpha set to 1.0 for manual control</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">sim_options</span> <span class="mkapi-dash">—</span> Configuration options for the force simulation </li>
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
	<p>Enables drag interaction for all node graphics in the visualization
Implements pointer-based dragging with viewport pause/resume and force simulation integration</p>
</div>
## disable_drag {#disable_drag }
<p class="mkapi-object mkapi-page-source" id=disable_drag>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">disable_drag</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Disables drag interaction for all node graphics
Sets interactive property to false for all nodes</p>
</div>
## enable_force {#enable_force }
<p class="mkapi-object mkapi-page-source" id=enable_force>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">enable_force</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Enables force simulation by connecting the dispatcher tick event to simulation updates</p>
</div>
## disable_force {#disable_force }
<p class="mkapi-object mkapi-page-source" id=disable_force>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">disable_force</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Disables force simulation by removing the tick event handler</p>
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
	</p>
<div class="mkapi-document"> 
	<p>Centers the graph visualization by translating all nodes to the viewport center
Optionally fits the graph to the viewport bounds and updates force simulation center</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">fit</span> <span class="mkapi-dash">—</span> Whether to fit the graph to viewport bounds </li>
			<li> <span class="mkapi-item-name mkapi-arg">x</span> <span class="mkapi-dash">—</span> Custom x-coordinate for center (defaults to viewport center) </li>
			<li> <span class="mkapi-item-name mkapi-arg">y</span> <span class="mkapi-dash">—</span> Custom y-coordinate for center (defaults to viewport center) </li>
		</ul>
		</div>
		</p>
</div>
## force_center {#force_center }
<p class="mkapi-object mkapi-page-source" id=force_center>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">force_center</span>(
	
	<span class="mkapi-arg">name</span>: <span class="mkapi-ann">string</span> = <span class="mkapi-default">&quot;center&quot;</span>
, 
	<span class="mkapi-arg">x</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">y</span>: <span class="mkapi-ann">number</span>
	)
	</p>
<div class="mkapi-document"> 
	<p>Adds a centering force to the simulation that pulls nodes toward a specified point</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">name</span> <span class="mkapi-dash">—</span> Name identifier for the force </li>
			<li> <span class="mkapi-item-name mkapi-arg">x</span> <span class="mkapi-dash">—</span> X-coordinate for center point (defaults to viewport center) </li>
			<li> <span class="mkapi-item-name mkapi-arg">y</span> <span class="mkapi-dash">—</span> Y-coordinate for center point (defaults to viewport center) </li>
		</ul>
		</div>
		</p>
</div>
## force_link {#force_link }
<p class="mkapi-object mkapi-page-source" id=force_link>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">force_link</span>(
	
	<span class="mkapi-arg">name</span>: <span class="mkapi-ann">string</span> = <span class="mkapi-default">&quot;spring&quot;</span>
, 
	<span class="mkapi-arg">distance</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">strength</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">iterations</span>: <span class="mkapi-ann">number</span>
	)
	</p>
<div class="mkapi-document"> 
	<p>Adds a spring force to the simulation that maintains desired distances between linked nodes</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">name</span> <span class="mkapi-dash">—</span> Name of the link force. </li>
			<li> <span class="mkapi-item-name mkapi-arg">distance</span> <span class="mkapi-dash">—</span> Desired distance between linked nodes. </li>
			<li> <span class="mkapi-item-name mkapi-arg">strength</span> <span class="mkapi-dash">—</span> Strength of the link force. </li>
			<li> <span class="mkapi-item-name mkapi-arg">iterations</span> <span class="mkapi-dash">—</span> Number of iterations for the link force calculation. </li>
		</ul>
		</div>
		</p>
</div>
## force_manybody {#force_manybody }
<p class="mkapi-object mkapi-page-source" id=force_manybody>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">force_manybody</span>(
	
	<span class="mkapi-arg">name</span>: <span class="mkapi-ann">string</span> = <span class="mkapi-default">&quot;charge&quot;</span>
, 
	<span class="mkapi-arg">strength</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">theta</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">distanceMin</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">distanceMax</span>: <span class="mkapi-ann">number</span>
	)
	</p>
<div class="mkapi-document"> 
	<p>Adds a many-body force to the simulation that simulates attractive or repulsive forces between all nodes</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">name</span> <span class="mkapi-dash">—</span> Name identifier for the force </li>
			<li> <span class="mkapi-item-name mkapi-arg">strength</span> <span class="mkapi-dash">—</span> Strength of the force (negative for repulsion, positive for attraction) </li>
			<li> <span class="mkapi-item-name mkapi-arg">theta</span> <span class="mkapi-dash">—</span> Barnes-Hut approximation parameter for performance optimization </li>
			<li> <span class="mkapi-item-name mkapi-arg">distanceMin</span> <span class="mkapi-dash">—</span> Minimum distance for force calculation </li>
			<li> <span class="mkapi-item-name mkapi-arg">distanceMax</span> <span class="mkapi-dash">—</span> Maximum distance for force calculation </li>
		</ul>
		</div>
		</p>
</div>
## apply_force {#apply_force }
<p class="mkapi-object mkapi-page-source" id=apply_force>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">apply_force</span>(
	
	<span class="mkapi-arg">params</span>: <span class="mkapi-ann">Object</span>
, 
	<span class="mkapi-arg">params.forceName</span>: <span class="mkapi-ann">Object</span>
, 
	<span class="mkapi-arg">params.forceName.type</span>: <span class="mkapi-ann">string</span>
, 
	<span class="mkapi-arg">params.forceName.enabled</span>: <span class="mkapi-ann">boolean</span>
	)
	 -> 
			<span class="mkapi-ann">boolean</span>
</p>
<div class="mkapi-document"> 
	<p>Applies force configuration parameters to the simulation
Parses force settings object and applies appropriate force types with their parameters</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">params</span> <span class="mkapi-dash">—</span> Force configuration object with force names as keys </li>
			<li> <span class="mkapi-item-name mkapi-arg">params.forceName</span> <span class="mkapi-dash">—</span> Individual force configuration </li>
			<li> <span class="mkapi-item-name mkapi-arg">params.forceName.type</span> <span class="mkapi-dash">—</span> Type of force (e.g., &quot;forceCenter&quot;, &quot;forceManyBody&quot;) </li>
			<li> <span class="mkapi-item-name mkapi-arg">params.forceName.enabled</span> <span class="mkapi-dash">—</span> Whether the force is enabled </li>
		</ul>
		</div>
		</p>
</div>
## init {#init }
<p class="mkapi-object mkapi-page-source" id=init>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">init</span>(
	
	<span class="mkapi-arg">drag</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">center</span>: <span class="mkapi-ann">boolean</span>
	)
	</p>
<div class="mkapi-document"> 
	<p>Initializes the visualization with PIXI application, viewport, and force simulation</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">drag</span> <span class="mkapi-dash">—</span> Whether to enable node dragging </li>
			<li> <span class="mkapi-item-name mkapi-arg">center</span> <span class="mkapi-dash">—</span> Whether to center the graph initially </li>
		</ul>
		</div>
		</p>
</div>
## init_all {#init_all }
<p class="mkapi-object mkapi-page-source" id=init_all>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">init_all</span>(
	
	<span class="mkapi-arg">drag</span>: <span class="mkapi-ann">boolean</span>
, 
	<span class="mkapi-arg">center</span>: <span class="mkapi-ann">boolean</span>
	)
	</p>
<div class="mkapi-document"> 
	<p>Initializes the visualization with PIXI application, viewport, and force simulation</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">drag</span> <span class="mkapi-dash">—</span> Whether to enable node dragging </li>
			<li> <span class="mkapi-item-name mkapi-arg">center</span> <span class="mkapi-dash">—</span> Whether to center the graph initially </li>
		</ul>
		</div>
		</p>
</div>




## Pixiplex {#Pixiplex }
<p class="mkapi-object mkapi-page-source" id=Pixiplex>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">Pixiplex</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Creates a new Pixiplex network visualization instance</p>
</div>





