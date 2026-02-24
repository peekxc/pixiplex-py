"""Style configuration models for Pixinet widgets."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


def _parse_color(value: int | str) -> int:
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        text = value.strip().lower()
        if text.startswith("#"):
            return int(text[1:], 16)
        if text.startswith("0x"):
            return int(text[2:], 16)
        return int(text, 16)
    raise TypeError(f"Unsupported color type: {type(value)!r}")


@dataclass
class NodeStyle:
    color: int | str = 0x650A5A
    radius: int = 6
    alpha: float = 1
    line_size: float = 1.5
    line_color: int | str = 0xFFFFFF

    @staticmethod
    def as_dict(config: "NodeStyle", widget: Any) -> dict[str, Any]:
        """Dictionary serialization method necessary for widget synchronization."""
        return {
            "radius": config.radius,
            "alpha": config.alpha,
            "color": _parse_color(config.color),
            "lineStyle": {
                "size": config.line_size,
                "color": _parse_color(config.line_color),
            },
        }


@dataclass
class EdgeStyle:
    line_width: float = 1.0
    color: int | str = 0x000000
    alpha: float = 1.0

    @staticmethod
    def as_dict(config: "EdgeStyle", widget: Any) -> dict[str, Any]:
        """Dictionary serialization method necessary for widget synchronization."""
        return {
            "lineWidth": config.line_width,
            "color": _parse_color(config.color),
            "alpha": config.alpha,
        }
