# VerifAI

> **Don't forward. Verify.**
> An evidence-first misinformation detection platform: paste a claim or upload a forwarded-message screenshot and get a confidence-graded verdict, backed by cited sources, not a bare true/false label.

Built for **FUSIONX 1.0**, AI for Social Good track, problem statement **ASG-04**.

![status](https://img.shields.io/badge/status-hackathon%20prototype-orange)
![license](https://img.shields.io/badge/license-MIT-green)
![backend](https://img.shields.io/badge/backend-FastAPI-009688)
![frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb)

---

## The problem

False claims spread faster than corrections, especially through forwarded messages. People need a quick way to check a claim **and see why** it was judged the way it was.

## What it does

1. Accepts a claim as **text** or as an **image** (OCR reads the screenshot).
2. Extracts the core factual claim from noisy forwarded text.
3. Retrieves **supporting and contradicting evidence** from fact-check APIs, news search and Reddit.
4. Filters out irrelevant evidence, then weights sources by trustworthiness.
5. Classifies each piece of evidence as *supports / contradicts / neutral* (NLI).
6. Combines evidence with secondary signals (writing-style classifier, image reuse check) into a **confidence-graded verdict**.
7. Writes a plain-language explanation that cites the evidence shown on screen.

If there is not enough relevant evidence, it says **"Unverified"** instead of guessing.

## Features

| Feature | Technology |
|---|---|
| Text + image input | React, shadcn/ui |
| OCR for screenshots | Tesseract (`pytesseract`) + OpenCV preprocessing |
| Claim extraction | LLM structured output + spaCy NER |
| Evidence retrieval | Google Fact Check Tools API, Serper/Tavily, Reddit (PRAW), run in parallel |
| Relevance gate | `sentence-transformers` (`all-MiniLM-L6-v2`), cosine similarity |
| Source credibility weighting | Transparent domain-trust dictionary |
| Stance detection | NLI model (`roberta-large-mnli`) |
| Writing-style signal | TF-IDF + Logistic Regression trained on LIAR |
| Image reuse check | Perceptual hashing (`imagehash`) |
| Verdict | Documented weighted ensemble with an insufficient-evidence override |
| Explanation | LLM prompt grounded in the retrieved evidence |
| Stretch | WhatsApp-style input mode, claim history, regional language support |

## Architecture

A modular pipeline: each stage is an independent, testable service, orchestrated by a single `POST /verify` endpoint. A failure in one stage degrades gracefully instead of crashing the verdict.

```
Input -> OCR -> Claim extraction -> Image check -> Evidence retrieval
      -> Relevance gate -> Credibility weighting -> Stance detection
      -> Style score -> Insufficient-evidence rule -> Verdict -> Explanation -> UI
```

The evidence-based verdict is the primary signal. The classifier and image check only adjust confidence.

## Repository layout

```
.
├── backend/          FastAPI app and pipeline stages
├── frontend/         React + Vite + TypeScript UI
├── data/sample/      Small, redacted demo claims (no personal data)
├── docs/             Technical approach and design notes
└── .env.example      Required environment variables (placeholders only)
```

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 20+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed on your system (`pytesseract` is only a wrapper)
- API keys for the services you want to enable (see `.env.example`)

### 1. Clone and configure
```bash
git clone https://github.com/rishikeshrprasad-ship-it/verifai.git
cd verifai
cp .env.example .env     # then fill in your own keys. Never commit .env
```

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```
Interactive API docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Train the style classifier (optional)
Model files and datasets are **not** committed. Download LIAR from its official source and train the classifier locally. Always reuse the same vectorizer that was fitted at training time.

## Configuration

All configuration is via environment variables. See [`.env.example`](.env.example). Key ones:

| Variable | Purpose |
|---|---|
| `GOOGLE_FACTCHECK_API_KEY` | Fact Check Tools API |
| `SERPER_API_KEY` or `TAVILY_API_KEY` | Web/news search |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Reddit API |
| `LLM_API_KEY` / `LLM_MODEL` | Claim extraction and explanations |
| `ALLOWED_ORIGINS` | CORS allowlist (set to your frontend URL in production) |
| `RELEVANCE_THRESHOLD` | Cosine-similarity cutoff (default `0.4`) |

## API

`POST /verify`

```json
{ "text": "Government bans onions from tomorrow!" }
```
or multipart form with an `image` file.

Response: verdict, confidence, per-evidence stance and source, and the explanation text.

## Limitations (please read)

- This is a **hackathon prototype**, not a replacement for professional fact-checkers.
- The writing-style classifier is a weak, secondary signal (modest accuracy on LIAR) and never decides the verdict alone.
- Image check detects **reuse of known images**, not deepfakes or edits.
- OCR accuracy drops on low-resolution, rotated or heavily compressed screenshots.
- Verdicts depend on what the retrieval sources return; "Unverified" is an intentional, honest outcome.

## Security

See [SECURITY.md](SECURITY.md). To report a vulnerability, use GitHub's private vulnerability reporting. Do not open a public issue.

## License

Released under the [MIT License](LICENSE).

## Team

Built by **Corefour** for FUSIONX 1.0.
