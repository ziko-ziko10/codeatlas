/**
 * CodeAtlas Roadmap JavaScript
 * Wires roadmap.html to real backend data.
 */
const RoadmapPage = (() => {
  function updateRepoName() {
    const repoName = AppState.get('repoName');
    if (repoName) {
      const el = document.querySelector('.repo-switcher-name');
      if (el) el.textContent = repoName;
    }
  }

  function updateRoadmap() {
    const scanResult = AppState.get('scanResult');
    const metrics = AppState.get('metrics');
    const graph = AppState.get('graph');
    const highRiskFiles = scanResult?.summary?.high_risk_files || [];
    const conf = graph?.metrics?.dependency_confidence;

    // Update phase 1 with real data
    const phases = document.querySelectorAll('.roadmap-phase');
    if (phases.length >= 1 && highRiskFiles.length > 0) {
      const top = highRiskFiles[0];
      const riskPct = Math.round(top.risk_score || 0);
      phases[0].querySelector('.phase-title').textContent = 'Stabilize Critical Modules';
      phases[0].querySelector('.phase-desc').textContent = `Address the highest-risk component (${top.path}, ${riskPct}% risk) and add test coverage to improve confidence before future changes.`;
      const tasks = phases[0].querySelectorAll('.phase-task-text');
      if (tasks.length >= 3) {
        tasks[0].textContent = `Separate concerns in ${top.path.split('/').pop()}`;
        tasks[1].textContent = 'Add component tests for critical modules';
        tasks[2].textContent = 'Document module boundaries and contracts';
      }
    }

    // Update phase 3 with high-risk files
    if (phases.length >= 3) {
      const otherHighRisk = highRiskFiles.slice(1, 4);
      if (otherHighRisk.length > 0) {
        const names = otherHighRisk.map((f) => f.path.split('/').pop()).join(', ');
        phases[2].querySelector('.phase-desc').textContent = `Address the remaining high-risk modules (${names}) and reduce coupling in shared components.`;
      }
    }

    // Update confidence notes
    const confLabel = conf !== undefined ? (conf < 0.3 ? 'Low' : conf < 0.6 ? 'Medium' : 'High') : 'Unknown';
    document.querySelectorAll('.phase-meta-item:last-child .phase-meta-value').forEach((el) => {
      if (el.textContent.includes('Confidence') || el.textContent.includes('Low')) {
        el.textContent = confLabel;
        el.style.color = confLabel === 'Low' ? 'var(--warning)' : confLabel === 'Medium' ? 'var(--info)' : 'var(--success)';
      }
    });
  }

  function bindEvents() {
    // Task checkboxes
    document.querySelectorAll('.phase-task-check').forEach((check) => {
      check.addEventListener('click', () => {
        check.classList.toggle('done');
        if (check.classList.contains('done')) {
          check.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
        } else {
          check.innerHTML = '';
        }
      });
    });

    // Export plan button
    document.querySelector('.btn-primary')?.addEventListener('click', () => {
      window.location.href = 'reports.html';
    });
  }

  function init() {
    updateRepoName();
    updateRoadmap();
    bindEvents();

    // Listen for repo switch changes
    window.addEventListener('repo-changed', () => {
      updateRepoName();
      updateRoadmap();
    });
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => RoadmapPage.init());
} else {
  RoadmapPage.init();
}
