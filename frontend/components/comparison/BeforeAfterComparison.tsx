'use client';

import { useState } from 'react';
import { DependencyGraph } from '@/types';
import { ArrowRight, TrendingUp, TrendingDown, Zap } from 'lucide-react';

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

interface BeforeAfterComparisonProps {
  graph: DependencyGraph;
}

export function BeforeAfterComparison({ graph }: BeforeAfterComparisonProps) {
  const [showAfter, setShowAfter] = useState(false);

  const beforeMetrics = calculateCurrentMetrics(graph);
  const afterMetrics = calculateModernizedMetrics(graph);

  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Modernization Impact Simulator
            </h3>
            <p className="text-sm text-muted-foreground">
              Compare current state vs. post-modernization
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAfter(!showAfter)}
          className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-smooth text-sm font-medium flex items-center gap-2"
        >
          {showAfter ? 'Show Current' : 'Show Modernized'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before State */}
        <div className={`space-y-4 transition-all duration-500 ${showAfter ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-foreground">Current State</h4>
            <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs rounded-full font-medium">
              Before
            </span>
          </div>
          
          <MetricComparison
            label="Maintainability Score"
            value={beforeMetrics.maintainability}
            maxValue={100}
            color="text-orange-500"
            trend="negative"
          />
          <MetricComparison
            label="Technical Debt"
            value={`$${beforeMetrics.technicalDebt}K`}
            color="text-red-500"
            trend="negative"
          />
          <MetricComparison
            label="Critical Modules"
            value={beforeMetrics.criticalModules}
            color="text-red-500"
            trend="negative"
          />
          <MetricComparison
            label="Architecture Complexity"
            value={beforeMetrics.complexity.toFixed(1)}
            color="text-orange-500"
            trend="negative"
          />
          <MetricComparison
            label="Deployment Time"
            value={beforeMetrics.deploymentTime}
            color="text-orange-500"
            trend="negative"
          />
          <MetricComparison
            label="Onboarding Time"
            value={beforeMetrics.onboardingTime}
            color="text-orange-500"
            trend="negative"
          />
        </div>

        {/* After State */}
        <div className={`space-y-4 transition-all duration-500 ${showAfter ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-foreground">Modernized State</h4>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs rounded-full font-medium">
              After
            </span>
          </div>
          
          <MetricComparison
            label="Maintainability Score"
            value={afterMetrics.maintainability}
            maxValue={100}
            color="text-green-500"
            trend="positive"
            improvement={`+${afterMetrics.maintainability - beforeMetrics.maintainability}%`}
          />
          <MetricComparison
            label="Technical Debt"
            value={`$${afterMetrics.technicalDebt}K`}
            color="text-green-500"
            trend="positive"
            improvement={`-${Math.abs(beforeMetrics.technicalDebt - afterMetrics.technicalDebt)}K`}
          />
          <MetricComparison
            label="Critical Modules"
            value={afterMetrics.criticalModules}
            color="text-green-500"
            trend="positive"
            improvement={`-${Math.abs(beforeMetrics.criticalModules - afterMetrics.criticalModules)}`}
          />
          <MetricComparison
            label="Architecture Complexity"
            value={afterMetrics.complexity.toFixed(1)}
            color="text-green-500"
            trend="positive"
            improvement={`-${Math.abs(beforeMetrics.complexity - afterMetrics.complexity).toFixed(1)}`}
          />
          <MetricComparison
            label="Deployment Time"
            value={afterMetrics.deploymentTime}
            color="text-green-500"
            trend="positive"
            improvement="-80%"
          />
          <MetricComparison
            label="Onboarding Time"
            value={afterMetrics.onboardingTime}
            color="text-green-500"
            trend="positive"
            improvement="-60%"
          />
        </div>
      </div>

      {/* Impact Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
        <h4 className="text-sm font-semibold text-foreground mb-3">Projected Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BenefitCard
            label="Risk Reduction"
            value="70%"
            description="Fewer critical vulnerabilities"
          />
          <BenefitCard
            label="Velocity Increase"
            value="3x"
            description="Faster feature delivery"
          />
          <BenefitCard
            label="Cost Savings"
            value="$180K/year"
            description="Reduced maintenance overhead"
          />
        </div>
      </div>
    </div>
  );
}

interface MetricComparisonProps {
  label: string;
  value: string | number;
  maxValue?: number;
  color: string;
  trend: 'positive' | 'negative';
  improvement?: string;
}

function MetricComparison({ label, value, maxValue, color, trend, improvement }: MetricComparisonProps) {
  const percentage = maxValue ? (Number(value) / maxValue) * 100 : null;

  return (
    <div className="p-3 glass rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {improvement && (
          <span className={`text-xs font-medium ${trend === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
            {improvement}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {trend === 'positive' ? (
          <TrendingUp className="w-5 h-5 text-green-500" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-500" />
        )}
      </div>
      {percentage !== null && (
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-2">
          <div 
            className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function BenefitCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold text-green-500 mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function calculateCurrentMetrics(graph: DependencyGraph) {
  const totalNodes = safeNumber(graph.nodes?.length, 1);
  
  if (!graph.nodes || totalNodes === 0) {
    return {
      maintainability: 75,
      technicalDebt: 8,
      criticalModules: 0,
      complexity: 5.0,
      deploymentTime: '30 min',
      onboardingTime: '2 weeks'
    };
  }

  const risk = calculateRiskCounts(graph.nodes);
  const avgRiskScore = safeNumber(
    graph.nodes.reduce((sum, n) => sum + safeNumber(n.risk_score, 0), 0) / risk.total,
    0.5
  );
  const avgComplexity = safeNumber(graph.metrics?.architecture_complexity, 5);
  const totalLOC = graph.nodes.reduce((sum, n) => sum + safeNumber(n.loc, 0), 0);
  
  const baseDebt = avgRiskScore * Math.max(totalLOC, 5000) * 0.08;
  const complexityMultiplier = 1 + (avgComplexity / 10);
  const riskMultiplier = 1 + (risk.highPlusCritical / Math.max(risk.total, 1)) * 0.5;
  const technicalDebt = safeCurrency(baseDebt * complexityMultiplier * riskMultiplier);
  const minDebt = totalNodes > 50 ? 15 : totalNodes > 20 ? 8 : 3;

  return {
    maintainability: safePercent((1 - avgRiskScore) * 100),
    technicalDebt: Math.max(technicalDebt, minDebt),
    criticalModules: risk.critical,
    complexity: avgComplexity,
    deploymentTime: '30-45 min',
    onboardingTime: '3-4 weeks'
  };
}

function calculateModernizedMetrics(graph: DependencyGraph) {
  const current = calculateCurrentMetrics(graph);
  
  const newMaintainability = clamp(current.maintainability + 25, 60, 95);
  const debtReduction = 0.35;
  const newTechnicalDebt = Math.max(1, Math.round(current.technicalDebt * (1 - debtReduction)));
  const newCriticalModules = Math.max(0, Math.round(current.criticalModules * 0.25));
  const newComplexity = clamp(current.complexity * 0.5, 2, 8);
  
  return {
    maintainability: newMaintainability,
    technicalDebt: newTechnicalDebt,
    criticalModules: newCriticalModules,
    complexity: newComplexity,
    deploymentTime: '8-10 min',
    onboardingTime: '1-2 weeks'
  };
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

// Made with Bob