# CodeAtlas - Quick Start Guide

## Overview

CodeAtlas is an enterprise-grade architecture intelligence platform that analyzes codebases, generates dependency graphs, calculates risk scores, and provides modernization recommendations.

## Architecture

```
codeatlas/
├── backend/          # FastAPI backend (Python)
│   ├── app/
│   │   ├── main.py          # API endpoints
│   │   ├── scanner.py       # Code scanning
│   │   ├── graph.py         # Graph generation
│   │   ├── risk.py          # Risk analysis
│   │   └── models.py        # Data models
│   └── requirements.txt
└── frontend/         # Next.js frontend (TypeScript)
    ├── app/
    │   ├── page.tsx         # Main dashboard
    │   └── globals.css      # Styling
    ├── components/
    │   ├── dashboard/       # Dashboard components
    │   └── graph/           # Graph visualization
    ├── lib/                 # Utilities
    └── types/               # TypeScript types
```

## Prerequisites

- **Python 3.9+** with pip
- **Node.js 20+** with npm
- **Git** (for repository scanning)

## Installation

### 1. Backend Setup

```bash
# Navigate to backend directory
cd codeatlas/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd codeatlas/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

## Usage

### Step 1: Access the Dashboard

Open your browser and navigate to **http://localhost:3000**

### Step 2: Scan a Repository

You have two options:

#### Option A: Scan Local Repository

1. Click **"Local Path"** tab
2. Enter the **full path** to your local repository
   - Windows: `C:\Users\YourName\Projects\my-repo`
   - macOS/Linux: `/Users/yourname/projects/my-repo`
3. Click **"Analyze Repository"**

#### Option B: Import from GitHub

1. Click **"GitHub URL"** tab
2. Enter a **public GitHub repository URL**
   - Example: `https://github.com/facebook/react`
   - Example: `https://github.com/vercel/next.js`
3. Click **"Import from GitHub"**
4. Wait for the repository to be cloned and analyzed

**Note**: Only public GitHub repositories are supported. Private repositories require authentication (not yet implemented).

### Step 3: Wait for Analysis

The scan may take a few seconds to minutes depending on repository size. You'll see a loading indicator with the message "Cloning and analyzing repository..." for GitHub imports.

### Step 4: Explore the Results

#### Dashboard Metrics
- **Total Files**: Number of code files analyzed
- **High Risk Modules**: Files with 60-80% risk score
- **Critical Modules**: Files with 80-100% risk score
- **Complexity Score**: Overall architecture complexity

#### Interactive Graph
- **Nodes**: Represent code files, colored by risk level
  - 🟢 Green: Low risk (0-40%)
  - 🟡 Yellow: Medium risk (40-60%)
  - 🟠 Orange: High risk (60-80%)
  - 🔴 Red: Critical risk (80-100%)
- **Edges**: Show dependencies between files
- **Controls**: Zoom, pan, and navigate the graph

#### Node Details
Click any node to see:
- File path and language
- Risk score with visual indicator
- Lines of code
- Centrality (importance in the codebase)
- Blast radius (impact of changes)
- Imports, functions, and classes
- Modernization recommendations

## API Endpoints

### Backend API (Port 8000)

#### POST /scan
Scan a local repository and generate dependency graph.

**Request:**
```json
{
  "path": "/path/to/repository",
  "include_hidden": false,
  "max_depth": null
}
```

#### POST /github/import
Import and analyze a public GitHub repository.

**Request:**
```json
{
  "github_url": "https://github.com/owner/repo",
  "include_hidden": false,
  "max_depth": null
}
```

**Response:**
```json
{
  "success": true,
  "clone_path": "backend/tmp/repos/owner_repo_timestamp",
  "repo_name": "repo",
  "owner": "owner",
  "branch": "main",
  "github_url": "https://github.com/owner/repo.git",
  "scan_result": {...},
  "graph_data": {...}
}
```

#### GET /graph
Retrieve existing graph data.

**Query Parameters:**
- `repo_path`: Repository path

#### GET /health
Health check endpoint.

## Configuration

### Backend (.env)
```env
# Optional: Configure settings
LOG_LEVEL=INFO
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

### Backend Issues

**Problem**: Module not found errors
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt
```

**Problem**: Port 8000 already in use
```bash
# Solution: Use a different port
python -m uvicorn app.main:app --reload --port 8001
# Update frontend .env.local accordingly
```

### Frontend Issues

**Problem**: Dependency conflicts
```bash
# Solution: Use legacy peer deps
npm install --legacy-peer-deps
```

**Problem**: Cannot connect to backend
- Verify backend is running on port 8000
- Check `.env.local` has correct API URL
- Ensure no CORS issues (backend has CORS enabled)

**Problem**: Graph not rendering
- Check browser console for errors
- Verify repository path is correct
- Ensure repository has supported code files

## Supported Languages

- Python (.py)
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Java (.java)
- C/C++ (.c, .cpp, .h, .hpp)
- Go (.go)
- Rust (.rs)
- Ruby (.rb)
- PHP (.php)

## Performance Tips

1. **Large Repositories**: First scan may take time; subsequent scans are faster
2. **Graph Navigation**: Use minimap for quick navigation in large graphs
3. **Node Selection**: Click nodes to focus on specific modules
4. **Zoom Controls**: Use mouse wheel or controls for better view

## Demo Tips

For impressive hackathon demos:

1. **Start with Overview**: Show the clean, modern UI
2. **Scan a Real Project**: Use a well-known open-source project
3. **Highlight Risk Nodes**: Click on critical/high-risk nodes
4. **Show Details Panel**: Demonstrate comprehensive insights
5. **Navigate Graph**: Show smooth interactions and animations
6. **Explain Metrics**: Walk through the dashboard metrics

## Next Steps

### Phase 4: AI Integration (Future)
- AI-powered modernization recommendations
- Natural language queries
- Automated refactoring suggestions
- Code quality predictions

## Support

For issues or questions:
1. Check the documentation in each directory
2. Review the PHASE2_DOCUMENTATION.md and PHASE3_DOCUMENTATION.md
3. Inspect browser console and terminal logs

## License

Part of the CodeAtlas project.

---

**Quick Reference:**
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs