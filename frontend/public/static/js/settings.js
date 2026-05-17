/**
 * CodeAtlas Settings JavaScript
 * Wires settings.html with basic functionality.
 */
const SettingsPage = (() => {
  let integrations = { watsonx: { connected: false }, github: { connected: true } };

  function updateRepoName() {
    const repoName = AppState.get('repoName');
    if (repoName) {
      document.querySelectorAll('.repo-switcher-name').forEach(el => el.textContent = repoName);
    }
    // Update profile avatar text
    document.querySelectorAll('.profile-avatar').forEach(el => {
      if (el.textContent === 'JD') el.textContent = 'CA';
    });
    document.querySelectorAll('.sidebar .profile-avatar + div div:first-child').forEach(el => {
      if (el.textContent === 'John Doe') el.textContent = 'Demo Workspace';
    });
    document.querySelectorAll('.sidebar .profile-avatar + div div:last-child').forEach(el => {
      if (el.textContent === 'Admin') el.textContent = 'IBM Bob Hackathon';
    });
  }

  async function loadIntegrationStatus() {
    try {
      const status = await API.getIntegrationStatus();
      integrations = status;
      updateIntegrationUI(status);
    } catch (e) {
      console.warn('Could not load integration status:', e.message);
    }
  }

  function updateIntegrationUI(status) {
    const watsonxCard = document.getElementById('watsonxCard');
    if (watsonxCard && status?.watsonx) {
      const statusEl = document.getElementById('watsonxStatus');
      const descEl = document.getElementById('watsonxDesc');
      if (status.watsonx.connected) {
        if (statusEl) { statusEl.className = 'integration-status connected'; statusEl.innerHTML = '<div class="status-dot connected"></div>Connected'; }
        if (descEl) descEl.textContent = `AI analysis engine — ${status.watsonx.model}`;
      } else {
        if (statusEl) { statusEl.className = 'integration-status disconnected'; statusEl.innerHTML = '<div class="status-dot disconnected"></div>Not Configured'; }
        if (descEl) descEl.textContent = 'AI analysis engine — click to configure';
      }
    }
    const descEl = document.getElementById('githubDesc');
    if (descEl && status?.github) {
      descEl.textContent = status.github.rate_limit === 'Authenticated' ? 'Connected with API token' : 'Connected (no API token — rate limited)';
    }
  }

  function bindEvents() {
    // Clear scan data
    document.getElementById('clearDataBtn')?.addEventListener('click', () => {
      if (confirm('Clear all scan data? This cannot be undone.')) {
        AppState.reset();
        alert('Scan data cleared.');
        window.location.reload();
      }
    });

    // Revoke API keys
    document.querySelectorAll('.api-key-row .btn-ghost').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.api-key-row');
        if (confirm('Revoke this API key?')) {
          row.style.opacity = '0.4';
          btn.textContent = 'Revoked';
          btn.disabled = true;
          const badge = row.querySelector('.badge');
          if (badge) { badge.textContent = 'Revoked'; badge.className = 'badge'; badge.style.color = 'var(--fg-subtle)'; }
        }
      });
    });

    // Generate new API key
    document.querySelector('#api .btn-secondary')?.addEventListener('click', () => {
      const key = 'sk-' + Array.from({length: 48}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
      const masked = key.slice(0, 5) + '•'.repeat(38) + key.slice(-4);
      const container = document.querySelector('#api .setting-group');
      const newRow = document.createElement('div');
      newRow.className = 'api-key-row';
      newRow.innerHTML = `<span class="api-key-value"><span class="api-key-mask">${masked}</span></span><span class="badge badge-success">Active</span><button class="btn btn-ghost btn-sm">Revoke</button>`;
      container.insertBefore(newRow, container.querySelector('.btn-secondary'));
      newRow.querySelector('.btn-ghost').addEventListener('click', () => {
        if (confirm('Revoke this API key?')) { newRow.style.opacity = '0.4'; newRow.querySelector('.btn-ghost').textContent = 'Revoked'; newRow.querySelector('.btn-ghost').disabled = true; }
      });
      alert('New API key generated:\n\n' + key + '\n\nCopy this key now — it will not be shown again.');
    });

    // Invite member
    document.querySelector('#team .btn-secondary')?.addEventListener('click', () => {
      const email = prompt('Enter email address to invite:');
      if (email && email.includes('@')) {
        const container = document.querySelector('#team .setting-group');
        const initials = email.slice(0, 2).toUpperCase();
        const colors = ['var(--accent-blue)', 'var(--accent-violet)', 'var(--success)', 'var(--warning)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const newRow = document.createElement('div');
        newRow.className = 'setting-row';
        newRow.innerHTML = `<div style="display: flex; align-items: center; gap: var(--space-3);"><div class="profile-avatar" style="width: 32px; height: 32px; font-size: 13px; background: ${color};">${initials}</div><div><div style="font-size: 14px; font-weight: 500;">${email}</div><div style="font-size: 12px; color: var(--fg-subtle);">Invited</div></div></div><span class="badge">Viewer</span>`;
        const btn = container.querySelector('.btn-secondary');
        container.insertBefore(newRow, btn);
        const count = container.querySelectorAll('.setting-row').length;
        container.querySelector('h3').textContent = `Members (${count})`;
      }
    });

    // Configure watsonx.ai
    const watsonxCard = document.getElementById('watsonxCard');
    if (watsonxCard) {
      watsonxCard.style.cursor = 'pointer';
      watsonxCard.addEventListener('click', () => {
        if (integrations.watsonx?.connected) {
          alert(`watsonx.ai is configured.\nModel: ${integrations.watsonx.model}\nURL: ${integrations.watsonx.url}`);
          return;
        }
        const apiKey = prompt('Enter watsonx.ai API Key:');
        if (!apiKey) return;
        const projectId = prompt('Enter watsonx.ai Project ID:');
        if (!projectId) return;
        const url = prompt('Enter watsonx.ai URL:', 'https://us-south.ml.cloud.ibm.com');
        const modelId = prompt('Enter Model ID:', 'ibm/granite-13b-chat-v2');
        API.configureIntegration({ provider: 'watsonx', api_key: apiKey, project_id: projectId, url: url || 'https://us-south.ml.cloud.ibm.com', model_id: modelId || 'ibm/granite-13b-chat-v2' })
          .then(() => { alert('watsonx.ai configured! Restart backend to apply.'); loadIntegrationStatus(); })
          .catch(e => { alert('Failed: ' + e.message); });
      });
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        const isDark = darkModeToggle.classList.contains('active');
        if (isDark) {
          document.documentElement.setAttribute('data-theme', 'light');
          darkModeToggle.classList.remove('active');
          localStorage.setItem('codeatlas-theme', 'light');
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          darkModeToggle.classList.add('active');
          localStorage.setItem('codeatlas-theme', 'dark');
        }
      });
    }

    // Accent color picker
    document.querySelectorAll('.accent-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        document.documentElement.style.setProperty('--accent-blue', color);
        document.documentElement.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${color}, oklch(55% 0.18 300))`);
        document.querySelectorAll('.accent-swatch').forEach(s => s.style.border = '2px solid transparent');
        swatch.style.border = '2px solid var(--fg)';
        localStorage.setItem('codeatlas-accent', color);
      });
    });

    // Restore saved accent color
    const savedAccent = localStorage.getItem('codeatlas-accent');
    document.querySelectorAll('.accent-swatch').forEach(s => {
      s.style.border = '2px solid transparent';
      if (savedAccent && s.dataset.color === savedAccent) {
        s.style.border = '2px solid var(--fg)';
      }
    });
    if (!savedAccent) {
      const blueSwatch = document.querySelector('.accent-swatch[data-color="oklch(60% 0.16 245)"]');
      if (blueSwatch) blueSwatch.style.border = '2px solid var(--fg)';
    }

    // Tab switching
    document.querySelectorAll('.tabs').forEach((tg) => {
      tg.querySelectorAll('.tab').forEach((t) => {
        t.addEventListener('click', () => {
          tg.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
          t.classList.add('active');
        });
      });
    });
  }

  function init() {
    updateRepoName();
    loadIntegrationStatus();
    bindEvents();

    // Listen for repo switch changes
    window.addEventListener('repo-changed', () => {
      updateRepoName();
    });
  }

  return { init };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SettingsPage.init());
} else {
  SettingsPage.init();
}
