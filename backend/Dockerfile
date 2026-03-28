FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install PyTorch CPU-only first (smaller image)
RUN pip install --no-cache-dir \
    torch==2.2.1+cpu \
    torchvision==0.17.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi==0.110.0 \
    uvicorn[standard]==0.27.1 \
    python-multipart==0.0.9 \
    websockets==12.0 \
    compressai==1.2.6 \
    Pillow==10.2.0 \
    numpy==1.26.4 \
    scikit-image==0.22.0

# Pre-download the compressai pretrained model (quality 4)
RUN python -c "\
import torch; \
from compressai.zoo import bmshj2018_factorized; \
m = bmshj2018_factorized(quality=4, pretrained=True); \
print('Model downloaded successfully')"

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--ws", "websockets"]
