/**
 * CodeAtlas Shared State
 * Manages scan results, graph data, and UI state across pages.
 * Persists to sessionStorage so data survives page navigation.
 */
const AppState = (() => {
  const STORAGE_KEY = 'codeatlas_state';
  const REPOS_KEY = 'codeatlas_repos';

  let state = {
    repoName: null,
    repoPath: null,
    githubUrl: null,
    scanResult: null,
    graph: null,
    metrics: null,
    blastRadius: null,
    aiInsights: null,
    scanTimestamp: null,
  };

  function load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...state, ...parsed };
      }
    } catch (e) {
      // ignore
    }
    return state;
  }

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }

  function set(key, value) {
    state[key] = value;
    save();
  }

  function get(key) {
    return state[key];
  }

  function reset() {
    state = {
      repoName: null,
      repoPath: null,
      githubUrl: null,
      scanResult: null,
      graph: null,
      metrics: null,
      blastRadius: null,
      aiInsights: null,
      scanTimestamp: null,
    };
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function hasData() {
    return !!state.graph && !!state.metrics;
  }

  // --- Repo List Management (localStorage, cross-tab synced) ---

  function getRepos() {
    try {
      const raw = localStorage.getItem(REPOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRepos(repos) {
    localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
  }

  function addRepo(repo) {
    const repos = getRepos();
    // Avoid duplicates by github_url or path
    const exists = repos.find(r =>
      (repo.github_url && r.github_url === repo.github_url) ||
      (repo.path && r.path === repo.path)
    );
    if (!exists) {
      repos.unshift({
        name: repo.name || 'Unknown',
        path: repo.path || null,
        github_url: repo.github_url || null,
        total_files: repo.total_files || 0,
        total_lines: repo.total_lines || 0,
        critical_modules: repo.critical_modules || 0,
        added_at: new Date().toISOString(),
      });
      saveRepos(repos);
    }
    return repos;
  }

  function removeRepo(index) {
    const repos = getRepos();
    repos.splice(index, 1);
    saveRepos(repos);
    return repos;
  }

  function setActiveRepo(repo) {
    set('repoName', repo.name);
    set('repoPath', repo.path);
    set('githubUrl', repo.github_url);
    set('scanResult', repo.scanResult || null);
    set('graph', repo.graph || null);
    set('metrics', repo.metrics || null);
    set('scanTimestamp', repo.scanTimestamp || new Date().toISOString());
  }

  function getActiveRepoIndex() {
    const repos = getRepos();
    const activeName = state.repoName;
    return repos.findIndex(r => r.name === activeName);
  }

  // Load on init
  load();

  // Restore saved accent color on every page load
  const savedAccent = localStorage.getItem('codeatlas-accent');
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent-blue', savedAccent);
    document.documentElement.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${savedAccent}, oklch(55% 0.18 300))`);
  }

  // Restore saved theme on every page load
  const savedTheme = localStorage.getItem('codeatlas-theme');
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  return { state, set, get, save, reset, hasData, load, getRepos, saveRepos, addRepo, removeRepo, setActiveRepo, getActiveRepoIndex };
})();
