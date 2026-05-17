'use client';

import { DependencyGraph } from '@/types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Clock, 
  Shield,
  Zap,
  Target
} from 'lucide-react';

interface CTODashboardProps {
  graph: DependencyGraph;
  isDemoMode?: boolean;
  metrics?: {
    maintainability_score: number;
    technical_debt_estimate: number;
    architecture_health: number;
    modernization_readiness: number;
    refactoring_effort: number;
    critical_path_risk: string;
    critical_modules: number;
    critical_risk: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    velocity_loss: number;
    bug_fix_overhead: number;
    potential_savings: number;
    before_modernization?: {
      maintainability: number;
      technical_debt: number;
      critical_modules: number;
    };
    after_modernization?: {
      maintainability: number;
      technical_debt: number;
      critical_modules: number;
    };
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return fallback;
  return value;
}

function safePercent(value: number): number {
  return clamp(Math.round(safeNumber(value, 0)), 0, 100);
}

function safeCurrency(value: number): number {
  return Math.max(0, Math.round(safeNumber(value, 0)));
}

function formatDelta(value: number, prefix: string, suffix: string): string {
  const v = safeNumber(value, 0);
  if (v === 0) return `0${suffix}`;
  const sign = v > 0 ? '+' : '';
  return `${sign}${prefix}${Math.abs(v)}${suffix}`;
}

function getRepoSizeCategory(totalNodes: number): 'small' | 'medium' | 'large' {
  if (totalNodes <= 20) return 'small';
  if (totalNodes <= 100) return 'medium';
  return 'large';
}

function getRefactoringEffortRange(category: 'small' | 'medium' | 'large'): { min: number; max: number } {
  switch (category) {
    case 'small': return { min: 1, max: 4 };
    case 'medium': return { min: 4, max: 12 };
    case 'large': return { min: 12, max: 40 };
  }
}

interface RiskCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  highPlusCritical: number;
}

function calculateRiskCounts(nodes: DependencyGraph['nodes']): RiskCounts {
  const total = safeNumber(nodes?.length, 1);
  if (!nodes || total === 0) {
    return { critical: 0, high: 0, medium: 0, low: 0, total: 0, highPlusCritical: 0 };
  }
  
  const critical = nodes.filter(n => safeNumber(n.risk_score, 0) >= 0.8).length;
  const high = nodes.filter(n => {
    const risk = safeNumber(n.risk_score, 0);
    return risk >= 0.6 && risk < 0.8;
  }).length;
  const medium = nodes.filter(n => {
    const risk = safeNumber(n.risk_score, 0);
    return risk >= 0.4 && risk < 0.6;
  }).length;
  const low = nodes.filter(n => safeNumber(n.risk_score, 0) < 0.4).length;
  
  return {
    critical,
    high,
    medium,
    low,
    total,
    highPlusCritical: critical + high
  };
}

interface CTODashboardProps {
  graph: DependencyGraph;
  isDemoMode?: boolean;
}

function mapBackendMetrics(backendMetrics: CTODashboardProps['metrics']) {
  if (!backendMetrics) return null;
  
  const riskTotal = (backendMetrics.critical_risk || 0) + 
                    (backendMetrics.high_risk || 0) + 
                    (backendMetrics.medium_risk || 0) + 
                    (backendMetrics.low_risk || 0);
  
  return {
    maintainabilityScore: backendMetrics.maintainability_score ?? 50,
    maintainabilityTrend: (backendMetrics.maintainability_score ?? 50) > 70 ? 'positive' as const : 
                         (backendMetrics.maintainability_score ?? 50) > 40 ? 'neutral' as const : 'negative' as const,
    technicalDebtEstimate: backendMetrics.technical_debt_estimate ?? 10,
    onboardingDifficulty: 'Medium' as const,
    onboardingTime: '2-3 weeks',
    architectureHealth: backendMetrics.architecture_health ?? 50,
    architectureHealthTrend: (backendMetrics.architecture_health ?? 50) > 70 ? 'positive' as const :
                            (backendMetrics.architecture_health ?? 50) > 40 ? 'neutral' as const : 'negative' as const,
    modernizationReadiness: backendMetrics.modernization_readiness ?? 50,
    refactoringEffort: backendMetrics.refactoring_effort ?? 4,
    criticalPathRisk: (backendMetrics.critical_modules ?? 0) > 3 ? 'High' as const : 
                     (backendMetrics.critical_modules ?? 0) > 0 ? 'Medium' as const : 'Low' as const,
    criticalModules: backendMetrics.critical_modules ?? 0,
    criticalRisk: backendMetrics.critical_risk ?? 0,
    highRisk: backendMetrics.high_risk ?? 0,
    mediumRisk: backendMetrics.medium_risk ?? 0,
    lowRisk: backendMetrics.low_risk ?? 0,
    velocityLoss: backendMetrics.velocity_loss ?? 20,
    bugFixOverhead: backendMetrics.bug_fix_overhead ?? 10,
    potentialSavings: Math.round((backendMetrics.technical_debt_estimate ?? 10) * 0.6)
  };
}

