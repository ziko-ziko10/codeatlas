/**
 * CodeAtlas Dashboard JavaScript
 * Wires the static dashboard.html to real backend data.
 * Handles: GitHub import, scan form, progress tracking, metrics display.
 */
const Dashboard = (() => {
  // DOM references
  let dom = {};

  function cacheDom() {
    dom = {
      repoName: document.querySelector('.repo-switcher-name'),
      pageDesc: document.querySelector('.main-content-inner > div > p'),
      metricValues: document.querySelectorAll('.metric-card-value'),
      metricChanges: document.querySelectorAll('.metric-card-change'),
      activityList: document.querySelector('.activity-list'),
      archReviewContent: document.querySelector('.architecture-review-content'),
      riskSegments: document.querySelectorAll('.risk-segment'),
      riskLegendItems: document.querySelectorAll('.risk-legend-item'),
      confidenceItems: document.querySelectorAll('.confidence-value'),
      healthChartCanvas: document.getElementById('healthChart'),
      blastCanvas: document.getElementById('blastPreviewCanvas'),
      sparklines: ['sparkline1', 'sparkline2', 'sparkline3', 'sparkline4'],
      reScanBtn: document.querySelector('.btn-secondary'),
      exportBtn: document.querySelector('.btn-primary[href="reports.html"]'),
    };
  }

  // Inject GitHub import modal into the page
  function injectImportModal() {
    const modal = document.createElement('div');
    modal.className = 'import-modal';
    modal.id = 'importModal';
    modal.innerHTML = `
      <div class="import-modal-overlay" id="importOverlay"></div>
      <div class="import-modal-content">
        <div class="import-modal-header">
          <h3>Import Repository</h3>
          <button class="import-modal-close" id="importClose">&times;</button>
        </div>
        <div class="import-tabs">
          <button class="import-tab active" data-tab="local">Local Path</button>
          <button class="import-tab" data-tab="github">GitHub URL</button>
          <button class="import-tab" data-tab="demo">Demo Data</button>
        </div>
        <div class="import-body">
          <div class="import-panel active" id="panel-local">
            <input type="text" id="localPathInput" placeholder="Enter local repository path..." class="import-input">
            <button class="btn btn-primary" id="localScanBtn">Scan Repository</button>
          </div>
          <div class="import-panel" id="panel-github">
            <input type="text" id="githubUrlInput" placeholder="https://github.com/owner/repo" class="import-input">
            <div class="github-preview" id="githubPreview"></div>
            <div class="import-mode-select">
              <label class="mode-option selected" data-mode="fast">
                <input type="radio" name="importMode" value="fast" checked>
                <div class="mode-info">
                  <div class="mode-name">Fast</div>
                  <div class="mode-desc">Top 600 files · ~25MB · Quick overview</div>
                </div>
              </label>
              <label class="mode-option" data-mode="full">
                <input type="radio" name="importMode" value="full">
                <div class="mode-info">
                  <div class="mode-name">Complete</div>
                  <div class="mode-desc">All files · Full analysis · Slower</div>
                </div>
              </label>
            </div>
            <button class="btn btn-primary" id="githubImportBtn">Import from GitHub</button>
          </div>
          <div class="import-panel" id="panel-demo">
            <div class="demo-list" id="demoList"></div>
          </div>
        </div>
        <div class="import-progress" id="importProgress" style="display:none;">
          <div class="progress-steps" id="progressSteps"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Inject modal styles
  function injectModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .import-modal { position: fixed; inset: 0; z-index: 1000; display: none; align-items: center; justify-content: center; }
      .import-modal.open { display: flex; }
      .import-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
      .import-modal-content { position: relative; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); width: 520px; max-width: 90vw; max-height: 80vh; overflow-y: auto; box-shadow: 0 24px 48px rgba(0,0,0,0.3); }
      .import-modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border); }
      .import-modal-header h3 { font-size: 16px; font-weight: 600; margin: 0; }
      .import-modal-close { background: none; border: none; color: var(--fg-subtle); font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }
      .import-modal-close:hover { color: var(--fg); }
      .import-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 var(--space-6); }
      .import-tab { padding: var(--space-3) var(--space-4); background: none; border: none; color: var(--fg-subtle); font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--duration-fast) var(--ease-out); }
      .import-tab.active { color: var(--fg); border-bottom-color: var(--accent-blue); }
      .import-tab:hover { color: var(--fg-muted); }
      .import-body { padding: var(--space-5) var(--space-6); }
      .import-panel { display: none; }
      .import-panel.active { display: block; }
      .import-input { width: 100%; padding: var(--space-3) var(--space-4); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--fg); font-size: 14px; font-family: var(--font-sans); margin-bottom: var(--space-4); box-sizing: border-box; }
      .import-input:focus { outline: none; border-color: var(--accent-blue); }
      .import-body .btn { width: 100%; }
      .github-preview { padding: var(--space-3); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: var(--space-4); font-size: 13px; color: var(--fg-muted); display: none; }
      .github-preview.visible { display: block; }
      .import-mode-select { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
      .mode-option { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); }
      .mode-option:hover { border-color: var(--border-strong); }
      .mode-option.selected { border-color: var(--accent-blue); background: rgba(100, 140, 255, 0.05); }
      .mode-option input { display: none; }
      .mode-option .mode-radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; position: relative; }
      .mode-option.selected .mode-radio { border-color: var(--accent-blue); }
      .mode-option.selected .mode-radio::after { content: ''; position: absolute; inset: 3px; background: var(--accent-blue); border-radius: 50%; }
      .mode-info { flex: 1; }
      .mode-name { font-size: 14px; font-weight: 500; color: var(--fg); }
      .mode-desc { font-size: 12px; color: var(--fg-subtle); }
      .demo-list { display: flex; flex-direction: column; gap: var(--space-3); }
      .demo-item { padding: var(--space-4); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); }
      .demo-item:hover { border-color: var(--border-strong); background: var(--bg-active); }
      .demo-item-name { font-size: 14px; font-weight: 500; margin-bottom: var(--space-1); }
      .demo-item-desc { font-size: 12px; color: var(--fg-subtle); }
      .import-progress { padding: var(--space-5) var(--space-6); border-top: 1px solid var(--border); }
      .progress-steps { display: flex; flex-direction: column; gap: var(--space-3); }
      .progress-step { display: flex; align-items: center; gap: var(--space-3); font-size: 13px; }
      .progress-step-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; }
      .progress-step.running .progress-step-icon { border-color: var(--accent-blue); color: var(--accent-blue); }
      .progress-step.completed .progress-step-icon { border-color: var(--success); background: var(--success); color: white; }
      .progress-step.error .progress-step-icon { border-color: var(--danger); background: var(--danger); color: white; }
      .progress-step-label { color: var(--fg-muted); }
      .progress-step.running .progress-step-label { color: var(--fg); }
      .progress-step-detail { font-size: 11px; color: var(--fg-subtle); margin-left: auto; }
    `;
    document.head.appendChild(style);
  }

  function openModal() {
    document.getElementById('importModal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('importModal').classList.remove('open');
    resetProgress();
  }

  function resetProgress() {
    const prog = document.getElementById('importProgress');
    if (prog) prog.style.display = 'none';
  }

  function showProgress(steps) {
    const prog = document.getElementById('importProgress');
    const container = document.getElementById('progressSteps');
    prog.style.display = 'block';
    container.innerHTML = steps.map((s, i) => `
      <div class="progress-step" id="step-${i}">
        <div class="progress-step-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="progress-step-label">${s.label}</span>
        <span class="progress-step-detail">${s.detail || ''}</span>
      </div>
    `).join('');
  }

  function updateStep(index, status, detail) {
    const step = document.getElementById(`step-${index}`);
    if (!step) return;
    step.className = `progress-step ${status}`;
    if (detail) {
      step.querySelector('.progress-step-detail').textContent = detail;
    }
  }

  function updateDashboard(data) {
    const { graph, scan_result, metrics, clone_info } = data;

    // Update repo name
    const name = clone_info?.repo_name || scan_result?.metadata?.name || 'Unknown';
    const owner = clone_info?.owner || '';
    if (dom.repoName) {
      dom.repoName.textContent = owner ? `${owner}/${name}` : name;
    }
    if (dom.pageDesc) {
      const totalFiles = scan_result?.metadata?.total_files || graph?.metrics?.total_files || 0;
      const totalLines = scan_result?.metadata?.total_lines || 0;
      dom.pageDesc.textContent = `Architecture, risk, and modernization summary for ${name}.`;
    }

    // Update metrics
    const m = metrics || {};
    const archHealth = m.architecture_health || 0;
    const techDebt = m.technical_debt_estimate || 0;
    const techDebtLabel = techDebt >= 1000 ? `$${(techDebt / 1000).toFixed(1)}M` : `$${techDebt}K`;
    const maintainability = m.maintainability_score || 0;
    const criticalCount = m.critical_modules || 0;
    const totalLangs = m.total_languages || 0;
    const totalFiles = m.total_files || scan_result?.metadata?.total_files || graph?.metrics?.total_files || 0;
    const totalLines = m.total_loc || scan_result?.metadata?.total_lines || 0;

    // Find highest risk module from graph nodes
    let criticalModule = 'N/A';
    let criticalRisk = 0;
    if (graph?.nodes && graph.nodes.length > 0) {
      const sorted = [...graph.nodes].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
      if (sorted[0]) {
        const top = sorted[0];
        criticalModule = (top.path || top.name || 'unknown').split('/').pop();
        const raw = top.risk_score || 0;
        criticalRisk = raw > 1 ? Math.round(raw) : Math.round(raw * 100);
      }
    }

    if (dom.metricValues.length >= 4) {
      dom.metricValues[0].textContent = `${archHealth}%`;
      dom.metricValues[0].style.color = archHealth < 50 ? 'var(--warning)' : archHealth < 70 ? 'var(--info)' : 'var(--success)';
      dom.metricValues[1].textContent = techDebtLabel;
      dom.metricValues[2].textContent = `${maintainability}%`;
      dom.metricValues[3].textContent = criticalCount;
    }

    if (dom.metricChanges.length >= 4) {
      dom.metricChanges[0].innerHTML = archHealth < 50
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg> Weak assessment`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> Healthy`;
      dom.metricChanges[0].className = `metric-card-change ${archHealth < 50 ? 'negative' : 'positive'}`;

      dom.metricChanges[1].innerHTML = `${totalFiles} files · ${totalLines.toLocaleString()} LOC`;
      dom.metricChanges[2].innerHTML = `${totalLangs} language${totalLangs !== 1 ? 's' : ''} detected`;

      dom.metricChanges[3].innerHTML = `${criticalModule} — ${criticalRisk}% risk`;
      dom.metricChanges[3].className = `metric-card-change ${criticalCount > 0 ? 'negative' : 'positive'}`;
    }

    // Update activity list
    if (dom.activityList) {
      const activities = [];
      if (clone_info?.repo_name) {
        activities.push({ type: 'success', text: `<strong>GitHub repository imported</strong> — ${clone_info.owner}/${clone_info.repo_name}`, time: 'Just now' });
      }
      const tf = scan_result?.metadata?.total_files || 0;
      const tl = scan_result?.metadata?.total_lines || 0;
      activities.push({ type: 'success', text: `<strong>${tf} files analyzed</strong> · ${tl.toLocaleString()} LOC`, time: 'Just now' });

      const conf = graph?.metrics?.dependency_confidence;
      if (conf && conf < 50) {
        activities.push({ type: 'danger', text: `<strong>Dependency confidence warning</strong> — ${Math.round(conf * 100)}% resolved`, time: 'Just now' });
      }
      if (criticalCount > 0) {
        activities.push({ type: 'warning', text: `<strong>Critical module detected</strong> — ${criticalModule} at ${criticalRisk}% risk`, time: 'Just now' });
      }
      activities.push({ type: 'info', text: `<strong>Dashboard updated</strong> — analysis complete`, time: 'Just now' });

      dom.activityList.innerHTML = activities.map(a => `
        <div class="activity-item">
          <div class="activity-dot ${a.type}"></div>
          <div>
            <div class="activity-text">${a.text}</div>
            <div class="activity-time">${a.time}</div>
          </div>
        </div>
      `).join('');
    }

    // Update architecture review
    if (dom.archReviewContent) {
      const highRiskFiles = scan_result?.summary?.high_risk_files || [];
      const topFile = Array.isArray(highRiskFiles) && highRiskFiles.length > 0 ? highRiskFiles[0] : null;
      const topRisk = topFile ? Math.round(topFile.risk_score || 0) : criticalRisk;
      const topName = topFile?.path || criticalModule;

      const conf = graph?.metrics?.dependency_confidence;
      const edges = graph?.metrics?.resolved_edges || 0;
      const nodes = graph?.metrics?.total_files || 0;

      let html = `<p style="margin-bottom: var(--space-3);">The <strong>${topName}</strong> module is the highest-risk component with a <strong>${topRisk}% risk score</strong>.</p>`;
      if (conf !== undefined) {
        html += `<p style="margin-bottom: var(--space-3);">Dependency confidence is <strong>${Math.round(conf * 100)}%</strong> — ${edges} edges resolved across ${nodes} files.</p>`;
      }
      const otherFiles = Array.isArray(highRiskFiles) ? highRiskFiles.slice(1, 4) : [];
      if (otherFiles.length > 0) {
        const names = otherFiles.map(f => `<strong>${f.path}</strong> (${Math.round(f.risk_score || 0)}%)`).join(', ');
        html += `<p style="margin: 0;">Additional high-risk modules: ${names}.</p>`;
      }
      dom.archReviewContent.innerHTML = html;
    }

    // Update risk distribution
    if (dom.riskSegments.length >= 4) {
      const criticalPct = metrics?.critical_risk || 0;
      const highPct = metrics?.high_risk || 0;
      const mediumPct = metrics?.medium_risk || 0;
      const lowPct = metrics?.low_risk || (100 - criticalPct - highPct - mediumPct);
      const criticalCount = metrics?.critical_modules || 0;
      const highCount = metrics?.high_risk_modules || 0;
      const mediumCount = metrics?.medium_risk_modules || 0;
      const lowCount = metrics?.low_risk_modules || 0;

      dom.riskSegments[0].style.width = `${Math.max(criticalPct, criticalCount > 0 ? 1 : 0)}%`;
      dom.riskSegments[1].style.width = `${Math.max(highPct, highCount > 0 ? 2 : 0)}%`;
      dom.riskSegments[2].style.width = `${Math.max(mediumPct, mediumCount > 0 ? 4 : 0)}%`;
      dom.riskSegments[3].style.width = `${lowPct}%`;

      if (dom.riskLegendItems.length >= 4) {
        dom.riskLegendItems[0].innerHTML = `<div class="risk-legend-dot" style="background: var(--danger);"></div> Critical (${criticalCount})`;
        dom.riskLegendItems[1].innerHTML = `<div class="risk-legend-dot" style="background: var(--warning);"></div> High (${highCount})`;
        dom.riskLegendItems[2].innerHTML = `<div class="risk-legend-dot" style="background: var(--info);"></div> Medium (${mediumCount})`;
        dom.riskLegendItems[3].innerHTML = `<div class="risk-legend-dot" style="background: var(--success);"></div> Low (${lowCount})`;
      }
    }

    // Update confidence
    if (dom.confidenceItems.length >= 3) {
      const conf = metrics?.dependency_confidence;
      const edges = metrics?.resolved_edges || 0;
      const nodes = metrics?.total_nodes || metrics?.total_files || 0;
      if (conf !== undefined) {
        const confPct = conf > 1 ? Math.round(conf) : Math.round(conf * 100);
        dom.confidenceItems[0].textContent = `${confPct}%`;
        dom.confidenceItems[0].style.color = confPct < 30 ? 'var(--danger)' : confPct < 60 ? 'var(--warning)' : 'var(--success)';
      }
      dom.confidenceItems[1].textContent = edges;
      dom.confidenceItems[1].style.color = edges < 10 ? 'var(--danger)' : 'var(--fg)';
      dom.confidenceItems[2].textContent = nodes;
    }

    // Store in shared state
    AppState.set('repoName', name);
    AppState.set('repoPath', scan_result?.metadata?.path || '');
    AppState.set('githubUrl', clone_info?.github_url || '');
    AppState.set('graph', graph);
    AppState.set('metrics', metrics);
    AppState.set('scanResult', scan_result);
    AppState.set('scanTimestamp', new Date().toISOString());

    // Register repo in persistent list
    AppState.addRepo({
      name: owner ? `${owner}/${name}` : name,
      path: scan_result?.metadata?.path || '',
      github_url: clone_info?.github_url || '',
      total_files: totalFiles,
      total_lines: totalLines,
      critical_modules: criticalCount,
      scanResult: scan_result,
      graph: graph,
      metrics: metrics,
      scanTimestamp: new Date().toISOString(),
    });

    // Notify other components that graph data changed
    window.dispatchEvent(new CustomEvent('graph-data-changed', { detail: { graph, metrics, scan_result } }));

    // Notify repo switcher
    window.dispatchEvent(new CustomEvent('repo-changed', { detail: { name, graph, metrics } }));

    // Redraw charts
    requestAnimationFrame(() => {
      drawSparkline('sparkline1', [archHealth - 5, archHealth - 3, archHealth - 2, archHealth - 1, archHealth], 'rgb(255, 180, 50)');
      drawSparkline('sparkline2', [75, 74, 73, 72, 75], 'rgb(255, 180, 50)');
      drawSparkline('sparkline3', [maintainability - 5, maintainability - 3, maintainability - 1, maintainability], 'rgb(100, 140, 255)');
      drawSparkline('sparkline4', [criticalCount + 1, criticalCount, criticalCount], 'rgb(255, 70, 70)');
      if (typeof drawHealthChart === 'function') drawHealthChart();
    });
  }

  function bindEvents() {
    // Re-scan button opens import modal
    if (dom.reScanBtn) {
      dom.reScanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }

    // Modal close
    document.getElementById('importClose')?.addEventListener('click', closeModal);
    document.getElementById('importOverlay')?.addEventListener('click', closeModal);

    // Tabs
    document.querySelectorAll('.import-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.import-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.import-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
      });
    });

    // Local scan
    document.getElementById('localScanBtn')?.addEventListener('click', () => {
      const path = document.getElementById('localPathInput').value.trim();
      if (!path) return;
      runScan(path);
    });

    // GitHub import
    document.getElementById('githubImportBtn')?.addEventListener('click', () => {
      const url = document.getElementById('githubUrlInput').value.trim();
      if (!url) return;
      const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'fast';
      runGitHubImport(url, mode);
    });

    // Mode selection
    document.querySelectorAll('.mode-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
      });
    });

    // GitHub preview on input
    let previewTimeout;
    document.getElementById('githubUrlInput')?.addEventListener('input', (e) => {
      clearTimeout(previewTimeout);
      const url = e.target.value.trim();
      if (!url || !url.includes('github.com')) {
        document.getElementById('githubPreview').classList.remove('visible');
        return;
      }
      previewTimeout = setTimeout(async () => {
        try {
          const preview = await API.githubPreview(url);
          const el = document.getElementById('githubPreview');
          const name = preview.repo || preview.repo_name || preview.full_name || 'Unknown';
          el.textContent = `${name} · ${preview.total_files || '?'} files · ${preview.estimated_time || 'Calculating...'}`;
          el.classList.add('visible');
        } catch (e) {
          // ignore preview errors
        }
      }, 500);
    });

    // Demo list
    loadDemos();
  }

  async function loadDemos() {
    try {
      const data = await API.listDemos();
      const container = document.getElementById('demoList');
      if (!container || !data.demos) return;
      container.innerHTML = data.demos.map(d => `
        <div class="demo-item" data-name="${d.name}">
          <div class="demo-item-name">${d.name}</div>
          <div class="demo-item-desc">${d.description} · ${d.total_files} files · ${d.critical_modules} critical</div>
        </div>
      `).join('');
      container.querySelectorAll('.demo-item').forEach(item => {
        item.addEventListener('click', () => loadDemo(item.dataset.name));
      });
    } catch (e) {
      // ignore
    }
  }

  async function loadDemo(name) {
    try {
      const data = await API.loadDemo(name);
      if (data.graph && data.metrics) {
        updateDashboard({
          graph: data.graph,
          scan_result: { metadata: { total_files: data.metrics.total_files, total_lines: 0, name: name, path: '' }, summary: { high_risk_files: [] } },
          metrics: data.metrics,
          clone_info: null,
        });
        closeModal();
      }
    } catch (e) {
      alert('Failed to load demo: ' + e.message);
    }
  }

  function runScan(path) {
    showProgress([
      { label: 'Scanning Repository', detail: 'Scanning file structure...' },
      { label: 'Parsing Files', detail: 'Reading source files...' },
      { label: 'Analyzing Dependencies', detail: 'Building dependency map...' },
      { label: 'Building Graph', detail: 'Constructing graph...' },
      { label: 'Calculating Metrics', detail: 'Computing scores...' },
      { label: 'Finalizing', detail: 'Preparing results...' },
    ]);

    API.scanStream(path, {}, (progress) => {
      progress.steps.forEach((step, i) => {
        if (step.status) updateStep(i, step.status, step.detail);
      });
    }, (result) => {
      updateDashboard(result);
      setTimeout(closeModal, 500);
    }, (error) => {
      alert('Scan failed: ' + error.message);
      resetProgress();
    });
  }

  function runGitHubImport(url, mode = 'fast') {
    showProgress([
      { label: 'Connecting to GitHub', detail: 'Fetching repository...' },
      { label: 'Downloading Repository', detail: 'Downloading source files...' },
      { label: 'Extracting Files', detail: 'Extracting and filtering...' },
      { label: 'Analyzing Dependencies', detail: 'Parsing imports...' },
      { label: 'Building Graph', detail: 'Constructing graph...' },
      { label: 'Calculating Metrics', detail: 'Computing scores...' },
      { label: 'Finalizing', detail: 'Preparing dashboard...' },
    ]);

    const options = mode === 'full' ? { mode: 'full', max_files: 5000, max_total_bytes: 104857600 } : {};
    API.githubImportStream(url, options, (progress) => {
      progress.steps.forEach((step, i) => {
        if (step.status) updateStep(i, step.status, step.detail);
      });
    }, (result) => {
      updateDashboard(result);
      setTimeout(closeModal, 500);
    }, (error) => {
      alert('Import failed: ' + error.message);
      resetProgress();
    });
  }

  function init() {
    cacheDom();
    injectModalStyles();
    injectImportModal();
    bindEvents();

    // If we already have data in state, restore it
    if (AppState.hasData()) {
      updateDashboard({
        graph: AppState.get('graph'),
        scan_result: AppState.get('scanResult'),
        metrics: AppState.get('metrics'),
        clone_info: null,
      });
    }

    // Listen for repo switch changes
    window.addEventListener('repo-changed', (e) => {
      const repo = e.detail;
      if (repo && repo.graph && repo.metrics) {
        updateDashboard({
          graph: repo.graph,
          scan_result: repo.scanResult || AppState.get('scanResult'),
          metrics: repo.metrics,
          clone_info: null,
        });
      }
    });
  }

  return { init, openModal, updateDashboard };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
  Dashboard.init();
}
