"""Style configuration models for Pixinet widgets."""

from dataclasses import asdict, dataclass
from typing import Any

import anywidget


@dataclass
class NodeStyle:
    border_width: float = 1.5
    border_color: str = "0xFFFFFF"
    color: str = "0x650A5A"
    radius: int = 6
    alpha: float = 1

    @staticmethod
    def as_dict(config: "NodeStyle", widget: anywidget.AnyWidget) -> dict[str, Any]:
        """Dictionary serialization method necessary for widget synchronization."""
        return asdict(config)


@dataclass
class EdgeStyle:
    line_width: float = 1.0
    color: str = "0x000000"
    alpha: float = 1.0

    @staticmethod
    def as_dict(config: "EdgeStyle", widget: anywidget.AnyWidget) -> dict[str, Any]:
        """Dictionary serialization method necessary for widget synchronization."""
        return asdict(config)
