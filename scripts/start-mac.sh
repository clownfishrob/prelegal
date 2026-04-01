#!/bin/bash
set -e

cd "$(dirname "$0")/.."

# Stop existing container if running
if docker ps -q --filter "name=prelegal" | grep -q .; then
    echo "Stopping existing container..."
    docker stop prelegal
    docker rm prelegal
elif docker ps -aq --filter "name=prelegal" | grep -q .; then
    docker rm prelegal
fi

echo "Building Docker image..."
docker build -t prelegal .

echo "Starting container..."
if [ -f .env ]; then
    docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
else
    echo "Warning: No .env file found. Using defaults."
    docker run -d --name prelegal -p 8000:8000 prelegal
fi

echo "Prelegal is running at http://localhost:8000"
