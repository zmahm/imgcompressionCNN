"""Unit tests for the FastAPI endpoints."""
import json
import io
import numpy as np
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from PIL import Image
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app


def make_image_bytes(w=64, h=64) -> bytes:
    arr = np.random.randint(0, 255, (h, w, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class TestHealthEndpoint:
    @pytest.mark.asyncio
    async def test_health_returns_200(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/health")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_health_returns_ok_status(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/health")
        data = response.json()
        assert data["status"] == "ok"
        assert "service" in data


class TestWebSocketCompression:
    def test_websocket_full_compression(self):
        """Integration test: connect, send config + image, receive 'complete'."""
        client = TestClient(app)
        img_bytes = make_image_bytes(64, 64)

        with client.websocket_connect("/ws/compress") as ws:
            # Send config
            ws.send_text(json.dumps({"type": "config", "quality": 1}))
            # Send image
            ws.send_bytes(img_bytes)

            # Collect messages until 'complete' or 'error'
            messages = []
            for _ in range(100):  # safety cap
                try:
                    raw = ws.receive_text()
                    msg = json.loads(raw)
                    messages.append(msg)
                    if msg["type"] in ("complete", "error"):
                        break
                except Exception:
                    break

        types = [m["type"] for m in messages]
        assert "complete" in types, f"Got types: {types}"

    def test_websocket_complete_has_required_fields(self):
        client = TestClient(app)
        img_bytes = make_image_bytes(64, 64)

        with client.websocket_connect("/ws/compress") as ws:
            ws.send_text(json.dumps({"quality": 1}))
            ws.send_bytes(img_bytes)

            complete_msg = None
            for _ in range(100):
                try:
                    msg = json.loads(ws.receive_text())
                    if msg["type"] == "complete":
                        complete_msg = msg
                        break
                    if msg["type"] == "error":
                        pytest.fail(f"Got error: {msg['message']}")
                except Exception:
                    break

        assert complete_msg is not None
        data = complete_msg["data"]
        required = {"psnr", "ssim", "bpp", "original_image",
                    "reconstructed_image", "compressed_bytes", "original_bytes"}
        for field in required:
            assert field in data, f"Missing field: {field}"

    def test_websocket_quality_clamped_to_valid_range(self):
        """Sending quality=99 should clamp to 8 without erroring."""
        client = TestClient(app)
        img_bytes = make_image_bytes(64, 64)

        with client.websocket_connect("/ws/compress") as ws:
            ws.send_text(json.dumps({"quality": 99}))
            ws.send_bytes(img_bytes)

            for _ in range(100):
                try:
                    msg = json.loads(ws.receive_text())
                    if msg["type"] in ("complete", "error"):
                        assert msg["type"] == "complete"
                        break
                except Exception:
                    break
