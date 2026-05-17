'use client';

import { useState, useEffect } from 'react';
import { DependencyGraph, GraphNode } from '@/types';
import { Brain, AlertTriangle, Zap, TrendingDown } from 'lucide-react';

interface RiskNarratorProps {
  graph: DependencyGraph;
}

export function RiskNarrator({ graph }: RiskNarratorProps) {
  const [currentNarration, setCurrentNarration] = useState(0);
  const narrations = generateNarrations(graph);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNarration((prev) => (prev + 1) % narrations.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [narrations.length]);

  if (narrations.length === 0) return null;

  return (
    <div className="glass rounded-xl p-6 border border-white/10 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 animate-gradient" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Risk Intelligence</h3>
            <p className="text-xs text-muted-foreground">Real-time architecture analysis</p>
          </div>
        </div>

        <div className="space-y-4">
          {narrations.map((narration, index) => (
            <NarrationCard
              key={index}
              narration={narration}
              isActive={index === currentNarration}
              index={index}
            />
          ))}
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mt-4">
          {narrations.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                index === currentNarration ? 'bg-primary' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Narration {
  type: 'critical' | 'warning' | 'insight' | 'recommendation';
  icon: React.ElementType;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface NarrationCardProps {
  narration: Narration;
  isActive: boolean;
  index: number;
}

function NarrationCard({ narration, isActive, index }: NarrationCardProps) {
  const Icon = narration.icon;
  
  const severityColors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-orange-500/30 bg-orange-500/5',
    low: 'border-blue-500/30 bg-blue-500/5'
  };

  const iconColors = {
    high: 'text-red-500',
    medium: 'text-orange-500',
    low: 'text-blue-500'
  };

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all duration-500
        ${isActive ? severityColors[narration.severity] : 'border-white/5 bg-white/5 opacity-50'}
        ${isActive ? 'scale-100' : 'scale-95'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-opacity-10 ${isActive ? iconColors[narration.severity] : 'text-muted-foreground'}`}>
          <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className={`font-semibold text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
            {narration.title}
          </h4>
          <p className={`text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
            {narration.message}
          </p>
        </div>
      </div>
    </div>
  );
}

function generateNarrations(graph: DependencyGraph): Narration[] {
  if (!graph.nodes || graph.nodes.length === 0) {
    return [{
      type: 'insight',
      icon: Brain,
      title: 'No Data Available',
      message: 'Run a repository scan to generate AI-powered risk analysis.',
      severity: 'low'
    }];
  }
  
  const narrations: Narration[] = [];
  const criticalNodes = graph.nodes.filter(n => (n.risk_score || 0) >= 0.8);
  const highRiskNodes = graph.nodes.filter(n => {
    const risk = n.risk_score || 0;
    return risk >= 0.6 && risk < 0.8;
  });
  
  // Critical coupling detection - use 'path' property and add safety check
  const authNodes = graph.nodes.filter(n => {
    const path = n.path || n.name || '';
    return path.toLowerCase().includes('auth') ||
           path.toLowerCase().includes('authentication');
  });
  
  const paymentNodes = graph.nodes.filter(n => {
    const path = n.path || n.name || '';
    return path.toLowerCase().includes('payment') ||
           path.toLowerCase().includes('transaction');
  });

  if (authNodes.length > 0 && paymentNodes.length > 0) {
    const authNode = authNodes[0];
    const paymentNode = paymentNodes[0];
    
    // Check if they're connected
    const isConnected = graph.edges.some(e => 
      (e.source === authNode.id && e.target === paymentNode.id) ||
      (e.source === paymentNode.id && e.target === authNode.id)
    );

    if (isConnected) {
      narrations.push({
        type: 'critical',
        icon: AlertTriangle,
        title: 'Critical Architectural Coupling Detected',
        message: 'Authentication service is tightly coupled to payment workflows. A failure in auth could cascade to payment processing, creating a critical business risk.',
        severity: 'high'
      });
    }
  }

  // Cache invalidation risk
  const cacheNodes = graph.nodes.filter(n => {
    const path = n.path || n.name || '';
    return path.toLowerCase().includes('cache') ||
           path.toLowerCase().includes('redis');
  });

  if (cacheNodes.length > 0 && ((cacheNodes[0].in_degree || 0) > 15)) {
    const dependentCount = cacheNodes[0].in_degree || 0;
    narrations.push({
      type: 'critical',
      icon: Zap,
      title: 'Cache Invalidation Propagation Risk',
      message: `A failure in cache invalidation may propagate across ${dependentCount} dependent modules. This represents a systemic reliability concern requiring immediate attention.`,
      severity: 'high'
    });
  }

  // Architectural erosion
  if (criticalNodes.length > 2) {
    const avgComplexity = graph.metrics.architecture_complexity;
    narrations.push({
      type: 'warning',
      icon: TrendingDown,
      title: 'Architectural Erosion Detected',
      message: `${criticalNodes.length} modules show characteristics of architectural erosion. Complexity score of ${avgComplexity.toFixed(1)} indicates accumulated technical debt affecting maintainability.`,
      severity: 'medium'
    });
  }

  // High centrality risk
  const highCentralityNodes = graph.nodes
    .filter(n => (n.centrality || 0) > 0.8 && (n.path || n.name))
    .sort((a, b) => (b.centrality || 0) - (a.centrality || 0));

  if (highCentralityNodes.length > 0) {
    const node = highCentralityNodes[0];
    const path = node.path || node.name || '';
    const fileName = path.split('/').pop() || path;
    narrations.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Single Point of Failure Identified',
      message: `Module "${fileName}" has centrality score of ${((node.centrality || 0) * 100).toFixed(0)}%. This creates a single point of failure with ${node.in_degree || 0} dependent modules at risk.`,
      severity: 'high'
    });
  }

  // Modernization opportunity
  if (highRiskNodes.length > 3) {
    narrations.push({
      type: 'recommendation',
      icon: Brain,
      title: 'Modernization Opportunity',
      message: `${highRiskNodes.length} high-risk modules are candidates for refactoring. Implementing microservices architecture could reduce coupling by an estimated 40-60%.`,
      severity: 'low'
    });
  }

  // Dependency density insight
  if (graph.metrics.dependency_density > 0.6) {
    narrations.push({
      type: 'insight',
      icon: Brain,
      title: 'High Dependency Density',
      message: `Dependency density of ${(graph.metrics.dependency_density * 100).toFixed(0)}% indicates tight coupling. Consider implementing dependency injection and interface segregation principles.`,
      severity: 'medium'
    });
  }

  // Testing recommendation
  const untested = graph.nodes.filter(n => (n.risk_score || 0) > 0.7);
  if (untested.length > 0) {
    narrations.push({
      type: 'recommendation',
      icon: Brain,
      title: 'Test Coverage Priority',
      message: `${untested.length} high-risk modules require comprehensive test coverage. Prioritize integration tests for modules with blast radius > 10 to prevent cascading failures.`,
      severity: 'medium'
    });
  }

  return narrations;
}

// Made with Bob