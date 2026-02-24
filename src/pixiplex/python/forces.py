"""Force configuration models and fluent builders for Pixinet."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Optional, Union


@dataclass
class ForceCenter:
    """Center force that translates nodes uniformly."""

    x: float = 0
    y: float = 0
    strength: float = 1


@dataclass
class ForceCollide:
    """Collision force between nodes."""

    radius: Union[float, str] = 1
    strength: float = 0.7
    iterations: int = 1


@dataclass
class ForceLink:
    """Link force that pulls linked nodes together."""

    distance: Union[float, str] = 30
    strength: Optional[Union[float, str]] = None
    iterations: int = 1


@dataclass
class ForceManyBody:
    """Many-body force for attraction/repulsion between nodes."""

    strength: Union[float, str] = -30
    theta: float = 0.9
    distanceMin: float = 1
    distanceMax: float = 10000


@dataclass
class ForceX:
    """Positioning force along x-axis."""

    x: Union[float, str] = 0
    strength: Union[float, str] = 0.1


@dataclass
class ForceY:
    """Positioning force along y-axis."""

    y: Union[float, str] = 0
    strength: Union[float, str] = 0.1


@dataclass
class ForceRadial:
    """Radial positioning force."""

    radius: Union[float, str]
    x: float = 0
    y: float = 0
    strength: Union[float, str] = 0.1


class ForceConfig:
    """Fluent interface for configuring d3-forces."""

    def __init__(self) -> None:
        self.forces: dict[str, Any] = {}

    def center(
        self,
        name: str = "center",
        x: float = 0.0,
        y: float = 0.0,
        strength: float = 1.0,
    ) -> "ForceConfig":
        """Add center force."""
        fc = ForceCenter(x, y, strength)
        self.forces[name] = {
            "type": "forceCenter",
            "enabled": True,
            "params": asdict(fc),
        }
        return self

    def collide(self, name: str = "collide", **kwargs) -> "ForceConfig":
        """Add collision force."""
        self.forces[name] = {
            "type": "forceCollide",
            "enabled": True,
            "params": asdict(ForceCollide(**kwargs)),
        }
        return self

    def link(self, name: str = "link", **kwargs) -> "ForceConfig":
        """Adds a link force."""
        self.forces[name] = {
            "type": "forceLink",
            "enabled": True,
            "params": asdict(ForceLink(**kwargs)),
        }
        return self

    def many_body(self, name: str = "charge", **kwargs) -> "ForceConfig":
        """Adds a many-body force, such as gravity or electrostatic repulsion."""
        if "distance_min" in kwargs:
            kwargs["distanceMin"] = kwargs.pop("distance_min")
        if "distance_max" in kwargs:
            kwargs["distanceMax"] = kwargs.pop("distance_max")
        if kwargs.get("distanceMax") == float("inf"):
            kwargs["distanceMax"] = None
        self.forces[name] = {
            "type": "forceManyBody",
            "enabled": True,
            "params": asdict(ForceManyBody(**kwargs)),
        }
        return self

    def radial(
        self, radius: Union[float, str], name: str = "radial", **kwargs
    ) -> "ForceConfig":
        """Add radial positioning force."""
        self.forces[name] = {
            "type": "forceRadial",
            "enabled": True,
            "params": asdict(ForceRadial(radius=radius, **kwargs)),
        }
        return self

    def x(self, name: str = "x", **kwargs) -> "ForceConfig":
        """Add x-positioning force."""
        self.forces[name] = {
            "type": "forceX",
            "enabled": True,
            "params": asdict(ForceX(**kwargs)),
        }
        return self

    def y(self, name: str = "y", **kwargs) -> "ForceConfig":
        """Add y-positioning force."""
        self.forces[name] = {
            "type": "forceY",
            "enabled": True,
            "params": asdict(ForceY(**kwargs)),
        }
        return self

    @staticmethod
    def as_dict(config: "ForceConfig", widget: Any) -> dict[str, Any]:
        """Dictionary serialization method necessary for widget synchronization."""
        return config.forces.copy()

    def __repr__(self) -> str:
        if not self.forces:
            return "(empty force configuration)"
        msg = "Force Configuration {\n"
        for fn, fp in self.forces.items():
            params = ",".join([f"{k}={v}" for k, v in fp["params"].items()])
            msg += (
                f" {['[off]', '[on] '][fp['enabled']]} {fn}: {fp['type']}({params})\n"
            )
        msg += "}"
        return msg
