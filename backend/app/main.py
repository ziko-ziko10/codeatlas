"""
CodeAtlas FastAPI Application
Main entry point for the backend API
Updated with GitHub import support
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel
from typing import Dict, Any, List
import asyncio
import json
import time

from app.config import API_TITLE, API_VERSION, API_DESCRIPTION
from app.models import (
    HealthResponse,
    ScanRequest,
    ScanResult,
    ErrorResponse,
    GraphRequest,
    GraphResponse,
    BlastRadiusRequest,
    BlastRadiusResponse,
    ModuleInsightRequest,
    ModuleInsightResponse,
    RepoSummaryRequest,
    RepoSummaryResponse,
    GenerateDocsRequest,
    GenerateDocsResponse,
    GitHubImportRequest,
    GitHubImportResponse,
    AnalysisConfidence,
    RepoPreviewResponse,
)
from app.scanner import RepositoryScanner
from app.ai import AIInsightEngine
from app.graph import DependencyGraph
from app.demo import DemoRepository
from app.github_import import GitHubImporter
from app.report import generate_markdown_report, generate_json_report
from app.metrics import calculate_metrics, metrics_to_dict


class ReportRequest(BaseModel):
    """Request model for report export"""
    repo_name: str
    repo_path: str
    metadata: Dict[str, Any] = {}
    graph: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    timeline: Dict[str, Any] = {}
    blast_radius: Dict[str, Any] = {}
    before_after: Dict[str, Any] = {}
    ai_insights: List[Dict[str, Any]] = []


class ReportResponse(BaseModel):
    """Response model for report export"""
    markdown: str
    json_data: Dict[str, Any]
    filename: str

# Create FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "CodeAtlas API",
        "version": API_VERSION,
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns the current status and version of the API.
    """
    return HealthResponse(
        status="healthy",
        version=API_VERSION,
        timestamp=datetime.now(),
    )


@app.post("/scan", response_model=ScanResult, tags=["Scanner"])
def scan_repository(request: ScanRequest):
    """
    Scan a repository and return analysis results.
    
    Args:
        request: ScanRequest containing repository path and options
    
    Returns:
        ScanResult with complete repository analysis
    
    Raises:
        HTTPException: If repository path is invalid or scanning fails
    """
    try:
        # Validate path exists
        repo_path = Path(request.path)
        if not repo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Repository path not found: {request.path}"
            )
        
        if not repo_path.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Path is not a directory: {request.path}"
            )
        
        # Create scanner and scan repository
        scanner = RepositoryScanner(
            repo_path=request.path,
            include_hidden=request.include_hidden,
            max_depth=request.max_depth,
        )
        
        result = scanner.scan()
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error scanning repository: {str(e)}"
        )


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def api_health_check():
    """
    Alternative health check endpoint with /api prefix.
    Returns the current status and version of the API.
    """
    return HealthResponse(
        status="healthy",
        version=API_VERSION,
        timestamp=datetime.now(),
    )


@app.post("/graph", response_model=GraphResponse, tags=["Graph"])
def generate_dependency_graph(request: GraphRequest):
    """
    Generate a dependency graph for the repository.
    
    Args:
        request: GraphRequest containing repository path and options
    
    Returns:
        GraphResponse with nodes, edges, and metrics
    
    Raises:
        HTTPException: If repository path is invalid or graph generation fails
    """
    try:
        # Validate path exists
        repo_path = Path(request.path)
        if not repo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Repository path not found: {request.path}"
            )
        
        if not repo_path.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Path is not a directory: {request.path}"
            )
        
        # First, scan the repository to get file information
        scanner = RepositoryScanner(
            repo_path=request.path,
            include_hidden=request.include_hidden,
            max_depth=request.max_depth,
        )
        
        scan_result = scanner.scan()
        
        # Build dependency graph
        graph = DependencyGraph(
            files=scan_result.files,
            repo_path=request.path
        )
        
        graph_data = graph.build_graph()
        
        return GraphResponse(**graph_data)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating dependency graph: {str(e)}"
        )


