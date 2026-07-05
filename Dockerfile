# Build frontend assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/postcss.config.js ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Build backend runtime
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app/backend

COPY --from=frontend-builder /app/frontend/dist /app/backend/static

RUN mkdir -p /app/backend/uploads /app/backend/data

WORKDIR /app/backend

EXPOSE 8000

# Render 通过 $PORT 环境变量指定端口；本地/Docker 默认 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
