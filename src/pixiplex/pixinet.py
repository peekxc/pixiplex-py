"""Backward-compatible facade for Pixinet Python API.

The implementation now lives under `pixiplex.python` modules:
- `pixiplex.python.widget`
- `pixiplex.python.forces`
- `pixiplex.python.styles`
"""

from .python.forces import (
    ForceConfig,
    ForceCenter,
    ForceCollide,
    ForceLink,
    ForceManyBody,
    ForceRadial,
    ForceX,
    ForceY,
)
from .python.styles import EdgeStyle, NodeStyle
from .python.widget import Pixinet

__all__ = [
    "Pixinet",
    "NodeStyle",
    "EdgeStyle",
    "ForceConfig",
    "ForceCenter",
    "ForceCollide",
    "ForceLink",
    "ForceManyBody",
    "ForceRadial",
    "ForceX",
    "ForceY",
]
