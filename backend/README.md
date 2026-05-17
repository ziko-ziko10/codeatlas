# CodeAtlas Backend

FastAPI backend for CodeAtlas - repository analysis and risk scoring engine.

## Features

- Multi-language repository scanning (Python, JavaScript, TypeScript, Java)
- Dependency detection and import analysis
- Risk scoring based on complexity, size, and code quality indicators
- TODO/FIXME tracking
- Folder and language summaries

## Setup

### Prerequisites

- Python 3.9 or higher
- pip

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python directly
python -m app.main
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## API Endpoints

### Health Check
```
GET /health
GET /api/health
```

Returns API status and version.

### Scan Repository
```
POST /scan
```

Request body:
```json
{
  "path": "/path/to/repository",
  "include_hidden": false,
  "max_depth": null
}
```

Response includes:
- Repository metadata (total files, lines, languages)
- File-level analysis (risk scores, complexity, dependencies)
- Folder summaries
- Language distribution
- Overall statistics

### Import from GitHub
```
POST /github/import
```

Import and analyze a public GitHub repository.

Request body:
```json
{
  "github_url": "https://github.com/owner/repo",
  "include_hidden": false,
  "max_depth": null
}
```

Response includes:
- Clone information (path, owner, repo name, branch)
- Complete scan result
- Dependency graph data

**Features:**
- ✅ Shallow clone (--depth 1) for faster imports
- ✅ Automatic cleanup on errors
- ✅ Path traversal protection
- ✅ URL validation (only github.com)
- ✅ Public repositories only
- ✅ 5-minute timeout protection

**Example URLs:**
- `https://github.com/facebook/react`
- `https://github.com/vercel/next.js`
- `https://github.com/owner/repo.git`

**Security:**
- Only public GitHub repositories are supported
- Private repositories require authentication (not yet supported)
- All clones are stored in isolated temporary directories
- Automatic sanitization of repository names

## Configuration

Edit `app/config.py` to customize:
- Ignored directories
- Supported file extensions
- Risk scoring weights and thresholds
- Maximum file size

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application
│   ├── config.py        # Configuration settings
│   ├── models.py        # Pydantic data models
│   ├── scanner.py       # Repository scanner
│   └── risk.py          # Risk scoring logic
├── requirements.txt
├── .env.example
└── README.md
```

## Example Usage

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Scan a local repository
curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/your/repo"}'

# Import from GitHub
curl -X POST http://localhost:8000/github/import \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/facebook/react"}'
```

### Using Python

```python
import requests

# Scan local repository
response = requests.post(
    "http://localhost:8000/scan",
    json={"path": "/path/to/your/repo"}
)

result = response.json()
print(f"Total files: {result['metadata']['total_files']}")
print(f"High risk files: {result['summary']['high_risk_files']}")

# Import from GitHub
response = requests.post(
    "http://localhost:8000/github/import",
    json={"github_url": "https://github.com/owner/repo"}
)

result = response.json()
print(f"Repository: {result['owner']}/{result['repo_name']}")
print(f"Branch: {result['branch']}")
print(f"Total files: {result['scan_result']['metadata']['total_files']}")
```

## Risk Scoring

Files are scored based on:
- **Lines of Code** (30%): Larger files are harder to maintain
- **Complexity** (25%): Cyclomatic complexity estimate
- **TODO/FIXME Count** (15%): Technical debt indicators
- **Import Count** (15%): High coupling risk
- **Function Count** (15%): Too many functions may indicate complexity

Risk levels:
- **Low**: 0-25
- **Medium**: 25-50
- **High**: 50-75
- **Critical**: 75-100

## Language Support

### Python
- Uses AST parsing for accurate analysis
- Detects imports, functions, classes, control flow

### JavaScript/TypeScript
- Regex-based pattern matching
- Detects imports, functions, classes, control structures

### Java
- Regex-based pattern matching
- Detects imports, methods, classes, control structures

## Development

### Adding New Language Support

1. Add file extensions to `config.py`:
```python
LANGUAGE_EXTENSIONS = {
    "newlang": {".ext1", ".ext2"},
}
```

2. Implement analyzer in `scanner.py`:
```python
def _analyze_newlang(self, content: str) -> Dict[str, int]:
    # Your analysis logic
    return {
        "import_count": 0,
        "function_count": 0,
        "class_count": 0,
        "nesting_indicators": 0,
    }
```

## Testing

Test the scanner with a sample repository:

```bash
# Create a test directory
mkdir test_repo
cd test_repo

# Add some sample files
echo "import os\ndef hello():\n    print('hello')" > test.py
echo "const x = 1;" > test.js

# Scan it
curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{"path": "./test_repo"}'
```

## Troubleshooting

### Import errors
Make sure you're running from the backend directory and the virtual environment is activated.

### Permission errors
Ensure the API has read permissions for the directories you're scanning.

### Large repositories
For very large repositories, consider:
- Setting `max_depth` to limit recursion
- Excluding more directories in `config.py`
- Increasing `MAX_FILE_SIZE` if needed

## License

MIT License - IBM Bob Hackathon 2026