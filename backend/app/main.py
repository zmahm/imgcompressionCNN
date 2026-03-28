"""FastAPI application — REST health endpoint + WebSocket compression endpoint."""
import asyncio
import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .pipeline import compress_image
from .model import warmup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Neural Image Compression API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://imgcompressioncnn.zeshanmahmood.com"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Pre-loading default model (quality=4)…")
    try:
        warmup(4)
        logger.info("Model ready.")
    except Exception as exc:
        logger.warning(f"Model warmup failed (will retry on first request): {exc}")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "imgcompression-backend"}


@app.websocket("/ws/compress")
async def ws_compress(ws: WebSocket):
    await ws.accept()
    logger.info("WebSocket connection accepted")

    async def send(msg: dict):
        await ws.send_text(json.dumps(msg))

    # slow_flag[0] is read by compress_image at each pause point so toggling
    # mid-run takes effect on the very next sleep call.
    slow_flag: list[bool] = [False]

    try:
        # First message: JSON config
        config_raw = await ws.receive_text()
        if len(config_raw) > 256:
            raise ValueError("Config message too large.")
        config = json.loads(config_raw)
        quality = max(1, min(8, int(config.get("quality", 4))))
        slow_flag[0] = bool(config.get("slow", False))

        # Second message: binary image data
        image_bytes = await ws.receive_bytes()
        logger.info(f"Received {len(image_bytes)} bytes quality={quality} slow={slow_flag[0]}")

        # Run compression as a background task so we can receive toggle messages
        # on the same WebSocket connection while it is running.
        compress_task = asyncio.create_task(
            compress_image(image_bytes, quality, send, slow_flag=slow_flag)
        )

        async def _listen_for_toggles() -> None:
            while True:
                try:
                    raw = await ws.receive_text()
                    if len(raw) > 256:
                        continue
                    msg = json.loads(raw)
                    if msg.get("type") == "slow_toggle":
                        slow_flag[0] = bool(msg.get("slow", slow_flag[0]))
                        logger.info(f"Slow mode toggled → {slow_flag[0]}")
                except (WebSocketDisconnect, Exception):
                    break

        listen_task = asyncio.create_task(_listen_for_toggles())
        try:
            await compress_task
        finally:
            listen_task.cancel()

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except ValueError as exc:
        logger.warning(f"Validation error: {exc}")
        try:
            await send({"type": "error", "message": str(exc)})
        except Exception:
            pass
    except Exception as exc:
        logger.error(f"Compression error: {exc}", exc_info=True)
        try:
            await send({"type": "error", "message": "Compression failed. Please try a different image."})
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass
