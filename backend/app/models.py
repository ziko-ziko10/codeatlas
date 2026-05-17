"""
Pydantic models for CodeAtlas API
"""
from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class FileInfo(BaseModel):
    """Information about a single file"""
    path: str
    name: str
    extension: str
    language: str
    size_bytes: int
    lines_of_code: int
    import_count: int
    function_count: int
    class_count: int
    todo_count: int
    fixme_count: int
    complexity_score: float
    risk_score: float
    risk_level: str  # "low", "medium", "high", "critical"


class FolderSummary(BaseModel):
    """Summary statistics for a folder"""
    path: str
    file_count: int
    total_lines: int
    languages: Dict[str, int]  # language -> file count
    avg_risk_score: float
    high_risk_files: int


class LanguageSummary(BaseModel):
    """Summary statistics for a language"""
    language: str
    file_count: int
    total_lines: int
    avg_risk_score: float
    extensions: List[str]


class RepositoryMetadata(BaseModel):
    """Metadata about the scanned repository"""
    path: str
    name: str
    total_files: int
    total_lines: int
    total_size_bytes: int
    scanned_at: datetime
    scan_duration_seconds: float
    languages: List[LanguageSummary]


class ScanResult(BaseModel):
    """Complete scan result"""
    metadata: RepositoryMetadata
    files: List[FileInfo]
    folders: List[FolderSummary]
    summary: Dict[str, Any] = Field(default_factory=dict)


class ScanRequest(BaseModel):
    """Request to scan a repository"""
    path: str
    include_hidden: bool = False
    max_depth: Optional[int] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    path: Optional[str] = None


# Graph and Blast Radius Models

class GraphNode(BaseModel):
    """Node in the dependency graph"""
    id: str
    path: str
    name: str
    language: str
    risk_level: str
    risk_score: float
    line_count: int
    import_count: int
    function_count: int
    class_count: int
    in_degree: int
    out_degree: int
    centrality: float


class GraphEdge(BaseModel):
    """Edge in the dependency graph"""
    source: str
    target: str
    type: str = "dependency"


class GraphMetrics(BaseModel):
    """Graph-level metrics"""
    total_nodes: int
    total_edges: int
    density: float
    avg_in_degree: float
    avg_out_degree: float
    max_in_degree: int
    max_out_degree: int


class CriticalModule(BaseModel):
    """Critical module information"""
    path: str
    centrality: float
    in_degree: int
    risk_score: float


class GraphResponse(BaseModel):
    """Response for dependency graph generation"""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    metrics: GraphMetrics
    critical_modules: List[CriticalModule]


class GraphRequest(BaseModel):
    """Request to generate dependency graph"""
    path: str
    include_hidden: bool = False
    max_depth: Optional[int] = None


class AffectedFile(BaseModel):
    """Information about an affected file"""
    path: str
    risk_level: str
    language: str


class FileInfoSummary(BaseModel):
    """Summary information about a file"""
    path: str
    language: str
    risk_level: str
    risk_score: float
    in_degree: int
    out_degree: int
    centrality: float


class BlastRadiusResponse(BaseModel):
    """Response for blast radius analysis"""
    changed_file: str
    file_info: FileInfoSummary
    directly_affected: List[AffectedFile]
    indirectly_affected: List[AffectedFile]
    total_affected: int
    risk_severity: Literal["low", "medium", "high", "critical", "unknown"]
    explanation: str
    risk_factors: List[str]
    test_recommendations: List[str]


class BlastRadiusRequest(BaseModel):
    """Request to calculate blast radius"""
    path: str
    changed_file: str
    include_hidden: bool = False
    max_depth: Optional[int] = None

# AI Insights Models

class ModuleInsightRequest(BaseModel):
    """Request for AI module insight"""
    path: str
    file_path: str
    include_hidden: bool = False
    max_depth: Optional[int] = None


class ModuleInsightResponse(BaseModel):
    """Response for AI module insight"""
    file_path: str
    purpose: str
    technical_debt: str
    modernization_advice: str
    change_risks: List[str]
    suggested_tests: List[str]
    confidence_score: float
    generated_at: str


class RepoSummaryRequest(BaseModel):
    """Request for repository AI summary"""
    path: str
    include_hidden: bool = False
    max_depth: Optional[int] = None


class CriticalModuleInfo(BaseModel):
    """Information about a critical module"""
    path: str
    risk_score: float
    reason: str


class OnboardingDifficulty(BaseModel):
    """Onboarding difficulty assessment"""
    level: str
    score: float
    description: str
    estimated_onboarding_time: str


class RepoSummaryResponse(BaseModel):
    """Response for repository AI summary"""
    repository_name: str
    total_files: int
    total_lines: int
    languages: List[str]
    architecture_overview: str
    top_risks: List[str]
    critical_modules: List[CriticalModuleInfo]
    modernization_priorities: List[str]
    onboarding_difficulty: OnboardingDifficulty
    recommended_next_steps: List[str]
    generated_at: str


class GenerateDocsRequest(BaseModel):
    """Request for documentation generation"""
    path: str
    doc_type: Literal["ARCHITECTURE", "ONBOARDING", "RISK_REPORT", "MODERNIZATION_PLAN"]
    include_hidden: bool = False
    max_depth: Optional[int] = None


class GenerateDocsResponse(BaseModel):
    """Response for documentation generation"""
    doc_type: str
    content: str
    generated_at: str



# Made with Bob


# GitHub Import Models

class GitHubImportRequest(BaseModel):
    """Request to import a GitHub repository"""
    github_url: str = Field(..., description="Public GitHub repository URL")
    mode: str = Field(default="fast", description="Import mode: 'fast' or 'full'")
    max_files: int = Field(default=600, description="Maximum files to analyze (fast mode)")
    max_total_bytes: int = Field(default=26214400, description="Maximum total bytes (25MB default)")
    max_file_size: int = Field(default=307200, description="Maximum single file size (300KB)")
    include_hidden: bool = False
    max_depth: Optional[int] = None


class RepoPreviewResponse(BaseModel):
    """Repository preview info before importing"""
    owner: str
    repo: str
    full_name: str
    description: str
    language: str
    stars: int
    size_kb: int
    size_mb: float
    total_files: int
    source_files: int
    branch: str
    updated_at: str
    estimated_time: str
    estimated_time_seconds: float
    import_mode: str
    is_large: bool


class AnalysisConfidence(BaseModel):
    """Confidence metadata for analysis"""
    analysis_mode: str
    sampled_files: int
    skipped_files: int
    total_bytes: int
    priority_files: int
    analysis_confidence: str
    max_files: int
    max_total_bytes: int
    limitations: List[str]


class GitHubImportResponse(BaseModel):
    """Response for GitHub repository import"""
    success: bool
    clone_path: str
    repo_name: str
    owner: str
    branch: str
    github_url: str
    scan_result: ScanResult
    graph_data: Dict[str, Any]
    confidence: Optional[AnalysisConfidence] = None