export function CTODashboard({ graph, isDemoMode = false, metrics: providedMetrics }: CTODashboardProps) {
  const mappedMetrics = providedMetrics ? mapBackendMetrics(providedMetrics) : null;
  const metrics = mappedMetrics || calculateIntelligenceMetrics(graph);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Executive Intelligence Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered architecture health assessment
          </p>
        </div>
        {isDemoMode && (
          <div className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
            Demo Mode
          </div>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntelligenceCard
          title="Maintainability Score"
          value={metrics.maintainabilityScore}
          maxValue={100}
          icon={TrendingUp}
          trend={metrics.maintainabilityTrend}
          description="Overall code health and maintainability"
          color={getScoreColor(metrics.maintainabilityScore)}
        />
        <IntelligenceCard
          title="Technical Debt"
          value={`$${metrics.technicalDebtEstimate}K`}
          icon={DollarSign}
          trend="negative"
          description="Estimated cost to resolve all issues"
          color="text-orange-500"
        />
        <IntelligenceCard
          title="Onboarding Difficulty"
          value={metrics.onboardingDifficulty}
          icon={Users}
          description={`${metrics.onboardingTime} for new engineers`}
          color={getDifficultyColor(metrics.onboardingDifficulty)}
        />
        <IntelligenceCard
          title="Architecture Health"
          value={metrics.architectureHealth}
          maxValue={100}
          icon={Shield}
          trend={metrics.architectureHealthTrend}
          description="Structural integrity and design quality"
          color={getScoreColor(metrics.architectureHealth)}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricBox
          icon={Zap}
          label="Modernization Readiness"
          value={`${metrics.modernizationReadiness}%`}
          subtitle="Ready for cloud-native migration"
          color="text-blue-500"
        />
        <MetricBox
          icon={Clock}
          label="Refactoring Effort"
          value={`${metrics.refactoringEffort} weeks`}
          subtitle="Estimated time to modernize"
          color="text-purple-500"
        />
        <MetricBox
          icon={Target}
          label="Critical Path Risk"
          value={metrics.criticalPathRisk}
          subtitle={`${metrics.criticalModules} modules at risk`}
          color="text-red-500"
        />
      </div>

      {/* Risk Breakdown */}
      <div className="glass rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Risk Distribution
        </h3>
        <div className="space-y-3">
          <RiskBar label="Critical Risk" value={metrics.criticalRisk} color="bg-red-500" />
          <RiskBar label="High Risk" value={metrics.highRisk} color="bg-orange-500" />
          <RiskBar label="Medium Risk" value={metrics.mediumRisk} color="bg-yellow-500" />
          <RiskBar label="Low Risk" value={metrics.lowRisk} color="bg-green-500" />
        </div>
      </div>

      {/* Engineering Cost Impact */}
      <div className="glass rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Engineering Cost Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CostMetric
            label="Current Velocity Loss"
            value={`${metrics.velocityLoss}%`}
            description="Due to technical debt"
          />
          <CostMetric
            label="Bug Fix Overhead"
            value={`${metrics.bugFixOverhead}h/week`}
            description="Time spent on maintenance"
          />
          <CostMetric
            label="Potential Savings"
            value={`$${metrics.potentialSavings}K/year`}
            description="After modernization"
          />
        </div>
      </div>
    </div>
  );
}

interface IntelligenceCardProps {
  title: string;
  value: string | number;
  maxValue?: number;
  icon: React.ElementType;
  trend?: 'positive' | 'negative' | 'neutral';
  description: string;
  color: string;
}

function IntelligenceCard({ 
  title, 
  value, 
  maxValue, 
  icon: Icon, 
  trend, 
  description, 
  color 
}: IntelligenceCardProps) {
  const percentage = maxValue ? (Number(value) / maxValue) * 100 : null;

  return (
    <div className="glass rounded-xl p-6 border border-white/10 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10 ${color}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {trend && (
          <TrendIndicator trend={trend} />
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {percentage !== null && (
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, subtitle, color }: any) {
  return (
    <div className="glass rounded-lg p-4 border border-white/10">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function RiskBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function CostMetric({ label, value, description }: any) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'positive' | 'negative' | 'neutral' }) {
  const colors = {
    positive: 'text-green-500',
    negative: 'text-red-500',
    neutral: 'text-gray-500'
  };

  return (
    <div className={`text-xs font-medium ${colors[trend]}`}>
      {trend === 'positive' && '↑'}
      {trend === 'negative' && '↓'}
      {trend === 'neutral' && '→'}
    </div>
  );
}

function calculateIntelligenceMetrics(graph: DependencyGraph) {
  const totalNodes = safeNumber(graph.nodes?.length, 1);
  
  if (!graph.nodes || totalNodes === 0) {
    return getDefaultMetrics();
  }

  const risk = calculateRiskCounts(graph.nodes);
  const avgRiskScore = safeNumber(
    graph.nodes.reduce((sum, n) => sum + safeNumber(n.risk_score, 0), 0) / risk.total,
    0.5
  );
  const avgComplexity = safeNumber(graph.metrics?.architecture_complexity, 5);
  const totalLOC = graph.nodes.reduce((sum, n) => sum + safeNumber(n.loc, 0), 0);
  
  const maintainabilityScore = safePercent((1 - avgRiskScore) * 100);
  
  const baseDebt = avgRiskScore * Math.max(totalLOC, 5000) * 0.08;
  const complexityMultiplier = 1 + (avgComplexity / 10);
  const riskMultiplier = 1 + (risk.highPlusCritical / Math.max(risk.total, 1)) * 0.5;
  const technicalDebtEstimate = safeCurrency(baseDebt * complexityMultiplier * riskMultiplier);
  const minDebt = totalNodes > 50 ? 15 : totalNodes > 20 ? 8 : 3;
  const finalDebt = Math.max(technicalDebtEstimate, minDebt);
  
  const onboardingScore = avgComplexity > 7 ? 'High' : avgComplexity > 4 ? 'Medium' : 'Low';
  const onboardingTime = avgComplexity > 7 ? '4-6 weeks' : avgComplexity > 4 ? '2-3 weeks' : '1 week';
  
  const architectureHealth = safePercent(100 - (avgComplexity * 8) - (avgRiskScore * 20));
  const healthInverse = 100 - architectureHealth;
  const modernizationReadiness = clamp(safePercent((1 - healthInverse / 100) * 100 - (avgComplexity * 3)), 5, 95);
  
  const repoSize = getRepoSizeCategory(totalNodes);
  const effortRange = getRefactoringEffortRange(repoSize);
  const calculatedEffort = Math.round(risk.critical * 1.5 + risk.high * 0.75 + risk.medium * 0.25);
  const refactoringEffort = clamp(calculatedEffort, effortRange.min, effortRange.max);
  
  const criticalRiskPct = safePercent((risk.critical / risk.total) * 100);
  const highRiskPct = safePercent((risk.high / risk.total) * 100);
  const mediumRiskPct = safePercent((risk.medium / risk.total) * 100);
  const lowRiskPct = safePercent((risk.low / risk.total) * 100);
  
  const riskTotal = criticalRiskPct + highRiskPct + mediumRiskPct + lowRiskPct;
  const normalizedCritical = riskTotal > 0 ? Math.round((criticalRiskPct / riskTotal) * 100) : criticalRiskPct;
  const normalizedHigh = riskTotal > 0 ? Math.round((highRiskPct / riskTotal) * 100) : highRiskPct;
  const normalizedMedium = riskTotal > 0 ? Math.round((mediumRiskPct / riskTotal) * 100) : mediumRiskPct;
  const normalizedLow = riskTotal > 0 ? Math.round((lowRiskPct / riskTotal) * 100) : lowRiskPct;
  
  const velocityLoss = clamp(safePercent(avgRiskScore * 50 + (risk.highPlusCritical / Math.max(risk.total, 1)) * 25), 10, 75);
  const bugFixOverhead = clamp(safeNumber(risk.critical * 8 + risk.high * 3 + risk.medium * 1), 5, 60);
  
  return {
    maintainabilityScore,
    maintainabilityTrend: (maintainabilityScore > 70 ? 'positive' : maintainabilityScore > 40 ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
    technicalDebtEstimate: finalDebt,
    onboardingDifficulty: onboardingScore,
    onboardingTime,
    architectureHealth,
    architectureHealthTrend: (architectureHealth > 70 ? 'positive' : architectureHealth > 40 ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
    modernizationReadiness,
    refactoringEffort,
    criticalPathRisk: risk.critical > 3 ? 'High' : risk.critical > 0 ? 'Medium' : 'Low',
    criticalModules: risk.critical,
    criticalRisk: normalizedCritical,
    highRisk: normalizedHigh,
    mediumRisk: normalizedMedium,
    lowRisk: normalizedLow,
    velocityLoss,
    bugFixOverhead,
    potentialSavings: Math.round(finalDebt * 0.6)
  };
}

function getDefaultMetrics() {
  return {
    maintainabilityScore: 75,
    maintainabilityTrend: 'positive' as const,
    technicalDebtEstimate: 8,
    onboardingDifficulty: 'Low',
    onboardingTime: '1 week',
    architectureHealth: 80,
    architectureHealthTrend: 'positive' as const,
    modernizationReadiness: 65,
    refactoringEffort: 2,
    criticalPathRisk: 'Low',
    criticalModules: 0,
    criticalRisk: 5,
    highRisk: 15,
    mediumRisk: 30,
    lowRisk: 50,
    velocityLoss: 15,
    bugFixOverhead: 5,
    potentialSavings: 5
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getDifficultyColor(difficulty: string): string {
  if (difficulty === 'Low') return 'text-green-500';
  if (difficulty === 'Medium') return 'text-yellow-500';
  return 'text-red-500';
}

// Made with Bob