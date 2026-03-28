# Neural Image Compression

An interactive web tool that compresses images using a neural network and visualises every stage of the pipeline in real time. Built on the [bmshj2018 Factorized Prior](https://arxiv.org/abs/1802.01436) model from [CompressAI](https://github.com/InterDigitalInc/CompressAI).

Live demo: **https://imgcompressioncnn.zeshanmahmood.com**

---

## How it works

The compression pipeline runs entirely server-side. Progress is streamed to the browser over a WebSocket so each stage lights up as it happens:

| Stage | What happens |
|---|---|
| **Pre-process** | Image is validated, resized to fit the model (max 768 px), and padded to a multiple of 64 px |
| **Encoder CNN** (`g_a`) | Four convolutional layers transform the image into a compact latent tensor |
| **Latent Space** | The encoder output is visualised as a heatmap — brighter = more energy, harder to compress |
| **Quantize** | Continuous latent values are rounded to integers (lossy, irreversible) |
| **Entropy Code** | An arithmetic coder assigns short bit-strings to frequent values, producing the final bitstream |
| **Decoder CNN** (`g_s`) | The bitstream is decoded back to quantized latents; the synthesis network reconstructs pixels |
| **Post-process** | PSNR and MS-SSIM are computed against the original to quantify quality loss |

Quality levels 1–8 correspond to the eight pretrained checkpoints from CompressAI. Higher = better quality, larger bitstream.

### Slow visualisation mode

Toggle **Slow viz** in the header to enable step-by-step mode. Each stage pauses for ~4 seconds with an explanation of what is happening. The toggle works live — you can flip it mid-compression and the next pause point picks it up immediately.

---

## Architecture

```
imgcompressionCNN/
├── backend/                  # FastAPI service
│   ├── app/
│   │   ├── main.py           # WebSocket endpoint + REST health check
│   │   ├── pipeline.py       # Full compression pipeline, stage-by-stage
│   │   ├── model.py          # CompressAI model loader / singleton cache
│   │   └── metrics.py        # PSNR and MS-SSIM computation
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/
│   │   │   └── useWebSocketCompression.js   # WS state machine + slow toggle
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── UploadZone.jsx
│   │       ├── PipelineViz.jsx    # Animated pipeline progress bar
│   │       ├── StageDetail.jsx    # Per-stage data panels
│   │       ├── LatentHeatmap.jsx
│   │       ├── QuantizationViz.jsx
│   │       ├── BitStreamViz.jsx
│   │       ├── ImageComparison.jsx
│   │       └── MetricsDisplay.jsx
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml        # Local development
```

### WebSocket protocol

The frontend opens a single WebSocket connection per compression run. Messages:

**Client → Server**

```jsonc
{ "type": "config", "quality": 4, "slow": false }  // first message
<binary ArrayBuffer>                                 // second message: image bytes
{ "type": "slow_toggle", "slow": true }             // any time during run
```

**Server → Client**

```jsonc
{ "type": "stage_start",    "stage": "encoding", "message": "..." }
{ "type": "stage_progress", "stage": "encoding", "progress": 0.5 }
{ "type": "stage_data",     "stage": "latent",   "data": { ... } }
{ "type": "complete",       "data": { "psnr": 34.2, "ssim": 0.97, ... } }
{ "type": "error",          "message": "Invalid or unsupported image format." }
```

---

## Running locally

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for backend dev without Docker)
- Node 20+ (for frontend dev without Docker)

### Docker (recommended)

```bash
docker compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/api/health

The first build downloads PyTorch (CPU) and the pretrained CompressAI model weights (~200 MB total). Subsequent builds use the Docker layer cache.

### Backend — without Docker

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install torch==2.2.1+cpu torchvision==0.17.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend — without Docker

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/ws/` and `/api/` to `http://localhost:8000`.

---

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

---

## Security

- **CORS**: Restricted to the production domain. Update `allow_origins` in `backend/app/main.py` for local development.
- **Upload limits**: Images are capped at 20 MB. Minimum size is 8×8 px. Only JPEG, PNG, WebP, BMP, GIF, and TIFF are accepted.
- **Error sanitisation**: Only validation errors (`ValueError`) surface to the client with their message. All other exceptions return a generic "Compression failed" response.
- **Config message size**: WebSocket config and toggle messages are capped at 256 bytes.

---

## Deployment

The `deploy/` directory contains scripts for pushing to the production server over SSH and rebuilding Docker containers. It is excluded from version control because it contains server credentials. Copy the scripts to your local environment and configure the connection details before use.

---

## Model

`bmshj2018_factorized` — Ballé et al., "Variational image compression with a scale hyperprior", ICLR 2018. The factorized prior variant uses a fully factorized entropy model without a side-information network.

Pretrained weights are downloaded automatically by CompressAI on first use and cached inside the Docker image at build time to avoid cold-start latency.

---

## Stack

| Layer | Technology |
|---|---|
| Model | CompressAI · PyTorch 2.2 (CPU) |
| Backend | FastAPI · Uvicorn · WebSockets |
| Frontend | React 18 · Vite · Tailwind CSS · Framer Motion |
| Serving | Nginx (frontend) · Uvicorn (backend) |
| Containers | Docker · Docker Compose |
