import { DependencyGraph, ScanRequest, ScanResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function scanRepository(repoPath: string): Promise<DependencyGraph> {
  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo_path: repoPath } as ScanRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to scan repository');
  }

  const data: ScanResponse = await response.json();
  
  if (data.status === 'error' || !data.graph) {
    throw new Error(data.message || 'Failed to scan repository');
  }

  return data.graph;
}

export async function getGraphData(repoPath: string): Promise<DependencyGraph> {
  const response = await fetch(`${API_BASE_URL}/graph?repo_path=${encodeURIComponent(repoPath)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch graph data');
  }

  return response.json();
}

// AI Insights API
export async function getModuleInsight(repoPath: string, filePath: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/ai/module-insight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: repoPath,
      file_path: filePath,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate module insight');
  }

  return response.json();
}

export async function getRepoSummary(repoPath: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/ai/repo-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: repoPath,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate repository summary');
  }

  return response.json();
}

export async function generateDocumentation(
  repoPath: string,
  docType: 'ARCHITECTURE' | 'ONBOARDING' | 'RISK_REPORT' | 'MODERNIZATION_PLAN'
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/docs/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: repoPath,
      doc_type: docType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate documentation');
  }

  return response.json();
}
// GitHub Import API
export interface RepoPreview {
  owner: string;
  repo: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  size_kb: number;
  size_mb: number;
  total_files: number;
  source_files: number;
  branch: string;
  updated_at: string;
  estimated_time: string;
  estimated_time_seconds: number;
  import_mode: string;
  is_large: boolean;
}

export async function previewGitHubRepository(githubUrl: string): Promise<RepoPreview> {
  const response = await fetch(`${API_BASE_URL}/github/preview?github_url=${encodeURIComponent(githubUrl)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch repo info');
  }
  return response.json();
}

export interface GitHubImportOptions {
  mode?: 'fast' | 'full';
  max_files?: number;
}

export async function importGitHubRepository(githubUrl: string, options?: GitHubImportOptions): Promise<DependencyGraph> {
  const response = await fetch(`${API_BASE_URL}/github/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      github_url: githubUrl,
      mode: options?.mode || 'fast',
      max_files: options?.max_files || 600,
      include_hidden: false,
      max_depth: null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to import GitHub repository');
  }

  const data = await response.json();
  
  // Transform the response to match DependencyGraph format
  return {
    nodes: data.graph_data.nodes,
    edges: data.graph_data.edges,
    metrics: {
      total_files: data.scan_result.metadata.total_files,
      high_risk_modules: data.scan_result.summary.high_risk_files,
      critical_modules: data.graph_data.critical_modules.length,
      dependency_density: data.graph_data.metrics.density || 0,
      architecture_complexity: data.scan_result.summary.avg_risk_score,
    },
  };
}


// Demo Mode API
export async function loadDemoRepository(demoName: string): Promise<DependencyGraph> {
  const response = await fetch(`${API_BASE_URL}/demo/load/${demoName}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to load demo repository');
  }

  return response.json();
}

export async function listDemoRepositories(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/demo/list`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list demo repositories');
  }

  return response.json();
}

export interface ReportData {
  repo_name: string;
  repo_path: string;
  metadata: Record<string, any>;
  graph: Record<string, any>;
  metrics: Record<string, any>;
  timeline: Record<string, any>;
  blast_radius: Record<string, any>;
  before_after: Record<string, any>;
  ai_insights: Record<string, any>[];
}

export interface ReportResponse {
  markdown: string;
  json_data: Record<string, any>;
  filename: string;
}

export async function exportReport(data: ReportData): Promise<ReportResponse> {
  const response = await fetch(`${API_BASE_URL}/report/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate report');
  }

  return response.json();
}

export interface MetricsResponse {
  total_files: number;
  total_loc: number;
  total_languages: number;
  total_nodes: number;
  total_edges: number;
  resolved_edges: number;
  unresolved_imports: number;
  dependency_confidence: number;
  critical_risk: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  critical_modules: number;
  high_risk_modules: number;
  medium_risk_modules: number;
  low_risk_modules: number;
  maintainability_score: number;
  architecture_health: number;
  modernization_readiness: number;
  technical_debt_estimate: number;
  refactoring_effort: number;
  velocity_loss: number;
  bug_fix_overhead: number;
  risk_concentration: number;
  blast_radius_concentration: number;
  centrality_concentration: number;
  before_modernization: {
    maintainability: number;
    technical_debt: number;
    critical_modules: number;
    complexity: number;
    deployment_time: string;
    onboarding_time: string;
  };
  after_modernization: {
    maintainability: number;
    technical_debt: number;
    critical_modules: number;
    complexity: number;
    deployment_time: string;
    onboarding_time: string;
  };
  validation_warnings: string[];
}

export async function calculateMetrics(graph: any): Promise<MetricsResponse> {
  const response = await fetch(`${API_BASE_URL}/metrics/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(graph),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to calculate metrics');
  }

  return response.json();
}

// Made with Bob