@app.post("/blast-radius", response_model=BlastRadiusResponse, tags=["Graph"])
def calculate_blast_radius(request: BlastRadiusRequest):
    """
    Calculate the blast radius for a changed file.
    
    Args:
        request: BlastRadiusRequest containing repository path and changed file
    
    Returns:
        BlastRadiusResponse with affected files and recommendations
    
    Raises:
        HTTPException: If repository path is invalid or calculation fails
    """
    try:
        # Validate path exists
        repo_path = Path(request.path)
        if not repo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Repository path not found: {request.path}"
            )
        
        if not repo_path.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Path is not a directory: {request.path}"
            )
        
        # First, scan the repository to get file information
        scanner = RepositoryScanner(
            repo_path=request.path,
            include_hidden=request.include_hidden,
            max_depth=request.max_depth,
        )
        
        scan_result = scanner.scan()
        
        # Build dependency graph
        graph = DependencyGraph(
            files=scan_result.files,
            repo_path=request.path
        )
        
        # Build the graph first
        graph.build_graph()
        
        # Calculate blast radius
        blast_radius = graph.calculate_blast_radius(request.changed_file)
        
        # Check if there was an error
        if "error" in blast_radius:
            raise HTTPException(
                status_code=404,
                detail=blast_radius["error"]
            )
        
        return BlastRadiusResponse(**blast_radius)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating blast radius: {str(e)}"
        )


# Initialize AI engine
ai_engine = AIInsightEngine()


@app.post("/ai/module-insight", response_model=ModuleInsightResponse, tags=["AI"])
async def generate_module_insight(request: ModuleInsightRequest):
    """
    Generate AI insights for a specific module/file.
    
    Args:
        request: ModuleInsightRequest containing repository and file path
    
    Returns:
        ModuleInsightResponse with AI-generated insights
    
    Raises:
        HTTPException: If file not found or analysis fails
    """
    try:
        # Validate paths
        repo_path = Path(request.path)
        if not repo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Repository path not found: {request.path}"
            )
        
        # Scan repository to get file info
        scanner = RepositoryScanner(
            repo_path=request.path,
            include_hidden=request.include_hidden,
            max_depth=request.max_depth,
        )
        
        scan_result = scanner.scan()
        
        # Find the specific file
        target_file = None
        for file in scan_result.files:
            if file.path == request.file_path or file.path.endswith(request.file_path):
                target_file = file
                break
        
        if not target_file:
            raise HTTPException(
                status_code=404,
                detail=f"File not found: {request.file_path}"
            )
        
        # Generate AI insights
        insights = await ai_engine.generate_module_insight(target_file)
        
        return ModuleInsightResponse(**insights)
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating module insight: {str(e)}"
        )


@app.post("/ai/repo-summary", response_model=RepoSummaryResponse, tags=["AI"])
async def generate_repo_summary(request: RepoSummaryRequest):
    """
    Generate AI executive summary for entire repository.
    
    Args:
        request: RepoSummaryRequest containing repository path
    
    Returns:
        RepoSummaryResponse with comprehensive AI analysis
    
    Raises:
        HTTPException: If repository not found or analysis fails
    """
    try:
        # Validate path
        repo_path = Path(request.path)
        if not repo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Repository path not found: {request.path}"
            )
        
        # Scan repository
        scanner = RepositoryScanner(
            repo_path=request.path,
            include_hidden=request.include_hidden,
            max_depth=request.max_depth,
        )
        
        scan_result = scanner.scan()
        
        # Build dependency graph for additional context
        graph = DependencyGraph(
            files=scan_result.files,
            repo_path=request.path
        )
        
        graph_data = graph.build_graph()
        
        # Generate AI summary
        summary = await ai_engine.generate_repo_summary(scan_result, graph_data)
        
        return RepoSummaryResponse(**summary)
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating repository summary: {str(e)}"
        )


@app.post("/docs/generate", response_model=GenerateDocsResponse, tags=["Documentation"])
async def generate_documentation(request: GenerateDocsRequest):
    """
    Generate markdown documentation for the repository.
    
    Args:
        request: GenerateDocsRequest specifying doc type and repository path
    
    Returns:
        GenerateDocsResponse with generated markdown content
    
    Raises:
        HTTPException: If repository not found or generation fails
    """
    try:
        # Validate path
        repo_path = Path(request.path)
        if not repo_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Repository path not found: {request.path}"
            )
        
        # Scan repository
        scanner = RepositoryScanner(
            repo_path=request.path,
            include_hidden=request.include_hidden,
            max_depth=request.max_depth,
        )
        
        scan_result = scanner.scan()
        
        # Build dependency graph for additional context
        graph_data = None
        if request.doc_type in ["ARCHITECTURE", "RISK_REPORT"]:
            graph = DependencyGraph(
                files=scan_result.files,
                repo_path=request.path
            )
            graph_data = graph.build_graph()
        
        # Generate documentation
        content = await ai_engine.generate_documentation(
            scan_result,
            request.doc_type,
            graph_data
        )
        
        return GenerateDocsResponse(
            doc_type=request.doc_type,
            content=content,
            generated_at=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating documentation: {str(e)}"
        )


