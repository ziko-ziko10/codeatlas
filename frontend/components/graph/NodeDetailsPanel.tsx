'use client';

import { GraphNode } from '@/types';
import { getRiskLevel, getRiskBgColor, formatNumber } from '@/lib/utils';
import { X, FileCode, AlertTriangle, TrendingUp, GitBranch, Code, Box } from 'lucide-react';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';

function safeVal<T>(val: T | undefined | null, fallback: any): any {
  if (val === undefined || val === null) return fallback;
  return val;
}

function normalizeRiskScore(score: number): number {
  const raw = safeVal(score, 0);
  if (raw > 1) return Math.min(raw / 100, 1);
  return Math.max(0, Math.min(raw, 1));
}

interface NodeDetailsPanelProps {
  node: GraphNode | null;
  repoPath: string;
  onClose: () => void;
}

export function NodeDetailsPanel({ node, repoPath, onClose }: NodeDetailsPanelProps) {
  if (!node) return null;

  const riskScore = normalizeRiskScore(node.risk_score);
  const riskLevel = getRiskLevel(riskScore);
  const riskBgClass = getRiskBgColor(riskScore);
  const centrality = safeVal(node.centrality, 0);
  const blastRadius = safeVal(node.in_degree, 0);
  const loc = safeVal(node.line_count, 0);
  const imports: string[] = [];
  const functions: string[] = [];
  const classes: string[] = [];
  const filePath = safeVal(node.path, node.name, 'Unknown');
  const language = safeVal(node.language, 'Unknown');
  const modernizationRec = 'Modernization recommendation not available for this module.';

  return (
    <div className="fixed top-20 right-4 w-96 glass rounded-xl border border-white/10 shadow-2xl z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-white/10">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">Module Details</h3>
          <p className="text-sm text-muted-foreground truncate">{filePath}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Risk Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Risk Score</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${riskBgClass}`}>
              {riskLevel}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${riskScore * 100}%`,
                background: `hsl(${(1 - riskScore) * 120}, 70%, 50%)`,
              }}
            />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {(riskScore * 100).toFixed(1)}%
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricItem
            icon={FileCode}
            label="Language"
            value={language}
          />
          <MetricItem
            icon={Code}
            label="Lines of Code"
            value={formatNumber(loc)}
          />
          <MetricItem
            icon={GitBranch}
            label="Centrality"
            value={(centrality * 100).toFixed(1) + '%'}
          />
          <MetricItem
            icon={AlertTriangle}
            label="Blast Radius"
            value={blastRadius.toFixed(1)}
          />
        </div>

        {/* Dependencies */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Imports ({imports.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {imports.length > 0 ? (
              imports.map((imp: string, idx: number) => (
                <div
                  key={idx}
                  className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg"
                >
                  {imp}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No imports</p>
            )}
          </div>
        </div>

        {/* Functions */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Functions ({functions.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {functions.length > 0 ? (
              functions.map((func: string, idx: number) => (
                <div
                  key={idx}
                  className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg font-mono"
                >
                  {func}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No functions</p>
            )}
          </div>
        </div>

        {/* Classes */}
        {classes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Box className="w-4 h-4" />
              Classes ({classes.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {classes.map((cls: string, idx: number) => (
                <div
                  key={idx}
                  className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg font-mono"
                >
                  {cls}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        <AIInsightsPanel repoPath={repoPath} filePath={filePath} />

        {/* Modernization Recommendation */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Modernization Recommendation
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {modernizationRec}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MetricItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}

function MetricItem({ icon: Icon, label, value }: MetricItemProps) {
  return (
    <div className="bg-secondary/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

// Made with Bob
