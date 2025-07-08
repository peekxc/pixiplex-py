`pixiplex` comes with a variety of developer workflows. 

=== "Python Widget"

    Based on the [anywidgets developer workflow](https://youtu.be/600PU6E4Srw?si=z2yqNLeX9-M2gedf), the recommended way to 
    develop and actively test the Python widget is via Jupyter lab (+ devtools [option + cmd + I]).

    ```bash
    jupyter lab 
    ```

    Then compile with: 

    ```bash
    npx esbuild --bundle --format=esm --outdir=src/pixiplex/static src/pixiplex/widget.js src/pixiplex/pixinet.js --watch
    ```

    Now, editing files on jupyter lab triggers an automatic update to the notebook via HMR, and you can use devtools. 

    !!! warning
      
        Unfortunately, opening the notebook via VSCode does works with HMR, but devtools is useless in VSCode. 


=== "JavaScript Widget"
    The pure JS part of the library is developed via incrementally testing via the following workflow: 

    1. Setup watchers for `index.pug` and `pixinet.js` via pug and esbuild, respectively. 
    2. Run any http server from the `src/pixiplex/static` root level

    ```bash
    npx pug src/pixiplex/index.pug --out src/pixiplex/static --watch
    npx esbuild --bundle --format=esm --outdir=src/pixiplex/static src/pixiplex/widget.js src/pixiplex/pixinet.js --watch
    http-server src/pixiplex/static
    ```

    This serves `index.html` statically; tweak `src/pixinet.js` or `index.pug` incrementally until desired functionality is verified. 

=== "Dashboard"
    An interactive dashboard showcasing the functionality of the package can be run via the Panel command:

    ```bash
    panel serve src/pixiplex/panel_app.py
    ```

=== "Production build"
    For distributing the library using the appropriate minifiers: 

    ```bash
    npx esbuild --bundle src/pixiplex/widget.js \
    --outfile=src/pixiplex/static/widget.js \
    --minify --format=esm --tree-shaking=true
    ```

    You can further compress the assets via e.g. [Brotli compression](https://blog.cloudflare.com/this-is-brotli-from-origin/):

    ```bash
    npx brotli-cli compress src/pixiplex/static/widget.js
    ```

=== "Docs" 
    The docsite is built with `mkdocs-material` using `mkapi` for Python and `jsdoc2md` for JS. 

    ```bash
    jsdoc2md --template templates/sig-style.hbs --files src/pixiplex/pixinet.js > docs/api/pixinet.md
    ```