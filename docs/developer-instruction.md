# CommunityPulse

Upstream health equity, one story at a time. CommunityPulse empowers outreach workers to capture patient stories, identify social determinants of health, and visualize community needs.

Built at **Hack the Globe 2026**.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/products/docker-desktop/) — required for DynamoDB Local
- [Ollama](https://ollama.com) — local LLM for PII masking and SDOH classification (no data leaves your machine)

### Install Ollama

**macOS (Homebrew):**

```bash
brew install ollama
```

Or download directly from [ollama.com](https://ollama.com).

### Pull the LLM model

```bash
ollama pull llama3
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start local backend services (DynamoDB Local + Ollama):

```bash
npm run start:local-backend
```

> **Note:** Make sure Docker Desktop is running before executing this command. This script starts a DynamoDB Local container on `localhost:8000` and Ollama on `localhost:11434`.

3. (Optional) Seed sample analysis data:

```bash
npm run seed:analysis
```

4. Start the dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Service Overview

| Service | URL | How to verify |
|---|---|---|
| Next.js dev server | `localhost:3000` | Open in browser |
| Ollama | `localhost:11434` | `curl http://localhost:11434/api/tags` |
| DynamoDB Local | `localhost:8000` | `docker ps` shows `dynamodb-local` |

## Troubleshooting

- **`ollama: command not found`** — Install Ollama with `brew install ollama`
- **`model 'llama3' not found`** — Run `ollama pull llama3`
- **`ECONNREFUSED` on Ollama** — Run `ollama serve` in a separate terminal, or use `npm run start:local-backend` which starts it automatically
- **Docker errors** — Make sure Docker Desktop is open and running before running `start:local-backend`

## How It Works

1. **Interview** — Outreach workers record patient stories and demographics using a secure form with speech-to-text.
2. **Analyze** — A local LLM (via Ollama) obfuscates PHI/PII and classifies each story against social determinants of health. All data stays on your machine.
3. **Visualize** — Results appear on a filterable heatmap for stakeholders to plan upstream interventions.

