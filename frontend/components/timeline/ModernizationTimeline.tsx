'use client';

import { DependencyGraph } from '@/types';
import { Clock, Zap, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

function safeNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return fallback;
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface ModernizationTimelineProps {
  graph: DependencyGraph;
}

interface TimelinePhase {
  phase: string;
  title: string;
  duration: string;
  effort: string;
  priority: 'immediate' | 'short-term' | 'long-term';
  tasks: string[];
  impact: string;
  cost: string;
}

export function ModernizationTimeline({ graph }: ModernizationTimelineProps) {
  const phases = generateModernizationPhases(graph);

  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Engineering Intelligence Timeline
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-generated modernization roadmap
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {phases.map((phase, index) => (
          <TimelineCard key={index} phase={phase} index={index} />
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Duration</p>
            <p className="text-xl font-bold text-foreground">
              {calculateTotalDuration(phases)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Effort</p>
            <p className="text-xl font-bold text-foreground">
              {calculateTotalEffort(phases)} weeks
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
            <p className="text-xl font-bold text-foreground">
              ${calculateTotalCost(phases)}K
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineCardProps {
  phase: TimelinePhase;
  index: number;
}

function TimelineCard({ phase, index }: TimelineCardProps) {
  const priorityColors = {
    immediate: 'border-red-500/30 bg-red-500/5',
    'short-term': 'border-orange-500/30 bg-orange-500/5',
    'long-term': 'border-blue-500/30 bg-blue-500/5'
  };

  const priorityIcons = {
    immediate: Zap,
    'short-term': Target,
    'long-term': TrendingUp
  };

  const Icon = priorityIcons[phase.priority];

  return (
    <div
      className={`relative pl-8 pb-6 border-l-2 ${
        index === 0 ? 'border-primary' : 'border-white/10'
      } animate-fadeIn`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Timeline dot */}
      <div
        className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${
          index === 0 ? 'bg-primary animate-pulse-glow' : 'bg-white/20'
        }`}
      />

      <div className={`p-4 rounded-lg border ${priorityColors[phase.priority]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">{phase.title}</h4>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {phase.phase}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{phase.duration}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{phase.effort}</p>
            <p className="text-xs text-muted-foreground">{phase.cost}</p>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-2 mb-3">
          {phase.tasks.map((task, taskIndex) => (
            <div key={taskIndex} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{task}</p>
            </div>
          ))}
        </div>

        {/* Impact */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-muted-foreground mb-1">Expected Impact:</p>
          <p className="text-sm text-foreground font-medium">{phase.impact}</p>
        </div>
      </div>
    </div>
  );
}

function generateModernizationPhases(graph: DependencyGraph): TimelinePhase[] {
  const totalNodes = safeNumber(graph.nodes?.length, 0);
  if (!graph.nodes || totalNodes === 0) {
    return getDefaultPhases();
  }

  const criticalNodes = graph.nodes.filter(n => safeNumber(n.risk_score, 0) >= 0.8);
  const highRiskNodes = graph.nodes.filter(n => {
    const risk = safeNumber(n.risk_score, 0);
    return risk >= 0.6 && risk < 0.8;
  });
  const mediumRiskNodes = graph.nodes.filter(n => {
    const risk = safeNumber(n.risk_score, 0);
    return risk >= 0.4 && risk < 0.6;
  });
  
  const criticalCount = criticalNodes.length;
  const highRiskCount = highRiskNodes.length;
  const highPlusCritical = criticalCount + highRiskCount;

  const phases: TimelinePhase[] = [];

  if (criticalCount > 0) {
    phases.push({
      phase: 'Phase 1',
      title: 'Critical Risk Mitigation',
      duration: '2-4 weeks',
      effort: '3-4 weeks',
      priority: 'immediate',
      tasks: [
        `Address ${criticalCount} critical-risk modules`,
        'Implement comprehensive test coverage for critical paths',
        'Add monitoring and alerting for high-impact areas',
        'Document architectural dependencies and risks'
      ],
      impact: 'Reduce immediate production risk by 60-70%',
      cost: '40-60K'
    });
  }

  if (highRiskCount > 0) {
    phases.push({
      phase: 'Phase 2',
      title: 'Architectural Decoupling',
      duration: '6-8 weeks',
      effort: '8-10 weeks',
      priority: 'short-term',
      tasks: [
        `Refactor ${highRiskCount} high-risk modules`,
        'Implement dependency injection patterns',
        'Extract tightly coupled services',
        'Introduce API contracts and versioning',
        'Migrate to event-driven architecture for key workflows'
      ],
      impact: 'Improve maintainability score by 40%, reduce coupling by 50%',
      cost: '80-120K'
    });
  }

  phases.push({
    phase: 'Phase 3',
    title: 'Cloud-Native Transformation',
    duration: '12-16 weeks',
    effort: '16-20 weeks',
    priority: 'long-term',
    tasks: [
      'Migrate to microservices architecture',
      'Implement containerization (Docker/Kubernetes)',
      'Add service mesh for observability',
      'Implement CI/CD pipelines',
      'Add comprehensive integration testing',
      'Performance optimization and caching strategies'
    ],
    impact: 'Enable horizontal scaling, reduce deployment time by 80%',
    cost: '150-250K'
  });

  if (mediumRiskNodes.length > 5) {
    phases.push({
      phase: 'Phase 4',
      title: 'Performance & Optimization',
      duration: '8-10 weeks',
      effort: '10-12 weeks',
      priority: 'long-term',
      tasks: [
        'Optimize database queries and indexing',
        'Implement advanced caching strategies',
        'Add CDN for static assets',
        'Optimize API response times',
        'Implement load balancing and auto-scaling'
      ],
      impact: 'Reduce latency by 50%, improve throughput by 3x',
      cost: '60-100K'
    });
  }

  return phases.length > 0 ? phases : getDefaultPhases();
}

function getDefaultPhases(): TimelinePhase[] {
  return [
    {
      phase: 'Phase 1',
      title: 'Initial Assessment',
      duration: '1-2 weeks',
      effort: '1-2 weeks',
      priority: 'immediate',
      tasks: [
        'Analyze codebase structure and dependencies',
        'Identify quick wins for improvement',
        'Set up monitoring and metrics collection'
      ],
      impact: 'Establish baseline for modernization journey',
      cost: '10-20K'
    },
    {
      phase: 'Phase 2',
      title: 'Technical Foundation',
      duration: '4-8 weeks',
      effort: '6-8 weeks',
      priority: 'short-term',
      tasks: [
        'Implement CI/CD pipelines',
        'Add comprehensive test coverage',
        'Establish coding standards and code review process'
      ],
      impact: 'Improve developer productivity by 30%',
      cost: '40-60K'
    },
    {
      phase: 'Phase 3',
      title: 'Modernization',
      duration: '12-16 weeks',
      effort: '16-20 weeks',
      priority: 'long-term',
      tasks: [
        'Migrate to modern architecture patterns',
        'Implement containerization',
        'Add observability and monitoring'
      ],
      impact: 'Enable rapid feature delivery',
      cost: '100-150K'
    }
  ];
}

function calculateTotalDuration(phases: TimelinePhase[]): string {
  const weeks = phases.reduce((sum, phase) => {
    const match = phase.duration.match(/(\d+)-(\d+)/);
    if (match) {
      return sum + parseInt(match[2]);
    }
    return sum;
  }, 0);
  
  return `${Math.floor(weeks / 4)}-${Math.ceil(weeks / 4)} months`;
}

function calculateTotalEffort(phases: TimelinePhase[]): number {
  return phases.reduce((sum, phase) => {
    const match = phase.effort.match(/(\d+)-(\d+)/);
    if (match) {
      return sum + parseInt(match[2]);
    }
    return sum;
  }, 0);
}

function calculateTotalCost(phases: TimelinePhase[]): number {
  return phases.reduce((sum, phase) => {
    const match = phase.cost.match(/(\d+)-(\d+)/);
    if (match) {
      return sum + parseInt(match[2]);
    }
    return sum;
  }, 0);
}

// Made with Bob