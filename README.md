# pixiplex

## Install

```bash
python3 -m pip install -e .
```

Optional dev extras:

```bash
python3 -m pip install -e ".[dev]"
```

Install JS tooling:

```bash
bun install
```

## Build assets

```bash
bun run build
```

This regenerates:

- `src/pixiplex/static/widget.js`
- `src/pixiplex/static/pixinet.js`
- demo bundle in `demo/dist`

## Run demo

```bash
bun run dev
```

Open `http://127.0.0.1:5173`.

## Jupyter widget development

Terminal 1:

```bash
bun run build:widget -- --watch
```

Terminal 2:

```bash
bun run build:pixinet -- --watch
```

Terminal 3:

```bash
jupyter lab
```

In notebook:

```python
%load_ext autoreload
%autoreload 2
%env ANYWIDGET_HMR=1
```
