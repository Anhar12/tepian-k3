import { Hono } from "hono";
import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import { env } from "@/env";
import { validateToken } from "@tepian-k3/auth/utils";

const logsRouter = new Hono();

const appName = process.env.APP_NAME || "server";
const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), "logs");

// Allowed log file keywords (prevents directory traversal)
const LOG_FILES: Record<string, string> = {
  combined: `${appName}-combined.log`,
  error: `${appName}-error.log`,
};

const VALID_LEVELS = ["error", "warn", "info", "http", "debug"] as const;

interface ParsedLogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  [key: string]: unknown;
}

// Auth middleware: skip in dev, require JWT with logs.read in production
// The /ui route is excluded (static HTML only, no data)
logsRouter.use("*", async (c, next) => {
  if (env.NODE_ENV === "development") {
    return next();
  }

  // Allow the UI page to load without auth (it's just HTML)
  // c.req.path returns the full path (e.g. /api/logs/ui), not the sub-router path
  if (c.req.path.endsWith("/ui") || c.req.path.endsWith("/ui/")) {
    return next();
  }

  // Production: require JWT with logs.read permission
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Authorization header required" }, 401);
  }

  const token = authHeader.slice(7);
  const { user } = await validateToken(token);

  if (!user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  if (!user.permissions.includes("logs.read")) {
    return c.json({ error: "Missing logs.read permission" }, 403);
  }

  return next();
});

/**
 * Parse a single log line into a structured entry.
 * Handles both JSON format (production) and dev format (timestamp [level]: message).
 */
function parseLogLine(line: string): ParsedLogEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Try JSON parse first (production format)
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.level && parsed.message) {
      // Extract service name from [ServiceName] pattern in message
      const serviceMatch = parsed.message.match(/^\[([^\]]+)\]/);
      return {
        ...parsed,
        service: serviceMatch ? serviceMatch[1] : undefined,
      };
    }
  } catch {
    // Not JSON, try dev format
  }

  // Dev format: "2026-02-06 12:00:00 [info]: [Server] message"
  const devMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+\[(\w+)\]:\s+(.*)$/,
  );
  if (devMatch) {
    const [, timestamp, level, message] = devMatch;
    const serviceMatch = message!.match(/^\[([^\]]+)\]/);
    return {
      timestamp: timestamp!,
      level: level!,
      message: message!,
      service: serviceMatch ? serviceMatch[1] : undefined,
    };
  }

  return null;
}

/**
 * GET /api/logs — Read and filter log entries
 *
 * Query params:
 *   file    - "combined" (default) or "error"
 *   level   - Filter by log level
 *   service - Filter by service name (case-insensitive)
 *   search  - Free-text search in message (case-insensitive)
 *   from    - Start date (ISO string)
 *   to      - End date (ISO string)
 *   page    - Page number (default: 1)
 *   limit   - Items per page (default: 50, max: 200)
 *   order   - "desc" (default, newest first) or "asc"
 */
