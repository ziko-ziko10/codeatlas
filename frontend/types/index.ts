// Graph and Node Types
export interface GraphNode {
  id: string;
  path: string;
  name: string;
  language: string;
  risk_level: string;
  risk_score: number;
  line_count: number;
  import_count: number;
  function_count: number;
  class_count: number;
  in_degree: number;
  out_degree: number;
  centrality: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: GraphMetrics;
}

export interface GraphMetrics {
  total_files: number;
  high_risk_modules: number;
  critical_modules: number;
  dependency_density: number;
  architecture_complexity: number;
}

// Risk Levels
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// API Types
export interface ScanRequest {
  repo_path: string;
}

export interface ScanResponse {
  status: 'success' | 'error';
  message?: string;
  graph?: DependencyGraph;
}

// UI State Types
export interface SelectedNode {
  node: GraphNode;
  position: { x: number; y: number };
}

export interface DashboardState {
  graph: DependencyGraph | null;
  selectedNode: SelectedNode | null;
  isLoading: boolean;
  error: string | null;
}

// AI Insights Types
export interface ModuleInsight {
  file_path: string;
  purpose: string;
  technical_debt: string;
  modernization_advice: string;
  change_risks: string[];
  suggested_tests: string[];
  confidence_score: number;
  generated_at: string;
}

export interface CriticalModuleInfo {
  path: string;
  risk_score: number;
  reason: string;
}

export interface OnboardingDifficulty {
  level: string;
  score: number;
  description: string;
  estimated_onboarding_time: string;
}

export interface RepoSummary {
  repository_name: string;
  total_files: number;
  total_lines: number;
  languages: string[];
  architecture_overview: string;
  top_risks: string[];
  critical_modules: CriticalModuleInfo[];
  modernization_priorities: string[];
  onboarding_difficulty: OnboardingDifficulty;
  recommended_next_steps: string[];
  generated_at: string;
}

export interface GeneratedDoc {
  doc_type: 'ARCHITECTURE' | 'ONBOARDING' | 'RISK_REPORT' | 'MODERNIZATION_PLAN';
  content: string;
  generated_at: string;
}

// Made with Bob
