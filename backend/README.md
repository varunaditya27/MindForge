# MindForge Backend 🔥

FastAPI backend powering AI‑tempered idea evaluation with agentic‑first (web‑augmented) scoring, queue smoothing for bursty event traffic, multi‑key Gemini rotation, and privacy‑aware Firestore persistence.

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py          # Application configuration
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py         # Pydantic models
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py          # Health check endpoints
│   │   ├── ideas.py           # Async idea submission + job status endpoints
│   │   └── leaderboard.py     # Leaderboard endpoints
│   └── services/
│       ├── __init__.py
│       ├── ai_service.py        # Core Gemini evaluation (strict JSON prompt + fallback)
│       ├── agent_service.py     # Web-augmented (Google CSE) agentic evaluation layer
│       ├── evaluation_queue.py  # In-memory async job queue + worker
│       ├── gemini_client.py     # Round-robin Gemini multi-key wrapper
│       ├── key_manager.py       # Thread-safe round-robin key manager
│       └── firebase_service.py  # Firebase Firestore operations
├── main.py                    # FastAPI application entry point
├── run.py                     # Development server script
├── requirements.txt           # Python dependencies
└── .env                       # Environment variables
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Setup
Create `.env` file with:
```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_project_id
CORS_ORIGINS=http://localhost:5173,https://your-domain.com
DEBUG=true
# Optional: path to service account JSON if not using default creds
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase_admin_sdk.json
```

### 3. Run Development Server
```bash
# Option 1: Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using the main module
python main.py
```

The API will be available at `http://localhost:8000`

## 📡 API Endpoints (Current)

### Health
- `GET /` – Root
- `GET /health` – Liveness/status

### Ideas (Async Queue Flow)
- `POST /ideas/submit_async` – Enqueue a submission (guard: one per UID) → returns `{ jobId, status: "queued" }`
- `GET /ideas/status/{jobId}` – Poll job status → `queued | processing | completed | failed` (on success includes evaluation payload)

### Leaderboard
- `GET /leaderboard` – Current ranking (public slice only)

### Users
- `POST /users/profile` – Create/update profile (branch, rollNumber, name, etc.)
- `GET /users/profile/{uid}` – Fetch profile + latest private `lastEvaluation`

## 🧩 Architecture Overview

Flow: Client → (Auth via Firebase) → POST queue → Worker (agentic‑first, then baseline AI fallback) → Firestore (public + private slices) → Poll status → UI.

### Layers
- **Routers**: Thin HTTP surface (`ideas`, `leaderboard`, `users`, `health`).
- **Queue (`evaluation_queue`)**: In‑memory FIFO with background worker to absorb traffic bursts & prevent model throttling.
- **Evaluation Core (`ai_service`)**: Deterministic prompt + strict JSON parsing + graceful synthetic fallback path.
- **Agentic Augmentation (`agent_service`)**: Primary evaluation path (if CSE keys) enriching prompts with lightweight web grounding (feasibility / trend / originality signals) before scoring.
- **Multi-Key Rotation (`gemini_client` + `key_manager`)**: Round‑robin usage across `GEMINI_API_KEYS` to reduce per‑key rate limit pressure.
- **Persistence (`firebase_service`)**: Writes two data shapes: public leaderboard doc and private `lastEvaluation` under `users/{uid}`.
- **Config (`core.config`)**: Loads env, supports split Firebase credentials & preview-domain CORS regex.

### Evaluation Decision Tree (Agentic-First)
1. Submission dequeued.
2. If CSE keys present & Gemini reachable → attempt agentic path (multi-query search → context bundle → augmented prompt).
3. If agentic path fails OR keys missing → baseline `ai_service` prompt.
4. If Gemini unavailable → synthetic deterministic fallback (never blocks user).
5. Compute `totalScore` (rounded average of 5 criteria) → persist & return.

Resilience principle: user always gets a structured response quickly; advanced augmentation is opportunistic.

## 🔧 Configuration

### Core Environment Variables
| Variable | Description | Required | Notes |
|----------|-------------|----------|-------|
| `DEBUG` | Enable debug features | No | `true/false` |
| `CORS_ORIGINS` | Comma list of allowed origins | No | e.g. `http://localhost:5173,https://app.vercel.app` |
| `CORS_ALLOW_ORIGIN_REGEX` | Regex for dynamic preview origins | No | Useful for Vercel previews |
| `GEMINI_API_KEY` | Single Gemini key | One of | Provide if not using multi-key |
| `GEMINI_API_KEYS` | Comma-separated Gemini keys | One of | Enables round-robin load balancing |
| `GOOGLE_CSE_API_KEY` | Google Programmable Search API key | No | Needed for agentic mode |
| `GOOGLE_CSE_CX` | Programmable Search Engine CX id | No | Needed for agentic mode |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | Yes | Firestore target |
| `FIREBASE_PRIVATE_KEY_ID` | Firebase service account key id | Yes* | *If using split creds form |
| `FIREBASE_PRIVATE_KEY` | Private key (escaped newlines) | Yes* | Wrap in quotes; `\n` for newlines |
| `FIREBASE_CLIENT_EMAIL` | Service account client email | Yes* |  |
| `FIREBASE_CLIENT_ID` | Service account client id | Yes* |  |
| `FIREBASE_CLIENT_X509_CERT_URL` | Cert URL | No | Optional |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to JSON file | Alt | Alternate to split creds |

