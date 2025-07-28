# MT5 Service Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY services/mt5-service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY services/mt5-service/ .

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Set environment variables
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["python", "app.py"]