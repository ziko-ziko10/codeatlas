# CodeAtlas

> **Map your code. Understand your system.**

CodeAtlas is an AI-powered code intelligence platform that analyzes repository architecture, maps dependencies, identifies risk hotspots, and generates actionable modernization roadmaps. Built for the **IBM Bob AI Hackathon 2026**.

---

## Features

- **Dependency Graph Visualization** — Interactive force-directed graph showing module relationships, coupling, and dependency flow
- **Risk Analysis** — Identifies high-risk modules based on coupling, complexity, and dependency confidence
- **Blast Radius Preview** — Visualizes the impact scope of changes to critical modules
- **Architecture Health Score** — Quantifies system quality across multiple dimensions
- **Modernization Roadmap** — AI-generated phased migration plan with effort estimates
- **Executive Reports** — Exportable PDF reports for CTO-level decision making
- **Dark/Light Mode** — Full theme support with accent color customization
- **Multi-Repo Management** — Switch between analyzed repositories with persistent state

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Static HTML/CSS/JS (vanilla), Canvas API, SSE streaming |
| **Backend** | Python 3.11, FastAPI, Tree-sitter, NetworkX |
| **AI** | watsonx.ai (IBM Granite models) |
| **Analysis** | Tree-sitter AST parsing, graph algorithms, risk scoring |
| **Deployment** | Vercel (frontend), Render/Railway (backend) |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ (optional, for frontend dev server)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure WATSONX_API_KEY if using AI features
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend/public
python -m http.server 3001
```

Open `http://localhost:3001` in your browser.

### Demo Mode

No repository? Click **Demo Data** in the import modal to load pre-analyzed samples.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/scan/stream` | POST | Stream repository scan progress (SSE) |
| `/github/import/stream` | POST | Stream GitHub import progress (SSE) |
| `/metrics/calculate` | POST | Calculate architecture metrics from graph |
| `/blast-radius` | POST | Compute blast radius for a changed file |
| `/ai/module-insight` | POST | Get AI analysis of a specific module |
| `/ai/repo-summary` | POST | Get AI-generated repository summary |
| `/report/export` | POST | Generate exportable report |
| `/demo/list` | GET | List available demo repositories |
| `/demo/load/{name}` | GET | Load demo repository data |
| `/integrations/status` | GET | Check integration connection status |
| `/integrations/configure` | POST | Configure integration settings |

---

## Project Structure

```
codeatlas/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── scanner.py       # Repository scanning engine
│   │   ├── graph.py         # Dependency graph builder
│   │   ├── metrics.py       # Architecture metrics calculator
│   │   ├── risk.py          # Risk scoring engine
│   │   ├── ai.py            # watsonx.ai integration
│   │   ├── report.py        # Report generation
│   │   ├── github_import.py # GitHub API integration
│   │   └── demo.py          # Demo data provider
│   └── requirements.txt
├── frontend/public/
│   ├── index.html           # Landing page
│   ├── dashboard.html       # Main dashboard
│   ├── analysis.html        # Dependency graph view
│   ├── insights.html        # Engineering insights
│   ├── roadmap.html         # Modernization roadmap
│   ├── reports.html         # Report generation
│   ├── settings.html        # Configuration
│   ├── demo.html            # Guided demo
│   ├── design-system.css    # Global design system
│   └── static/js/           # Application JavaScript
└── vercel.json              # Vercel deployment config
```

---

## Architecture Analysis Metrics

| Metric | Description | Range |
|--------|-------------|-------|
| **Architecture Health** | Overall system quality score | 0–100% |
| **Dependency Confidence** | % of imports successfully resolved | 0–100% |
| **Technical Debt Estimate** | Estimated hours to fix critical issues | Hours |
| **Maintainability Score** | Code maintainability index | 0–100% |
| **Modernization Readiness** | Preparedness for migration | 0–100% |
| **Risk Score** | Per-module risk based on coupling/complexity | 0–100% |

---

## Screenshots

| Dashboard | Dependency Graph | Blast Radius |
|-----------|-----------------|--------------|
| Architecture health, risk distribution, activity feed | Interactive force-directed module graph | Impact visualization of critical modules |

---

## Deployment

### Frontend (Vercel)

1. Import this repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `frontend/public`
3. Set **Framework Preset** to **Other**
4. Deploy

### Backend (Render/Railway)

Deploy `backend/` as a Python service:

```bash
# Build command
pip install -r requirements.txt

# Start command
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Update `frontend/public/static/js/api.js` `BASE_URL` to point to your backend.

---

## Hackathon

Built for the **IBM Bob AI Hackathon 2026**.

- **Team**: ziko-ziko10
- **AI Provider**: IBM watsonx.ai (Granite models)

---

## License

MIT

---

## Acknowledgments

- [Tree-sitter](https://tree-sitter.github.io/) for AST parsing
- [NetworkX](https://networkx.org/) for graph algorithms
- [IBM watsonx.ai](https://www.ibm.com/watsonx) for AI capabilities
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
