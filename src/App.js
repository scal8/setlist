import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ───────────────────────────── CONFIG ───────────────────────────── */
const SPOTIFY_CLIENT_ID = '064f25fda20d4eb2bb0c78f1305f5469';
const REDIRECT_URI = 'http://127.0.0.1:3000';
const SCOPES = 'user-read-private playlist-read-private playlist-read-collaborative';
const GETSONGBPM_API_KEY = 'cd5cf88f35e7296383bbeb1fc9961737';

/* ─── PKCE Helpers ─── */
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function startAuthFlow() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);
  
  // Store verifier for token exchange
  window.localStorage.setItem('code_verifier', codeVerifier);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
  });
  
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('code_verifier');
  
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  
  const data = await resp.json();
  return data;
}

/* ───────────────────────────── STYLES ───────────────────────────── */
const css = `
  :root {
    --bg: #0a0a0f;
    --bg-card: #12121a;
    --bg-card-hover: #1a1a26;
    --bg-input: #16161f;
    --border: #2a2a3a;
    --border-focus: #ff6b35;
    --text: #e8e6e3;
    --text-dim: #6b6b7b;
    --text-muted: #4a4a5a;
    --accent: #ff6b35;
    --accent-glow: rgba(255,107,53,0.15);
    --accent2: #00d4aa;
    --accent2-glow: rgba(0,212,170,0.1);
    --danger: #ff4757;
    --radius: 10px;
    --radius-sm: 6px;
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 32px 48px;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0 32px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
  }

  .logo {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .logo h1 {
    font-family: 'DM Mono', monospace;
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -1px;
    color: var(--accent);
  }

  .logo .tag {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .auth-btn {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 8px 20px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }

  .auth-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-glow);
  }

  .auth-btn.connected {
    border-color: var(--accent2);
    color: var(--accent2);
  }

  /* Layout */
  .main-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 32px;
    align-items: start;
  }

  /* Sidebar */
  .sidebar {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .panel {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
  }

  .panel-title {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 16px;
  }

  /* Range Inputs */
  .range-group {
    margin-bottom: 16px;
  }

  .range-label {
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .range-value {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--accent);
  }

  .range-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .range-input {
    flex: 1;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 8px 12px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }

  .range-input:focus {
    border-color: var(--accent);
  }

  .range-sep {
    color: var(--text-muted);
    font-size: 12px;
  }

  /* Sort Controls */
  .sort-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sort-btn {
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sort-btn:hover {
    border-color: var(--text-dim);
    color: var(--text);
  }

  .sort-btn.active {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-glow);
  }

  .sort-dir {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    opacity: 0.7;
  }

  /* Saved Lists */
  .lists-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 13px;
    color: var(--text-dim);
  }

  .list-item:hover {
    background: var(--bg-card-hover);
    color: var(--text);
  }

  .list-item.active {
    background: var(--accent-glow);
    color: var(--accent);
  }

  .list-count {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    opacity: 0.5;
  }

  .new-list-btn {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    border: 1px dashed var(--border);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 4px;
  }

  .new-list-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  /* Content Area */
  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Search */
  .search-bar {
    display: flex;
    gap: 10px;
  }

  .search-input {
    flex: 1;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    padding: 12px 18px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    border-color: var(--accent);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .search-submit {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 12px 24px;
    border-radius: var(--radius);
    border: none;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .search-submit:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  .search-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  /* Import bar */
  .import-bar {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .import-select {
    flex: 1;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    padding: 10px 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    outline: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .import-btn {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 10px 18px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .import-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
  }

  .tab {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 10px 20px;
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
  }

  .tab:hover { color: var(--text); }

  .tab.active {
    color: var(--accent);
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
  }

  /* Track Table */
  .track-table {
    width: 100%;
    border-collapse: collapse;
  }

  .track-table thead th {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--border);
    font-weight: 400;
    user-select: none;
    cursor: pointer;
    transition: color 0.15s;
  }

  .track-table thead th:hover {
    color: var(--text-dim);
  }

  .track-table thead th.sorted {
    color: var(--accent);
  }

  .track-table tbody tr {
    cursor: pointer;
    transition: background 0.1s;
  }

  .track-table tbody tr:hover {
    background: var(--bg-card-hover);
  }

  .track-table tbody td {
    padding: 12px 12px;
    font-size: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    vertical-align: middle;
  }

  .track-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .track-art {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    background: var(--bg-input);
    flex-shrink: 0;
    object-fit: cover;
  }

  .track-name {
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
  }

  .track-artist {
    font-size: 12px;
    color: var(--text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
  }

  .bpm-cell {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--accent);
    font-weight: 500;
  }

  .duration-cell {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: var(--text-dim);
  }

  .add-to-list-btn {
    font-size: 18px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s;
    line-height: 1;
  }

  .add-to-list-btn:hover {
    color: var(--accent);
    background: var(--accent-glow);
  }

  .add-to-list-btn.in-list {
    color: var(--accent);
  }

  .remove-btn {
    font-size: 14px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .remove-btn:hover {
    color: var(--danger);
    background: rgba(255,71,87,0.1);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    color: var(--text-dim);
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }

  .empty-title {
    font-size: 18px;
    margin-bottom: 8px;
    color: var(--text-dim);
  }

  .empty-sub {
    font-size: 13px;
    color: var(--text-muted);
    max-width: 360px;
    line-height: 1.6;
  }

  /* Loading */
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-row td {
    text-align: center;
    padding: 40px !important;
    color: var(--text-dim);
  }

  /* Status */
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
    padding: 4px 0;
  }

  /* Modal overlay */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    min-width: 360px;
    max-width: 440px;
  }

  .modal h3 {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    letter-spacing: 1px;
    margin-bottom: 16px;
    color: var(--text);
  }

  .modal input {
    width: 100%;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    padding: 10px 14px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    outline: none;
    margin-bottom: 16px;
  }

  .modal input:focus {
    border-color: var(--accent);
  }

  .modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .modal-actions button {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
  }

  .btn-cancel:hover {
    border-color: var(--text-dim);
    color: var(--text);
  }

  .btn-confirm {
    background: var(--accent);
    border: none;
    color: #fff;
  }

  .btn-confirm:hover {
    opacity: 0.85;
  }

  .delete-list-btn {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255,71,87,0.3);
    background: transparent;
    color: var(--danger);
    cursor: pointer;
    transition: all 0.15s;
    margin-top: 8px;
  }

  .delete-list-btn:hover {
    background: rgba(255,71,87,0.1);
    border-color: var(--danger);
  }

  /* Drag handle */
  .drag-handle {
    cursor: grab;
    color: var(--text-muted);
    font-size: 14px;
    padding: 0 4px;
    user-select: none;
  }

  .drag-handle:active { cursor: grabbing; }

  tr.dragging {
    opacity: 0.4;
  }

  tr.drag-over td {
    border-top: 2px solid var(--accent) !important;
  }

  /* Spotify link icon */
  .spotify-link {
    color: var(--text-muted);
    transition: color 0.15s;
  }

  .spotify-link:hover {
    color: #1DB954;
  }

  /* No-auth state */
  .connect-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120px 20px;
    text-align: center;
  }

  .connect-prompt h2 {
    font-family: 'DM Mono', monospace;
    font-size: 22px;
    font-weight: 400;
    margin-bottom: 12px;
    color: var(--text);
  }

  .connect-prompt p {
    color: var(--text-dim);
    font-size: 14px;
    max-width: 400px;
    line-height: 1.6;
    margin-bottom: 28px;
  }

  .connect-big-btn {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    padding: 14px 36px;
    border-radius: var(--radius);
    border: none;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }

  .connect-big-btn:hover {
    opacity: 0.85;
    transform: translateY(-2px);
  }

  /* Responsive */
  @media (max-width: 860px) {
    .main-layout {
      grid-template-columns: 1fr;
    }
    .sidebar {
      position: static;
    }
    .app {
      padding: 16px;
    }
  }
`;

