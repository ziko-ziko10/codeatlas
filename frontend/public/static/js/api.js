/**
 * CodeAtlas API Client
 * Handles all backend communication for the static HTML frontend.
 */
const API = (() => {
  const BASE_URL = 'http://localhost:8000';

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    };
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    const res = await fetch(url, config);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  function streamSSE(endpoint, body, onProgress, onComplete, onError) {
    const url = `${BASE_URL}${endpoint}`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({ detail: response.statusText }));
          onError?.(new Error(err.detail || `HTTP ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onProgress?.(data);
                if (data.done) {
                  onComplete?.(data.result);
                  return;
                }
              } catch (e) {
                // skip malformed SSE lines
              }
            }
          }
        }
      })
      .catch(onError);
  }

  return {
    // Health
    health: () => request('/health'),

    // Scan (local path)
    scan: (path, options = {}) =>
      request('/scan', {
        method: 'POST',
        body: { path, ...options },
      }),

    scanStream: (path, options = {}, onProgress, onComplete, onError) =>
      streamSSE('/scan/stream', { path, ...options }, onProgress, onComplete, onError),

    // Graph
    graph: (path, options = {}) =>
      request('/graph', {
        method: 'POST',
        body: { path, ...options },
      }),

    // Blast radius
    blastRadius: (path, changedFile, options = {}) =>
      request('/blast-radius', {
        method: 'POST',
        body: { path, changed_file: changedFile, ...options },
      }),

    // Metrics
    calculateMetrics: (graphData) =>
      request('/metrics/calculate', {
        method: 'POST',
        body: graphData,
      }),

    // GitHub import
    githubPreview: (githubUrl) =>
      request(`/github/preview?github_url=${encodeURIComponent(githubUrl)}`),

    githubImport: (githubUrl, options = {}) =>
      request('/github/import', {
        method: 'POST',
        body: { github_url: githubUrl, ...options },
      }),

    githubImportStream: (githubUrl, options = {}, onProgress, onComplete, onError) =>
      streamSSE('/github/import/stream', { github_url: githubUrl, ...options }, onProgress, onComplete, onError),

    // Demo
    listDemos: () => request('/demo/list'),
    loadDemo: (name) => request(`/demo/load/${name}`),

    // AI
    moduleInsight: (path, filePath, options = {}) =>
      request('/ai/module-insight', {
        method: 'POST',
        body: { path, file_path: filePath, ...options },
      }),

    repoSummary: (path, options = {}) =>
      request('/ai/repo-summary', {
        method: 'POST',
        body: { path, ...options },
      }),

    // Report export
    exportReport: (data) =>
      request('/report/export', {
        method: 'POST',
        body: data,
      }),

    // Integrations
    getIntegrationStatus: () => request('/integrations/status'),
    configureIntegration: (config) =>
      request('/integrations/configure', {
        method: 'POST',
        body: config,
      }),
  };
})();
