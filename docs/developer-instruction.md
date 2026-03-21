# CommunityPulse

Upstream health equity, one story at a time. CommunityPulse empowers outreach workers to capture patient stories, identify social determinants of health, and visualize community needs.

Built at **Hack the Globe 2026**.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Ollama](https://ollama.com) (local LLM for PII masking)

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

2. Start Ollama (in a separate terminal):

```bash
ollama serve
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Interview** — Outreach workers record patient stories and demographics using a secure form with speech-to-text.
2. **Analyze** — A local LLM (via Ollama) obfuscates PHI/PII and classifies each story against social determinants of health. All data stays on your machine.
3. **Visualize** — Results appear on a filterable heatmap for stakeholders to plan upstream interventions.

