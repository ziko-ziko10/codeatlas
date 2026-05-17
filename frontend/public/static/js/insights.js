/**
 * CodeAtlas Insights JavaScript
 * Wires insights.html to real backend data and AI endpoints.
 */
const InsightsPage = (() => {
  function updateRepoName() {
    const repoName = AppState.get('repoName');
    if (repoName) {
      const el = document.querySelector('.repo-switcher-name');
      if (el) el.textContent = repoName;
    }
  }

  function updateInsights() {
    const graph = AppState.get('graph');
    const metrics = AppState.get('metrics');
    const scanResult = AppState.get('scanResult');

    if (!graph && !scanResult) return;

    const totalFiles = scanResult?.metadata?.total_files || graph?.metrics?.total_files || 0;
    const totalLines = scanResult?.metadata?.total_lines || 0;
    const archHealth = metrics?.architecture_health || 0;
    const conf = graph?.metrics?.dependency_confidence;
    const edges = graph?.metrics?.resolved_edges || 0;
    const highRiskFiles = scanResult?.summary?.high_risk_files || [];
    const languages = scanResult?.summary?.languages || {};

    // Update architecture summary
    const summaryBody = document.querySelector('.insight-card .insight-body');
    if (summaryBody) {
      const langText = Object.keys(languages).length > 0 ? Object.keys(languages).join(', ') : 'multiple';
      const topFile = highRiskFiles[0];
      summaryBody.innerHTML = `
        <p>The repository was analyzed across <strong>${totalFiles} files</strong> in <strong>${langText}</strong> totaling <strong>${totalLines.toLocaleString()} LOC</strong>.</p>
        ${topFile ? `<p style="margin-top: var(--space-3);">The <strong>${topFile.path}</strong> module is the highest-risk component with a <strong>${Math.round(topFile.risk_score || 0)}% risk score</strong>${topFile.centrality ? ` and <strong>${topFile.centrality.toFixed(2)} centrality</strong>` : ''}.</p>` : ''}
        <p style="margin-top: var(--space-3);"><strong>Dependency confidence is ${conf !== undefined ? Math.round(conf * 100) + '%' : 'N/A'}</strong> — ${edges} edges resolved across ${totalFiles} files.</p>
      `;
    }

    // Update metrics
    const metricValues = document.querySelectorAll('.insight-metric-value');
    if (metricValues.length >= 3) {
      metricValues[0].textContent = totalFiles;
      metricValues[1].textContent = `${archHealth}%`;
      metricValues[1].style.color = archHealth < 50 ? 'var(--warning)' : archHealth < 70 ? 'var(--info)' : 'var(--success)';
      metricValues[2].textContent = `${metrics?.modernization_readiness || 0}%`;
    }

    // Update engineering findings
    const roadmapList = document.querySelector('.roadmap-list');
    if (roadmapList && highRiskFiles.length > 0) {
      roadmapList.innerHTML = highRiskFiles.slice(0, 5).map((f) => {
        const riskPct = Math.round(f.risk_score || 0);
        const level = riskPct >= 80 ? 'Critical' : riskPct >= 50 ? 'High' : 'Medium';
        const color = riskPct >= 80 ? 'var(--danger)' : riskPct >= 50 ? 'var(--warning)' : 'var(--info)';
        const badge = riskPct >= 80 ? 'badge-danger' : riskPct >= 50 ? 'badge-warning' : 'badge-info';
        return `
          <div class="roadmap-item" style="border-left-color: ${color};">
            <div class="roadmap-item-header"><span class="roadmap-phase" style="color: ${color};">${level}</span><span class="badge ${badge}">${riskPct}% Risk</span></div>
            <h4>${f.path}</h4>
            <p>Risk score: ${riskPct}%${f.centrality ? ` · Centrality: ${f.centrality.toFixed(2)}` : ''}${f.loc ? ` · ${f.loc} LOC` : ''}</p>
            <div class="roadmap-effort"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Review before modification</div>
          </div>
        `;
      }).join('');
    }

    // Update dependency health sidebar
    const metricRows = document.querySelectorAll('.metric-row');
    if (metricRows.length >= 4) {
      metricRows[0].querySelector('.metric-row-value').textContent = totalFiles;
      metricRows[1].querySelector('.metric-row-value').textContent = edges;
      metricRows[2].querySelector('.metric-row-value').textContent = conf !== undefined ? `${Math.round(conf * 100)}%` : 'N/A';
    }

    // Update suggested onboarding path
    const onboardingPath = document.querySelector('.insights-sidebar .card:last-child .insight-body');
    if (onboardingPath && graph?.nodes) {
      const topNodes = [...graph.nodes]
        .sort((a, b) => (b.centrality || 0) - (a.centrality || 0))
        .slice(0, 4);
      if (topNodes.length > 0) {
        const items = topNodes.map((n, i) => {
          const name = (n.label || n.path || 'unknown').split('/').pop();
          return `<div style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2); background: var(--bg); border-radius: var(--radius-sm);"><span style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--accent-blue); color: white; border-radius: 50%; font-size: 12px; font-weight: 600;">${i + 1}</span><span style="font-size: 13px;"><code>${name}</code></span></div>`;
        }).join('');
        onboardingPath.innerHTML = `<p>The following modules appear most important for understanding repository structure:</p><div style="margin-top: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);">${items}</div>`;
      }
    }
  }

  function drawDebtChart() {
    const debtCanvas = document.getElementById('debtChart');
    if (!debtCanvas) return;
    const debtCtx = debtCanvas.getContext('2d');
    debtCanvas.width = debtCanvas.offsetWidth * 2;
    debtCanvas.height = debtCanvas.offsetHeight * 2;
    debtCtx.setTransform(2, 0, 0, 2, 0, 0);
    const w = debtCanvas.offsetWidth;
    const h = debtCanvas.offsetHeight;
    const padding = { top: 10, right: 10, bottom: 25, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const data = [12, 18, 15, 22, 20, 25, 23.8];
    const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      debtCtx.beginPath();
      debtCtx.moveTo(padding.left, y);
      debtCtx.lineTo(w - padding.right, y);
      debtCtx.strokeStyle = 'rgba(100, 120, 200, 0.08)';
      debtCtx.stroke();
      debtCtx.fillStyle = 'rgba(240, 242, 255, 0.4)';
      debtCtx.font = '11px Inter';
      debtCtx.textAlign = 'right';
      debtCtx.fillText((30 - 7.5 * i).toFixed(0) + '%', padding.left - 6, y + 4);
    }
    debtCtx.beginPath();
    data.forEach((v, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - (v / 30) * chartH;
      if (i === 0) debtCtx.moveTo(x, y);
      else debtCtx.lineTo(x, y);
    });
    debtCtx.strokeStyle = 'oklch(75% 0.16 85)';
    debtCtx.lineWidth = 2;
    debtCtx.stroke();
    debtCtx.lineTo(padding.left + chartW, padding.top + chartH);
    debtCtx.lineTo(padding.left, padding.top + chartH);
    debtCtx.closePath();
    const g = debtCtx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    g.addColorStop(0, 'rgba(255, 180, 50, 0.15)');
    g.addColorStop(1, 'transparent');
    debtCtx.fillStyle = g;
    debtCtx.fill();
    labels.forEach((l, i) => {
      const x = padding.left + (i / (labels.length - 1)) * chartW;
      debtCtx.fillStyle = 'rgba(240, 242, 255, 0.4)';
      debtCtx.font = '11px Inter';
      debtCtx.textAlign = 'center';
      debtCtx.fillText(l, x, h - 5);
    });
  }

  function bindEvents() {
    document.querySelectorAll('.tabs').forEach((tg) => {
      tg.querySelectorAll('.tab').forEach((t) => {
        t.addEventListener('click', () => {
          tg.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
          t.classList.add('active');
        });
      });
    });

    // Suggested queries
    document.querySelectorAll('.insight-tag').forEach((tag) => {
      tag.addEventListener('click', () => {
        const input = document.querySelector('.insights-sidebar .input');
        if (input) input.value = tag.textContent;
      });
    });

    // Export button - navigate to reports
    document.querySelector('.generated-doc .btn-secondary')?.addEventListener('click', () => {
      window.location.href = 'reports.html';
    });

    // Architecture query search
    document.querySelector('.insights-sidebar .btn-primary')?.addEventListener('click', () => {
      const input = document.querySelector('.insights-sidebar .input');
      if (input && input.value.trim()) {
        alert(`Searching for: "${input.value.trim()}"\n\nArchitecture query search will be available in the next update.`);
      }
    });
  }

  function init() {
    updateRepoName();
    updateInsights();
    drawDebtChart();
    bindEvents();
    window.addEventListener('resize', drawDebtChart);

    // Listen for repo switch changes
    window.addEventListener('repo-changed', () => {
      updateRepoName();
      updateInsights();
    });
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => InsightsPage.init());
} else {
  InsightsPage.init();
}
