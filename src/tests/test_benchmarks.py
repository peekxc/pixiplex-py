import time

from pixiplex import load_les_miserables
from pixiplex.pixinet import ForceConfig


def _bench(fn, *, repeat: int) -> float:
    start = time.perf_counter()
    for _ in range(repeat):
        fn()
    return time.perf_counter() - start


def test_benchmark_load_les_miserables():
    elapsed = _bench(load_les_miserables, repeat=100)
    per_call_ms = (elapsed / 100) * 1000

    # Loose guardrail: alerts if load performance regresses dramatically.
    assert per_call_ms < 15


def test_benchmark_force_config_build():
    def build_force_config():
        (
            ForceConfig()
            .center(x=600, y=400)
            .link(distance=30, strength=0.1)
            .many_body(strength=-30)
            .x(strength=0.03)
            .y(strength=0.03)
            .radial(radius=200, strength=0.04)
        )

    elapsed = _bench(build_force_config, repeat=20000)
    per_call_us = (elapsed / 20000) * 1_000_000

    # Loose guardrail for object construction overhead.
    assert per_call_us < 100
