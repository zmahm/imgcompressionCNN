"""Unit tests for image quality metrics."""
import numpy as np
import pytest

from app.metrics import compute_psnr, compute_ssim


def make_image(h=64, w=64, value=None):
    if value is not None:
        return np.full((h, w, 3), value, dtype=np.float32)
    rng = np.random.default_rng(42)
    return rng.random((h, w, 3)).astype(np.float32)


class TestPSNR:
    def test_identical_images_returns_high_value(self):
        img = make_image()
        result = compute_psnr(img, img)
        assert result == 100.0

    def test_different_images_returns_finite_positive(self):
        a = make_image(value=0.0)
        b = make_image(value=1.0)
        result = compute_psnr(a, b)
        assert result > 0
        assert np.isfinite(result)

    def test_noisy_image_psnr_range(self):
        rng = np.random.default_rng(0)
        original = rng.random((128, 128, 3)).astype(np.float32)
        noise = rng.normal(0, 0.05, original.shape).astype(np.float32)
        noisy = np.clip(original + noise, 0, 1)
        psnr = compute_psnr(original, noisy)
        # Typical range for small noise: 20–40 dB
        assert 20 < psnr < 50

    def test_higher_noise_gives_lower_psnr(self):
        rng = np.random.default_rng(1)
        original = rng.random((64, 64, 3)).astype(np.float32)
        low_noise = np.clip(original + rng.normal(0, 0.02, original.shape), 0, 1).astype(np.float32)
        high_noise = np.clip(original + rng.normal(0, 0.2, original.shape), 0, 1).astype(np.float32)
        assert compute_psnr(original, low_noise) > compute_psnr(original, high_noise)


class TestSSIM:
    def test_identical_images_returns_one(self):
        img = make_image()
        result = compute_ssim(img, img)
        assert abs(result - 1.0) < 1e-4

    def test_different_images_less_than_one(self):
        a = make_image(value=0.0)
        b = make_image(value=1.0)
        result = compute_ssim(a, b)
        assert result < 1.0

    def test_ssim_range(self):
        rng = np.random.default_rng(2)
        original = rng.random((64, 64, 3)).astype(np.float32)
        noisy = np.clip(original + rng.normal(0, 0.1, original.shape), 0, 1).astype(np.float32)
        result = compute_ssim(original, noisy)
        assert -1.0 <= result <= 1.0
