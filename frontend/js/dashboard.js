/* Dashboard data loader: prefers Firebase, falls back to IndexedDB */
(function () {
  const refreshIntervalMs = 6000;
  let timer = null;

  const $ = id => document.getElementById(id);

  const renderTable = (rows) => {
    const tableBody = $('tableBody');
    const tableCount = $('tableCount');
    const submissionCount = $('submissionCount');
    const latestSubmission = $('latestSubmission');
    const uniqueCompanies = $('uniqueCompanies');

    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!rows || rows.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7"><div class="empty-state">No submissions found.</div></td></tr>`;
      tableCount.textContent = '0 rows';
      submissionCount.textContent = '0';
      latestSubmission.textContent = '—';
      uniqueCompanies.textContent = '0';
      return;
    }

    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id || ''}</td>
        <td>${r.first_name || ''}</td>
        <td>${r.last_name || ''}</td>
        <td>${r.email || ''}</td>
        <td>${r.company || ''}</td>
        <td>${(r.message || '').replace(/</g, '&lt;')}</td>
        <td>${r.created_at || ''}</td>
      `;
      tableBody.appendChild(tr);
    });

    tableCount.textContent = `${rows.length} rows`;
    submissionCount.textContent = String(rows.length);
    latestSubmission.textContent = rows[0]?.created_at || '—';
    const companies = new Set(rows.map(r => (r.company || '').trim()).filter(Boolean));
    uniqueCompanies.textContent = String(companies.size);
  };

  const showError = (msg) => {
    const eb = $('errorBanner');
    if (!eb) return;
    eb.style.display = 'block';
    eb.textContent = msg;
  };

  const hideLoading = () => {
    const l = $('loading');
    if (l) l.style.display = 'none';
  };

  async function loadAndRender() {
    const lastUpdated = $('lastUpdated');
    try {
      hideLoading();
      let rows = [];
      // Require Firebase; don't fall back to local DB on error
      if (window.FirebaseService && typeof FirebaseService.fetchSubmissions === 'function') {
        rows = await FirebaseService.fetchSubmissions();
      } else {
        throw new Error('Firebase service is not available');
      }

      // ensure sorted by created_at desc
      rows = rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      renderTable(rows);
      if (lastUpdated) lastUpdated.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
      const refreshLabel = $('refreshLabel');
      if (refreshLabel) refreshLabel.textContent = `Auto-refresh every ${refreshIntervalMs/1000} seconds`;
      $('errorBanner')?.style && ($('errorBanner').style.display = 'none');
    } catch (err) {
      console.error(err);
      showError('Failed to load submissions. Check console for details.');
    }
  }

  function startAutoRefresh() {
    if (timer) clearInterval(timer);
    timer = setInterval(loadAndRender, refreshIntervalMs);
  }

  function setupSearch() {
    const input = $('searchInput');
    if (!input) return;
    input.addEventListener('input', async (e) => {
      const q = e.target.value.trim().toLowerCase();
      let rows = [];
      try {
        if (window.FirebaseService && typeof FirebaseService.fetchSubmissions === 'function') {
          rows = await FirebaseService.fetchSubmissions();
        } else {
          throw new Error('Firebase service is not available');
        }
      } catch (err) {
        // propagate error to caller (will be handled by outer try/catch)
        throw err;
      }

      if (q) {
        rows = rows.filter(r => {
          return (r.first_name||'').toLowerCase().includes(q)
            || (r.last_name||'').toLowerCase().includes(q)
            || (r.email||'').toLowerCase().includes(q)
            || (r.company||'').toLowerCase().includes(q)
            || (r.message||'').toLowerCase().includes(q);
        });
      }

      renderTable(rows);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = $('refreshButton');
    if (refreshButton) refreshButton.addEventListener('click', loadAndRender);
    setupSearch();
    loadAndRender();
    startAutoRefresh();
  });

})();
(() => {
  const REFRESH_MS = 6000;

  const els = {
    submissionCount: document.getElementById('submissionCount'),
    latestSubmission: document.getElementById('latestSubmission'),
    uniqueCompanies: document.getElementById('uniqueCompanies'),
    refreshLabel: document.getElementById('refreshLabel'),
    lastUpdated: document.getElementById('lastUpdated'),
    refreshButton: document.getElementById('refreshButton'),
    searchInput: document.getElementById('searchInput'),
    tableCount: document.getElementById('tableCount'),
    submissionsTable: document.getElementById('submissionsTable'),
    tableBody: document.getElementById('tableBody'),
    loading: document.getElementById('loading'),
    errorBanner: document.getElementById('errorBanner'),
  };

  let polling = false;
  let cachedRows = [];
  let lastUpdatedAt = null;

  const formatNumber = (value) => new Intl.NumberFormat().format(Number(value || 0));
  const formatDate = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const setError = (message) => {
    if (els.errorBanner) {
      els.errorBanner.textContent = message;
      els.errorBanner.style.display = message ? 'block' : 'none';
    }
  };

  const setLastUpdated = () => {
    lastUpdatedAt = new Date();
    if (els.lastUpdated) {
      els.lastUpdated.textContent = `Updated at ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(lastUpdatedAt)}`;
    }

    if (els.refreshLabel) {
      els.refreshLabel.textContent = `Auto-refresh every ${Math.round(REFRESH_MS / 1000)} seconds`;
    }
  };

  const getSearchValue = () => (els.searchInput?.value || '').trim().toLowerCase();

  const filterRows = (rows) => {
    const query = getSearchValue();
    if (!query) return rows;

    return rows.filter((row) => {
      const haystack = [row.id, row.first_name, row.last_name, row.email, row.company, row.message]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  };

  const updateSummary = (rows) => {
    const latest = rows[0];
    const uniqueCompanies = new Set(rows.map((row) => (row.company || '').trim()).filter(Boolean));

    if (els.submissionCount) els.submissionCount.textContent = formatNumber(rows.length);
    if (els.latestSubmission) {
      els.latestSubmission.textContent = latest ? formatDate(latest.created_at) : '—';
    }
    if (els.uniqueCompanies) {
      els.uniqueCompanies.textContent = formatNumber(uniqueCompanies.size);
    }
    if (els.tableCount) {
      els.tableCount.textContent = `${formatNumber(rows.length)} row${rows.length === 1 ? '' : 's'}`;
    }
  };

  const renderTable = (rows) => {
    if (!els.tableBody) return;

    const filteredRows = filterRows(rows);

    if (!filteredRows || filteredRows.length === 0) {
      els.tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No submissions yet</td></tr>';
      return;
    }

    els.tableBody.innerHTML = filteredRows.map((row) => `
      <tr>
        <td>${escapeHtml(row.id)}</td>
        <td>${escapeHtml(row.first_name)}</td>
        <td>${escapeHtml(row.last_name)}</td>
        <td>${escapeHtml(row.email)}</td>
        <td>${escapeHtml(row.company || '—')}</td>
        <td>${escapeHtml(String(row.message || '').substring(0, 50))}${String(row.message || '').length > 50 ? '...' : ''}</td>
        <td>${formatDate(row.created_at)}</td>
      </tr>
    `).join('');
  };

  const fetchSubmissions = async () => {
    if (polling) return;
    polling = true;
    setError('');

    if (els.loading) els.loading.style.display = 'block';

    try {
      // Fetch from IndexedDB instead of API
      cachedRows = await RecarbonDB.getAllSubmissions();
      updateSummary(cachedRows);
      renderTable(cachedRows);
      setLastUpdated();
    } catch (error) {
      setError(`Unable to load submissions: ${error.message}`);
    } finally {
      polling = false;
      if (els.loading) els.loading.style.display = 'none';
    }
  };

  if (els.refreshButton) {
    els.refreshButton.addEventListener('click', fetchSubmissions);
  }

  if (els.searchInput) {
    els.searchInput.addEventListener('input', () => renderTable(cachedRows));
  }

  fetchSubmissions();
  window.setInterval(fetchSubmissions, REFRESH_MS);
})();
