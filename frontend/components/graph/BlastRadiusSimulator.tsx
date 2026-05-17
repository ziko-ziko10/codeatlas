'use client';

import { useState } from 'react';
import { DependencyGraph, GraphNode } from '@/types';
import { Target, Zap, AlertTriangle } from 'lucide-react';

interface BlastRadiusSimulatorProps {
  graph: DependencyGraph;
  onNodeSelect: (node: GraphNode) => void;
}

export function BlastRadiusSimulator({ graph, onNodeSelect }: BlastRadiusSimulatorProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [affectedNodes, setAffectedNodes] = useState<Set<string>>(new Set());
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateBlastRadius = (node: GraphNode) => {
    setSelectedNode(node);
    setIsSimulating(true);
    
    // Calculate affected nodes
    const affected = new Set<string>();
    const queue: string[] = [node.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      affected.add(currentId);

      // Find all nodes that depend on current node
      const dependents = graph.edges
        .filter(e => e.source === currentId)
        .map(e => e.target);

      queue.push(...dependents);
    }

    // Animate the cascade
    let delay = 0;
    const animatedAffected = new Set<string>();
    
    Array.from(affected).forEach((nodeId, index) => {
      setTimeout(() => {
        animatedAffected.add(nodeId);
        setAffectedNodes(new Set(animatedAffected));
        
        if (index === affected.size - 1) {
          setTimeout(() => setIsSimulating(false), 500);
        }
      }, delay);
      delay += 200;
    });
  };

  const resetSimulation = () => {
    setSelectedNode(null);
    setAffectedNodes(new Set());
    setIsSimulating(false);
  };

  const getSeverityLevel = (count: number): string => {
    if (count > 15) return 'Critical';
    if (count > 10) return 'High';
    if (count > 5) return 'Medium';
    return 'Low';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Blast Radius Simulator</h3>
            <p className="text-sm text-muted-foreground">
              Click a module to visualize cascading impact
            </p>
          </div>
        </div>
        {selectedNode && (
          <button
            onClick={resetSimulation}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-smooth text-sm font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {!selectedNode ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {graph.nodes
            .filter(n => n.path || n.name)
            .sort((a, b) => (b.in_degree || 0) - (a.in_degree || 0))
            .slice(0, 12)
            .map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  simulateBlastRadius(node);
                  onNodeSelect(node);
                }}
                className="p-4 glass rounded-lg border border-white/10 hover:border-primary/50 transition-all text-left group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Zap className="w-4 h-4 text-primary group-hover:animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      {node.in_degree || 0} affected
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {(node.path || node.name || '').split('/').pop()}
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: (node.risk_score || 0) >= 0.8 ? '#ef4444' :
                                       (node.risk_score || 0) >= 0.6 ? '#f97316' :
                                       (node.risk_score || 0) >= 0.4 ? '#eab308' : '#22c55e'
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(node.risk_score * 100)}% risk
                    </span>
                  </div>
                </div>
              </button>
            ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected Node Info */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">
                  {(selectedNode.path || selectedNode.name || '').split('/').pop()}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedNode.path || selectedNode.name || 'Unknown'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-foreground">
                      Risk: {Math.round((selectedNode.risk_score || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">
                      {selectedNode.line_count || 0} LOC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ImpactCard
              label="Affected Modules"
              value={affectedNodes.size}
              severity={getSeverityLevel(affectedNodes.size)}
              isAnimating={isSimulating}
            />
            <ImpactCard
              label="Cascade Depth"
              value={calculateCascadeDepth(graph, selectedNode.id)}
              severity={getSeverityLevel(calculateCascadeDepth(graph, selectedNode.id))}
              isAnimating={isSimulating}
            />
            <ImpactCard
              label="Risk Severity"
              value={getSeverityLevel(affectedNodes.size)}
              severity={getSeverityLevel(affectedNodes.size)}
              isAnimating={isSimulating}
            />
          </div>

          {/* Affected Nodes List */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Cascading Impact ({affectedNodes.size} modules)
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.from(affectedNodes).map((nodeId, index) => {
                const node = graph.nodes.find(n => n.id === nodeId);
                if (!node) return null;

                return (
                  <div
                    key={nodeId}
                    className="p-3 glass rounded-lg border border-white/10 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {(node.path || node.name || '').split('/').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {node.path || node.name || 'Unknown'}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          (node.risk_score || 0) >= 0.8 ? 'bg-red-500/10 text-red-500' :
                          (node.risk_score || 0) >= 0.6 ? 'bg-orange-500/10 text-orange-500' :
                          (node.risk_score || 0) >= 0.4 ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-green-500/10 text-green-500'
                        }`}
                      >
                        {Math.round((node.risk_score || 0) * 100)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImpactCardProps {
  label: string;
  value: number | string;
  severity: string;
  isAnimating: boolean;
}

function ImpactCard({ label, value, severity, isAnimating }: ImpactCardProps) {
  const getSeverityColor = (sev: string): string => {
    switch (sev) {
      case 'Critical': return 'text-red-500 border-red-500/30 bg-red-500/5';
      case 'High': return 'text-orange-500 border-orange-500/30 bg-orange-500/5';
      case 'Medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5';
      default: return 'text-green-500 border-green-500/30 bg-green-500/5';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all ${getSeverityColor(severity)}`}>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className={`text-3xl font-bold ${isAnimating ? 'animate-pulse' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function calculateCascadeDepth(graph: DependencyGraph, startNodeId: string): number {
  let maxDepth = 0;
  const visited = new Set<string>();

  function dfs(nodeId: string, depth: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    maxDepth = Math.max(maxDepth, depth);

    const dependents = graph.edges
      .filter(e => e.source === nodeId)
      .map(e => e.target);

    dependents.forEach(depId => dfs(depId, depth + 1));
  }

  dfs(startNodeId, 0);
  return maxDepth;
}

// Made with Bob