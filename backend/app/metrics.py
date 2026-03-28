"""Image quality metrics: PSNR and SSIM."""
import numpy as np


def compute_psnr(original: np.ndarray, reconstructed: np.ndarray) -> float:
    """Peak Signal-to-Noise Ratio (higher is better). Images in [0, 1] range."""
    mse = np.mean((original.astype(np.float64) - reconstructed.astype(np.float64)) ** 2)
    if mse == 0.0:
        return 100.0
    return float(20.0 * np.log10(1.0 / np.sqrt(mse)))


def compute_ssim(original: np.ndarray, reconstructed: np.ndarray) -> float:
    """Structural Similarity Index (higher is better, max 1.0). Images in [0, 1] range."""
    from skimage.metrics import structural_similarity
    return float(
        structural_similarity(
            original,
            reconstructed,
            data_range=1.0,
            channel_axis=2,
        )
    )