@app.get("/demo/list", tags=["Demo"])
async def list_demo_repositories():
    """
    List all available demo repositories.
    
    Returns:
        List of demo repository metadata
    """
    demos = DemoRepository.get_all_demos()
    return {
        "demos": [
            {
                "name": demo["name"],
                "description": demo["description"],
                "total_files": demo["metrics"]["total_files"],
                "critical_modules": demo["metrics"]["critical_modules"]
            }
            for demo in demos
        ]
    }


@app.get("/demo/load/{demo_name}", tags=["Demo"])
def load_demo_repository(demo_name: str):
    """
    Load a specific demo repository.
    
    Args:
        demo_name: Name of the demo repository
    
    Returns:
        Complete demo repository data with graph
    """
    try:
        demo_data = DemoRepository.get_demo_by_name(demo_name)
        return {
            "name": demo_data["name"],
            "description": demo_data["description"],
            "nodes": demo_data["nodes"],
            "edges": demo_data["edges"],
            "metrics": demo_data["metrics"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading demo repository: {str(e)}"
        )


@app.get("/github/preview", response_model=RepoPreviewResponse, tags=["GitHub"])
def preview_github_repository(github_url: str):
    """
    Get repository info before importing - size, file count, estimated time.
    """
    try:
        importer = GitHubImporter()
        info = importer.get_repo_info(github_url)
        return RepoPreviewResponse(**info)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching repo info: {str(e)}")


@app.post("/github/import", response_model=GitHubImportResponse, tags=["GitHub"])
def import_github_repository(request: GitHubImportRequest):
    """
    Import a public GitHub repository, clone it, scan it, and generate dependency graph.
    
    Args:
        request: GitHubImportRequest containing GitHub URL, mode, and options
    
    Returns:
        GitHubImportResponse with clone info, scan results, graph data, and confidence metadata
    
    Raises:
        HTTPException: If URL is invalid, cloning fails, or scanning fails
    """
    try:
        # Initialize GitHub importer
        importer = GitHubImporter()
        
        # Clone the repository with specified mode
        clone_info = importer.clone_repository(
            github_url=request.github_url,
            mode=request.mode,
            max_files=request.max_files,
            max_total_bytes=request.max_total_bytes,
            max_file_size=request.max_file_size
        )
        
        if not clone_info["success"]:
            raise HTTPException(
                status_code=400,
                detail="Failed to clone repository"
            )
        
        clone_path = clone_info["clone_path"]
        
        try:
            # Scan the cloned repository
            scanner = RepositoryScanner(
                repo_path=clone_path,
                include_hidden=request.include_hidden,
                max_depth=request.max_depth,
            )
            
            scan_result = scanner.scan()
            
            # Build dependency graph
            graph = DependencyGraph(
                files=scan_result.files,
                repo_path=clone_path
            )
            
            graph_data = graph.build_graph()
            
            # Build confidence metadata
            confidence = None
            if "analysis_mode" in clone_info:
                confidence = AnalysisConfidence(
                    analysis_mode=clone_info.get("analysis_mode", "fast"),
                    sampled_files=clone_info.get("sampled_files", 0),
                    skipped_files=clone_info.get("skipped_files", 0),
                    total_bytes=clone_info.get("total_bytes", 0),
                    priority_files=clone_info.get("priority_files", 0),
                    analysis_confidence=clone_info.get("analysis_confidence", "medium"),
                    max_files=clone_info.get("max_files", request.max_files),
                    max_total_bytes=clone_info.get("max_total_bytes", request.max_total_bytes),
                    limitations=clone_info.get("limitations", [])
                )
            
            # Return complete response
            return GitHubImportResponse(
                success=True,
                clone_path=clone_path,
                repo_name=clone_info["repo"],
                owner=clone_info["owner"],
                branch=clone_info["branch"],
                github_url=clone_info["url"],
                scan_result=scan_result,
                graph_data=graph_data,
                confidence=confidence
            )
        
        except Exception as scan_error:
            # Clean up cloned repository on scan failure
            importer.cleanup_repository(clone_path)
            raise HTTPException(
                status_code=500,
                detail=f"Error scanning repository: {str(scan_error)}"
            )
    
    except ValueError as e:
        # Validation or clone errors
        raise HTTPException(status_code=400, detail=str(e))
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error importing repository: {str(e)}"
        )


