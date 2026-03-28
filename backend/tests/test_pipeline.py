"""Unit tests for the compression pipeline."""
import asyncio
import io
import json

import numpy as np
import pytest
import pytest_asyncio
from PIL import Image

from app.pipeline import compress_image, _preprocess, _latent_heatmap
import torch


def make_image(w=128, h=128) -> bytes:
    arr = np.random.randint(0, 255, (h, w, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class TestPreprocess:
    def test_returns_rgb_image(self):
        img_bytes = make_image(200, 150)
        img, orig_size = _preprocess(img_bytes)
        assert img.mode == "RGB"
        assert orig_size == len(img_bytes)

    def test_resizes_large_image(self):
        img_bytes = make_image(2000, 2000)
        img, _ = _preprocess(img_bytes)
        w, h = img.size
        assert max(w, h) <= 768

    def test_pads_to_multiple_of_64(self):
        img_bytes = make_image(100, 100)
        img, _ = _preprocess(img_bytes)
        w, h = img.size
        assert w % 64 == 0
        assert h % 64 == 0

    def test_small_image_unchanged_size_padded(self):
        img_bytes = make_image(64, 64)
        img, _ = _preprocess(img_bytes)
        assert img.size == (64, 64)


class TestLatentHeatmap:
    def test_heatmap_shape_matches_spatial_dims(self):
        y = torch.randn(1, 128, 8, 8)
        hmap = _latent_heatmap(y)
        assert len(hmap) == 8
        assert len(hmap[0]) == 8

    def test_heatmap_values_in_zero_one(self):
        y = torch.randn(1, 32, 4, 4)
        hmap = _latent_heatmap(y)
        flat = [v for row in hmap for v in row]
        assert all(0.0 <= v <= 1.0 for v in flat)


@pytest.mark.asyncio
async def test_full_pipeline_sends_complete():
    """Full pipeline integration test — verifies a 'complete' message is sent."""
    img_bytes = make_image(64, 64)
    messages = []

    async def capture(msg: dict):
        messages.append(msg)

    await compress_image(img_bytes, quality=1, send=capture)

    types = [m["type"] for m in messages]
    assert "complete" in types

    complete = next(m for m in messages if m["type"] == "complete")
    data = complete["data"]
    assert "psnr" in data
    assert "ssim" in data
    assert "bpp" in data
    assert "original_image" in data
    assert "reconstructed_image" in data
    assert data["psnr"] > 0
    assert 0 < data["ssim"] <= 1.0
    assert data["bpp"] > 0


@pytest.mark.asyncio
async def test_pipeline_sends_all_stages():
    img_bytes = make_image(64, 64)
    messages = []

    async def capture(msg: dict):
        messages.append(msg)

    await compress_image(img_bytes, quality=1, send=capture)

    stage_starts = {m["stage"] for m in messages if m["type"] == "stage_start"}
    expected = {"preprocessing", "encoding", "latent", "quantizing",
                "entropy_coding", "decoding", "postprocessing"}
    assert expected == stage_starts


@pytest.mark.asyncio
async def test_pipeline_latent_data_has_heatmap():
    img_bytes = make_image(64, 64)
    messages = []

    async def capture(msg: dict):
        messages.append(msg)

    await compress_image(img_bytes, quality=1, send=capture)

    latent_msgs = [m for m in messages if m.get("stage") == "latent" and m["type"] == "stage_data"]
    assert latent_msgs, "No latent stage_data message found"
    data = latent_msgs[0]["data"]
    assert "heatmap" in data
    assert "shape" in data
    assert "sample_values" in data
