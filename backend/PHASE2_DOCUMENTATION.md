# CodeAtlas Phase 2 - Dependency Graph & Blast Radius Engine

## Overview

Phase 2 adds dependency graph analysis and blast radius estimation to CodeAtlas. This enables developers to understand code relationships and predict the impact of changes.

## Features Implemented

### 1. Dependency Extraction (`app/graph.py`)

#### Python Dependencies (AST-based)
- Uses Python's `ast` module for accurate parsing
- Extracts `import` and `from...import` statements
- Fallback to regex if AST parsing fails
- Handles:
  - `import module`
  - `from module import item`
  - Nested imports (e.g., `from package.submodule import item`)

#### JavaScript/TypeScript Dependencies (Regex-based)
- ES6 imports: `import x from "y"`
- CommonJS: `require("x")`
- Dynamic imports: `import("x")`
- Named imports: `import { x, y } from "z"`

### 2. Dependency Graph Generation

#### Graph Structure
- **Nodes**: Files/modules with metadata
- **Edges**: Dependency relationships (who imports whom)

#### Node Metadata
Each node includes:
- `path`: File path
- `name`: File name
- `language`: Programming language
- `risk_level`: Risk assessment (low/medium/high/critical)
- `risk_score`: Numeric risk score (0-100)
- `line_count`: Lines of code
- `import_count`: Number of imports
- `function_count`: Number of functions
- `class_count`: Number of classes
- `in_degree`: Number of files that depend on this file
- `out_degree`: Number of files this file depends on
- `centrality`: Importance score in the codebase

### 3. Graph Metrics

#### Node-Level Metrics
- **In-Degree**: How many files depend on this file
- **Out-Degree**: How many files this file depends on
- **Centrality**: PageRank-like score indicating importance

#### Graph-Level Metrics
- **Total Nodes**: Number of files in the graph
- **Total Edges**: Number of dependencies
- **Density**: How interconnected the codebase is
- **Average In/Out Degree**: Average dependency counts
- **Max In/Out Degree**: Maximum dependency counts

#### Critical Modules
Identifies the top 10 most critical modules based on:
- High centrality score
- High in-degree (many dependents)
- Risk score

### 4. Blast Radius Estimation

When a file changes, the system calculates:

#### Directly Affected Files
Files that directly import the changed file

#### Indirectly Affected Files
Files that depend on the directly affected files (transitive dependencies)

#### Risk Severity
- **Low**: 0-3 affected files, isolated changes
- **Medium**: 4-10 affected files, moderate impact
- **High**: 11-20 affected files, significant impact
- **Critical**: 20+ affected files, widespread impact

#### Risk Factors
Identifies specific concerns:
- Changed file has high/critical risk level
- File is heavily depended upon (high in-degree)
- File is central to the codebase (high centrality)
- Large blast radius

#### Test Recommendations
Provides actionable testing guidance:
- Unit tests for changed file
- Tests for directly affected files
- Priority testing for high-risk affected files
- Integration tests for large blast radius
- Full test suite for critical changes
- Regression tests for central files

## API Endpoints

### POST /graph

Generate a dependency graph for a repository.

**Request:**
```json
{
  "path": "/path/to/repository",
  "include_hidden": false,
  "max_depth": null
}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "app/main.py",
      "path": "app/main.py",
      "name": "main.py",
      "language": "python",
      "risk_level": "medium",
      "risk_score": 34.52,
      "line_count": 121,
      "import_count": 8,
      "function_count": 5,
      "class_count": 0,
      "in_degree": 5,
      "out_degree": 7,
      "centrality": 3.64
    }
  ],
  "edges": [
    {
      "source": "app/main.py",
      "target": "app/config.py",
      "type": "dependency"
    }
  ],
  "metrics": {
    "total_nodes": 9,
    "total_edges": 35,
    "density": 0.4861,
    "avg_in_degree": 3.89,
    "avg_out_degree": 3.89,
    "max_in_degree": 5,
    "max_out_degree": 7
  },
  "critical_modules": [
    {
      "path": "app/config.py",
      "centrality": 3.64,
      "in_degree": 5,
      "risk_score": 0.0
    }
  ]
}
```

### POST /blast-radius

Calculate the blast radius for a changed file.

**Request:**
```json
{
  "path": "/path/to/repository",
  "changed_file": "app/graph.py",
  "include_hidden": false,
  "max_depth": null
}
```

