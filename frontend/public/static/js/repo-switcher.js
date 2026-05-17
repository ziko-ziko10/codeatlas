/**
 * CodeAtlas Repo Switcher
 * Shared component across all pages. Syncs via localStorage events.
 */
const RepoSwitcher = (() => {
  let dropdown = null;
  let trigger = null;
  let isOpen = false;

  function init() {
    trigger = document.querySelector('.repo-switcher');
    if (!trigger) return;

    // Migrate: if state has data but no repos in list, add it
    if (AppState.hasData() && AppState.getRepos().length === 0) {
      const name = AppState.get('repoName');
      const graph = AppState.get('graph');
      const metrics = AppState.get('metrics');
      const scanResult = AppState.get('scanResult');
      if (name) {
        AppState.addRepo({
          name: name,
          path: AppState.get('repoPath') || '',
          github_url: AppState.get('githubUrl') || '',
          total_files: metrics?.total_files || scanResult?.metadata?.total_files || 0,
          total_lines: metrics?.total_loc || scanResult?.metadata?.total_lines || 0,
          critical_modules: metrics?.critical_modules || 0,
          scanResult: scanResult,
          graph: graph,
          metrics: metrics,
          scanTimestamp: AppState.get('scanTimestamp') || new Date().toISOString(),
        });
      }
    }

    // Build dropdown
    buildDropdown();

    // Toggle on click
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Close on outside click
    document.addEventListener('click', () => close());

    // Sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'codeatlas_repos' || e.key === 'codeatlas_state') {
        refresh();
      }
    });

    // Listen for custom repo-changed event
    window.addEventListener('repo-changed', () => refresh());

    // Initial render
    refresh();
  }

  function buildDropdown() {
    if (dropdown) dropdown.remove();
    dropdown = document.createElement('div');
    dropdown.className = 'repo-dropdown';
    dropdown.id = 'repoDropdown';
    dropdown.innerHTML = `
      <div class="repo-dropdown-header">
        <span class="repo-dropdown-title">Repositories</span>
      </div>
      <div class="repo-dropdown-list" id="repoDropdownList"></div>
      <div class="repo-dropdown-footer">
        <button class="repo-dropdown-add" id="repoAddBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New Repository
        </button>
      </div>
    `;
    document.body.appendChild(dropdown);

    // Add new repo button
    document.getElementById('repoAddBtn')?.addEventListener('click', () => {
      close();
      if (typeof Dashboard !== 'undefined' && Dashboard.openModal) {
        Dashboard.openModal();
      }
    });
  }

  function refresh() {
    if (!dropdown) return;
    const repos = AppState.getRepos();
    const activeName = AppState.get('repoName');
    const list = document.getElementById('repoDropdownList');
    if (!list) return;

    if (repos.length === 0) {
      list.innerHTML = `
        <div class="repo-dropdown-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>
          <span>No repositories yet</span>
        </div>
      `;
    } else {
      list.innerHTML = repos.map((r, i) => `
        <div class="repo-dropdown-item ${r.name === activeName ? 'active' : ''}" data-index="${i}">
          <div class="repo-dropdown-item-info">
            <div class="repo-dropdown-item-name">${r.name}</div>
            <div class="repo-dropdown-item-meta">${r.total_files || 0} files · ${r.critical_modules || 0} critical</div>
          </div>
          ${r.name === activeName ? '<div class="repo-dropdown-item-badge">Active</div>' : ''}
        </div>
      `).join('');

      list.querySelectorAll('.repo-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.dataset.index);
          selectRepo(idx);
        });
      });
    }

    // Update trigger display
    const nameEl = trigger.querySelector('.repo-switcher-name');
    if (nameEl && activeName) {
      nameEl.textContent = activeName;
    } else if (nameEl && !activeName) {
      nameEl.textContent = 'Select Repository';
    }
  }

  function selectRepo(index) {
    const repos = AppState.getRepos();
    if (index < 0 || index >= repos.length) return;
    const repo = repos[index];

    // Store full scan data for this repo
    AppState.setActiveRepo(repo);

    // Trigger page reload with new data
    window.dispatchEvent(new CustomEvent('repo-changed', { detail: repo }));

    close();
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function open() {
    if (!dropdown) return;
    const rect = trigger.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.display = 'block';
    isOpen = true;
    refresh();
  }

  function close() {
    if (!dropdown) return;
    dropdown.style.display = 'none';
    isOpen = false;
  }

  return { init, refresh, open, close };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => RepoSwitcher.init());
} else {
  RepoSwitcher.init();
}
