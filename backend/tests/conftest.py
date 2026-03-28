"""Shared pytest fixtures."""
import io
import json

import numpy as np
import pytest
import pytest_asyncio
from PIL import Image


def make_test_image(width: int = 128, height: int = 128) -> bytes:
    """Create a small JPEG image as bytes for testing."""
    arr = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(arr, "RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


@pytest.fixture
def test_image_bytes():
    return make_test_image()


@pytest.fixture
def small_image_bytes():
    return make_test_image(64, 64)
