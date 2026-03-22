#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="dynamodb-local"
DYNAMO_ENDPOINT="http://127.0.0.1:8000"
OLLAMA_ENDPOINT="http://127.0.0.1:11434/api/tags"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DYNAMO_DATA_DIR="${PROJECT_ROOT}/.local/dynamodb"

ensure_dynamodb_local() {
  mkdir -p "${DYNAMO_DATA_DIR}"

  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "DynamoDB Local is already running at ${DYNAMO_ENDPOINT}"
    return
  fi

  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Starting existing DynamoDB Local container"
    docker start "${CONTAINER_NAME}" >/dev/null
    echo "DynamoDB Local is running at ${DYNAMO_ENDPOINT}"
    return
  fi

  echo "Creating and starting DynamoDB Local container"
  docker run -d \
    --name "${CONTAINER_NAME}" \
    -p 8000:8000 \
    -v "${DYNAMO_DATA_DIR}:/home/dynamodblocal/data" \
    amazon/dynamodb-local \
    -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data >/dev/null

  echo "DynamoDB Local is running at ${DYNAMO_ENDPOINT}"
}

ensure_ollama() {
  if curl -fsS "${OLLAMA_ENDPOINT}" >/dev/null; then
    echo "Ollama is already running at http://127.0.0.1:11434"
    return
  fi

  if ! command -v ollama >/dev/null 2>&1; then
    echo "Ollama CLI is not installed. Install Ollama and run 'ollama serve'."
    exit 1
  fi

  echo "Starting Ollama in the background"
  nohup ollama serve >/tmp/ollama.log 2>&1 &

  for _ in {1..10}; do
    if curl -fsS "${OLLAMA_ENDPOINT}" >/dev/null; then
      echo "Ollama is running at http://127.0.0.1:11434"
      return
    fi

    sleep 1
  done

  echo "Ollama did not start successfully. Check /tmp/ollama.log for details."
  exit 1
}

ensure_dynamodb_local
ensure_ollama

echo "Local backend dependencies are ready."