logsRouter.get("/", async (c) => {
  const fileKey = c.req.query("file") || "combined";
  const level = c.req.query("level");
  const service = c.req.query("service");
  const search = c.req.query("search");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(c.req.query("limit") || "50", 10)),
  );
  const order = c.req.query("order") === "asc" ? "asc" : "desc";

  // Validate file parameter
  const filename = LOG_FILES[fileKey];
  if (!filename) {
    return c.json(
      {
        error: `Invalid file parameter. Allowed: ${Object.keys(LOG_FILES).join(", ")}`,
      },
      400,
    );
  }

  // Validate level parameter
  if (level && !VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
    return c.json(
      {
        error: `Invalid level. Allowed: ${VALID_LEVELS.join(", ")}`,
      },
      400,
    );
  }

  const filePath = path.join(logsDir, filename);

  // Read file
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return c.json(
        {
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          meta: { file: fileKey, filters: {} },
        },
        200,
      );
    }
    return c.json({ error: "Failed to read log file" }, 500);
  }

  // Parse lines
  const lines = content.split("\n");
  let entries: ParsedLogEntry[] = [];

  for (const line of lines) {
    const parsed = parseLogLine(line);
    if (parsed) entries.push(parsed);
  }

  // Apply filters
  if (level) {
    entries = entries.filter((e) => e.level === level);
  }

  if (service) {
    const serviceLower = service.toLowerCase();
    entries = entries.filter(
      (e) => e.service && e.service.toLowerCase().includes(serviceLower),
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    entries = entries.filter((e) =>
      e.message.toLowerCase().includes(searchLower),
    );
  }

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      entries = entries.filter((e) => new Date(e.timestamp) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      entries = entries.filter((e) => new Date(e.timestamp) <= toDate);
    }
  }

  // Sort by timestamp
  entries.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return order === "desc" ? timeB - timeA : timeA - timeB;
  });

  // Pagination
  const total = entries.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedEntries = entries.slice(offset, offset + limit);

  const activeFilters: Record<string, string> = {};
  if (level) activeFilters.level = level;
  if (service) activeFilters.service = service;
  if (search) activeFilters.search = search;
  if (from) activeFilters.from = from;
  if (to) activeFilters.to = to;

  return c.json({
    data: paginatedEntries,
    pagination: { page, limit, total, totalPages },
    meta: { file: fileKey, order, filters: activeFilters },
  });
});

/**
 * GET /api/logs/files — List available log files with metadata
 */
logsRouter.get("/files", async (c) => {
  try {
    const dirEntries = await fs.readdir(logsDir);
    const logFiles = [];

    for (const entry of dirEntries) {
      if (!entry.endsWith(".log")) continue;

      const filePath = path.join(logsDir, entry);
      const stat = await fs.stat(filePath);

      logFiles.push({
        name: entry,
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        modified: stat.mtime.toISOString(),
      });
    }

    // Sort by modified date, newest first
    logFiles.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
    );

    return c.json({ files: logFiles, directory: logsDir });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return c.json({ files: [], directory: logsDir });
    }
    return c.json({ error: "Failed to read logs directory" }, 500);
  }
});

/**
 * GET /api/logs/ui — Self-contained log viewer dashboard
 */
