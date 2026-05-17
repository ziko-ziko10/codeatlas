/**
 * CodeAtlas Demo JavaScript
 * Wires demo.html to demo API endpoints.
 */
const DemoPage = (() => {
  function updateRepoName() {
    const repoName = AppState.get('repoName');
    if (repoName) {
      const el = document.querySelector('.repo-switcher-name');
      if (el) el.textContent = repoName;
    }
  }

  async function loadDemos() {
    const container = document.getElementById('demoList');
    if (!container) return;
    try {
      const data = await API.listDemos();
      if (!data.demos) return;
      container.innerHTML = data.demos.map((d) => `
        <div class="demo-card card" data-name="${d.name}" style="cursor: pointer;">
          <h4 style="margin-bottom: var(--space-2);">${d.name}</h4>
          <p style="font-size: 14px; color: var(--fg-muted); margin-bottom: var(--space-4);">${d.description}</p>
          <div style="display: flex; gap: var(--space-4);">
            <span style="font-size: 13px; color: var(--fg-subtle);">${d.total_files} files</span>
            <span style="font-size: 13px; color: var(--fg-subtle);">${d.critical_modules} critical</span>
          </div>
        </div>
      `).join('');
      container.querySelectorAll('.demo-card').forEach((card) => {
        card.addEventListener('click', () => loadDemo(card.dataset.name));
      });
    } catch (e) {
      container.innerHTML = `<div class="engineering-note">Failed to load demos: ${e.message}. Make sure the backend is running on port 8000.</div>`;
    }
  }

  async function loadDemo(name) {
    const statusEl = document.getElementById('demoStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = `Loading ${name}...`;
    }
    try {
      const data = await API.loadDemo(name);
      if (data.graph && data.metrics) {
        AppState.set('repoName', name);
        AppState.set('graph', data.graph);
        AppState.set('metrics', data.metrics);
        AppState.set('scanTimestamp', new Date().toISOString());
        if (statusEl) {
          statusEl.textContent = `Loaded ${name} successfully! Redirecting to dashboard...`;
          statusEl.style.color = 'var(--success)';
        }
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      }
    } catch (e) {
      if (statusEl) {
        statusEl.textContent = `Failed to load demo: ${e.message}`;
        statusEl.style.color = 'var(--danger)';
      }
    }
  }

  function init() {
    updateRepoName();
    loadDemos();
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DemoPage.init());
} else {
  DemoPage.init();
}
