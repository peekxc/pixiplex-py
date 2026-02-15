Because `pixiplex` is a library that spans both Python and JavaScript, it requires a variety of workflows for development. Below are some common ones and their associated commands.


=== "Python Widget"
	Based on the [anywidgets development workflow](https://youtu.be/600PU6E4Srw?si=z2yqNLeX9-M2gedf), the recommended way to 
	actively develop and test the Python widget is through a Jupyter notebook opened via Jupyter lab:

	```bash
	jupyter lab 
	```

	anywidget comes native with hot reload functionality via Hot Module Replacement (HMR). It is enabled via [line magics](https://ipython.readthedocs.io/en/stable/interactive/magics.html):

	```python
	%load_ext autoreload
	%autoreload 2
	%env ANYWIDGET_HMR=1
	```
	
	The `_esm` field should be set to the bundled output in `src/pixiplex/static`.
	During local widget development, run a Vite watch loop to keep `widget.js` and `pixinet.js` updated:
	
	```bash
	bun run build:widget -- --watch
	bun run build:pixinet -- --watch
	```

	With these commands, file edits on jupyter lab should trigger updates to the notebook instantly. 

	!!! warning
		Unfortunately, opening the notebook via VSCode does works with HMR, but devtools is useless in VSCode. 


=== "JavaScript Widget"
	A pure JS demo site to showcase and test the functionality is at `demo/index.html`.

	```bash
	bun run dev
	```

	This provides full HMR for JavaScript and styles; tweak `demo/main.js` or `demo/index.html` incrementally until desired functionality is verified.

=== "Testing dashboard"
	An interactive dashboard showcasing the functionality of the package can be run via the Panel command:

	```bash
	panel serve src/pixiplex/panel_app.py
	```

=== "Unit tests + benchmarks"
	Run the Python unit tests and lightweight benchmark guardrails with:

	```bash
	python -m pytest src/tests
	```

	Benchmark-style tests currently cover:

	- repeated `load_les_miserables()` parsing throughput
	- `ForceConfig` construction overhead

	Run JavaScript unit tests and benchmarks with:

	```bash
	bun run test:js
	bun run bench:js
	```

=== "Production build"
	To produce minified ESM outputs for the widget runtime and demo:

	```bash
	bun run build
	```

	The widget bundles are emitted to `src/pixiplex/static`, while the demo site is emitted to `demo/dist`.

	Assets can be further compressed via e.g. [Brotli compression](https://blog.cloudflare.com/this-is-brotli-from-origin/):

	```bash
	bunx brotli-cli compress src/pixiplex/static/widget.js
	```

=== "Docs" 
	The docsite is built from markdown documents with `mkdocs-material`. The API reference pages are generated using `mkapi`
	for Python and `jsdoc2md` for JavaScript. 
	
	The former is integrated into mkdocs via a plugin, whereas the latter requires manual execution. 

	```bash
	jsdoc2md --template templates/sig-style.hbs --files src/pixiplex/pixinet.js > docs/api/pixinet.md \n
	mkdocs build --clean
	```
