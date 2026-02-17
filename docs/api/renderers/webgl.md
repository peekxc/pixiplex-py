
## setUniformHexColor {#setUniformHexColor }
<p class="mkapi-object mkapi-page-source" id=setUniformHexColor>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">setUniformHexColor</span>(
	
	<span class="mkapi-arg">gl</span>: <span class="mkapi-ann">WebGL2RenderingContext</span>
, 
	<span class="mkapi-arg">uniformLocation</span>: <span class="mkapi-ann">WebGLUniformLocation | null</span>
, 
	<span class="mkapi-arg">hex</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">alpha</span>: <span class="mkapi-ann">number</span> = <span class="mkapi-default">1</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Sets a vec4 color uniform from packed hex + alpha values.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">gl</span> <span class="mkapi-dash">—</span> WebGL2 context. </li>
			<li> <span class="mkapi-item-name mkapi-arg">uniformLocation</span> <span class="mkapi-dash">—</span> Target uniform handle. </li>
			<li> <span class="mkapi-item-name mkapi-arg">hex</span> <span class="mkapi-dash">—</span> RGB packed as 0xRRGGBB. </li>
			<li> <span class="mkapi-item-name mkapi-arg">alpha</span> <span class="mkapi-dash">—</span> Alpha value in [0, 1]. </li>
		</ul>
		</div>
		</p>
</div>
## compileShader {#compileShader }
<p class="mkapi-object mkapi-page-source" id=compileShader>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">compileShader</span>(
	
	<span class="mkapi-arg">gl</span>: <span class="mkapi-ann">WebGL2RenderingContext</span>
, 
	<span class="mkapi-arg">type</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">source</span>: <span class="mkapi-ann">string</span>
	)
	 -> 
			<span class="mkapi-ann">WebGLShader</span>
</p>
<div class="mkapi-document"> 
	<p>Compiles a shader source string.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">gl</span> <span class="mkapi-dash">—</span> WebGL2 context. </li>
			<li> <span class="mkapi-item-name mkapi-arg">type</span> <span class="mkapi-dash">—</span> Shader type (&#x60;gl.VERTEX_SHADER&#x60; or &#x60;gl.FRAGMENT_SHADER&#x60;). </li>
			<li> <span class="mkapi-item-name mkapi-arg">source</span> <span class="mkapi-dash">—</span> GLSL source code. </li>
		</ul>
		</div>
		</p>
</div>
## createProgram {#createProgram }
<p class="mkapi-object mkapi-page-source" id=createProgram>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">createProgram</span>(
	
	<span class="mkapi-arg">gl</span>: <span class="mkapi-ann">WebGL2RenderingContext</span>
, 
	<span class="mkapi-arg">vsSource</span>: <span class="mkapi-ann">string</span>
, 
	<span class="mkapi-arg">fsSource</span>: <span class="mkapi-ann">string</span>
	)
	 -> 
			<span class="mkapi-ann">WebGLProgram</span>
</p>
<div class="mkapi-document"> 
	<p>Creates and links a WebGL program from vertex/fragment sources.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">gl</span> <span class="mkapi-dash">—</span> WebGL2 context. </li>
			<li> <span class="mkapi-item-name mkapi-arg">vsSource</span> <span class="mkapi-dash">—</span> Vertex shader source. </li>
			<li> <span class="mkapi-item-name mkapi-arg">fsSource</span> <span class="mkapi-dash">—</span> Fragment shader source. </li>
		</ul>
		</div>
		</p>
</div>
## _getPixelRatio {#_getPixelRatio }
<p class="mkapi-object mkapi-page-source" id=_getPixelRatio>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_getPixelRatio</span>(
)
	 -> 
			<span class="mkapi-ann">number</span>
</p>
<div class="mkapi-document"> 
	<p>Computes device pixel ratio used by this renderer.</p>
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
	<p>Initializes simulation nodes and resolves link endpoints.</p>
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
## _ensureCanvas {#_ensureCanvas }
<p class="mkapi-object mkapi-page-source" id=_ensureCanvas>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_ensureCanvas</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Lazily creates the WebGL canvas/context and shader programs.</p>
</div>
## attachToView {#attachToView }
<p class="mkapi-object mkapi-page-source" id=attachToView>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">attachToView</span>(
)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Attaches WebGL overlay canvas to the same DOM host as Pixi view.</p>
</div>
## resize {#resize }
<p class="mkapi-object mkapi-page-source" id=resize>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">resize</span>(
	
	<span class="mkapi-arg">width</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">height</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Resizes the WebGL canvas backing resolution and viewport.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">width</span> <span class="mkapi-dash">—</span> CSS width. </li>
			<li> <span class="mkapi-item-name mkapi-arg">height</span> <span class="mkapi-dash">—</span> CSS height. </li>
		</ul>
		</div>
		</p>
</div>
## setNodeStyles {#setNodeStyles }
<p class="mkapi-object mkapi-page-source" id=setNodeStyles>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">setNodeStyles</span>(
	
	<span class="mkapi-arg">style</span>: <span class="mkapi-ann">object | Array.&lt;object&gt;</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Applies node style values consumed by point rendering and picking.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">style</span> <span class="mkapi-dash">—</span> One shared style or per-node styles. </li>
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
## _ensureCapacity {#_ensureCapacity }
<p class="mkapi-object mkapi-page-source" id=_ensureCapacity>
<span class="mkapi-object-kind">function</span> <span class="mkapi-object-name">_ensureCapacity</span>(
	
	<span class="mkapi-arg">numLinks</span>: <span class="mkapi-ann">number</span>
, 
	<span class="mkapi-arg">numNodes</span>: <span class="mkapi-ann">number</span>
	)
	 -> 
			<span class="mkapi-ann">void</span>
</p>
<div class="mkapi-document"> 
	<p>Ensures reusable typed-array capacity for current graph sizes.</p>
		<p class="mkapi-section"> 
		<span class="mkapi-object-link">
			<span class="mkapi-section-toggle" title="Toggle methods">
				<i class="fa-regular fa-square-minus"></i>
			</span>
		</span>
		<span class="mkapi-section-name">Parameters:</span>
		<div class="mkapi-section-content">
		<ul class="mkapi-item-list">
			<li> <span class="mkapi-item-name mkapi-arg">numLinks</span> <span class="mkapi-dash">—</span> Link count. </li>
			<li> <span class="mkapi-item-name mkapi-arg">numNodes</span> <span class="mkapi-dash">—</span> Node count. </li>
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
	<p>Draws one frame to WebGL and uploads transformed node/edge buffers.</p>
</div>


## WebGLPrimitiveRenderer {#WebGLPrimitiveRenderer }
<p class="mkapi-object mkapi-page-source" id=WebGLPrimitiveRenderer>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">WebGLPrimitiveRenderer</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Renderer backend that draws nodes and edges with a dedicated WebGL2 canvas.</p>
</div>
## PixiplexWebGL {#PixiplexWebGL }
<p class="mkapi-object mkapi-page-source" id=PixiplexWebGL>
<span class="mkapi-object-kind">class</span> <span class="mkapi-object-name">PixiplexWebGL</span>(
)
	</p>
<div class="mkapi-document"> 
	<p>Pixiplex subclass preconfigured with the WebGL primitives backend.</p>
</div>





