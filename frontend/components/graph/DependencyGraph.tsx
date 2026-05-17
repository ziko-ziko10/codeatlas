'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GraphNode as GraphNodeType, GraphEdge, DependencyGraph as DependencyGraphType } from '@/types';
import { getRiskColor } from '@/lib/utils';

interface DependencyGraphProps {
  graph: DependencyGraphType;
  onNodeClick?: (node: GraphNodeType) => void;
}

const nodeWidth = 180;
const nodeHeight = 60;
const hSpacing = 220;
const vSpacing = 100;

interface LayoutNode {
  id: string;
  rank: number;
  order: number;
}

function computeLayout(graphNodes: GraphNodeType[], graphEdges: GraphEdge[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (graphNodes.length === 0) return positions;
  if (graphNodes.length === 1) {
    positions.set(graphNodes[0].id, { x: 0, y: 0 });
    return positions;
  }

  // Build adjacency
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  
  graphNodes.forEach(n => {
    inDegree.set(n.id, 0);
    outEdges.set(n.id, []);
    inEdges.set(n.id, []);
  });

  graphEdges.forEach(e => {
    if (outEdges.has(e.source) && inEdges.has(e.target)) {
      outEdges.get(e.source)!.push(e.target);
      inEdges.get(e.target)!.push(e.source);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Topological sort with ranking (longest path layering)
  const rank = new Map<string, number>();
  const queue: string[] = [];
  
  graphNodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
      rank.set(n.id, 0);
    }
  });

  // If no zero in-degree nodes (cycles), start from all nodes
  if (queue.length === 0) {
    queue.push(graphNodes[0].id);
    rank.set(graphNodes[0].id, 0);
  }

  const visited = new Set<string>();
  const processed: string[] = [];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    processed.push(current);

    const children = outEdges.get(current) || [];
    children.forEach(child => {
      const newRank = (rank.get(current) || 0) + 1;
      rank.set(child, Math.max(rank.get(child) || 0, newRank));
      inDegree.set(child, (inDegree.get(child) || 0) - 1);
      if ((inDegree.get(child) || 0) <= 0 && !visited.has(child)) {
        queue.push(child);
      }
    });
  }

  // Handle unvisited nodes (cycles)
  graphNodes.forEach(n => {
    if (!visited.has(n.id)) {
      rank.set(n.id, 0);
      processed.push(n.id);
    }
  });

  // Group by rank
  const rankGroups = new Map<number, string[]>();
  graphNodes.forEach(n => {
    const r = rank.get(n.id) || 0;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(n.id);
  });

  // Sort within each rank by connections
  const ranks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
  
  // Barycenter ordering
  for (let i = 1; i < ranks.length; i++) {
    const currentRank = rankGroups.get(ranks[i])!;
    const prevRank = rankGroups.get(ranks[i - 1])!;
    const prevOrder = new Map<string, number>();
    prevRank.forEach((id, idx) => prevOrder.set(id, idx));

    const barycenters = currentRank.map(id => {
      const parents = inEdges.get(id) || [];
      const parentOrders = parents
        .filter(p => prevOrder.has(p))
        .map(p => prevOrder.get(p)!)
        .sort((a, b) => a - b);
      
      const bary = parentOrders.length > 0 
        ? parentOrders.reduce((a, b) => a + b, 0) / parentOrders.length 
        : prevRank.length / 2;
      
      return { id, bary };
    });

    barycenters.sort((a, b) => a.bary - b.bary);
    rankGroups.set(ranks[i], barycenters.map(b => b.id));
  }

  // Assign positions
  const maxRankSize = Math.max(...ranks.map(r => rankGroups.get(r)!.length));
  const centerX = (maxRankSize - 1) * hSpacing / 2;

  ranks.forEach((r, rankIdx) => {
    const group = rankGroups.get(r)!;
    const rowWidth = (group.length - 1) * hSpacing;
    const startX = centerX - rowWidth / 2;

    group.forEach((id, order) => {
      positions.set(id, {
        x: startX + order * hSpacing,
        y: rankIdx * vSpacing,
      });
    });
  });

  return positions;
}

export function DependencyGraph({ graph, onNodeClick }: DependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!graph || !graph.nodes.length) return { flowNodes: [], flowEdges: [] };

    const positions = computeLayout(graph.nodes, graph.edges);

    const flowNodes: Node[] = graph.nodes.map((node) => {
      const path = node.path || node.file_path || node.name || node.id;
      const riskColor = getRiskColor(node.risk_score);
      const fileName = path.split('/').pop() || node.name || path;
      const dirName = path.split('/').slice(-2, -1)[0] || '';
      const pos = positions.get(node.id) || { x: 0, y: 0 };
      
      return {
        id: node.id,
        type: 'default',
        position: { x: pos.x, y: pos.y },
        data: {
          label: (
            <div className="px-3 py-2">
              <div className="font-semibold text-sm truncate max-w-[140px]" title={fileName}>
                {fileName}
              </div>
              {dirName && (
                <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                  {dirName}/
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: 'rgba(17, 17, 17, 0.9)',
          color: '#ffffff',
          border: `2px solid ${riskColor}`,
          borderRadius: '10px',
          padding: '0',
          fontSize: '12px',
          fontWeight: '500',
          width: nodeWidth,
          minWidth: nodeWidth,
          boxShadow: `0 0 15px ${riskColor}20`,
          transition: 'all 0.2s ease',
        },
      };
    });

    const flowEdges: Edge[] = graph.edges.map((edge, index) => {
      const weight = Number(edge.weight) || 0;
      const isHighWeight = weight > 0.5;
      
      return {
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        animated: isHighWeight,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: isHighWeight ? '#3b82f6' : '#4b5563',
        },
        style: {
          stroke: isHighWeight ? '#3b82f6' : '#4b5563',
          strokeWidth: Math.max(1, Math.min(3, weight * 2.5)),
          opacity: hoveredNode ? 
            (edge.source === hoveredNode || edge.target === hoveredNode ? 1 : 0.1) : 
            0.6,
          transition: 'opacity 0.2s ease',
        },
        type: 'smoothstep',
      };
    });

    return { flowNodes, flowEdges };
  }, [graph, hoveredNode]);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      const graphNode = graph.nodes.find((n) => n.id === node.id);
      if (graphNode && onNodeClick) {
        onNodeClick(graphNode);
      }
    },
    [graph.nodes, onNodeClick]
  );

  const handleNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    setHoveredNode(node.id);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [setNodes]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  if (!graph || !graph.nodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No graph data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls 
          className="!bg-card !border-border !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-card !border-border !shadow-lg"
          nodeColor={(node) => {
            const graphNode = graph.nodes.find(n => n.id === node.id);
            return graphNode ? getRiskColor(graphNode.risk_score) : '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          nodeBorderRadius={8}
          nodeStrokeWidth={2}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#27272a"
        />
      </ReactFlow>
    </div>
  );
}
