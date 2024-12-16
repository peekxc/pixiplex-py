# pixiplex_py

> CAUTION: Experimental library being developed for fun. Do not use. 

## Development 

Below is the *correct* dev workflow. 

### pixiplex Python widget 

Use Jupyter lab w/ DevTools.

```bash
jupyter lab 
```

Point the source of the jupyter widget to the `pixiplex/static/*` files, *NOT* the src files. Then compile with: 

```bash
npx esbuild --bundle --format=esm --outdir=pixiplex/static src/widget.js src/pixinet.js --watch
```

Done. Editing files on jupyter lab triggers an automatic update to the notebook via HMR, and you can use devtools. 

Unfortunately, opening the notebook via VSCode does works with HMR, but devtools is messed up. 

### pixiplex JS library 

The pure JS part of the library is developed via incrementally testing features from `pixinet.js` via the test 
graph in `index.pug`. To develop the JS component, the workflow is: 

1. Setup watchers for `index.pug` and `pixinet.js` via pug and esbuild, respectively. 

```bash
npx pug src/index.pug --out pixiplex/static
npx esbuild --bundle --format=esm --outdir=pixiplex/static src/widget.js src/pixinet.js --watch
```

2. Run any http server from the `pixiplex/static` root level

```bash
(pixiplex-py)$ http-server pixiplex/static
```

This will serve the output `index.html` file. By tweaking the `src/pixinet.js` or `index.pug` and verifying functionality, 
the corresponding library can be built incrementally until the desired functionality is implemented.