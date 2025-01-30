import importlib.metadata
import pathlib
import anywidget
import traitlets

try:
	__version__ = importlib.metadata.version("pixiplex")
except importlib.metadata.PackageNotFoundError:
	__version__ = "unknown"

_DEV = False  # switch to False for production

if _DEV:
	# from `npx vite`
	ESM = "/Users/mpiekenbrock/pixiplex-py/src/widget.js"
	CSS = "/Users/mpiekenbrock/pixiplex-py/src/widget.css"
else:
	# from `npx vite build`
	bundled_assets_dir = pathlib.Path(__file__).parent / "static"
	ESM = (bundled_assets_dir / "widget.js").read_text()
	CSS = (bundled_assets_dir / "widget.css").read_text()


class Widget(anywidget.AnyWidget):
	if _DEV:
		ESM = pathlib.Path(__file__).parent.parent / "src" / "widget.js"
		CSS = pathlib.Path(__file__).parent.parent / "src" / "widget.css"
	else:
		ESM = pathlib.Path(__file__).parent / "static" / "widget.js"
		CSS = pathlib.Path(__file__).parent / "static" / "widget.css"
	_esm = ESM  # pathlib.Path(__file__).parent / "static" / "widget.js"
	_css = CSS  # pathlib.Path(__file__).parent / "static" / "widget.css"
	value = traitlets.Int(0).tag(sync=True)
	x = traitlets.List([]).tag(sync=True)
	y = traitlets.List([]).tag(sync=True)

	def __init__(self, x: list, y: list, width: int = 200, height: int = 200) -> None:
		super().__init__()
		self.x = x
		self.y = y