@app.post("/report/export", tags=["Report"], response_model=ReportResponse)
def export_report(request: ReportRequest):
    """
    Export a CodeAtlas analysis report.
    
    Generates both Markdown and JSON format reports containing:
    - Executive summary
    - Repository overview
    - Architecture health
    - Risk distribution
    - Critical/high-risk modules
    - Dependency graph summary
    - Blast radius findings
    - Modernization roadmap
    - AI recommendations
    - Before/after impact
    """
    try:
        # Prepare data for report generation
        data = {
            "repo_name": request.repo_name,
            "repo_path": request.repo_path,
            "scanned_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "metadata": request.metadata,
            "graph": request.graph,
            "metrics": request.metrics,
            "timeline": request.timeline,
            "blast_radius": request.blast_radius,
            "before_after": request.before_after,
            "ai_insights": request.ai_insights,
        }
        
        # Generate reports
        markdown_report = generate_markdown_report(data)
        json_report = generate_json_report(data)
        
        # Generate filename
        safe_name = "".join(c for c in request.repo_name if c.isalnum() or c in "-_")
        filename = f"codeatlas-report-{safe_name}.md"
        
        return ReportResponse(
            markdown=markdown_report,
            json_data=json_report,
            filename=filename
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )


@app.post("/metrics/calculate", tags=["Metrics"])
def calculate_metrics_endpoint(graph: Dict[str, Any]):
    """
    Calculate all metrics from graph data using the centralized metrics engine.
    This is the single source of truth for all dashboard, report, and timeline metrics.
    """
    try:
        result = calculate_metrics(graph)
        return metrics_to_dict(result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating metrics: {str(e)}"
        )


@app.get("/integrations/status", tags=["Integrations"])
def get_integration_status():
    """Check status of all integrations"""
    import os
    watsonx_configured = all([
        os.getenv("WATSONX_API_KEY"),
        os.getenv("WATSONX_PROJECT_ID"),
        os.getenv("WATSONX_URL"),
    ])
    
    return {
        "watsonx": {
            "connected": watsonx_configured,
            "model": os.getenv("WATSONX_MODEL_ID", "ibm/granite-13b-chat-v2") if watsonx_configured else None,
            "url": os.getenv("WATSONX_URL") if watsonx_configured else None,
        },
        "github": {
            "connected": True,  # GitHub API is always available
            "rate_limit": "No token configured" if not os.getenv("GITHUB_TOKEN") else "Authenticated",
        }
    }


class IntegrationConfig(BaseModel):
    provider: str
    api_key: str = ""
    project_id: str = ""
    url: str = ""
    model_id: str = ""


@app.post("/integrations/configure", tags=["Integrations"])
def configure_integration(config: IntegrationConfig):
    """Configure an integration (stores in .env file)"""
    import os
    env_path = Path(__file__).parent.parent / ".env"
    
    if config.provider == "watsonx":
        lines = []
        updated_keys = {"WATSONX_API_KEY", "WATSONX_PROJECT_ID", "WATSONX_URL", "WATSONX_MODEL_ID"}
        
        if env_path.exists():
            with open(env_path, "r") as f:
                for line in f:
                    key = line.split("=")[0].strip() if "=" in line else ""
                    if key in updated_keys:
                        continue
                    lines.append(line.rstrip())
        
        if config.api_key:
            lines.append(f"WATSONX_API_KEY={config.api_key}")
        if config.project_id:
            lines.append(f"WATSONX_PROJECT_ID={config.project_id}")
        if config.url:
            lines.append(f"WATSONX_URL={config.url}")
        if config.model_id:
            lines.append(f"WATSONX_MODEL_ID={config.model_id}")
        
        with open(env_path, "w") as f:
            f.write("\n".join(lines) + "\n")
        
        # Update environment variables for current session
        if config.api_key:
            os.environ["WATSONX_API_KEY"] = config.api_key
        if config.project_id:
            os.environ["WATSONX_PROJECT_ID"] = config.project_id
        if config.url:
            os.environ["WATSONX_URL"] = config.url
        if config.model_id:
            os.environ["WATSONX_MODEL_ID"] = config.model_id
        
        return {"success": True, "message": "watsonx.ai configuration saved"}
    
    raise HTTPException(status_code=400, detail=f"Unknown provider: {config.provider}")


