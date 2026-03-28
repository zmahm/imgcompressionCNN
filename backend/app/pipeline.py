"""
Neural image compression pipeline with WebSocket stage updates.

WebSocket message protocol:
  {"type": "stage_start",    "stage": <str>, "message": <str>}
  {"type": "stage_progress", "stage": <str>, "progress": <0.0-1.0>}
  {"type": "stage_data",     "stage": <str>, "data": <dict>}
  {"type": "complete",       "data": <dict>}
  {"type": "error",          "message": <str>}
"""
import asyncio
import base64
import io
from typing import Callable, Awaitable

import numpy as np
import torch
from PIL import Image

from .model import get_model
from .metrics import compute_psnr, compute_ssim

# Maximum dimension (pixels) to keep inference fast
MAX_DIM = 768
# Encoder stride — dimensions must be multiples of this
STRIDE = 64

SendFn = Callable[[dict], Awaitable[None]]


def _to_base64_webp(img: Image.Image, quality: int = 92) -> str:
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=quality)
    return base64.b64encode(buf.getvalue()).decode()


_ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "BMP", "GIF", "TIFF"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB


def _preprocess(image_bytes: bytes) -> tuple:
    """Validate, decode, resize and pad image. Raises ValueError on bad input.

    Returns:
        (padded_img, content_width, content_height) where content dimensions
        are the true image size after any resize but before stride padding.
        The padded image is what the model sees; crop back to content dims
        after reconstruction to strip the padding from the output.
    """
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError("Image exceeds 20 MB limit.")
    if len(image_bytes) == 0:
        raise ValueError("Empty image data.")

    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()  # catch truncated/corrupt files early
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise ValueError("Invalid or unsupported image format.")

    if img.format and img.format.upper() not in _ALLOWED_FORMATS:
        raise ValueError(f"Unsupported format: {img.format}.")

    w, h = img.size
    if w < 8 or h < 8:
        raise ValueError("Image too small (minimum 8×8).")

    # Resize if needed
    if max(w, h) > MAX_DIM:
        scale = MAX_DIM / max(w, h)
        w, h = int(w * scale), int(h * scale)
        img = img.resize((w, h), Image.LANCZOS)

    # Content dimensions — what the user actually sees, before padding
    content_w, content_h = w, h

    # Pad to multiple of STRIDE (encoder requirement only)
    pw = ((w + STRIDE - 1) // STRIDE) * STRIDE
    ph = ((h + STRIDE - 1) // STRIDE) * STRIDE
    if pw != w or ph != h:
        padded = Image.new("RGB", (pw, ph), (0, 0, 0))
        padded.paste(img, (0, 0))
        img = padded

    return img, content_w, content_h


def _img_to_tensor(img: Image.Image) -> torch.Tensor:
    arr = np.array(img, dtype=np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)


def _tensor_to_img(t: torch.Tensor) -> Image.Image:
    arr = t.squeeze(0).permute(1, 2, 0).clamp(0, 1).cpu().numpy()
    return Image.fromarray((arr * 255).astype(np.uint8))


def _latent_heatmap(y: torch.Tensor) -> list[list[float]]:
    """Mean-across-channels heatmap, normalised to [0, 1]."""
    latent_np = y.squeeze(0).cpu().numpy()  # [C, H, W]
    hmap = latent_np.mean(axis=0)           # [H, W]
    lo, hi = hmap.min(), hmap.max()
    if hi > lo:
        hmap = (hmap - lo) / (hi - lo)
    return hmap.tolist()


# Base delays (seconds) per pause point.
# Slow mode multiplies each by _SLOW_MULTIPLIER, giving ≥4 s per stage so
# viewers have time to read the stage explanation before it advances.
_D = {
    "preprocess_done":  1.0,   # slow: 4.0 s
    "encode_step":      0.25,  # ×4 steps → 1.0 s fast, 4.0 s slow
    "latent_done":      1.0,   # slow: 4.0 s
    "quantize_done":    1.0,   # slow: 4.0 s
    "entropy_done":     1.0,   # slow: 4.0 s
    "decode_pre":       0.4,
    "decode_mid":       0.35,
    "decode_post":      0.25,  # decode total: 1.0 s fast, 4.0 s slow
    "postprocess_done": 1.0,   # slow: 4.0 s
}

_SLOW_MULTIPLIER = 4


async def compress_image(
    image_bytes: bytes,
    quality: int,
    send: SendFn,
    slow_flag: list[bool] | None = None,
) -> None:
    """Run the full compression pipeline, sending stage updates via `send`.

    Args:
        slow_flag: A single-element list [bool] shared with the WebSocket
                   handler so slow mode can be toggled live mid-compression.
    """
    if slow_flag is None:
        slow_flag = [False]

    async def pause(key: str) -> None:
        mult = _SLOW_MULTIPLIER if slow_flag[0] else 1
        await asyncio.sleep(_D[key] * mult)

    # ── Stage 1: Preprocessing ────────────────────────────────────────────────
    await send({"type": "stage_start", "stage": "preprocessing",
                "message": "Loading and normalising the image — resizing to fit the model input…"})

    img, content_w, content_h = _preprocess(image_bytes)
    # img may be larger than content_w × content_h due to stride padding.
    # All model operations use the padded image; outputs are cropped back.
    original_bytes = content_w * content_h * 3  # true content baseline
    orig_b64 = _to_base64_webp(img.crop((0, 0, content_w, content_h)))
    x = _img_to_tensor(img)

    await send({"type": "stage_data", "stage": "preprocessing",
                "data": {"width": content_w, "height": content_h,
                         "original_bytes": original_bytes, "preview": orig_b64}})
    await pause("preprocess_done")

    # ── Stage 2: Encoding ─────────────────────────────────────────────────────
    await send({"type": "stage_start", "stage": "encoding",
                "message": "The encoder CNN (g_a) transforms the image into a compact latent representation through successive convolutional layers…"})

    model = get_model(quality)

    with torch.no_grad():
        for step in range(1, 5):
            await pause("encode_step")
            await send({"type": "stage_progress", "stage": "encoding",
                        "progress": step / 4})
        y = model.g_a(x)

    # ── Stage 3: Latent Representation ───────────────────────────────────────
    await send({"type": "stage_start", "stage": "latent",
                "message": "The encoder output is a dense latent tensor — brighter regions hold more energy and are harder to compress…"})

    with torch.no_grad():
        latent_np = y.squeeze(0).cpu().numpy()
        flat = latent_np.flatten()
        sample_idx = np.random.choice(len(flat), min(24, len(flat)), replace=False)
        sample_vals = flat[sample_idx].tolist()

    await send({"type": "stage_data", "stage": "latent",
                "data": {
                    "heatmap": _latent_heatmap(y),
                    "shape": list(y.shape),
                    "min": float(latent_np.min()),
                    "max": float(latent_np.max()),
                    "mean": float(latent_np.mean()),
                    "sample_values": [round(v, 3) for v in sample_vals],
                }})
    await pause("latent_done")

    # ── Stage 4: Quantization ────────────────────────────────────────────────
    await send({"type": "stage_start", "stage": "quantizing",
                "message": "Continuous latent values are rounded to integers — this is where information is irreversibly lost, trading quality for compression…"})

    with torch.no_grad():
        y_sample = y.flatten()[:16].cpu().numpy()
        y_quant = np.round(y_sample)

    await send({"type": "stage_data", "stage": "quantizing",
                "data": {
                    "original_values": [round(float(v), 4) for v in y_sample],
                    "quantized_values": [int(v) for v in y_quant],
                }})
    await pause("quantize_done")

    # ── Stage 5: Entropy Coding ───────────────────────────────────────────────
    await send({"type": "stage_start", "stage": "entropy_coding",
                "message": "An arithmetic entropy coder assigns short codes to frequent values and long codes to rare ones, squeezing the quantized latents into a compact bitstream…"})

    with torch.no_grad():
        compressed = model.compress(x)
        compressed_bytes = sum(len(s[0]) for s in compressed["strings"])
        total_pixels = content_w * content_h  # content only, not padding
        bpp = (compressed_bytes * 8) / total_pixels

    await send({"type": "stage_data", "stage": "entropy_coding",
                "data": {
                    "compressed_bytes": compressed_bytes,
                    "bpp": round(bpp, 4),
                    "total_pixels": total_pixels,
                    "compression_ratio": round(original_bytes / compressed_bytes, 2)
                    if compressed_bytes else 0,
                }})
    await pause("entropy_done")

    # ── Stage 6: Decoding ─────────────────────────────────────────────────────
    await send({"type": "stage_start", "stage": "decoding",
                "message": "The bitstream is entropy-decoded back to quantized latents, then the decoder CNN (g_s) reconstructs a pixel image from them…"})

    with torch.no_grad():
        await pause("decode_pre")
        await send({"type": "stage_progress", "stage": "decoding", "progress": 0.33})

        x_hat = model.decompress(compressed["strings"], compressed["shape"])["x_hat"]

        await pause("decode_mid")
        await send({"type": "stage_progress", "stage": "decoding", "progress": 0.66})
        await pause("decode_post")
        await send({"type": "stage_progress", "stage": "decoding", "progress": 1.0})

    # ── Stage 7: Post-processing & metrics ────────────────────────────────────
    await send({"type": "stage_start", "stage": "postprocessing",
                "message": "Computing PSNR and MS-SSIM between the original and reconstructed image to quantify quality loss…"})

    with torch.no_grad():
        # Crop padding from both the reconstructed image and the reference
        # so output dimensions match the original content and metrics are
        # not diluted by the zero-padded border region.
        recon_img = _tensor_to_img(x_hat).crop((0, 0, content_w, content_h))
        recon_b64 = _to_base64_webp(recon_img)

        x_np = x.squeeze(0).permute(1, 2, 0).cpu().numpy()[:content_h, :content_w]
        x_hat_np = x_hat.squeeze(0).permute(1, 2, 0).clamp(0, 1).cpu().numpy()[:content_h, :content_w]

        psnr = compute_psnr(x_np, x_hat_np)
        ssim = compute_ssim(x_np, x_hat_np)

    await pause("postprocess_done")

    await send({"type": "complete",
                "data": {
                    "original_image": orig_b64,
                    "reconstructed_image": recon_b64,
                    "psnr": round(psnr, 2),
                    "ssim": round(ssim, 4),
                    "bpp": round(bpp, 4),
                    "compressed_bytes": compressed_bytes,
                    "original_bytes": original_bytes,
                    "compression_ratio": round(original_bytes / compressed_bytes, 2)
                    if compressed_bytes else 0,
                    "dimensions": {"width": content_w, "height": content_h},
                    "quality": quality,
                }})
