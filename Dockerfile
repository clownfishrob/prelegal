# Stage 1: Build frontend static export
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Python runtime with FastAPI
FROM python:3.12-slim
WORKDIR /app

RUN pip install uv

COPY backend/pyproject.toml backend/uv.lock backend/
RUN cd backend && uv sync --no-dev --frozen

COPY backend/ backend/
COPY templates/ templates/
COPY --from=frontend-builder /app/frontend/out frontend/out

EXPOSE 8000
CMD ["backend/.venv/bin/uvicorn", "main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
