'use client';

import { useState, useEffect } from 'react';
import { Loader2, FolderOpen, Search, Github, Zap, Database, Star, FileCode, Clock, AlertTriangle, ArrowRight, GitBranch, Languages, CheckCircle2, X } from 'lucide-react';
import { previewGitHubRepository, RepoPreview } from '@/lib/api';

interface ScanFormProps {
  onScan: (repoPath: string) => Promise<void>;
  onGitHubImport: (githubUrl: string, mode?: 'fast' | 'full') => Promise<void>;
  isLoading: boolean;
}

export function ScanForm({ onScan, onGitHubImport, isLoading }: ScanFormProps) {
  const [repoPath, setRepoPath] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'local' | 'github'>('local');
  const [analysisMode, setAnalysisMode] = useState<'fast' | 'full'>('fast');
  const [preview, setPreview] = useState<RepoPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Debounced preview fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isGitHubUrl(githubUrl) && !isLoading) {
        fetchPreview();
      } else {
        setPreview(null);
        setPreviewError(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [githubUrl, isLoading]);

  const isGitHubUrl = (input: string): boolean => {
    return input.trim().toLowerCase().startsWith('https://github.com/');
  };

  const fetchPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(false);
    try {
      const info = await previewGitHubRepository(githubUrl);
      setPreview(info);
    } catch {
      setPreview(null);
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'local') {
      if (!repoPath.trim()) {
        setError('Please enter a repository path');
        return;
      }
      try {
        await onScan(repoPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to scan repository');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!githubUrl.trim() || !preview) return;
    setError('');
    try {
      await onGitHubImport(githubUrl, analysisMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository');
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setGithubUrl('');
    setPreviewError(false);
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('local'); clearPreview(); }}
          disabled={isLoading}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
            mode === 'local'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <FolderOpen className="w-4 h-4" />
          Local Path
        </button>
        <button
          type="button"
          onClick={() => setMode('github')}
          disabled={isLoading}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
            mode === 'github'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Github className="w-4 h-4" />
          GitHub URL
        </button>
      </div>

      {mode === 'local' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="repoPath" className="block text-sm font-medium text-foreground mb-2">
              Repository Path
            </label>
            <div className="relative">
              <input
                id="repoPath"
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="C:\Users\YourName\Projects\my-repo"
                disabled={isLoading}
                className="w-full px-4 py-3 pl-11 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <FolderOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze Repository
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label htmlFor="githubUrl" className="block text-sm font-medium text-foreground mb-2">
              GitHub Repository URL
            </label>
            <div className="relative">
              <input
                id="githubUrl"
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                disabled={isLoading}
                className="w-full px-4 py-3 pl-11 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              {previewLoading && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
              )}
            </div>
          </div>

          {/* Preview Card */}
          {preview && (
            <div className="animate-fadeIn">
              <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Card Header */}
                <div className="p-5 border-b border-white/10 bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Github className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{preview.full_name}</h3>
                        {preview.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{preview.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                            {preview.stars.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Languages className="w-3.5 h-3.5 text-blue-400" />
                            {preview.language}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <GitBranch className="w-3.5 h-3.5 text-green-400" />
                            {preview.branch}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={clearPreview}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      icon={FileCode}
                      label="Source Files"
                      value={preview.source_files.toLocaleString()}
                      color="text-blue-400"
                      bgColor="bg-blue-500/10"
                    />
                    <StatCard
                      icon={Database}
                      label="Repository Size"
                      value={`${preview.size_mb} MB`}
                      color="text-purple-400"
                      bgColor="bg-purple-500/10"
                    />
                    <StatCard
                      icon={Clock}
                      label="Est. Analysis Time"
                      value={preview.estimated_time}
                      color="text-amber-400"
                      bgColor="bg-amber-500/10"
                    />
                    <StatCard
                      icon={Zap}
                      label="Import Mode"
                      value={preview.import_mode}
                      color="text-emerald-400"
                      bgColor="bg-emerald-500/10"
                    />
                  </div>

                  {/* Large Repo Warning */}
                  {preview.is_large && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <p className="text-sm text-amber-300">
                        Large repository detected. Using API tree mode for selective download.
                      </p>
                    </div>
                  )}

                  {/* Analysis Mode Selector */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Analysis Depth
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAnalysisMode('fast')}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          analysisMode === 'fast'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'bg-secondary/50 text-muted-foreground border border-border hover:border-white/20'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        Fast
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalysisMode('full')}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          analysisMode === 'full'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                            : 'bg-secondary/50 text-muted-foreground border border-border hover:border-white/20'
                        }`}
                      >
                        <Database className="w-4 h-4" />
                        Full Clone
                      </button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full mt-4 px-6 py-3.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25 group"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing & Analyzing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Proceed & Analyze
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Error */}
          {previewError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300">Could not fetch repository info</p>
                <p className="text-xs text-muted-foreground mt-1">Make sure the URL is correct and the repo is public</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Help Text */}
          {!preview && !previewError && (
            <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Example URLs:</strong>
                <br />
                <code className="text-primary">https://github.com/facebook/react</code>
                <br />
                <code className="text-primary">https://github.com/vercel/next.js</code>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: { icon: React.ElementType; label: string; value: string; color: string; bgColor: string }) {
  return (
    <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 ${bgColor} rounded-lg`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
