# pixiplex_py

> CAUTION: Experimental library being developed for fun. Do not use. 

## Development 

Below is the *correct* dev workflow, based on [anywidgets dev workflow](https://youtu.be/600PU6E4Srw?si=z2yqNLeX9-M2gedf).

### pixiplex Python widget 

Use Jupyter lab w/ devtools (option + cmd + I).

```bash
jupyter lab 
```

Point the source of the jupyter widget to the `pixiplex/static/*` files, *NOT* the src files. Then compile with: 

```bash
npx esbuild --bundle --format=esm --outdir=pixiplex/static src/widget.js src/pixinet.js --watch
```

Now, editing files on jupyter lab triggers an automatic update to the notebook via HMR, and you can use devtools. 

Unfortunately, opening the notebook via VSCode does works with HMR, but devtools is useless in VSCode. 

### pixiplex JS library 

The pure JS part of the library is developed via incrementally testing features from `pixinet.js` via the test 
graph in `index.pug`. To develop the JS component, the workflow is: 

1. Setup watchers for `index.pug` and `pixinet.js` via pug and esbuild, respectively. 

```bash
npx pug src/index.pug --out pixiplex/static --watch
npx esbuild --bundle --format=esm --outdir=pixiplex/static src/widget.js src/pixinet.js --watch
```

2. Run any http server from the `pixiplex/static` root level

```bash
(pixiplex-py)$ http-server pixiplex/static
```

This will serve the output `index.html` file. Tweak `src/pixinet.js` or `index.pug` incrementally until desired functionality is verified. 


## Production build 

For distributing the library, use the appropriate minifiers and compression: 

```bash
npx esbuild --bundle --format=esm --outdir=pixiplex/static src/widget.js src/pixinet.js --tree-shaking=true --minify-identifiers --minify-whitespace --minify-syntax 
brotli-cli compress pixiplex/static/pixinet.js pixiplex/static/widget.js
```