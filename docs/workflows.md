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
	
	The `_esm` field should be set to the bundled output of `esbuild` (w/ the appropriate watcher), i.e. 
	
	```bash
	npx esbuild@0.25.6 --bundle --format=esm --outdir=src/pixiplex/static \
	src/pixiplex/widget.js src/pixiplex/pixinet.js --watch
	```

	With these commands, file edits on jupyter lab should trigger updates to the notebook instantly. 

	!!! warning
		Unfortunately, opening the notebook via VSCode does works with HMR, but devtools is useless in VSCode. 


=== "JavaScript Widget"
	The pure JS part of the library is developed via incrementally testing via the following workflow: 

	1. Setup watchers for `index.pug` and `pixinet.js` via pug and esbuild, respectively. 
	2. Run any http server from the `src/pixiplex/static` root level

	```bash
	npx pug src/pixiplex/index.pug --out src/pixiplex/static --watch
	npx esbuild@0.25.6 --bundle --format=esm --outdir=src/pixiplex/static src/pixiplex/widget.js src/pixiplex/pixinet.js --watch
	npx http-server src/pixiplex/static
	```

	This serves `index.html` statically; tweak `src/pixinet.js` or `index.pug` incrementally until desired functionality is verified. 

=== "Testing dashboard"
	An interactive dashboard showcasing the functionality of the package can be run via the Panel command:

	```bash
	panel serve src/pixiplex/panel_app.py
	```

=== "Production build"
	To keep the size of the resulting JS files mall, using minifiers and dead-code elimination: 

	```bash
	npx esbuild@0.25.6 --bundle src/pixiplex/widget.js \
	--outfile=src/pixiplex/static/widget.js \
	--minify --format=esm --tree-shaking=true
	```

	Assets can be further compressed via e.g. [Brotli compression](https://blog.cloudflare.com/this-is-brotli-from-origin/):

	```bash
	npx brotli-cli compress src/pixiplex/static/widget.js
	```

=== "Docs" 
	The docsite is built from markdown documents with `mkdocs-material`. The API reference pages are generated using `mkapi`
	for Python and `jsdoc2md` for JavaScript. 
	
	The former is integrated into mkdocs via a plugin, whereas the latter requires manual execution. 

	```bash
	jsdoc2md --template templates/sig-style.hbs --files src/pixiplex/pixinet.js > docs/api/pixinet.md \n
	mkdocs build --clean
	```