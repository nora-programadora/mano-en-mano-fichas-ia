# Mano en Mano · AI Listing Generator

> Upload a photo of a secondhand garment and get a ready-to-edit product listing: title, description, color, category, garment type, season and condition. Runs 100% locally with open-weight AI.

Built for the **Hacktoberfest 2026 Open-Source AI Challenge, Week 2: Side Hustle**.

**Status:** 🚧 work in progress. This README is updated as the project advances.

---

## The problem

[Mano en Mano](https://manoenmano.mx) is a circular-economy marketplace for secondhand clothing. Every seller has to write a listing for each garment: title, description, category, season, condition... For people selling dozens of items, that is slow, repetitive work, and it is one of the main reasons secondhand clothes never get listed.

## What it does

1. The seller uploads one or more photos of a garment.
2. A local vision model analyzes the images.
3. The app returns a structured listing that **pre-fills the form**.
4. The seller reviews, edits what is wrong and publishes.

The model suggests; the seller always has the final word.

### Fields generated

| Field | Notes |
|---|---|
| `title` | Short and descriptive, no invented phrases |
| `description` | 1–2 sentences, only what is visible in the photo |
| `color` | Main color |
| `category` | One value from a closed list |
| `type_of_clothes` | Shirt, pants, dress, jacket... |
| `season` | One value from a closed list |
| `state` | One value from a closed condition scale |

When something cannot be determined from the photo, the model returns `unknown` instead of guessing.

> Output language: English.

## Why open-source AI

- **Privacy:** sellers' photos are processed on the machine and never sent to a third-party server.
- **Cost:** no per-request fees. For a marketplace where each garment is worth little, cost per listing has to be close to zero.
- **Control:** I can change the model, adjust the prompt and the JSON schema, and eventually fine-tune on real marketplace data.
- **No lock-in:** swapping Gemma for another open-weight model is a one-line change.

## Tech stack

- **Model:** [Gemma 3](https://ai.google.dev/gemma) (vision-capable, open weights)
- **Inference:** [Ollama](https://ollama.com) running locally
- **Backend:** Node.js + TypeScript
- **Frontend:** React
- **Structured output:** JSON schema passed to Ollama's `format` parameter

## Getting started

### Prerequisites

- [Ollama](https://ollama.com/download) installed
- Node.js 20+
- A machine with at least 16 GB of RAM is recommended for the 12B model; the 4B model is lighter.

### 1. Download the model

```bash
ollama pull gemma3:4b
# optional, higher quality:
ollama pull gemma3:12b
```

### 2. Quick test from the terminal

```bash
ollama run gemma3:4b "Analyze this garment and answer only in JSON with: title, description, color, category, type_of_clothes, season, state. Answer in English. /path/to/photo.jpg"
```

### 3. Run the app

```bash
git clone https://github.com/nora-programadora/mano-en-mano-fichas-ia.git
cd mano-en-mano-fichas-ia
cp .env.example .env
npm install
npm run dev
```

> ⚠️ The commands for step 3 are a placeholder and will be updated when the app is ready.

### Configuration

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Where Ollama is running |
| `OLLAMA_MODEL` | `gemma3:4b` | Model used for analysis |

If you run the backend inside WSL and Ollama on Windows, see the WSL networking note in the docs (to be added).

## Project structure (planned)

```
.
├── README.md
├── schema.json        # JSON schema with the allowed values for each field
├── prompts/           # System prompt and examples
├── server/            # API: POST /generate-listing
├── web/               # React demo UI
└── examples/          # Test photos and generated results
```

## Roadmap

- [x] First proof of concept: photo → JSON with Gemma 3 via Ollama
- [ ] Closed lists for category, season and condition (`schema.json`)
- [ ] Structured output enforced with Ollama's `format` parameter
- [ ] `POST /generate-listing` endpoint
- [ ] React UI with an editable pre-filled form
- [ ] Comparison of `gemma3:4b` vs `gemma3:12b` on real garments
- [ ] Test with real Mano en Mano sellers
- [ ] Garment measurements in cm (flat-lay photo + reference marker)
- [ ] Fine-tuning with marketplace data
- [ ] Integration into the Mano en Mano app

## Results

_To be filled in with real data: accuracy per field, time per listing, hardware used and feedback from first users._

## Limitations

- Condition (`state`) is hard to judge from a single photo, so it is always editable and confirmed by the seller.
- Quality depends on photo lighting and background.
- Small models can invent details; the prompt and schema are designed to reduce this.

## License

[MIT](LICENSE)

## Author

Built by **Nora Aguirre** · Founder of [Mano en Mano](https://manoenmano.mx)
