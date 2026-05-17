'use client';

import { useState, useEffect } from 'react';
import { ModuleInsight } from '@/types';
import { getModuleInsight } from '@/lib/api';
import { Sparkles, AlertCircle, Lightbulb, TestTube, TrendingUp, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface AIInsightsPanelProps {
  repoPath: string;
  filePath: string;
}

export function AIInsightsPanel({ repoPath, filePath }: AIInsightsPanelProps) {
  const [insight, setInsight] = useState<ModuleInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadInsight();
  }, [repoPath, filePath]);

  const loadInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModuleInsight(repoPath, filePath);
      setInsight(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <span className="text-sm text-purple-300">Generating AI insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-smooth"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-semibold text-foreground">AI Insights</h4>
          <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
            {(insight.confidence_score * 100).toFixed(0)}% confidence
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Purpose */}
          <InsightSection
            icon={Lightbulb}
            title="Purpose"
            content={insight.purpose}
            iconColor="text-yellow-400"
          />

          {/* Technical Debt */}
          <InsightSection
            icon={AlertCircle}
            title="Technical Debt"
            content={insight.technical_debt}
            iconColor="text-orange-400"
          />

          {/* Modernization Advice */}
          <InsightSection
            icon={TrendingUp}
            title="Modernization Advice"
            content={insight.modernization_advice}
            iconColor="text-blue-400"
          />

          {/* Change Risks */}
          {insight.change_risks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <h5 className="text-xs font-semibold text-foreground">Change Risks</h5>
              </div>
              <ul className="space-y-1.5">
                {insight.change_risks.map((risk, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Tests */}
          {insight.suggested_tests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="w-4 h-4 text-green-400" />
                <h5 className="text-xs font-semibold text-foreground">Suggested Tests</h5>
              </div>
              <ul className="space-y-1.5">
                {insight.suggested_tests.map((test, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{test}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-muted-foreground/60 pt-2 border-t border-white/5">
            Generated {new Date(insight.generated_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

interface InsightSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  iconColor: string;
}

function InsightSection({ icon: Icon, title, content, iconColor }: InsightSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h5 className="text-xs font-semibold text-foreground">{title}</h5>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}

// Made with Bob