"""
Configuration settings for CodeAtlas backend
"""
from typing import Set

# Directories to ignore during scanning
IGNORED_DIRECTORIES: Set[str] = {
    "node_modules",
    ".git",
    "dist",
    "build",
    "__pycache__",
    ".next",
    "venv",
    "env",
    ".venv",
    "virtualenv",
    ".pytest_cache",
    ".mypy_cache",
    "coverage",
    ".coverage",
    "htmlcov",
    "target",  # Java/Maven
    "out",     # Java/Gradle
    ".idea",
    ".vscode",
    ".DS_Store",
}

# File extensions to scan by language
LANGUAGE_EXTENSIONS = {
    "python": {".py", ".pyw"},
    "javascript": {".js", ".jsx", ".mjs", ".cjs"},
    "typescript": {".ts", ".tsx"},
    "java": {".java"},
}

# All supported extensions
SUPPORTED_EXTENSIONS = set()
for exts in LANGUAGE_EXTENSIONS.values():
    SUPPORTED_EXTENSIONS.update(exts)

# Risk scoring weights
RISK_WEIGHTS = {
    "lines_of_code": 0.3,      # Larger files are riskier
    "complexity": 0.25,         # More complex code is riskier
    "todo_fixme_count": 0.15,   # Technical debt indicators
    "import_count": 0.15,       # High coupling
    "function_count": 0.15,     # Too many functions might indicate complexity
}

# Thresholds for risk scoring
RISK_THRESHOLDS = {
    "lines_of_code": {
        "low": 100,
        "medium": 300,
        "high": 500,
    },
    "complexity": {
        "low": 5,
        "medium": 10,
        "high": 20,
    },
    "todo_fixme_count": {
        "low": 2,
        "medium": 5,
        "high": 10,
    },
    "import_count": {
        "low": 5,
        "medium": 15,
        "high": 30,
    },
    "function_count": {
        "low": 5,
        "medium": 15,
        "high": 30,
    },
}

# Maximum file size to scan (in bytes) - 1MB
MAX_FILE_SIZE = 1024 * 1024

# API Configuration
API_TITLE = "CodeAtlas API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Google Maps for Legacy Codebases - Repository Analysis API"

# Made with Bob
