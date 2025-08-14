# IdeaArena Backend 🚀

FastAPI backend service for AI-powered idea evaluation platform.

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
│   │   ├── ideas.py           # Idea submission endpoints
│   │   └── leaderboard.py     # Leaderboard endpoints
│   └── services/
│       ├── __init__.py
│       ├── ai_service.py       # Gemini AI integration (single or multi-key)
│       ├── agent_service.py    # Web-augmented (Google CSE) agentic evaluation
│       ├── gemini_client.py    # Round-robin Gemini multi-key wrapper
│       ├── key_manager.py      # Thread-safe round-robin key manager
│       └── firebase_service.py # Firebase Firestore operations
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
# Option 1: Using the run script
python run.py

# Option 2: Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Option 3: Using the main module
python main.py
```

The API will be available at `http://localhost:8000`

## 📡 API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check

### Ideas
- `POST /ideas/submit` - Submit idea for evaluation (10 criteria, totalScore is average)

### Leaderboard
- `GET /leaderboard` - Get current rankings

### Users
- `POST /users/profile` - Create/update user profile (branch, rollNumber); persists `lastEvaluation`
- `GET /users/profile/{uid}` - Get user profile, including latest `lastEvaluation` if present

## 🧩 Architecture

### Models (`app/models/`)
- **schemas.py**: Pydantic models for request/response validation
  - `IdeaSubmission`: Request model for idea submissions
  - `EvaluationResponse`: AI evaluation results
  - `LeaderboardEntry`: Leaderboard data structure
  - `APIResponse`: Generic API response
  - `HealthResponse`: Health check response

### Services (`app/services/`)
- **ai_service.py**: Gemini AI integration
  - Prompt engineering for idea evaluation
  - Response parsing and validation
  - Error handling for AI failures

- **firebase_service.py**: Firebase Firestore operations
  - Leaderboard updates
  - Data retrieval
  - Connection management

### Routers (`app/routers/`)
- **health.py**: Health check and status endpoints
- **ideas.py**: Idea submission and evaluation
- **leaderboard.py**: Leaderboard data retrieval

### Configuration (`app/core/`)
- **config.py**: Centralized configuration management
  - Environment variable loading
  - Settings validation
  - Default values

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `FIREBASE_PROJECT_ID` | Firebase project ID | No | - |
| `CORS_ORIGINS` | Allowed CORS origins | No | `http://localhost:5173` |
| `DEBUG` | Enable debug mode | No | `false` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to Firebase service account JSON | No | `./firebase_admin_sdk.json` |

### Firebase Setup
1. Create Firebase project
2. Enable Firestore (Native mode)
3. Set up a service account for Admin SDK
4. Add your service account JSON as `backend/firebase_admin_sdk.json` or set `FIREBASE_SERVICE_ACCOUNT_KEY` to its path

### Gemini AI Setup
1. Get API key(s) from Google AI Studio
2. Add either GEMINI_API_KEY (single) or GEMINI_API_KEYS (comma-separated) in `.env`
3. We automatically use round-robin across keys to reduce rate limits during the event

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

### Scoring Criteria (10, each 1–100)
1. Problem Clarity
2. Originality
3. Feasibility
4. Technical Complexity
5. Scalability
6. Market Size
7. Business Model
8. Impact
9. Execution Plan
10. Risk Mitigation

Total score is the average of all 10 criteria (rounded, 1–100).

### Prompt Engineering
- Structured prompts for consistent evaluation
- JSON response format enforcement
- Educational feedback generation
- Optional agentic path: lightweight Google CSE search + context synthesis before Gemini

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

# Submit idea (POST request with JSON body)
curl -X POST http://localhost:8000/ideas/submit \
  -H "Content-Type: application/json" \
  -d '{"uid":"test","name":"Test User","branch":"CSE","rollNumber":"TEST001","idea":"A revolutionary app that solves world hunger using AI and blockchain technology..."}'

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