@app.post("/scan/stream", tags=["Scanner"])
async def scan_repository_stream(request: ScanRequest):
    """
    Scan a repository and stream progress updates via SSE.
    """
    try:
        repo_path = Path(request.path)
        if not repo_path.exists():
            raise HTTPException(status_code=404, detail=f"Repository path not found: {request.path}")
        if not repo_path.is_dir():
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {request.path}")

        steps = [
            {"id": "scan", "label": "Scanning Repository", "detail": "Scanning file structure..."},
            {"id": "parse", "label": "Parsing Files", "detail": "Reading and parsing source files..."},
            {"id": "analyze", "label": "Analyzing Dependencies", "detail": "Parsing imports and building dependency map..."},
            {"id": "graph", "label": "Building Graph", "detail": "Constructing dependency graph..."},
            {"id": "metrics", "label": "Calculating Metrics", "detail": "Computing risk scores and complexity..."},
            {"id": "finalize", "label": "Finalizing", "detail": "Preparing results..."},
        ]

        async def event_stream():
            progress = {"current_step": 0, "overall": 0, "steps": steps}
            
            # Send initial state
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 1: Scan
            progress["current_step"] = 0
            progress["steps"][0]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            scanner = RepositoryScanner(
                repo_path=request.path,
                include_hidden=request.include_hidden,
                max_depth=request.max_depth,
            )

            # Run scan in thread pool
            loop = asyncio.get_event_loop()
            scan_result = await loop.run_in_executor(None, scanner.scan)

            progress["steps"][0]["status"] = "completed"
            progress["steps"][0]["progress"] = 100
            progress["overall"] = 15
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 2: Parse
            progress["current_step"] = 1
            progress["steps"][1]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.2)

            progress["steps"][1]["status"] = "completed"
            progress["steps"][1]["progress"] = 100
            progress["overall"] = 30
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 3: Analyze
            progress["current_step"] = 2
            progress["steps"][2]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            graph = DependencyGraph(files=scan_result.files, repo_path=request.path)
            graph_data = await loop.run_in_executor(None, graph.build_graph)

            progress["steps"][2]["status"] = "completed"
            progress["steps"][2]["progress"] = 100
            progress["overall"] = 55
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 4: Graph
            progress["current_step"] = 3
            progress["steps"][3]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.2)

            progress["steps"][3]["status"] = "completed"
            progress["steps"][3]["progress"] = 100
            progress["overall"] = 70
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 5: Metrics
            progress["current_step"] = 4
            progress["steps"][4]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Build graph response
            graph_response = {
                "nodes": graph_data.get("nodes", []),
                "edges": graph_data.get("edges", []),
                "metrics": {
                    "total_files": scan_result.metadata.total_files,
                    "high_risk_modules": scan_result.summary.get("high_risk_files", 0),
                    "critical_modules": len([n for n in graph_data.get("nodes", []) if n.get("risk_score", 0) >= 0.8]),
                    "dependency_density": graph_data.get("metrics", {}).get("density", 0),
                    "architecture_complexity": scan_result.summary.get("avg_risk_score", 0) * 10,
                },
            }

            metrics_result = calculate_metrics(graph_response)

            progress["steps"][4]["status"] = "completed"
            progress["steps"][4]["progress"] = 100
            progress["overall"] = 90
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 6: Finalize
            progress["current_step"] = 5
            progress["steps"][5]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            result_data = {
                "graph": graph_response,
                "scan_result": {
                    "metadata": {
                        "total_files": scan_result.metadata.total_files,
                        "total_lines": scan_result.metadata.total_lines,
                        "total_size_bytes": scan_result.metadata.total_size_bytes,
                        "name": scan_result.metadata.name,
                        "path": scan_result.metadata.path,
                    },
                    "summary": scan_result.summary,
                },
                "metrics": metrics_to_dict(metrics_result),
            }

            progress["steps"][5]["status"] = "completed"
            progress["steps"][5]["progress"] = 100
            progress["overall"] = 100
            progress["done"] = True
            progress["result"] = result_data
            yield f"data: {json.dumps(progress)}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning repository: {str(e)}")


