/**
 * CodeAtlas Reports JavaScript
 * Wires the static reports.html to real backend report export API.
 * Generates live reports from stored scan data.
 */
const ReportsPage = (() => {
  let selectedType = 'EXECUTIVE';

  function updateRepoName() {
    const repoName = AppState.get('repoName');
    if (repoName) {
      const el = document.querySelector('.repo-switcher-name');
      if (el) el.textContent = repoName;
    }
  }

  function updatePreview() {
    const graph = AppState.get('graph');
    const metrics = AppState.get('metrics');
    const scanResult = AppState.get('scanResult');
    const timestamp = AppState.get('scanTimestamp');

    if (!graph && !metrics) {
      const previewContent = document.querySelector('.preview-content');
      if (previewContent) {
        previewContent.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--fg-subtle);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="margin-bottom: var(--space-4); opacity: 0.3;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3 style="font-size: 16px; color: var(--fg-muted); margin-bottom: var(--space-2);">No Scan Data</h3>
            <p style="font-size: 14px;">Run a scan from the Dashboard first, then generate a report.</p>
            <a href="dashboard.html" class="btn btn-primary" style="margin-top: var(--space-4);">Go to Dashboard</a>
          </div>
        `;
      }
      return;
    }

    const repoName = AppState.get('repoName') || 'Unknown';
    const totalFiles = scanResult?.metadata?.total_files || graph?.metrics?.total_files || 0;
    const totalLines = scanResult?.metadata?.total_lines || 0;
    const date = timestamp ? new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

    const archHealth = metrics?.architecture_health || 35;
    const techDebt = metrics?.technical_debt_estimate || 0;
    const techDebtLabel = techDebt >= 1000 ? `$${(techDebt / 1000).toFixed(1)}M` : `$${techDebt}K`;
    const criticalCount = metrics?.critical_modules || 0;
    const conf = graph?.metrics?.dependency_confidence;
    const maintainability = metrics?.maintainability_score || 79;

    const riskDist = metrics?.risk_distribution || { critical: 0, high: 0, medium: 0, low: 0 };
    const highRiskFiles = scanResult?.summary?.high_risk_files || [];

    // Build critical risks section
    let criticalRisksHTML = '';
    if (highRiskFiles.length > 0) {
      const top = highRiskFiles[0];
      criticalRisksHTML += `<h3>${top.path} — Highest Risk Component</h3>`;
      criticalRisksHTML += `<p>The <code>${top.path}</code> module has a ${Math.round(top.risk_score || 0)}% risk score${top.centrality ? ` and ${(top.centrality).toFixed(2)} centrality` : ''}. It acts as a coupling point between layers, making changes potentially impactful.</p>`;
    }
    if (conf !== undefined && conf < 0.5) {
      const edges = graph?.metrics?.resolved_edges || 0;
      criticalRisksHTML += `<h3>Low Dependency Confidence</h3>`;
      criticalRisksHTML += `<p>Only ${edges} edges were resolved across ${totalFiles} files (${Math.round(conf * 100)}% confidence). Framework aliases, dynamic imports, and convention-based routing prevent full static analysis.</p>`;
    }

    // Build recommendations based on report type
    let recommendationsHTML = '';
    if (selectedType === 'EXECUTIVE') {
      recommendationsHTML = `<p>Four-phase plan: stabilize critical modules, improve dependency visibility, reduce high-risk components, and conduct a readiness review.</p>`;
    } else if (selectedType === 'TECHNICAL') {
      recommendationsHTML = `<p>Recommended actions:</p><ul>`;
      highRiskFiles.slice(0, 5).forEach((f) => {
        recommendationsHTML += `<li><code>${f.path}</code> (${Math.round(f.risk_score || 0)}% risk) — isolate and add tests before modification</li>`;
      });
      recommendationsHTML += `</ul>`;
    } else {
      recommendationsHTML = `<p>Phase 1 (Weeks 1-2): Address critical modules. Phase 2 (Weeks 3-4): Improve dependency resolution. Phase 3 (Weeks 5-6): Refactor high-risk components. Phase 4 (Weeks 7-8): Validation and readiness review.</p>`;
    }

    const previewContent = document.querySelector('.preview-content');
    if (previewContent) {
      previewContent.innerHTML = `
        <div class="report-doc">
          <div class="report-meta">
            <div class="report-meta-item"><strong>Repository</strong>${repoName}</div>
            <div class="report-meta-item"><strong>Generated</strong>${date}</div>
            <div class="report-meta-item"><strong>Files</strong>${totalFiles}</div>
          </div>
          <h1>Architecture Analysis Report</h1>
          <p class="subtitle">${selectedType === 'EXECUTIVE' ? 'Executive Summary' : selectedType === 'TECHNICAL' ? 'Technical Deep Dive' : 'Modernization Plan'} — ${repoName}</p>
          <h2>Executive Overview</h2>
          <p>This report presents a comprehensive analysis of the repository architecture, identifying critical risks, technical debt, and a phased modernization roadmap. The analysis covers ${totalFiles} files totaling ${totalLines.toLocaleString()} LOC.</p>
          <h2>Key Findings</h2>
          <table>
            <thead><tr><th>Metric</th><th>Value</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Architecture Health</td><td>${archHealth}%</td><td style="color: ${archHealth < 50 ? 'var(--danger)' : archHealth < 70 ? 'var(--warning)' : 'var(--success)'};">${archHealth < 50 ? 'Weak' : archHealth < 70 ? 'Moderate' : 'Good'}</td></tr>
              <tr><td>Technical Debt</td><td>${techDebtLabel}</td><td style="color: var(--warning);">Moderate</td></tr>
              <tr><td>Critical Modules</td><td>${criticalCount} file${criticalCount !== 1 ? 's' : ''}</td><td style="color: ${criticalCount > 0 ? 'var(--danger)' : 'var(--success)'};">${criticalCount > 0 ? 'Action Required' : 'None'}</td></tr>
              <tr><td>Dependency Confidence</td><td>${conf !== undefined ? Math.round(conf * 100) + '%' : 'N/A'}</td><td style="color: ${conf < 0.5 ? 'var(--danger)' : 'var(--success)'};">${conf < 0.5 ? 'Low' : 'Good'}</td></tr>
              <tr><td>Maintainability</td><td>${maintainability}%</td><td style="color: ${maintainability < 60 ? 'var(--danger)' : maintainability < 80 ? 'var(--warning)' : 'var(--success)'};">${maintainability < 60 ? 'Poor' : maintainability < 80 ? 'Fair' : 'Good'}</td></tr>
            </tbody>
          </table>
          <h2>Critical Risks</h2>
          ${criticalRisksHTML}
          <h2>Modernization Actions</h2>
          ${recommendationsHTML}
          <h2>Limitations</h2>
          <p>Analysis is limited to statically resolvable imports. Dynamic imports, framework conventions, and runtime-generated modules may not be fully represented in the dependency graph.</p>
        </div>
      `;
    }
  }

  async function exportReport() {
    const graph = AppState.get('graph');
    const metrics = AppState.get('metrics');
    const scanResult = AppState.get('scanResult');
    const repoName = AppState.get('repoName') || 'unknown';

    if (!graph && !metrics) {
      alert('No scan data available. Run a scan from the Dashboard first.');
      return;
    }

    const data = {
      repo_name: repoName,
      repo_path: scanResult?.metadata?.path || '',
      metadata: {
        total_files: scanResult?.metadata?.total_files || graph?.metrics?.total_files || 0,
        total_lines: scanResult?.metadata?.total_lines || 0,
        languages: scanResult?.summary?.languages || {},
      },
      graph: graph || {},
      metrics: metrics || {},
      timeline: {},
      blast_radius: AppState.get('blastRadius') || {},
      before_after: {},
      ai_insights: AppState.get('aiInsights') || [],
    };

    try {
      const result = await API.exportReport(data);

      // Download as markdown file
      const blob = new Blob([result.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || 'codeatlas-report.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export report: ' + e.message);
    }
  }

  function bindEvents() {
    document.querySelectorAll('.export-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.export-option').forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        const title = opt.querySelector('h4')?.textContent || '';
        selectedType = title.includes('Executive') ? 'EXECUTIVE' : title.includes('Technical') ? 'TECHNICAL' : 'MODERNIZATION';
        updatePreview();
      });
    });

    document.querySelectorAll('.tabs').forEach((tg) => {
      tg.querySelectorAll('.tab').forEach((t) => {
        t.addEventListener('click', () => {
          tg.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
          t.classList.add('active');
        });
      });
    });

    // Download report button
    document.getElementById('downloadReportBtn')?.addEventListener('click', exportReport);

    // Copy to clipboard button
    document.getElementById('shareReportBtn')?.addEventListener('click', async () => {
      const previewContent = document.querySelector('.preview-content');
      if (!previewContent) return;
      try {
        await navigator.clipboard.writeText(previewContent.innerText);
        const btn = document.getElementById('shareReportBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Copied!';
        btn.style.borderColor = 'var(--success)';
        btn.style.color = 'var(--success)';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      } catch (e) {
        alert('Failed to copy to clipboard');
      }
    });
  }

  function init() {
    updateRepoName();
    updatePreview();
    bindEvents();

    // Listen for repo switch changes
    window.addEventListener('repo-changed', () => {
      updateRepoName();
      updatePreview();
    });
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ReportsPage.init());
} else {
  ReportsPage.init();
}