Either provide the split credential fields (preferred for managed hosts) OR mount a JSON file and point `FIREBASE_SERVICE_ACCOUNT_KEY` to it.

### Firebase Setup
1. Create Firebase project
2. Enable Firestore (Native mode)
3. Set up a service account for Admin SDK
4. Add your service account JSON as `backend/firebase_admin_sdk.json` or set `FIREBASE_SERVICE_ACCOUNT_KEY` to its path

### Gemini & Agentic Setup
1. Obtain Gemini key(s) from Google AI Studio.
2. (Optional) Supply multiple keys via `GEMINI_API_KEYS` for higher throughput.
3. (Optional Agentic) Create a Google Programmable Search Engine (CSE) → note API key + CX → set `GOOGLE_CSE_API_KEY` & `GOOGLE_CSE_CX`.
4. Agentic mode activates automatically when both CSE values are present.

## 🔒 Security

### CORS Configuration
- Configurable origins via environment variable
- Specific methods allowed (GET, POST, PUT, DELETE)
- Credentials support enabled

### Data Validation
- Pydantic models for all requests/responses
- Input validation and sanitization
- Type checking and constraints

### Error Handling
- Structured error responses
- Logging for debugging
- No sensitive data in error messages

## 📊 AI Evaluation

### Rubric (5 Criteria, 0–100 each)
1. `aiRelevance` – Centrality & plausibility of AI usage
2. `creativity` – Originality / novelty of approach
3. `impact` – Potential real-world value / timeliness
4. `clarity` – Pitch structure & communicative quality (~50 words target)
5. `funFactor` – Delight / memorability / wow

`totalScore` = rounded average of the 5.

### Baseline Prompt
- Constrained JSON schema (exact keys) to minimize hallucinated fields.
- Strict parsing & clamping; invalid responses trigger fallback.

### Agentic Augmentation (Primary When Enabled)
Pipeline (within `agent_service`):
1. Heuristic token extraction & domain inference (no extra LLM calls).
2. Diversified query generation (market, competitors, feasibility, regulation, adoption).
3. Fan-out Google CSE searches (small `num` per query) → merge & score for diversity.
4. Select & fetch top pages; lightweight heuristic content summarization (HTML trimmed & sentence filtered).
5. Assemble `context_bundle` JSON array (titles, snippets, excerpts) injected into system prompt.
6. Gemini reasoning phase (ANALYSIS) then strict JSON emission (JSON_RESPONSE). Parsing strips analysis.
7. Failures at any stage silently degrade to baseline path.

### Fallback Strategy (Priority Order)
1. Agentic evaluation (if CSE keys present)
2. Baseline Gemini evaluation
3. Synthetic deterministic scoring (length-informed) with clearly labeled feedback

This guarantees a timely structured response under quota or network failures.

## 🚢 Deployment

### Development
```bash
python run.py
```

### Production (using Docker)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Platform Deployment
- **Render**: Connect GitHub repo, set environment variables
  - Required: `GEMINI_API_KEY`, `CORS_ORIGINS`
- Optional: `FIREBASE_SERVICE_ACCOUNT_KEY` (upload the JSON as a secret file and reference its mounted path)
- **Heroku**: Use Procfile: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Railway**: Auto-deploy from GitHub with environment variables

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:8000/health

# Submit idea (async) – returns jobId
curl -X POST http://localhost:8000/ideas/submit_async \
  -H "Content-Type: application/json" \
  -d '{"uid":"test","name":"Test User","branch":"CSE","rollNumber":"TEST001","idea":"An AI tool that helps small farmers optimize irrigation using satellite + sensor data... (>=50 words)"}'

# Poll status until completed
curl http://localhost:8000/ideas/status/<jobId>

# Get leaderboard
curl http://localhost:8000/leaderboard
```

### API Documentation
- Swagger UI: `http://localhost:8000/docs` (in debug mode)
- ReDoc: `http://localhost:8000/redoc` (in debug mode)

## 📝 Logging

- Structured logging with timestamps
- Different log levels (INFO, WARNING, ERROR)
- Request/response logging
- Error tracking for debugging

## 🛠 Development

### Adding New Endpoints
1. Create router in `app/routers/`
2. Define models in `app/models/schemas.py`
3. Add business logic to `app/services/`
4. Register router in `main.py`

### Code Style
- Follow PEP 8 guidelines
- Use type hints
- Add docstrings to functions
- Keep functions focused and small

---

Built with ❤️ for RVCE Coding Club events!