/* ──────────────────────── HELPERS ──────────────────────── */

function msToMinSec(ms) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function msToMinutes(ms) {
  return ms / 60000;
}

/* ──────────────────────── MAIN APP ──────────────────────── */

export default function App() {
  const [token, setToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'list'

  // Filters
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');
  const [durMin, setDurMin] = useState('');
  const [durMax, setDurMax] = useState('');

  // Sort
  const [sortField, setSortField] = useState('bpm');
  const [sortDir, setSortDir] = useState('asc');

  // Saved lists
  const [savedLists, setSavedLists] = useState(() => {
    try {
      const stored = localStorage.getItem('bpm-sorter-lists');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [activeListId, setActiveListId] = useState(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Drag state
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Persist lists
  useEffect(() => {
    localStorage.setItem('bpm-sorter-lists', JSON.stringify(savedLists));
  }, [savedLists]);

  // Auth: check URL for authorization code (PKCE flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      exchangeCodeForToken(code).then(data => {
        if (data.access_token) {
          setToken(data.access_token);
          // Store refresh token for later
          if (data.refresh_token) {
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
          }
        }
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }).catch(err => console.error('Token exchange failed:', err));
    }
  }, []);

  // Fetch user playlists
  useEffect(() => {
    if (!token) return;
    fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.items) setPlaylists(data.items);
      })
      .catch(console.error);
  }, [token]);

  /* ─── Spotify Search ─── */
  const searchTracks = useCallback(async () => {
    if (!token || !searchQuery.trim()) return;
    setLoading(true);
    try {
      // Dev Mode limits search to 10 per request, so paginate to get more
      let allTracks = [];
      for (let offset = 0; offset < 50; offset += 10) {
        const resp = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resp.ok) {
          console.error('Search error:', resp.status, await resp.text());
          break;
        }
        const data = await resp.json();
        const tracks = (data.tracks?.items || []).map(t => ({
          id: t.id,
          name: t.name,
          artist: t.artists?.map(a => a.name).join(', ') || 'Unknown',
          album: t.album?.name || '',
          art: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '',
          duration_ms: t.duration_ms,
          uri: t.uri,
          external_url: t.external_urls?.spotify || '',
          bpm: null,
        }));
        allTracks = [...allTracks, ...tracks];
        if ((data.tracks?.items || []).length < 10) break; // no more results
      }
      // Enrich with BPM via audio features (may fail for new apps)
      await enrichBpm(allTracks);
      setSearchResults(allTracks);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  }, [token, searchQuery]);

  /* ─── Import playlist ─── */
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  const importPlaylist = useCallback(async () => {
    if (!token || !selectedPlaylist) return;
    setLoading(true);
    try {
      let allTracks = [];
      let url = `https://api.spotify.com/v1/playlists/${selectedPlaylist}/items?limit=10`;
      while (url) {
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await resp.json();
        const tracks = (data.items || [])
          .filter(item => item.track)
          .map(item => {
            const t = item.track;
            return {
              id: t.id,
              name: t.name,
              artist: t.artists.map(a => a.name).join(', '),
              album: t.album.name,
              art: t.album.images?.[2]?.url || t.album.images?.[0]?.url || '',
              duration_ms: t.duration_ms,
              uri: t.uri,
              external_url: t.external_urls?.spotify || '',
              bpm: null,
            };
          });
        allTracks = [...allTracks, ...tracks];
        url = data.next;
      }
      await enrichBpm(allTracks);
      setSearchResults(allTracks);
    } catch (err) {
      console.error('Import failed:', err);
    }
    setLoading(false);
  }, [token, selectedPlaylist]);

  /* ─── BPM Enrichment via GetSongBPM ─── */
  const bpmCache = useRef({}); // Cache results to avoid redundant API calls

  const enrichBpm = async (tracks) => {
    if (tracks.length === 0) return;

    // First try Spotify audio features (may fail for new apps)
    if (token) {
      const ids = tracks.filter(t => t.bpm === null).map(t => t.id);
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        try {
          const resp = await fetch(
            `https://api.spotify.com/v1/audio-features?ids=${batch.join(',')}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (resp.ok) {
            const data = await resp.json();
            if (data.audio_features) {
              data.audio_features.forEach((feat) => {
                if (feat && feat.tempo && feat.id) {
                  const track = tracks.find(t => t.id === feat.id);
                  if (track) track.bpm = Math.round(feat.tempo);
                }
              });
            }
          }
        } catch (e) {
          // Silently fail — will fall back to GetSongBPM
        }
      }
    }

    // For tracks still missing BPM, use GetSongBPM API
    const needBpm = tracks.filter(t => t.bpm === null);
    for (const track of needBpm) {
      // Check cache first
      const cacheKey = `${track.artist}::${track.name}`.toLowerCase();
      if (bpmCache.current[cacheKey] !== undefined) {
        track.bpm = bpmCache.current[cacheKey];
        continue;
      }

      try {
        // Clean up track name for better matching
        const cleanName = track.name
          .replace(/\s*\(.*?\)\s*/g, '')  // strip "(Taylor's Version)" etc.
          .replace(/\s*-\s*.*$/, '')       // strip "- Remastered" etc.
          .replace(/\s*\[.*?\]\s*/g, '')   // strip "[Deluxe]" etc.
          .trim();
        const artistName = track.artist.split(',')[0].trim();

        // Step 1: Search for the song by title only first
        let searchData = null;
        const searchAttempts = [
          cleanName,                                    // just title
          `${cleanName} ${artistName}`,                 // title + artist
          track.name.split('(')[0].trim(),              // original title before any parens
        ];

        for (const query of searchAttempts) {
          const searchResp = await fetch(
            `/bpm-api/search/?type=song&lookup=${encodeURIComponent(query)}`
          );
          if (searchResp.ok) {
            const data = await searchResp.json();
            if (data.search && !data.search.error && Array.isArray(data.search) && data.search.length > 0) {
              searchData = data;
              console.log('GetSongBPM hit for:', query, '→', data.search.length, 'results');
              break;
            }
          }
          await new Promise(r => setTimeout(r, 200));
        }

        if (searchData && searchData.search && Array.isArray(searchData.search)) {
          // Find the best match by artist name
          const artistLower = artistName.toLowerCase();
          const match = searchData.search.find(s => {
            const sArtist = (s.artist?.name || '').toLowerCase();
            return sArtist.includes(artistLower) || artistLower.includes(sArtist);
          }) || searchData.search[0];

          console.log('Match found:', match?.id, match?.title || match?.name, 'tempo:', match?.tempo);

          if (match && match.id) {
            // Check if tempo is already in search results
            if (match.tempo && parseInt(match.tempo, 10) > 0) {
              track.bpm = parseInt(match.tempo, 10);
              bpmCache.current[cacheKey] = track.bpm;
            } else {
              // Step 2: Get full song details including BPM
              const songResp = await fetch(
                `/bpm-api/song/?id=${match.id}`
              );
              if (songResp.ok) {
                const songData = await songResp.json();
                console.log('Song details:', JSON.stringify(songData).substring(0, 300));
                const tempo = songData.song?.tempo;
                if (tempo && parseInt(tempo, 10) > 0) {
                  track.bpm = parseInt(tempo, 10);
                  bpmCache.current[cacheKey] = track.bpm;
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('GetSongBPM lookup failed for:', track.name, e);
      }

      // Small delay to respect rate limits (3000/hour = ~1.2/sec)
      await new Promise(r => setTimeout(r, 350));
    }
  };

  /* ─── Filtering & Sorting ─── */
  const filterAndSort = (tracks) => {
    let filtered = [...tracks];

    // BPM filter
    if (bpmMin !== '') {
      filtered = filtered.filter(t => t.bpm === null || t.bpm >= Number(bpmMin));
    }
    if (bpmMax !== '') {
      filtered = filtered.filter(t => t.bpm === null || t.bpm <= Number(bpmMax));
    }

    // Duration filter (user enters minutes)
    if (durMin !== '') {
      filtered = filtered.filter(t => msToMinutes(t.duration_ms) >= Number(durMin));
    }
    if (durMax !== '') {
      filtered = filtered.filter(t => msToMinutes(t.duration_ms) <= Number(durMax));
    }

    // Sort
    filtered.sort((a, b) => {
      let va, vb;
      if (sortField === 'bpm') {
        va = a.bpm ?? 9999;
        vb = b.bpm ?? 9999;
      } else if (sortField === 'duration') {
        va = a.duration_ms;
        vb = b.duration_ms;
      } else if (sortField === 'name') {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      } else if (sortField === 'artist') {
        va = a.artist.toLowerCase();
        vb = b.artist.toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* ─── List Management ─── */
  const activeList = savedLists.find(l => l.id === activeListId);

  const createList = () => {
    if (!newListName.trim()) return;
    const newList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      tracks: [],
    };
    setSavedLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    setNewListName('');
    setShowNewListModal(false);
    setActiveTab('list');
  };

  const deleteList = (id) => {
    setSavedLists(prev => prev.filter(l => l.id !== id));
    if (activeListId === id) {
      setActiveListId(null);
      setActiveTab('search');
    }
  };

  const addTrackToList = (track) => {
    if (!activeListId) {
      setShowNewListModal(true);
      return;
    }
    setSavedLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      if (l.tracks.some(t => t.id === track.id)) return l;
      return { ...l, tracks: [...l.tracks, track] };
    }));
  };

  const removeTrackFromList = (trackId) => {
    setSavedLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      return { ...l, tracks: l.tracks.filter(t => t.id !== trackId) };
    }));
  };

  const isInActiveList = (trackId) => {
    if (!activeList) return false;
    return activeList.tracks.some(t => t.id === trackId);
  };

  /* ─── Drag & Drop for list reordering ─── */
  const handleDragStart = (idx) => {
    dragItem.current = idx;
    setDraggingIdx(idx);
  };

  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
    setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (!activeListId) return;

    setSavedLists(prev => prev.map(l => {
      if (l.id !== activeListId) return l;
      const tracks = [...l.tracks];
      const draggedItem = tracks[dragItem.current];
      tracks.splice(dragItem.current, 1);
      tracks.splice(dragOverItem.current, 0, draggedItem);
      return { ...l, tracks };
    }));

    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  /* ─── Render ─── */
  const displayTracks = activeTab === 'search'
    ? filterAndSort(searchResults)
    : activeList
      ? (bpmMin || bpmMax || durMin || durMax ? filterAndSort(activeList.tracks) : activeList.tracks)
      : [];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <h1>SETLIST</h1>
            <span className="tag">bpm sorter</span>
          </div>
          {token ? (
            <button className="auth-btn connected" onClick={() => setToken(null)}>
              ● connected
            </button>
          ) : (
            <button className="auth-btn" onClick={startAuthFlow}>connect spotify →</button>
          )}
        </header>

        {!token ? (
          <div className="connect-prompt">
            <h2>connect to spotify</h2>
            <p>
              Search tracks, import playlists, sort by BPM and duration,
              and build custom setlists. Click a song to play it in Spotify.
            </p>
            <button className="connect-big-btn" onClick={startAuthFlow}>connect spotify →</button>
          </div>
        ) : (
          <div className="main-layout">
            {/* Sidebar */}
            <aside className="sidebar">
              {/* Filters */}
              <div className="panel">
                <div className="panel-title">Filters</div>
                <div className="range-group">
                  <div className="range-label">
                    <span>BPM range</span>
                    {(bpmMin || bpmMax) && (
                      <span className="range-value">{bpmMin || '—'}–{bpmMax || '—'}</span>
                    )}
                  </div>
                  <div className="range-row">
                    <input
                      className="range-input"
                      type="number"
                      placeholder="min"
                      value={bpmMin}
                      onChange={e => setBpmMin(e.target.value)}
                    />
                    <span className="range-sep">to</span>
                    <input
                      className="range-input"
                      type="number"
                      placeholder="max"
                      value={bpmMax}
                      onChange={e => setBpmMax(e.target.value)}
                    />
                  </div>
                </div>
                <div className="range-group">
                  <div className="range-label">
                    <span>Duration (min)</span>
                    {(durMin || durMax) && (
                      <span className="range-value">{durMin || '—'}–{durMax || '—'}</span>
                    )}
                  </div>
                  <div className="range-row">
                    <input
                      className="range-input"
                      type="number"
                      step="0.5"
                      placeholder="min"
                      value={durMin}
                      onChange={e => setDurMin(e.target.value)}
                    />
                    <span className="range-sep">to</span>
                    <input
                      className="range-input"
                      type="number"
                      step="0.5"
                      placeholder="max"
                      value={durMax}
                      onChange={e => setDurMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div className="panel">
                <div className="panel-title">Sort by</div>
                <div className="sort-options">
                  {[
                    { field: 'bpm', label: 'BPM' },
                    { field: 'duration', label: 'Duration' },
                    { field: 'name', label: 'Track name' },
                    { field: 'artist', label: 'Artist' },
                  ].map(s => (
                    <button
                      key={s.field}
                      className={`sort-btn ${sortField === s.field ? 'active' : ''}`}
                      onClick={() => toggleSort(s.field)}
                    >
                      {s.label}
                      {sortField === s.field && (
                        <span className="sort-dir">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Lists */}
              <div className="panel">
                <div className="panel-title">My Lists</div>
                <div className="lists-section">
                  {savedLists.map(list => (
                    <div
                      key={list.id}
                      className={`list-item ${activeListId === list.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveListId(list.id);
                        setActiveTab('list');
                      }}
                    >
                      <span>{list.name}</span>
                      <span className="list-count">{list.tracks.length}</span>
                    </div>
                  ))}
                  <button className="new-list-btn" onClick={() => setShowNewListModal(true)}>
                    + new list
                  </button>
                </div>
                {activeList && (
                  <button
                    className="delete-list-btn"
                    onClick={() => {
                      if (window.confirm(`Delete "${activeList.name}"?`)) {
                        deleteList(activeListId);
                      }
                    }}
                  >
                    delete "{activeList.name}"
                  </button>
                )}
              </div>
            </aside>

            {/* Main content */}
            <main className="content">
              {/* Search / Import */}
              <div className="search-bar">
                <input
                  className="search-input"
                  placeholder="Search songs, artists, albums..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchTracks()}
                />
                <button
                  className="search-submit"
                  onClick={searchTracks}
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? <span className="spinner" /> : 'search'}
                </button>
              </div>

              {playlists.length > 0 && (
                <div className="import-bar">
                  <select
                    className="import-select"
                    value={selectedPlaylist}
                    onChange={e => setSelectedPlaylist(e.target.value)}
                  >
                    <option value="">Import from playlist...</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.tracks?.total ?? '?'} tracks)
                      </option>
                    ))}
                  </select>
                  <button
                    className="import-btn"
                    onClick={importPlaylist}
                    disabled={!selectedPlaylist || loading}
                  >
                    import
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                  onClick={() => setActiveTab('search')}
                >
                  Search Results {searchResults.length > 0 && `(${searchResults.length})`}
                </button>
                {activeList && (
                  <button
                    className={`tab ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                  >
                    {activeList.name} ({activeList.tracks.length})
                  </button>
                )}
              </div>

              {/* Status bar */}
              <div className="status-bar">
                <span>{displayTracks.length} tracks shown</span>
                <span>
                  {(bpmMin || bpmMax) && `BPM: ${bpmMin || '*'}–${bpmMax || '*'}`}
                  {(bpmMin || bpmMax) && (durMin || durMax) && ' · '}
                  {(durMin || durMax) && `Duration: ${durMin || '*'}–${durMax || '*'}min`}
                </span>
              </div>

              {/* Track Table */}
              {displayTracks.length === 0 && !loading ? (
                <div className="empty-state">
                  <div className="empty-icon">♪</div>
                  <div className="empty-title">
                    {activeTab === 'search' ? 'No tracks yet' : 'Empty list'}
                  </div>
                  <div className="empty-sub">
                    {activeTab === 'search'
                      ? 'Search for songs or import a playlist to get started. BPM and duration data will appear automatically.'
                      : 'Add tracks from search results using the + button.'}
                  </div>
                </div>
              ) : (
                <table className="track-table">
                  <thead>
                    <tr>
                      {activeTab === 'list' && <th style={{ width: 32 }}></th>}
                      <th
                        className={sortField === 'name' ? 'sorted' : ''}
                        onClick={() => toggleSort('name')}
                        style={{ minWidth: 200 }}
                      >
                        Track {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className={sortField === 'bpm' ? 'sorted' : ''}
                        onClick={() => toggleSort('bpm')}
                        style={{ width: 80 }}
                      >
                        BPM {sortField === 'bpm' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className={sortField === 'duration' ? 'sorted' : ''}
                        onClick={() => toggleSort('duration')}
                        style={{ width: 80 }}
                      >
                        Time {sortField === 'duration' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ width: 48 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr className="loading-row">
                        <td colSpan={activeTab === 'list' ? 5 : 4}>
                          <span className="spinner" /> Loading tracks...
                        </td>
                      </tr>
                    ) : (
                      displayTracks.map((track, idx) => (
                        <tr
                          key={track.id + '-' + idx}
                          className={`
                            ${draggingIdx === idx ? 'dragging' : ''}
                            ${dragOverIdx === idx ? 'drag-over' : ''}
                          `}
                          draggable={activeTab === 'list'}
                          onDragStart={activeTab === 'list' ? () => handleDragStart(idx) : undefined}
                          onDragEnter={activeTab === 'list' ? () => handleDragEnter(idx) : undefined}
                          onDragEnd={activeTab === 'list' ? handleDragEnd : undefined}
                          onDragOver={e => e.preventDefault()}
                        >
                          {activeTab === 'list' && (
                            <td>
                              <span className="drag-handle">⋮⋮</span>
                            </td>
                          )}
                          <td>
                            <div className="track-info">
                              {track.art && (
                                <img className="track-art" src={track.art} alt="" />
                              )}
                              <div>
                                <div className="track-name">{track.name}</div>
                                <div className="track-artist">{track.artist}</div>
                              </div>
                            </div>
                          </td>
                          <td className="bpm-cell">
                            {track.bpm !== null ? track.bpm : '—'}
                          </td>
                          <td className="duration-cell">
                            {msToMinSec(track.duration_ms)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {/* Open in Spotify */}
                              <a
                                href={track.uri}
                                className="spotify-link"
                                title="Play in Spotify"
                                onClick={e => {
                                  e.stopPropagation();
                                  // uri opens desktop app; fallback to web
                                  window.open(track.external_url, '_blank');
                                }}
                              >
                                ▶
                              </a>
                              {activeTab === 'search' ? (
                                <button
                                  className={`add-to-list-btn ${isInActiveList(track.id) ? 'in-list' : ''}`}
                                  title={isInActiveList(track.id) ? 'Already in list' : 'Add to list'}
                                  onClick={() => addTrackToList(track)}
                                >
                                  {isInActiveList(track.id) ? '✓' : '+'}
                                </button>
                              ) : (
                                <button
                                  className="remove-btn"
                                  title="Remove from list"
                                  onClick={() => removeTrackFromList(track.id)}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </main>
          </div>
        )}

        {/* New List Modal */}
        {showNewListModal && (
          <div className="modal-overlay" onClick={() => setShowNewListModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>New List</h3>
              <input
                placeholder="List name..."
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createList()}
                autoFocus
              />
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowNewListModal(false)}>
                  cancel
                </button>
                <button className="btn-confirm" onClick={createList}>
                  create
                </button>
              </div>
            </div>
          </div>
        )}
        {/* GetSongBPM Credit (required for free API use) */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0 8px',
          fontSize: '11px',
          fontFamily: "'DM Mono', monospace",
          color: 'var(--text-muted)',
          letterSpacing: '0.5px',
        }}>
          BPM data by{' '}
          <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--text-dim)', textDecoration: 'underline' }}>
            GetSongBPM
          </a>
        </div>
      </div>
    </>
  );
}
