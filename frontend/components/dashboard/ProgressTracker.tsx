'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, Loader2, GitBranch, FileCode, Network, BarChart3, AlertTriangle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  icon: React.ElementType;
  detail?: string;
  status: 'pending' | 'running' | 'completed';
  progress: number;
}

interface ProgressTrackerProps {
  type: 'local' | 'github' | 'demo';
  repoPath?: string;
  analysisMode?: 'fast' | 'full';
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

const stepIcons: Record<string, React.ElementType> = {
  connect: GitBranch,
  download: FileCode,
  extract: FileCode,
  scan: FileCode,
  parse: FileCode,
  analyze: Network,
  graph: Network,
  metrics: BarChart3,
  finalize: Network,
  load: GitBranch,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function ProgressTracker({ type, repoPath, analysisMode, onComplete, onError }: ProgressTrackerProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallPercent, setOverallPercent] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async () => {
    abortRef.current = new AbortController();

    let endpoint: string;
    let body: Record<string, any>;

    if (type === 'local') {
      endpoint = `${API_BASE_URL}/scan/stream`;
      body = { path: repoPath || '' };
    } else if (type === 'github') {
      endpoint = `${API_BASE_URL}/github/import/stream`;
      body = {
        github_url: repoPath || '',
        mode: analysisMode || 'fast',
        max_files: 600,
        include_hidden: false,
        max_depth: null,
      };
    } else {
      // Demo doesn't need streaming, just simulate
      endpoint = '';
      body = {};
    }

    if (type === 'demo') {
      // For demo, just call the regular endpoint
      try {
        const resp = await fetch(`${API_BASE_URL}/demo/load/${repoPath}`);
        if (!resp.ok) throw new Error('Failed to load demo');
        const data = await resp.json();
        
        const graphData = {
          nodes: data.nodes || [],
          edges: data.edges || [],
          metrics: data.metrics || {},
        };
        
        const metricsResp = await fetch(`${API_BASE_URL}/metrics/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(graphData),
        });
        const metrics = metricsResp.ok ? await metricsResp.json() : null;
        
        onComplete({ graph: graphData, metrics });
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load demo');
      }
      return;
    }

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.detail || `Server error: ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Update steps
              if (data.steps) {
                const stepList = Object.entries(data.steps).map(([id, s]: [string, any]) => ({
                  id,
                  label: s.label,
                  icon: stepIcons[id] || Network,
                  detail: s.detail || '',
                  status: s.status || 'pending',
                  progress: s.progress || 0,
                }));
                setSteps(stepList);
              }

              // Update current step index
              if (typeof data.current_step === 'number') {
                setCurrentStep(data.current_step);
              }

              // Update overall progress
              if (typeof data.overall === 'number') {
                setOverallPercent(Math.round(data.overall));
              }

              // Check if done
              if (data.done && data.result) {
                setIsComplete(true);
                setOverallPercent(100);
                setTimeout(() => onComplete(data.result), 500);
                return;
              }

              // Check for error
              if (data.error) {
                setHasError(true);
                onError(data.error);
                return;
              }
            } catch (parseErr) {
              console.warn('Failed to parse SSE data:', parseErr);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setHasError(true);
      onError(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [type, repoPath, analysisMode, onComplete, onError]);

  useEffect(() => {
    startStream();
    return () => {
      abortRef.current?.abort();
    };
  }, [startStream]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium">Analysis failed</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {isComplete ? 'Analysis Complete' : steps[currentStep]?.label}
          </span>
          <span className="text-sm font-mono text-primary">{overallPercent}%</span>
        </div>
        <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'running';
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                isCurrent ? 'bg-primary/10 border border-primary/20' : 
                isCompleted ? 'bg-secondary/30 border border-white/5' : 
                'bg-transparent border border-transparent'
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  isCompleted ? 'text-emerald-400' : 
                  isCurrent ? 'text-foreground' : 
                  'text-muted-foreground/50'
                }`}>
                  {step.label}
                </p>
                {isCurrent && step.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                )}
              </div>

              {isCurrent && (
                <div className="flex-shrink-0 w-16">
                  <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {isComplete && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">Repository analysis complete. Loading dashboard...</p>
        </div>
      )}
    </div>
  );
}
