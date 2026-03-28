"""Singleton model loader for CompressAI pretrained models."""
import torch
from compressai.zoo import bmshj2018_factorized

_models: dict = {}


def get_model(quality: int):
    """Load and cache a pretrained compression model by quality level (1-8)."""
    if not 1 <= quality <= 8:
        raise ValueError(f"Quality must be 1-8, got {quality}")

    if quality not in _models:
        model = bmshj2018_factorized(quality=quality, pretrained=True)
        model.eval()
        _models[quality] = model

    return _models[quality]


def warmup(quality: int = 4):
    """Pre-load a model to avoid cold-start latency on first request."""
    get_model(quality)