logsRouter.get("/ui", (c) => {
  const nonce = randomBytes(16).toString("base64");
  // Nonce-based CSP: only our specific <script>/<style> blocks execute
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'nonce-${nonce}'`,
      `style-src 'nonce-${nonce}' 'unsafe-inline'`,
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  return c.html(getLogViewerHtml(nonce));
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getLogViewerHtml(nonce: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Log Viewer</title>
<style nonce="${nonce}">
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
    background: #0d1117; color: #c9d1d9; min-height: 100vh;
  }
  a { color: #58a6ff; text-decoration: none; }

  /* Header */
  .header {
    background: #161b22; border-bottom: 1px solid #30363d;
    padding: 12px 20px; display: flex; align-items: center; gap: 16px;
    position: sticky; top: 0; z-index: 10;
  }
  .header h1 { font-size: 16px; font-weight: 600; color: #f0f6fc; white-space: nowrap; }
  .header-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

  /* Filters */
  .filters {
    background: #161b22; border-bottom: 1px solid #30363d;
    padding: 10px 20px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }
  .filter-group { display: flex; align-items: center; gap: 4px; }
  .filter-group label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
  select, input[type="text"], input[type="datetime-local"] {
    background: #0d1117; border: 1px solid #30363d; color: #c9d1d9;
    padding: 5px 8px; border-radius: 6px; font-size: 13px; font-family: inherit;
  }
  select:focus, input:focus { outline: none; border-color: #58a6ff; }
  input[type="datetime-local"] { font-size: 12px; }

  /* Buttons */
  .btn {
    background: #21262d; border: 1px solid #30363d; color: #c9d1d9;
    padding: 5px 12px; border-radius: 6px; font-size: 13px; cursor: pointer;
    font-family: inherit; transition: background 0.15s;
  }
  .btn:hover { background: #30363d; }
  .btn-primary { background: #238636; border-color: #2ea043; color: #fff; }
  .btn-primary:hover { background: #2ea043; }
  .btn-sm { padding: 3px 8px; font-size: 12px; }
  .btn-danger { background: #da3633; border-color: #f85149; color: #fff; }
  .btn-danger:hover { background: #f85149; }

  /* Status bar */
  .status-bar {
    background: #161b22; border-bottom: 1px solid #30363d;
    padding: 6px 20px; display: flex; align-items: center; gap: 12px;
    font-size: 12px; color: #8b949e;
  }
  .status-bar .count { color: #f0f6fc; font-weight: 600; }
  .auto-refresh-indicator {
    display: inline-flex; align-items: center; gap: 4px;
  }
  .auto-refresh-indicator .dot {
    width: 6px; height: 6px; border-radius: 50%; background: #3fb950;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* Log table */
  .log-container { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th {
    background: #161b22; color: #8b949e; font-weight: 600; text-align: left;
    padding: 8px 12px; border-bottom: 1px solid #30363d;
    position: sticky; top: 0; font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tr { border-bottom: 1px solid #21262d; cursor: pointer; }
  tr:hover { background: #161b22; }
  td { padding: 6px 12px; vertical-align: top; }
  td.timestamp { white-space: nowrap; color: #8b949e; font-size: 12px; min-width: 170px; }
  td.service { white-space: nowrap; color: #d2a8ff; font-size: 12px; min-width: 100px; }
  td.message {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 12px; word-break: break-word; line-height: 1.5;
  }

  /* Level badges */
  .level {
    display: inline-block; padding: 1px 8px; border-radius: 10px;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    min-width: 50px; text-align: center;
  }
  .level-error { background: #da363322; color: #f85149; border: 1px solid #da363344; }
  .level-warn { background: #d2992222; color: #e3b341; border: 1px solid #d2992244; }
  .level-info { background: #23863622; color: #3fb950; border: 1px solid #23863644; }
  .level-http { background: #a371f722; color: #bc8cff; border: 1px solid #a371f744; }
  .level-debug { background: #58a6ff22; color: #58a6ff; border: 1px solid #58a6ff44; }

  /* Expanded row */
  .expanded-row td { padding: 0; }
  .expanded-content {
    background: #0d1117; border: 1px solid #30363d; border-radius: 6px;
    margin: 4px 12px 8px; padding: 12px; font-family: monospace;
    font-size: 12px; white-space: pre-wrap; word-break: break-all;
    color: #e6edf3; max-height: 400px; overflow-y: auto;
  }

  /* Pagination */
  .pagination {
    background: #161b22; border-top: 1px solid #30363d;
    padding: 10px 20px; display: flex; align-items: center; justify-content: space-between;
    position: sticky; bottom: 0; font-size: 13px;
  }
  .pagination .page-info { color: #8b949e; }
  .pagination .page-controls { display: flex; gap: 6px; }

  /* File panel */
  .file-panel {
    background: #161b22; border-bottom: 1px solid #30363d;
    padding: 10px 20px; display: none;
  }
  .file-panel.visible { display: block; }
  .file-panel h3 { font-size: 13px; margin-bottom: 8px; color: #f0f6fc; }
  .file-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .file-card {
    background: #0d1117; border: 1px solid #30363d; border-radius: 6px;
    padding: 8px 12px; font-size: 12px;
  }
  .file-card .name { color: #58a6ff; font-weight: 600; }
  .file-card .meta { color: #8b949e; margin-top: 2px; }

  /* Empty state */
  .empty {
    text-align: center; padding: 60px 20px; color: #8b949e;
  }
  .empty h2 { font-size: 18px; margin-bottom: 8px; color: #c9d1d9; }

  /* Loading */
  .loading { text-align: center; padding: 40px; color: #8b949e; }

  /* Auth bar */
  .auth-bar {
    background: #1c1e26; border-bottom: 1px solid #30363d;
    padding: 8px 20px; display: flex; align-items: center; gap: 8px;
  }
  .auth-bar label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  .auth-bar input {
    flex: 1; background: #0d1117; border: 1px solid #30363d; color: #c9d1d9;
    padding: 5px 10px; border-radius: 6px; font-size: 12px; font-family: monospace;
  }
  .auth-bar .status { font-size: 11px; white-space: nowrap; }
  .auth-bar .status.ok { color: #3fb950; }
  .auth-bar .status.err { color: #f85149; }
  .auth-bar .status.none { color: #8b949e; }
</style>
</head>
<body>

<div class="header">
  <h1>Log Viewer</h1>
  <div class="header-right">
    <button class="btn btn-sm" id="toggleFiles">Files</button>
    <select id="autoRefresh" class="btn-sm" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:3px 8px;border-radius:6px;font-size:12px;">
      <option value="0">Auto-refresh: Off</option>
      <option value="5000">Every 5s</option>
      <option value="10000">Every 10s</option>
      <option value="30000">Every 30s</option>
    </select>
    <button class="btn btn-primary btn-sm" id="refreshBtn">Refresh</button>
  </div>
</div>

<div class="auth-bar" id="authBar">
  <label>JWT Token</label>
  <input type="password" id="authToken" placeholder="Paste your Bearer token here (required in production)...">
  <button class="btn btn-sm" id="authSave">Save</button>
  <span class="status none" id="authStatus">No token</span>
</div>

<div class="file-panel" id="filePanel">
  <h3>Log Files</h3>
  <div class="file-list" id="fileList"></div>
</div>

<div class="filters">
  <div class="filter-group">
    <label>File</label>
    <select id="filterFile">
      <option value="combined">Combined</option>
      <option value="error">Error Only</option>
    </select>
  </div>
  <div class="filter-group">
    <label>Level</label>
    <select id="filterLevel">
      <option value="">All</option>
      <option value="error">Error</option>
      <option value="warn">Warn</option>
      <option value="info">Info</option>
      <option value="http">HTTP</option>
      <option value="debug">Debug</option>
    </select>
  </div>
  <div class="filter-group">
    <label>Service</label>
    <input type="text" id="filterService" placeholder="e.g. Server" style="width:100px;">
  </div>
  <div class="filter-group">
    <label>Search</label>
    <input type="text" id="filterSearch" placeholder="Search messages..." style="width:180px;">
  </div>
  <div class="filter-group">
    <label>From</label>
    <input type="datetime-local" id="filterFrom">
  </div>
  <div class="filter-group">
    <label>To</label>
    <input type="datetime-local" id="filterTo">
  </div>
  <div class="filter-group">
    <label>Order</label>
    <select id="filterOrder">
      <option value="desc">Newest first</option>
      <option value="asc">Oldest first</option>
    </select>
  </div>
  <button class="btn btn-sm" id="clearFilters">Clear</button>
</div>

<div class="status-bar">
  <span>Showing <span class="count" id="showCount">0</span> of <span class="count" id="totalCount">0</span> entries</span>
  <span id="autoRefreshStatus"></span>
</div>

<div class="log-container">
  <table>
    <thead>
      <tr>
        <th style="width:170px">Timestamp</th>
        <th style="width:70px">Level</th>
        <th style="width:110px">Service</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody id="logBody"></tbody>
  </table>
  <div class="empty" id="emptyState" style="display:none;">
    <h2>No log entries found</h2>
    <p>Try adjusting your filters or check that log files exist.</p>
  </div>
  <div class="loading" id="loadingState">Loading...</div>
</div>

<div class="pagination">
  <div class="page-info" id="pageInfo">Page 1 of 1</div>
  <div class="page-controls">
    <select id="limitSelect" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:4px 8px;border-radius:6px;font-size:12px;">
      <option value="25">25 / page</option>
      <option value="50" selected>50 / page</option>
      <option value="100">100 / page</option>
      <option value="200">200 / page</option>
    </select>
    <button class="btn btn-sm" id="prevPage" disabled>Prev</button>
    <button class="btn btn-sm" id="nextPage" disabled>Next</button>
  </div>
</div>

<script nonce="${nonce}">
(function() {
  // State
  let currentPage = 1;
  let totalPages = 1;
  let autoRefreshTimer = null;
  let expandedRow = null;

  // Base path (strip /ui from current URL)
  const basePath = window.location.pathname.replace(/\\/ui\\/?$/, '');

  // Auth token: auto-read from web app's localStorage (same origin via nginx on :3001),
  // fall back to manually entered token (for direct :3000 access)
  const MANUAL_TOKEN_KEY = 'log_viewer_token';
  let authToken = localStorage.getItem('accessToken') || localStorage.getItem(MANUAL_TOKEN_KEY) || '';

  function getHeaders() {
    const h = {};
    if (authToken) h['Authorization'] = 'Bearer ' + authToken;
    return h;
  }

  function updateAuthUI() {
    const input = document.getElementById('authToken');
    const status = document.getElementById('authStatus');
    const authBar = document.getElementById('authBar');
    const webToken = localStorage.getItem('accessToken');
    if (webToken) {
      // Auto-detected from web app — hide manual input
      authBar.style.display = 'none';
      authToken = webToken;
    } else if (authToken) {
      input.value = authToken;
      status.textContent = 'Token set';
      status.className = 'status ok';
    } else {
      input.value = '';
      status.textContent = 'No token';
      status.className = 'status none';
    }
  }

  // Elements
  const $ = (id) => document.getElementById(id);
  const logBody = $('logBody');
  const emptyState = $('emptyState');
  const loadingState = $('loadingState');
  const showCount = $('showCount');
  const totalCount = $('totalCount');
  const pageInfo = $('pageInfo');
  const prevPage = $('prevPage');
  const nextPage = $('nextPage');

  // Build query string from filters
  function buildQuery() {
    const params = new URLSearchParams();
    const file = $('filterFile').value;
    const level = $('filterLevel').value;
    const service = $('filterService').value.trim();
    const search = $('filterSearch').value.trim();
    const from = $('filterFrom').value;
    const to = $('filterTo').value;
    const order = $('filterOrder').value;
    const limit = $('limitSelect').value;

    params.set('file', file);
    if (level) params.set('level', level);
    if (service) params.set('service', service);
    if (search) params.set('search', search);
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(to).toISOString());
    params.set('order', order);
    params.set('page', currentPage.toString());
    params.set('limit', limit);

    return params.toString();
  }

  // Escape HTML
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Format timestamp for display
  function fmtTime(ts) {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return esc(ts);
      return d.toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        fractionalSecondDigits: 3, hour12: false
      });
    } catch { return esc(ts); }
  }

  // Fetch and render logs
  async function fetchLogs() {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';

    try {
      const res = await fetch(basePath + '?' + buildQuery(), { headers: getHeaders() });
      if (res.status === 401 || res.status === 403) {
        const err = await res.json().catch(function() { return {}; });
        throw new Error(err.error || 'Auth failed (' + res.status + ') — enter a valid JWT token above');
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();

      const entries = json.data || [];
      const pagination = json.pagination || {};
      totalPages = pagination.totalPages || 1;
      currentPage = pagination.page || 1;

      showCount.textContent = entries.length;
      totalCount.textContent = pagination.total || 0;
      pageInfo.textContent = 'Page ' + currentPage + ' of ' + totalPages;
      prevPage.disabled = currentPage <= 1;
      nextPage.disabled = currentPage >= totalPages;

      loadingState.style.display = 'none';

      if (entries.length === 0) {
        logBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      expandedRow = null;

      let html = '';
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const levelClass = 'level-' + (e.level || 'info');
        html += '<tr data-idx="' + i + '">'
          + '<td class="timestamp">' + fmtTime(e.timestamp) + '</td>'
          + '<td><span class="level ' + levelClass + '">' + esc(e.level || '') + '</span></td>'
          + '<td class="service">' + esc(e.service || '-') + '</td>'
          + '<td class="message">' + esc(e.message || '') + '</td>'
          + '</tr>';
      }
      logBody.innerHTML = html;

      // Click to expand
      logBody.querySelectorAll('tr').forEach((tr, idx) => {
        tr.addEventListener('click', function() {
          // Remove previous expanded
          const prev = logBody.querySelector('.expanded-row');
          if (prev) {
            if (expandedRow === idx) { prev.remove(); expandedRow = null; return; }
            prev.remove();
          }
          expandedRow = idx;
          const detail = entries[idx];
          const row = document.createElement('tr');
          row.className = 'expanded-row';
          row.innerHTML = '<td colspan="4"><div class="expanded-content">'
            + esc(JSON.stringify(detail, null, 2))
            + '</div></td>';
          tr.after(row);
        });
      });

    } catch (err) {
      loadingState.style.display = 'none';
      logBody.innerHTML = '<tr><td colspan="4" style="color:#f85149;padding:20px;">Error fetching logs: '
        + esc(err.message) + '</td></tr>';
    }
  }

  // Fetch file list
  async function fetchFiles() {
    try {
      const res = await fetch(basePath + '/files', { headers: getHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      const files = json.files || [];
      const fileList = $('fileList');

      if (files.length === 0) {
        fileList.innerHTML = '<div class="file-card"><div class="name">No log files found</div><div class="meta">' + esc(json.directory || '') + '</div></div>';
        return;
      }

      fileList.innerHTML = files.map(function(f) {
        return '<div class="file-card">'
          + '<div class="name">' + esc(f.name) + '</div>'
          + '<div class="meta">' + esc(f.sizeFormatted) + ' &middot; ' + fmtTime(f.modified) + '</div>'
          + '</div>';
      }).join('');
    } catch {}
  }

  // Event listeners
  $('refreshBtn').addEventListener('click', function() { fetchLogs(); });

  $('toggleFiles').addEventListener('click', function() {
    const panel = $('filePanel');
    panel.classList.toggle('visible');
    if (panel.classList.contains('visible')) fetchFiles();
  });

  // Filters: debounced auto-fetch on text input, immediate on select change
  let debounceTimer;
  function debouncedFetch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() { currentPage = 1; fetchLogs(); }, 400);
  }
  function immediateFetch() { currentPage = 1; fetchLogs(); }

  $('filterFile').addEventListener('change', immediateFetch);
  $('filterLevel').addEventListener('change', immediateFetch);
  $('filterOrder').addEventListener('change', immediateFetch);
  $('filterService').addEventListener('input', debouncedFetch);
  $('filterSearch').addEventListener('input', debouncedFetch);
  $('filterFrom').addEventListener('change', immediateFetch);
  $('filterTo').addEventListener('change', immediateFetch);
  $('limitSelect').addEventListener('change', function() { currentPage = 1; fetchLogs(); });

  $('clearFilters').addEventListener('click', function() {
    $('filterFile').value = 'combined';
    $('filterLevel').value = '';
    $('filterService').value = '';
    $('filterSearch').value = '';
    $('filterFrom').value = '';
    $('filterTo').value = '';
    $('filterOrder').value = 'desc';
    currentPage = 1;
    fetchLogs();
  });

  // Pagination
  prevPage.addEventListener('click', function() {
    if (currentPage > 1) { currentPage--; fetchLogs(); }
  });
  nextPage.addEventListener('click', function() {
    if (currentPage < totalPages) { currentPage++; fetchLogs(); }
  });

  // Auto-refresh
  $('autoRefresh').addEventListener('change', function() {
    const interval = parseInt(this.value, 10);
    if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
    const statusEl = $('autoRefreshStatus');
    if (interval > 0) {
      autoRefreshTimer = setInterval(fetchLogs, interval);
      statusEl.innerHTML = '<span class="auto-refresh-indicator"><span class="dot"></span> Auto-refreshing every ' + (interval / 1000) + 's</span>';
    } else {
      statusEl.innerHTML = '';
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'r') fetchLogs();
    if (e.key === 'ArrowLeft' && currentPage > 1) { currentPage--; fetchLogs(); }
    if (e.key === 'ArrowRight' && currentPage < totalPages) { currentPage++; fetchLogs(); }
  });

  // Auth token save (manual input, for direct :3000 access)
  $('authSave').addEventListener('click', function() {
    authToken = $('authToken').value.trim();
    if (authToken) {
      localStorage.setItem(MANUAL_TOKEN_KEY, authToken);
    } else {
      localStorage.removeItem(MANUAL_TOKEN_KEY);
    }
    updateAuthUI();
    fetchLogs();
  });
  $('authToken').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') $('authSave').click();
  });

  // Init auth UI and fetch
  updateAuthUI();
  fetchLogs();
})();
</script>
</body>
</html>`;
}

export { logsRouter };
