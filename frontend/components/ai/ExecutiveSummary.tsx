'use client';

import { useState, useEffect } from 'react';
import { RepoSummary } from '@/types';
import { getRepoSummary } from '@/lib/api';
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface ExecutiveSummaryProps {
  repoPath: string;
}

export function ExecutiveSummary({ repoPath }: ExecutiveSummaryProps) {
  const [summary, setSummary] = useState<RepoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    architecture: true,
    risks: true,
    priorities: true,
    onboarding: true,
  });

  useEffect(() => {
    if (repoPath) {
      loadSummary();
    }
  }, [repoPath]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRepoSummary(repoPath);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="glass rounded-xl border border-white/10 p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="text-lg text-purple-300">Generating executive summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl border border-red-500/20 p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-foreground">AI Executive Summary</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.repository_name} • {summary.total_files} files • {summary.total_lines.toLocaleString()} lines
        </p>
        <div className="flex gap-2 mt-3">
          {summary.languages.map((lang) => (
            <span key={lang} className="text-xs bg-white/10 px-2 py-1 rounded">
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Architecture Overview */}
        <CollapsibleSection
          title="Architecture Overview"
          icon={FileText}
          expanded={expandedSections.architecture}
          onToggle={() => toggleSection('architecture')}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary.architecture_overview}
          </p>
        </CollapsibleSection>

        {/* Top Risks */}
        <CollapsibleSection
          title="Top Risks"
          icon={AlertTriangle}
          expanded={expandedSections.risks}
          onToggle={() => toggleSection('risks')}
          iconColor="text-red-400"
        >
          <ul className="space-y-2">
            {summary.top_risks.map((risk, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Critical Modules */}
        {summary.critical_modules.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Critical Modules
            </h3>
            <div className="space-y-2">
              {summary.critical_modules.map((module, idx) => (
                <div key={idx} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-foreground">{module.path}</span>
                    <span className="text-xs text-orange-400 font-semibold">
                      Risk: {module.risk_score.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{module.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modernization Priorities */}
        <CollapsibleSection
          title="Modernization Priorities"
          icon={TrendingUp}
          expanded={expandedSections.priorities}
          onToggle={() => toggleSection('priorities')}
          iconColor="text-blue-400"
        >
          <ol className="space-y-2">
            {summary.modernization_priorities.map((priority, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-blue-400 font-semibold">{idx + 1}.</span>
                <span>{priority}</span>
              </li>
            ))}
          </ol>
        </CollapsibleSection>

        {/* Onboarding Difficulty */}
        <CollapsibleSection
          title="Onboarding Assessment"
          icon={Users}
          expanded={expandedSections.onboarding}
          onToggle={() => toggleSection('onboarding')}
          iconColor="text-green-400"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Difficulty Level</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                summary.onboarding_difficulty.level === 'Easy' 
                  ? 'bg-green-500/20 text-green-400'
                  : summary.onboarding_difficulty.level === 'Moderate'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {summary.onboarding_difficulty.level}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Time</span>
              <span className="text-sm font-semibold text-foreground">
                {summary.onboarding_difficulty.estimated_onboarding_time}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary.onboarding_difficulty.description}
            </p>
          </div>
        </CollapsibleSection>

        {/* Recommended Next Steps */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Recommended Next Steps
          </h3>
          <ul className="space-y-2">
            {summary.recommended_next_steps.map((step, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground/60 pt-4 border-t border-white/5">
          Generated {new Date(summary.generated_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  expanded: boolean;
  onToggle: () => void;
  iconColor?: string;
  children: React.ReactNode;
}

function CollapsibleSection({ 
  title, 
  icon: Icon, 
  expanded, 
  onToggle, 
  iconColor = 'text-primary',
  children 
}: CollapsibleSectionProps) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-smooth"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}

// Made with Bob