@app.post("/github/import/stream", tags=["GitHub"])
async def import_github_repository_stream(request: GitHubImportRequest):
    """
    Import a GitHub repository and stream progress updates via SSE.
    """
    try:
        importer = GitHubImporter()

        is_valid, error_msg = importer.validate_github_url(request.github_url)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        repo_info = importer.parse_github_url(request.github_url)

        steps = [
            {"id": "connect", "label": "Connecting to GitHub", "detail": f"Fetching {repo_info['owner']}/{repo_info['repo']}..."},
            {"id": "download", "label": "Downloading Repository", "detail": "Downloading source files..."},
            {"id": "extract", "label": "Extracting Files", "detail": "Extracting and filtering source files..."},
            {"id": "analyze", "label": "Analyzing Dependencies", "detail": "Parsing imports and building dependency map..."},
            {"id": "graph", "label": "Building Graph", "detail": "Constructing dependency graph..."},
            {"id": "metrics", "label": "Calculating Metrics", "detail": "Computing risk scores and complexity..."},
            {"id": "finalize", "label": "Finalizing", "detail": "Preparing dashboard..."},
        ]

        async def event_stream():
            progress = {"current_step": 0, "overall": 0, "steps": steps}
            loop = asyncio.get_event_loop()

            # Send initial
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 1: Connect
            progress["current_step"] = 0
            progress["steps"][0]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"

            clone_info = await loop.run_in_executor(None, lambda: importer.clone_repository(
                github_url=request.github_url,
                mode=request.mode,
                max_files=request.max_files,
                max_total_bytes=request.max_total_bytes,
                max_file_size=request.max_file_size,
            ))

            if not clone_info["success"]:
                raise HTTPException(status_code=400, detail="Failed to clone repository")

            clone_path = clone_info["clone_path"]

            progress["steps"][0]["status"] = "completed"
            progress["steps"][0]["progress"] = 100
            progress["overall"] = 15
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 2: Download
            progress["current_step"] = 1
            progress["steps"][1]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.3)

            progress["steps"][1]["status"] = "completed"
            progress["steps"][1]["progress"] = 100
            progress["overall"] = 25
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 3: Extract
            progress["current_step"] = 2
            progress["steps"][2]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.2)

            progress["steps"][2]["status"] = "completed"
            progress["steps"][2]["progress"] = 100
            progress["overall"] = 35
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 4: Analyze
            progress["current_step"] = 3
            progress["steps"][3]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"

            scanner = RepositoryScanner(
                repo_path=clone_path,
                include_hidden=request.include_hidden,
                max_depth=request.max_depth,
            )
            scan_result = await loop.run_in_executor(None, scanner.scan)

            progress["steps"][3]["status"] = "completed"
            progress["steps"][3]["progress"] = 100
            progress["overall"] = 55
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 5: Graph
            progress["current_step"] = 4
            progress["steps"][4]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"

            graph = DependencyGraph(files=scan_result.files, repo_path=clone_path)
            graph_data = await loop.run_in_executor(None, graph.build_graph)

            progress["steps"][4]["status"] = "completed"
            progress["steps"][4]["progress"] = 100
            progress["overall"] = 75
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 6: Metrics
            progress["current_step"] = 5
            progress["steps"][5]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"

            graph_response = {
                "nodes": graph_data.get("nodes", []),
                "edges": graph_data.get("edges", []),
                "metrics": {
                    "total_files": scan_result.metadata.total_files,
                    "high_risk_modules": scan_result.summary.get("high_risk_files", 0),
                    "critical_modules": len([n for n in graph_data.get("nodes", []) if n.get("risk_score", 0) >= 0.8]),
                    "dependency_density": graph_data.get("metrics", {}).get("density", 0),
                    "architecture_complexity": scan_result.summary.get("avg_risk_score", 0) * 10,
                },
            }

            metrics_result = calculate_metrics(graph_response)

            progress["steps"][5]["status"] = "completed"
            progress["steps"][5]["progress"] = 100
            progress["overall"] = 90
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            # Step 7: Finalize
            progress["current_step"] = 6
            progress["steps"][6]["status"] = "running"
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)

            result_data = {
                "graph": graph_response,
                "scan_result": {
                    "metadata": {
                        "total_files": scan_result.metadata.total_files,
                        "total_lines": scan_result.metadata.total_lines,
                        "total_size_bytes": scan_result.metadata.total_size_bytes,
                        "name": scan_result.metadata.name,
                        "path": scan_result.metadata.path,
                    },
                    "summary": scan_result.summary,
                },
                "metrics": metrics_to_dict(metrics_result),
                "clone_info": {
                    "repo_name": clone_info.get("repo", ""),
                    "owner": clone_info.get("owner", ""),
                    "branch": clone_info.get("branch", ""),
                },
            }

            progress["steps"][6]["status"] = "completed"
            progress["steps"][6]["progress"] = 100
            progress["overall"] = 100
            progress["done"] = True
            progress["result"] = result_data
            yield f"data: {json.dumps(progress)}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing repository: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