**Response:**
```json
{
  "changed_file": "app/graph.py",
  "file_info": {
    "path": "app/graph.py",
    "language": "python",
    "risk_level": "medium",
    "risk_score": 47.35,
    "in_degree": 5,
    "out_degree": 7,
    "centrality": 3.64
  },
  "directly_affected": [
    {
      "path": "app/main.py",
      "risk_level": "medium",
      "language": "python"
    }
  ],
  "indirectly_affected": [],
  "total_affected": 5,
  "risk_severity": "medium",
  "explanation": "Moderate blast radius. 5 files affected.",
  "risk_factors": [
    "File is heavily depended upon (5 direct dependents)"
  ],
  "test_recommendations": [
    "Run unit tests for app/graph.py",
    "Run tests for 5 directly affected file(s)"
  ]
}
```

## Usage Examples

### 1. Generate Dependency Graph

```python
import requests

response = requests.post("http://localhost:8000/graph", json={
    "path": "/path/to/your/project",
    "include_hidden": False,
    "max_depth": 5
})

graph = response.json()
print(f"Total files: {graph['metrics']['total_nodes']}")
print(f"Total dependencies: {graph['metrics']['total_edges']}")
print(f"Critical modules: {len(graph['critical_modules'])}")
```

### 2. Calculate Blast Radius

```python
import requests

response = requests.post("http://localhost:8000/blast-radius", json={
    "path": "/path/to/your/project",
    "changed_file": "src/utils/helper.py"
})

blast = response.json()
print(f"Risk Severity: {blast['risk_severity']}")
print(f"Total Affected: {blast['total_affected']}")
print(f"Test Recommendations:")
for rec in blast['test_recommendations']:
    print(f"  - {rec}")
```

## Testing

Run the test script to verify functionality:

```bash
cd codeatlas/backend
python test_graph.py
```

The test script will:
1. Generate a dependency graph for the backend codebase
2. Calculate blast radius for a sample file
3. Display detailed results and metrics

## React Flow Integration (Future)

The graph output is designed to be directly compatible with React Flow:

```javascript
// Frontend integration example
const { nodes, edges } = await fetch('/graph', {
  method: 'POST',
  body: JSON.stringify({ path: repoPath })
}).then(r => r.json());

// Use directly in React Flow
<ReactFlow nodes={nodes} edges={edges} />
```

## Architecture

```
app/
├── graph.py          # Dependency graph engine
├── models.py         # Pydantic models (updated)
├── main.py           # FastAPI endpoints (updated)
├── scanner.py        # File scanner (existing)
└── risk.py           # Risk scoring (existing)
```

## Key Classes

### DependencyGraph
Main class for graph analysis:
- `build_graph()`: Builds the complete dependency graph
- `calculate_blast_radius()`: Estimates impact of changes
- `_extract_dependencies()`: Extracts imports from files
- `_calculate_centrality()`: Computes node importance

## Performance Considerations

- **Caching**: Graph is rebuilt on each request (consider caching for production)
- **Large Codebases**: May take time for repos with 1000+ files
- **Memory**: Graph stored in memory during analysis
- **Optimization**: Use `max_depth` to limit scanning depth

## Limitations

1. **Import Resolution**: Best-effort matching of imports to files
2. **Dynamic Imports**: May miss runtime-generated imports
3. **External Dependencies**: Only tracks internal project files
4. **Language Support**: Currently Python and JavaScript/TypeScript

## Future Enhancements

- [ ] Cache graph results for faster repeated queries
- [ ] Add support for more languages (Java, Go, Rust, etc.)
- [ ] Improve import resolution accuracy
- [ ] Add graph visualization endpoint
- [ ] Track historical blast radius changes
- [ ] Integration with CI/CD pipelines
- [ ] Real-time graph updates via WebSocket

## Success Metrics

From test run on backend codebase:
- ✅ Successfully analyzed 9 Python files
- ✅ Identified 35 dependency relationships
- ✅ Calculated graph density: 0.4861
- ✅ Identified 5 critical modules
- ✅ Blast radius calculation working correctly
- ✅ Test recommendations generated accurately

## Next Steps

Phase 3 will add:
- watsonx.ai integration for AI-powered insights
- Automated test generation suggestions
- Risk prediction based on historical data
- Frontend visualization with React Flow

---

**Made with Bob** 🚀