# Package Overview

`pixiplex` is a hybrid Python + JavaScript graph visualization package.

At a high level:

- Python provides the notebook/widget-facing API surface.
- JavaScript provides the rendering and interaction engine.
- `d3-force` drives layout simulation.
- PixiJS/WebGL backends handle rendering.

## Repository Structure

- `src/pixiplex/pixinet.py`: Python host API and widget integration.
- `src/pixiplex/widget.js`: anywidget/browser bridge glue.
- `src/pixiplex/pixinet.js`: core JS graph logic, utilities, force controls, and base runtime.
- `src/pixiplex/renderers/`: renderer backends and shared renderer runtime.
- `src/pixiplex/renderers.js`: single public export surface for renderer plugins.
- `docs/`: MkDocs site source.
- `demo/`: standalone JavaScript demo app.

## Rendering Backends

The package supports multiple interchangeable renderer backends through a shared interface/runtime contract.

- `individual` (`pixiplex_individual.js`)
  - One `Graphics` object per node.
  - Good for straightforward per-node object semantics.
- `grouped` (`pixiplex_grouped.js`)
  - Shared `Graphics` object(s) for batched node/edge drawing.
  - Reduces object count and can help on object-heavy scenes.
- `mesh` (`pixiplex_mesh.js`)
  - Uses Pixi Mesh primitives and typed buffers.
  - Oriented toward lower per-frame allocation overhead.
- `webgl` (`pixiplex_webgl.js`)
  - Dedicated WebGL2 canvas path for lines/points.
  - Most explicit control over GPU submission behavior.

All renderers are installed through shared runtime wiring in `pixiplex_renderer_runtime.js`, which centralizes:

- init lifecycle
- force simulation hookup
- drag behavior
- center/fit behavior
- style delegation

## Documentation Flow

JavaScript API docs are generated into `docs/api/` before building MkDocs.

- `npm run docs:api` generates JS and renderer API markdown.
- `npm run docs:build` generates API markdown and builds the site.

Python API docs are generated through `mkapi` during MkDocs build.
