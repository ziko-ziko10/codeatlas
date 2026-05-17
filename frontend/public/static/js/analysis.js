/**
 * CodeAtlas Analysis JavaScript
 * Wires the static analysis.html graph to real backend data.
 * Replaces hardcoded nodes/edges with actual scan results when available.
 */
const AnalysisPage = (() => {
  let graphNodes = [];
  let graphEdges = [];
  let camera = { x: 0, y: 0, zoom: 1 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let selectedNode = null;
  let hoveredNode = null;
  let blastMode = false;
  let time = 0;

  let canvas, ctx, minimapCanvas, minimapCtx;

  const layerColors = {
    presentation: 'oklch(65% 0.22 245)',
    business: 'oklch(60% 0.25 300)',
    data: 'oklch(70% 0.18 145)',
    infra: 'oklch(75% 0.16 85)',
  };

  const riskColors = {
    critical: 'rgba(255, 70, 70, 0.8)',
    warning: 'rgba(255, 180, 50, 0.7)',
    healthy: 'rgba(80, 200, 120, 0.6)',
  };

  function riskLevel(score) {
    if (score >= 0.8) return 'critical';
    if (score >= 0.5) return 'warning';
    return 'healthy';
  }

  function layerFromPath(path) {
    const p = path.toLowerCase();
    if (p.includes('component') || p.includes('ui') || p.includes('view') || p.includes('page')) return 'presentation';
    if (p.includes('model') || p.includes('schema') || p.includes('data') || p.includes('db')) return 'data';
    if (p.includes('config') || p.includes('infra') || p.includes('main') || p.includes('app')) return 'infra';
    return 'business';
  }

  function buildGraphFromData(graphData) {
    const nodes = graphData?.nodes || [];
    const edges = graphData?.edges || [];
    const w = canvas?.offsetWidth || 800;
    const h = canvas?.offsetHeight || 600;

    // Hierarchical layout
    const layerOrder = ['presentation', 'business', 'data', 'infra'];
    const layers = {};
    nodes.forEach((n) => {
      const layer = n.layer || layerFromPath(n.path || n.label || '');
      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(n);
    });

    const result = [];
    let idx = 0;
    layerOrder.forEach((layer, li) => {
      const items = layers[layer] || [];
      const y = 0.1 + (li / (layerOrder.length - 1)) * 0.8;
      items.forEach((n, ni) => {
        const x = items.length === 1 ? 0.5 : (ni + 1) / (items.length + 1);
        const riskScore = (n.risk_score || 0) > 1 ? (n.risk_score || 0) / 100 : (n.risk_score || 0);
        result.push({
          id: idx,
          label: (n.label || n.path || 'unknown').split('/').pop(),
          path: n.path || n.label || '',
          x,
          y,
          r: Math.max(10, Math.min(30, 8 + riskScore * 25)),
          layer,
          risk: riskLevel(riskScore),
          riskScore,
          riskScoreDisplay: Math.round((riskScore) * 100),
          centrality: n.centrality || 0,
          loc: n.loc || n.lines_of_code || 0,
          files: 1,
          original: n,
        });
        idx++;
      });
    });

    // Map edges by node path
    const pathToId = {};
    result.forEach((n) => {
      pathToId[n.path] = n.id;
      pathToId[n.label] = n.id;
    });

    const resultEdges = [];
    edges.forEach((e) => {
      const from = pathToId[e.source] ?? pathToId[e.from] ?? pathToId[e.source_path];
      const to = pathToId[e.target] ?? pathToId[e.to] ?? pathToId[e.target_path];
      if (from !== undefined && to !== undefined && from !== to) {
        resultEdges.push([from, to]);
      }
    });

    return { nodes: result, edges: resultEdges };
  }

  function useDefaultGraph() {
    graphNodes = [
      { id: 0, label: 'Appearance.tsx', x: 0.5, y: 0.12, r: 26, layer: 'presentation', risk: 'critical', riskScore: 0.82, centrality: 0.11, loc: 98, files: 1, path: 'frontend/src/components/Common/Appearance.tsx' },
      { id: 1, label: 'AppSidebar', x: 0.25, y: 0.22, r: 20, layer: 'presentation', risk: 'warning', riskScore: 0.6, centrality: 0.08, loc: 156, files: 1, path: 'frontend/src/components/Sidebar/AppSidebar.tsx' },
      { id: 2, label: 'sidebar.tsx', x: 0.75, y: 0.22, r: 18, layer: 'presentation', risk: 'warning', riskScore: 0.73, centrality: 0.07, loc: 230, files: 1, path: 'frontend/src/components/ui/sidebar.tsx' },
      { id: 3, label: 'users.py', x: 0.3, y: 0.42, r: 20, layer: 'business', risk: 'healthy', riskScore: 0.2, centrality: 0.05, loc: 420, files: 1, path: 'backend/app/api/routes/users.py' },
      { id: 4, label: 'login.py', x: 0.5, y: 0.42, r: 18, layer: 'business', risk: 'healthy', riskScore: 0.15, centrality: 0.04, loc: 310, files: 1, path: 'backend/app/api/routes/login.py' },
      { id: 5, label: 'test_users.py', x: 0.7, y: 0.42, r: 20, layer: 'business', risk: 'warning', riskScore: 0.66, centrality: 0.03, loc: 180, files: 1, path: 'backend/tests/api/routes/test_users.py' },
      { id: 6, label: 'models.py', x: 0.35, y: 0.62, r: 18, layer: 'data', risk: 'healthy', riskScore: 0.1, centrality: 0.09, loc: 560, files: 1, path: 'backend/app/db/models.py' },
      { id: 7, label: 'crud.py', x: 0.55, y: 0.62, r: 16, layer: 'data', risk: 'healthy', riskScore: 0.12, centrality: 0.06, loc: 380, files: 1, path: 'backend/app/db/crud.py' },
      { id: 8, label: 'schemas.py', x: 0.75, y: 0.62, r: 16, layer: 'data', risk: 'healthy', riskScore: 0.08, centrality: 0.07, loc: 490, files: 1, path: 'backend/app/api/schemas.py' },
      { id: 9, label: 'api.py', x: 0.2, y: 0.8, r: 18, layer: 'infra', risk: 'healthy', riskScore: 0.1, centrality: 0.05, loc: 280, files: 1, path: 'backend/app/api/api.py' },
      { id: 10, label: 'config.py', x: 0.45, y: 0.8, r: 14, layer: 'infra', risk: 'healthy', riskScore: 0.05, centrality: 0.03, loc: 90, files: 1, path: 'backend/app/core/config.py' },
      { id: 11, label: 'deps.py', x: 0.7, y: 0.8, r: 14, layer: 'infra', risk: 'healthy', riskScore: 0.08, centrality: 0.04, loc: 120, files: 1, path: 'backend/app/api/deps.py' },
      { id: 12, label: 'main.py', x: 0.5, y: 0.92, r: 20, layer: 'infra', risk: 'healthy', riskScore: 0.05, centrality: 0.1, loc: 65, files: 1, path: 'backend/app/main.py' },
    ];
    graphEdges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 6], [4, 7], [5, 3], [6, 8], [9, 10], [10, 11], [11, 12]];
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const area = canvas.parentElement;
    canvas.width = area.offsetWidth * window.devicePixelRatio;
    canvas.height = area.offsetHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function screenToWorld(sx, sy) {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    return {
      x: (sx - camera.x - w / 2) / camera.zoom + w / 2,
      y: (sy - camera.y - h / 2) / camera.zoom + h / 2,
    };
  }

  function getNodeAt(mx, my) {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    for (let i = graphNodes.length - 1; i >= 0; i--) {
      const n = graphNodes[i];
      const sx = (n.x * w - w / 2) * camera.zoom + w / 2 + camera.x;
      const sy = (n.y * h - h / 2) * camera.zoom + h / 2 + camera.y;
      const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
      if (dist < n.r * camera.zoom + 8) return n;
    }
    return null;
  }

  function drawGraph() {
    if (!canvas || !ctx) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    time += 0.004;

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const gridSize = 60;
    const offsetX = (-camera.x / camera.zoom) % gridSize;
    const offsetY = (-camera.y / camera.zoom) % gridSize;
    ctx.strokeStyle = 'rgba(100, 120, 200, 0.04)';
    ctx.lineWidth = 1 / camera.zoom;
    for (let x = offsetX - gridSize; x < w / camera.zoom + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h / camera.zoom);
      ctx.stroke();
    }
    for (let y = offsetY - gridSize; y < h / camera.zoom + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w / camera.zoom, y);
      ctx.stroke();
    }

    graphEdges.forEach(([a, b]) => {
      const na = graphNodes[a];
      const nb = graphNodes[b];
      if (!na || !nb) return;
      const isHighlighted = selectedNode && (selectedNode.id === na.id || selectedNode.id === nb.id);
      const isBlast = blastMode && selectedNode && selectedNode.id === na.id;
      ctx.beginPath();
      ctx.moveTo(na.x * w, na.y * h);
      ctx.lineTo(nb.x * w, nb.y * h);
      ctx.strokeStyle = isHighlighted ? 'rgba(100, 140, 255, 0.5)' : 'rgba(100, 120, 200, 0.12)';
      ctx.lineWidth = (isHighlighted ? 2 : 1) / camera.zoom;
      ctx.stroke();
      if (isHighlighted || isBlast) {
        const t = (time * 0.2 + a * 0.05) % 1;
        const dx = na.x * w + (nb.x * w - na.x * w) * t;
        const dy = na.y * h + (nb.y * h - na.y * h) * t;
        ctx.beginPath();
        ctx.arc(dx, dy, 2 / camera.zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 140, 255, 0.5)';
        ctx.fill();
      }
    });

    graphNodes.forEach((n) => {
      const sx = n.x * w;
      const sy = n.y * h;
      const isSelected = selectedNode && selectedNode.id === n.id;
      const isHovered = hoveredNode && hoveredNode.id === n.id;
      const pulse = Math.sin(time * 1.5 + n.id) * 0.04 + 1;
      const nodeR = n.r * pulse;
      if (isSelected || isHovered || n.risk === 'critical') {
        ctx.beginPath();
        ctx.arc(sx, sy, nodeR * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = n.risk === 'critical' ? 'rgba(255, 70, 70, 0.08)' : 'rgba(100, 140, 255, 0.05)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(sx, sy, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 22, 40, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? 'rgba(100, 140, 255, 0.8)' : isHovered ? 'rgba(100, 140, 255, 0.5)' : riskColors[n.risk];
      ctx.lineWidth = (isSelected ? 3 : isHovered ? 2 : 1.5) / camera.zoom;
      ctx.stroke();
      ctx.fillStyle = 'rgba(220, 222, 240, 0.8)';
      ctx.font = `${Math.max(10, 12 / camera.zoom)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.label, sx, sy);
    });

    ctx.restore();
  }

  function drawMinimap() {
    if (!minimapCanvas || !minimapCtx) return;
    minimapCanvas.width = 180 * 2;
    minimapCanvas.height = 120 * 2;
    minimapCtx.setTransform(2, 0, 0, 2, 0, 0);
    minimapCtx.fillStyle = 'rgba(12, 14, 26, 0.95)';
    minimapCtx.fillRect(0, 0, 180, 120);
    graphNodes.forEach((n) => {
      minimapCtx.beginPath();
      minimapCtx.arc(n.x * 180, n.y * 120, 2, 0, Math.PI * 2);
      minimapCtx.fillStyle = riskColors[n.risk].replace(/[\d.]+\)$/, (m) => String(Math.min(parseFloat(m) * 0.7, 1)) + ')');
      minimapCtx.fill();
    });
    graphEdges.forEach(([a, b]) => {
      const na = graphNodes[a];
      const nb = graphNodes[b];
      if (!na || !nb) return;
      minimapCtx.beginPath();
      minimapCtx.moveTo(na.x * 180, na.y * 120);
      minimapCtx.lineTo(nb.x * 180, nb.y * 120);
      minimapCtx.strokeStyle = 'rgba(100, 120, 200, 0.08)';
      minimapCtx.lineWidth = 0.5;
      minimapCtx.stroke();
    });
    minimapCtx.strokeStyle = 'rgba(100, 140, 255, 0.3)';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(
      90 - 90 / camera.zoom + (camera.x / camera.zoom) * 0.5,
      60 - 60 / camera.zoom + (camera.y / camera.zoom) * 0.5,
      180 / camera.zoom,
      120 / camera.zoom,
    );
  }

  function showNodeDetail(node) {
    const panelDefault = document.getElementById('panelDefault');
    const nodeDetail = document.getElementById('nodeDetail');
    if (!panelDefault || !nodeDetail) return;
    panelDefault.style.display = 'none';
    nodeDetail.classList.add('active');

    const nameEl = document.getElementById('nodeName');
    const pathEl = document.getElementById('nodePath');
    const iconEl = document.getElementById('nodeIcon');
    if (nameEl) nameEl.textContent = node.label;
    if (pathEl) pathEl.textContent = node.path || 'Unknown path';
    if (iconEl) {
      iconEl.className = 'node-icon ' + node.risk;
      iconEl.textContent = node.risk === 'critical' ? '\u26a0' : node.risk === 'warning' ? '!' : '\u2713';
    }

    // Update metric rows
    const metricRows = document.getElementById('metricRows');
    if (metricRows) {
      const riskLabel = node.risk === 'critical' ? 'Critical' : node.risk === 'warning' ? 'High' : 'Low';
      const riskColor = node.risk === 'critical' ? 'var(--danger)' : node.risk === 'warning' ? 'var(--warning)' : 'var(--success)';
      const conf = node.riskScore < 0.3 ? 'Low' : node.riskScore < 0.6 ? 'Medium' : 'High';
      const confPct = Math.round((node.riskScore || 0) * 100);
      metricRows.innerHTML = `
        <div class="metric-row"><span class="metric-row-label">Risk Level</span><span class="metric-row-value" style="color: ${riskColor};">${riskLabel}</span></div>
        <div class="metric-row"><span class="metric-row-label">Risk Score</span><span class="metric-row-value" style="color: ${riskColor};">${node.riskScoreDisplay || Math.round((node.riskScore || 0) * 100)}%</span></div>
        <div class="metric-row"><span class="metric-row-label">Centrality</span><span class="metric-row-value">${(node.centrality || 0).toFixed(2)}</span></div>
        <div class="metric-row"><span class="metric-row-label">Lines of Code</span><span class="metric-row-value">${node.loc || 0}</span></div>
        <div class="metric-row"><span class="metric-row-label">Layer</span><span class="metric-row-value">${node.layer}</span></div>
        <div class="metric-row"><span class="metric-row-label">Dependency Confidence</span><span class="metric-row-value">${conf}</span></div>
      `;
    }

    // Update affected modules (other high-risk nodes)
    const affectedModules = document.getElementById('affectedModules');
    if (affectedModules) {
      const highRisk = graphNodes
        .filter((n) => n.id !== node.id && n.risk !== 'healthy')
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
        .slice(0, 5);
      if (highRisk.length > 0) {
        affectedModules.innerHTML = highRisk
          .map(
            (n) => `
          <div class="affected-module" data-node-id="${n.id}">
            <div class="affected-module-dot" style="background: ${riskColors[n.risk]};"></div>
            <span>${n.label}</span>
            <span class="badge badge-${n.risk === 'critical' ? 'danger' : 'warning'}" style="margin-left: auto;">${n.riskScoreDisplay || Math.round((n.riskScore || 0) * 100)}%</span>
          </div>
        `,
          )
          .join('');
        affectedModules.querySelectorAll('.affected-module').forEach((el) => {
          el.addEventListener('click', () => {
            const target = graphNodes.find((n) => n.id === parseInt(el.dataset.nodeId));
            if (target) {
              selectedNode = target;
              showNodeDetail(target);
              drawGraph();
            }
          });
        });
      } else {
        affectedModules.innerHTML = '<div style="font-size: 13px; color: var(--fg-subtle);">No other high-risk modules detected.</div>';
      }
    }
  }

  function updateStatsBar() {
    const statsBar = document.querySelector('.graph-stats');
    if (!statsBar) return;
    const graph = AppState.get('graph');
    const metrics = AppState.get('metrics');
    const totalFiles = graph?.metrics?.total_files || graphNodes.length;
    const resolvedEdges = graph?.metrics?.resolved_edges || graphEdges.length;
    const conf = graph?.metrics?.dependency_confidence;
    const archHealth = metrics?.architecture_health || 35;

    statsBar.innerHTML = `
      <div class="graph-stat"><strong>${totalFiles}</strong> files</div>
      <div class="graph-stat"><strong>${resolvedEdges}</strong> resolved edges</div>
      <div class="graph-stat"><strong>${conf !== undefined ? Math.round(conf * 100) + '%' : 'N/A'}</strong> dep. confidence ${conf !== undefined && conf < 0.5 ? '<span class="badge badge-warning" style="font-size: 10px; padding: 1px 6px; margin-left: 4px;">Low</span>' : ''}</div>
      <div class="graph-stat"><strong>${archHealth}%</strong> arch. health</div>
    `;
  }

  function updateRepoName() {
    const repoName = AppState.get('repoName');
    if (repoName) {
      const el = document.querySelector('.repo-switcher-name');
      if (el) el.textContent = repoName;
    }
  }

  function bindEvents() {
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);
      if (node) {
        selectedNode = node;
        showNodeDetail(node);
      } else {
        isDragging = true;
        dragStart = { x: e.clientX - camera.x, y: e.clientY - camera.y };
      }
      drawGraph();
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (isDragging) {
        camera.x = e.clientX - dragStart.x;
        camera.y = e.clientY - dragStart.y;
      } else {
        const node = getNodeAt(mx, my);
        if (node !== hoveredNode) {
          hoveredNode = node;
          canvas.style.cursor = node ? 'pointer' : 'grab';
        }
      }
      drawGraph();
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });
    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      hoveredNode = null;
      drawGraph();
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        camera.zoom = Math.max(0.3, Math.min(3, camera.zoom * delta));
        drawGraph();
      },
      { passive: false },
    );

    document.getElementById('zoomIn')?.addEventListener('click', () => {
      camera.zoom = Math.min(3, camera.zoom * 1.2);
      drawGraph();
    });
    document.getElementById('zoomOut')?.addEventListener('click', () => {
      camera.zoom = Math.max(0.3, camera.zoom * 0.8);
      drawGraph();
    });
    document.getElementById('zoomFit')?.addEventListener('click', () => {
      camera = { x: 0, y: 0, zoom: 1 };
      drawGraph();
    });

    document.getElementById('btnAll')?.addEventListener('click', function () {
      setToolbarActive(this);
      blastMode = false;
      drawGraph();
    });
    document.getElementById('btnCritical')?.addEventListener('click', function () {
      setToolbarActive(this);
      blastMode = false;
      drawGraph();
    });
    document.getElementById('btnLayers')?.addEventListener('click', function () {
      setToolbarActive(this);
      blastMode = false;
      drawGraph();
    });
    document.getElementById('btnBlast')?.addEventListener('click', function () {
      setToolbarActive(this);
      blastMode = true;
      drawGraph();
    });

    document.getElementById('panelClose')?.addEventListener('click', () => {
      const panelDefault = document.getElementById('panelDefault');
      const nodeDetail = document.getElementById('nodeDetail');
      if (panelDefault) panelDefault.style.display = 'flex';
      if (nodeDetail) nodeDetail.classList.remove('active');
      selectedNode = null;
      drawGraph();
    });

    // Graph search
    document.getElementById('graphSearch')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        hoveredNode = null;
        drawGraph();
        return;
      }
      const match = graphNodes.find((n) => n.label.toLowerCase().includes(query) || (n.path && n.path.toLowerCase().includes(query)));
      if (match) {
        hoveredNode = match;
        drawGraph();
      }
    });
  }

  function setToolbarActive(btn) {
    document.querySelectorAll('.graph-toolbar .btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function animate() {
    drawGraph();
    drawMinimap();
    requestAnimationFrame(animate);
  }

  function init() {
    canvas = document.getElementById('graphCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    minimapCanvas = document.getElementById('minimapCanvas');
    minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      drawGraph();
    });

    loadGraphData();
    updateRepoName();
    updateStatsBar();
    bindEvents();
    animate();

    // Listen for repo switch changes
    window.addEventListener('repo-changed', () => {
      loadGraphData();
      updateRepoName();
      updateStatsBar();
    });
  }

  function loadGraphData() {
    const graphData = AppState.get('graph');
    if (graphData && graphData.nodes && graphData.nodes.length > 0) {
      const built = buildGraphFromData(graphData);
      graphNodes = built.nodes;
      graphEdges = built.edges;
    } else {
      useDefaultGraph();
    }
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AnalysisPage.init());
} else {
  AnalysisPage.init();
}
