'use client';

import { useState } from 'react';
import { GeneratedDoc } from '@/types';
import { generateDocumentation } from '@/lib/api';
import { FileText, Download, Copy, Loader2, CheckCircle } from 'lucide-react';

interface DocumentationGeneratorProps {
  repoPath: string;
}

export function DocumentationGenerator({ repoPath }: DocumentationGeneratorProps) {
  const [selectedDocType, setSelectedDocType] = useState<GeneratedDoc['doc_type']>('ARCHITECTURE');
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const docTypes: Array<{ value: GeneratedDoc['doc_type']; label: string; description: string }> = [
    {
      value: 'ARCHITECTURE',
      label: 'Architecture Documentation',
      description: 'System design, module structure, and technical stack'
    },
    {
      value: 'ONBOARDING',
      label: 'Onboarding Guide',
      description: 'Setup instructions and getting started guide'
    },
    {
      value: 'RISK_REPORT',
      label: 'Risk Assessment Report',
      description: 'Technical debt and risk analysis'
    },
    {
      value: 'MODERNIZATION_PLAN',
      label: 'Modernization Plan',
      description: 'Roadmap for improving the codebase'
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedDoc(null);
    try {
      const doc = await generateDocumentation(repoPath, selectedDocType);
      setGeneratedDoc(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate documentation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (generatedDoc) {
      await navigator.clipboard.writeText(generatedDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedDoc) {
      const blob = new Blob([generatedDoc.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedDoc.doc_type}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-foreground">Documentation Generator</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate comprehensive markdown documentation powered by AI
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Document Type Selection */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Select Document Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docTypes.map((docType) => (
              <button
                key={docType.value}
                onClick={() => setSelectedDocType(docType.value)}
                className={`text-left p-4 rounded-lg border transition-smooth ${
                  selectedDocType === docType.value
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="font-semibold text-sm text-foreground mb-1">
                  {docType.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {docType.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate Documentation
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Generated Documentation */}
        {generatedDoc && (
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {docTypes.find(d => d.value === generatedDoc.doc_type)?.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Generated {new Date(generatedDoc.generated_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-smooth text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-smooth text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-secondary/30 border border-white/10 rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {generatedDoc.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob