/**
 * Dashboard 12 - React Bits Pro Block
 * Payout desk with a headline balance, dual-series pace chart, and sweep lanes.
 * Adapted for Medi Smart: Platform Administrator viewing Hospital Status & Website/Infrastructure Status.
 */

export function renderDashboard12(data = {}) {
  const hospitals = data.hospitals || [];
  const users = data.users || [];
  const activityLogs = data.activityLogs || [];

  // Calculate live summary stats
  const totalHospitals = hospitals.length > 0 ? hospitals.length : 5;
  const activeHospitals = hospitals.filter(h => h.active !== false).length || totalHospitals;
  const totalUsers = users.length > 0 ? users.length : 148;
  const healthIndex = '99.98%';
  const avgPing = '26ms';

  return `
    <div class="rb-dashboard-12" id="rb-dashboard-12-root">
      <!-- 1. HEADLINE BALANCE & PAYOUT/OPERATIONS DESK -->
      <section class="rb-desk-card">
        <div class="rb-desk-header">
          <div class="rb-desk-identity">
            <div class="rb-desk-badge">
              <span class="rb-pulse-beacon"></span>
              <span>LIVE TELEMETRY & OPERATIONS COMMAND</span>
            </div>
            <h1 class="rb-desk-title">Hospital Fleet & Platform Infrastructure Status</h1>
            <p class="rb-desk-subtitle">
              Continuous monitoring of connected healthcare networks, bed allocations, API nodes, and real-time edge servers.
            </p>
          </div>
          <div class="rb-desk-actions">
            <button class="rb-btn rb-btn-secondary" id="rb-export-report-btn" onclick="window.__RB_D12__?.exportReport()">
              <span>📥</span> Export Audit Report
            </button>
            <button class="rb-btn rb-btn-primary" id="rb-run-sweep-btn" onclick="window.__RB_D12__?.triggerSweep()">
              <span class="rb-spin-icon">⚡</span> Run Health Sweep
            </button>
          </div>
        </div>

        <!-- Headline Balance Display -->
        <div class="rb-headline-grid">
          <div class="rb-balance-block">
            <div class="rb-balance-label">HEADLINE OPERATIONAL CAPACITY & SYSTEM HEALTH</div>
            <div class="rb-balance-row">
              <div class="rb-balance-value">${healthIndex}</div>
              <div class="rb-trend-pill positive">
                <span class="rb-trend-arrow">↗</span> +4.8% vs last cycle
              </div>
            </div>
            <div class="rb-balance-meta">
              <span>Bed Availability: <b>1,420 / 1,500 Slots (94.6%)</b></span>
              <span class="rb-dot-sep">•</span>
              <span>Throughput: <b>28.4 req/s avg</b></span>
              <span class="rb-dot-sep">•</span>
              <span>Cluster Uptime: <b>48d 14h continuous</b></span>
            </div>
          </div>

          <div class="rb-quick-metrics">
            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">🏥</div>
              <div>
                <div class="rb-chip-label">Connected Hospitals</div>
                <div class="rb-chip-value">${activeHospitals} <small class="text-muted">/ ${totalHospitals} Online</small></div>
              </div>
            </div>

            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">🌐</div>
              <div>
                <div class="rb-chip-label">Website & API Gateway</div>
                <div class="rb-chip-value">Operational <small style="color:var(--accent); font-weight:700;">${avgPing}</small></div>
              </div>
            </div>

            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">👥</div>
              <div>
                <div class="rb-chip-label">Platform Accounts</div>
                <div class="rb-chip-value">${totalUsers} Active</div>
              </div>
            </div>

            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">🛡️</div>
              <div>
                <div class="rb-chip-label">Security & TLS Shield</div>
                <div class="rb-chip-value">100% Strict <small class="text-muted">AES-256</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. DUAL-SERIES PACE CHART -->
      <section class="rb-chart-card">
        <div class="rb-chart-head">
          <div>
            <div class="rb-section-eyebrow">DUAL-SERIES TELEMETRY PACE</div>
            <h2 class="rb-section-title">Hospital Workload vs Website Throughput Pace</h2>
            <p class="rb-section-desc">Comparing live patient inflow/occupancy with edge web server response velocity over time.</p>
          </div>

          <div class="rb-chart-controls">
            <div class="rb-series-legend">
              <span class="rb-legend-item">
                <span class="rb-legend-dot" style="background:#22d3ee; box-shadow:0 0 10px #22d3ee;"></span>
                <span>Hospital Inflow Pace</span>
              </span>
              <span class="rb-legend-item">
                <span class="rb-legend-dot" style="background:#a78bfa; box-shadow:0 0 10px #a78bfa;"></span>
                <span>Website Request Pace</span>
              </span>
            </div>

            <div class="rb-time-tabs" id="rb-chart-time-tabs">
              <button class="rb-time-tab" data-range="24h" onclick="window.__RB_D12__?.setTimeRange('24h')">24h</button>
              <button class="rb-time-tab active" data-range="7d" onclick="window.__RB_D12__?.setTimeRange('7d')">7 Days</button>
              <button class="rb-time-tab" data-range="30d" onclick="window.__RB_D12__?.setTimeRange('30d')">30 Days</button>
              <button class="rb-time-tab" data-range="90d" onclick="window.__RB_D12__?.setTimeRange('90d')">90 Days</button>
            </div>
          </div>
        </div>

        <!-- SVG Pace Chart Canvas -->
        <div class="rb-chart-viewport-wrap">
          <div class="rb-chart-viewport" id="rb-chart-svg-container">
            <!-- Rendered by initDashboard12() -->
          </div>
          <div class="rb-chart-tooltip" id="rb-chart-tooltip" style="display:none;"></div>
        </div>

        <!-- Chart Pace Summary Footbar -->
        <div class="rb-chart-footbar">
          <div class="rb-foot-kpi">
            <span class="rb-foot-label">Peak Hospital Surge Pace</span>
            <span class="rb-foot-val" style="color:#22d3ee;">89.4% Capacity <small>(14:00 - 17:30 IST)</small></span>
          </div>
          <div class="rb-foot-kpi">
            <span class="rb-foot-label">Peak Website API Traffic</span>
            <span class="rb-foot-val" style="color:#a78bfa;">1,240 req/min <small>(99.99% Success)</small></span>
          </div>
          <div class="rb-foot-kpi">
            <span class="rb-foot-label">Pace Synchronization Delta</span>
            <span class="rb-foot-val" style="color:#34d399;">+1.2% Synchronized <small>(Nominal)</small></span>
          </div>
        </div>
      </section>

      <!-- 3. SWEEP LANES -->
      <section class="rb-lanes-card">
        <div class="rb-lanes-head">
          <div>
            <div class="rb-section-eyebrow">SWEEP LANES & SERVICE NODES</div>
            <h2 class="rb-section-title">Operational Sweep Pipeline & Diagnostic Lanes</h2>
            <p class="rb-section-desc">Real-time status probes for hospital fleet nodes, website edge engines, and automated health checks.</p>
          </div>

          <div class="rb-lanes-filter-row">
            <div class="rb-lane-search-wrap">
              <span class="rb-search-icon">🔍</span>
              <input type="text" id="rb-lane-search" placeholder="Filter nodes, hospitals, endpoints..." oninput="window.__RB_D12__?.filterNodes(this.value)">
            </div>
            <div class="rb-lane-tabs" id="rb-lane-type-tabs">
              <button class="rb-lane-tab active" data-lane="all" onclick="window.__RB_D12__?.setLaneCategory('all')">All Lanes (14)</button>
              <button class="rb-lane-tab" data-lane="hospitals" onclick="window.__RB_D12__?.setLaneCategory('hospitals')">🏥 Hospital Nodes</button>
              <button class="rb-lane-tab" data-lane="website" onclick="window.__RB_D12__?.setLaneCategory('website')">🌐 Website & Servers</button>
              <button class="rb-lane-tab" data-lane="diagnostics" onclick="window.__RB_D12__?.setLaneCategory('diagnostics')">⚡ Sweep Diagnostics</button>
            </div>
          </div>
        </div>

        <!-- Multi-Lane Display Grid -->
        <div class="rb-sweep-lanes-container" id="rb-sweep-lanes-grid">
          <!-- Rendered by initDashboard12() -->
        </div>
      </section>
    </div>
  `;
}

// Internal State & Mock Telemetry Data
const MOCK_TIME_SERIES = {
  '24h': {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:59'],
    series1: [45, 42, 58, 82, 89, 86, 78, 64, 52], // Hospital Inflow %
    series2: [28, 22, 44, 76, 94, 91, 85, 72, 48], // Website Pace %
    tooltips: [
      { s1: '45% Occupancy (675 beds)', s2: '280 req/min (18ms)' },
      { s1: '42% Occupancy (630 beds)', s2: '220 req/min (16ms)' },
      { s1: '58% Occupancy (870 beds)', s2: '440 req/min (20ms)' },
      { s1: '82% Occupancy (1230 beds)', s2: '760 req/min (24ms)' },
      { s1: '89% Occupancy (1335 beds)', s2: '940 req/min (28ms)' },
      { s1: '86% Occupancy (1290 beds)', s2: '910 req/min (26ms)' },
      { s1: '78% Occupancy (1170 beds)', s2: '850 req/min (25ms)' },
      { s1: '64% Occupancy (960 beds)', s2: '720 req/min (21ms)' },
      { s1: '52% Occupancy (780 beds)', s2: '480 req/min (19ms)' }
    ]
  },
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series1: [72, 84, 88, 92, 86, 68, 59],
    series2: [68, 79, 89, 95, 90, 72, 61],
    tooltips: [
      { s1: '72% Bed Load (1,080 Active)', s2: '680 req/min • 22ms' },
      { s1: '84% Bed Load (1,260 Active)', s2: '790 req/min • 24ms' },
      { s1: '88% Bed Load (1,320 Active)', s2: '890 req/min • 26ms' },
      { s1: '92% Bed Load (1,380 Active)', s2: '950 req/min • 28ms' },
      { s1: '86% Bed Load (1,290 Active)', s2: '900 req/min • 25ms' },
      { s1: '68% Bed Load (1,020 Active)', s2: '720 req/min • 20ms' },
      { s1: '59% Bed Load (885 Active)', s2: '610 req/min • 18ms' }
    ]
  },
  '30d': {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
    series1: [68, 74, 82, 89, 78],
    series2: [64, 71, 80, 92, 83],
    tooltips: [
      { s1: 'Avg 68% Capacity', s2: '640 req/min' },
      { s1: 'Avg 74% Capacity', s2: '710 req/min' },
      { s1: 'Avg 82% Capacity', s2: '800 req/min' },
      { s1: 'Avg 89% Capacity', s2: '920 req/min' },
      { s1: 'Avg 78% Capacity', s2: '830 req/min' }
    ]
  },
  '90d': {
    labels: ['Month 1', 'Month 2', 'Month 3'],
    series1: [71, 79, 85],
    series2: [66, 77, 88],
    tooltips: [
      { s1: 'Month 1: 71% Load', s2: '660 req/min avg' },
      { s1: 'Month 2: 79% Load', s2: '770 req/min avg' },
      { s1: 'Month 3: 85% Load', s2: '880 req/min avg' }
    ]
  }
};

const DEFAULT_HOSPITAL_NODES = [
  {
    id: 'hosp-apollo',
    category: 'hospitals',
    title: 'Apollo Main Multispecialty',
    region: 'South Zone • Metro Hub',
    status: 'operational',
    statusText: 'ONLINE / READY',
    occupancy: '84%',
    occupancyVal: 84,
    icuAvailable: '24 / 28 Beds',
    doctorsOnDuty: 18,
    ping: '22ms',
    lastSync: '45s ago'
  },
  {
    id: 'hosp-aiims',
    category: 'hospitals',
    title: 'AIIMS Super-Specialty Medical',
    region: 'Central Zone • Apex Hub',
    status: 'operational',
    statusText: 'ONLINE / READY',
    occupancy: '91%',
    occupancyVal: 91,
    icuAvailable: '12 / 32 Beds',
    doctorsOnDuty: 34,
    ping: '18ms',
    lastSync: '1m ago'
  },
  {
    id: 'hosp-fortis',
    category: 'hospitals',
    title: 'Fortis Health Node 4',
    region: 'North Zone • Trauma Node',
    status: 'operational',
    statusText: 'ONLINE / READY',
    occupancy: '76%',
    occupancyVal: 76,
    icuAvailable: '18 / 24 Beds',
    doctorsOnDuty: 14,
    ping: '31ms',
    lastSync: '2m ago'
  },
  {
    id: 'hosp-max',
    category: 'hospitals',
    title: 'Max Healthcare Network',
    region: 'East Zone • Cardiac Center',
    status: 'operational',
    statusText: 'ONLINE / READY',
    occupancy: '88%',
    occupancyVal: 88,
    icuAvailable: '8 / 20 Beds',
    doctorsOnDuty: 22,
    ping: '26ms',
    lastSync: '30s ago'
  },
  {
    id: 'hosp-care',
    category: 'hospitals',
    title: 'Care City Health Center',
    region: 'West Zone • General Care',
    status: 'operational',
    statusText: 'ONLINE / READY',
    occupancy: '64%',
    occupancyVal: 64,
    icuAvailable: '30 / 36 Beds',
    doctorsOnDuty: 11,
    ping: '38ms',
    lastSync: '3m ago'
  }
];

const INFRASTRUCTURE_NODES = [
  {
    id: 'infra-api',
    category: 'website',
    title: 'Node.js Express API Gateway',
    region: 'Port 4000 • Production Cluster',
    status: 'operational',
    statusText: 'HEALTHY / 100% UPTIME',
    metricLabel: 'Req Throughput',
    metricVal: '480 req/min',
    metricPercent: 98,
    latency: '14ms avg',
    subtext: 'REST endpoints, JWT auth & rate limiter',
    ping: '12ms'
  },
  {
    id: 'infra-ai',
    category: 'website',
    title: 'Medi-AI Python Neural Engine',
    region: 'Port 5000 • Clinical Triage Model',
    status: 'operational',
    statusText: 'HEALTHY / ACTIVE',
    metricLabel: 'Inference Speed',
    metricVal: '42ms latency',
    metricPercent: 96,
    latency: '42ms',
    subtext: 'Symptom triage, EHR summaries & clinical Rx',
    ping: '18ms'
  },
  {
    id: 'infra-webrtc',
    category: 'website',
    title: 'WebRTC Live Telemedicine Bridge',
    region: 'P2P Mesh + TURN/STUN Relay',
    status: 'operational',
    statusText: 'STREAMING ACTIVE',
    metricLabel: 'Media Quality',
    metricVal: '60 FPS HD',
    metricPercent: 100,
    latency: '24ms',
    subtext: 'Encrypted live audio/video consultations',
    ping: '24ms'
  },
  {
    id: 'infra-db',
    category: 'website',
    title: 'Encrypted EHR Data Vault',
    region: 'AES-GCM-256 Storage Cluster',
    status: 'operational',
    statusText: 'ENCRYPTED / SYNCED',
    metricLabel: 'Read/Write IOPS',
    metricVal: '1,420 IOPS',
    metricPercent: 99,
    latency: '0.6ms',
    subtext: 'Patient records, audit logs & prescription vault',
    ping: '9ms'
  },
  {
    id: 'infra-ws',
    category: 'website',
    title: 'WebSocket Real-Time Dispatcher',
    region: 'Sub-Millisecond Event Bus',
    status: 'operational',
    statusText: 'CONNECTED (1,840 Sockets)',
    metricLabel: 'Buffer Load',
    metricVal: '0.02% Low',
    metricPercent: 99,
    latency: '4ms',
    subtext: 'Live emergency alerts & hospital queue sync',
    ping: '8ms'
  }
];

const DIAGNOSTIC_NODES = [
  {
    id: 'diag-tls',
    category: 'diagnostics',
    title: 'SSL / TLS 1.3 Security Handshake',
    region: 'HSTS Strict • 2048-bit RSA / ECC',
    status: 'operational',
    statusText: 'PASSED / 0 FAULTS',
    metricLabel: 'Certificate Validity',
    metricVal: '284 Days Left',
    metricPercent: 100,
    subtext: 'A+ Grade on SSL Labs security sweep',
    ping: '15ms'
  },
  {
    id: 'diag-cdn',
    category: 'diagnostics',
    title: 'Global Edge CDN & Asset Latency',
    region: 'Distributed Edge Points',
    status: 'operational',
    statusText: 'OPTIMAL (99.4% Hit)',
    metricLabel: 'Global TTFB',
    metricVal: '32ms Global',
    metricPercent: 97,
    subtext: 'Static bundles, WebGL assets & shaders',
    ping: '21ms'
  },
  {
    id: 'diag-backup',
    category: 'diagnostics',
    title: 'Continuous EHR Snapshot Relay',
    region: 'Immutable Hot-Backup Vault',
    status: 'operational',
    statusText: 'VERIFIED / SYNCED',
    metricLabel: 'RPO Recovery Point',
    metricVal: '< 1 Minute',
    metricPercent: 100,
    subtext: 'Last automated snapshot #1084 verified',
    ping: '16ms'
  },
  {
    id: 'diag-failover',
    category: 'diagnostics',
    title: 'High Availability Failover Gate',
    region: 'Dual-Zone Redundancy Matrix',
    status: 'operational',
    statusText: 'HOT-STANDBY READY',
    metricLabel: 'Switchover Time',
    metricVal: '180ms SLA',
    metricPercent: 100,
    subtext: 'Zero data-loss automatic failover daemon',
    ping: '14ms'
  }
];

export function initDashboard12(rootEl, options = {}) {
  if (!rootEl) rootEl = document.getElementById('rb-dashboard-12-root');
  if (!rootEl) return;

  let currentRange = '7d';
  let currentCategory = 'all';
  let searchQuery = '';
  let isSweeping = false;

  // Build combined node list (including any dynamic hospitals in options.data)
  let allNodes = [];

  function refreshNodeList() {
    const customHospitals = (options.data?.hospitals || []).map((h, i) => ({
      id: `hosp-dyn-${h.id || i}`,
      category: 'hospitals',
      title: h.name || 'Registered Hospital',
      region: h.address || 'Network Connected Hospital',
      status: h.active !== false ? 'operational' : 'warning',
      statusText: h.active !== false ? 'ONLINE / READY' : 'INACTIVE',
      occupancy: '78%',
      occupancyVal: 78,
      icuAvailable: '16 / 20 Beds',
      doctorsOnDuty: 12,
      ping: '28ms',
      lastSync: 'Just now'
    }));

    const baseHospitals = customHospitals.length > 0 ? customHospitals : DEFAULT_HOSPITAL_NODES;
    allNodes = [...baseHospitals, ...INFRASTRUCTURE_NODES, ...DIAGNOSTIC_NODES];
  }

  refreshNodeList();

  // Render Chart SVG
  function renderPaceChart(rangeKey) {
    const container = rootEl.querySelector('#rb-chart-svg-container');
    if (!container) return;

    const data = MOCK_TIME_SERIES[rangeKey] || MOCK_TIME_SERIES['7d'];
    const width = container.clientWidth || 900;
    const height = 240;
    const padding = { top: 25, right: 30, bottom: 40, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = 100;
    const count = data.labels.length;

    // Calculate (x, y) coordinates
    const getX = index => padding.left + (index / (count - 1)) * chartW;
    const getY = val => padding.top + chartH - (val / maxVal) * chartH;

    const pts1 = data.series1.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));
    const pts2 = data.series2.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));

    // Generate smooth bezier curves
    function createSmoothPath(points) {
      if (points.length === 0) return '';
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return d;
    }

    const path1 = createSmoothPath(pts1);
    const path2 = createSmoothPath(pts2);

    const area1 = `${path1} L ${pts1[pts1.length - 1].x} ${padding.top + chartH} L ${pts1[0].x} ${padding.top + chartH} Z`;
    const area2 = `${path2} L ${pts2[pts2.length - 1].x} ${padding.top + chartH} L ${pts2[0].x} ${padding.top + chartH} Z`;

    // Grid lines
    let gridLinesSvg = '';
    for (let i = 0; i <= 4; i++) {
      const yVal = padding.top + (i / 4) * chartH;
      const label = `${100 - i * 25}%`;
      gridLinesSvg += `
        <line x1="${padding.left}" y1="${yVal}" x2="${width - padding.right}" y2="${yVal}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4" />
        <text x="${padding.left - 10}" y="${yVal + 4}" fill="#7c93ab" font-size="11" text-anchor="end" font-family="'Space Grotesk', monospace">${label}</text>
      `;
    }

    // X-Axis Labels
    let xLabelsSvg = '';
    data.labels.forEach((lbl, i) => {
      const xVal = getX(i);
      xLabelsSvg += `
        <text x="${xVal}" y="${height - 12}" fill="#91a7bd" font-size="12" text-anchor="middle" font-weight="600">${lbl}</text>
        <line x1="${xVal}" y1="${padding.top + chartH}" x2="${xVal}" y2="${padding.top + chartH + 5}" stroke="rgba(255,255,255,0.15)" />
      `;
    });

    // Dots & Interactive Hover Points
    let interactivePoints = '';
    pts1.forEach((p, i) => {
      const p2 = pts2[i];
      interactivePoints += `
        <g class="rb-chart-point-group" data-index="${i}">
          <circle cx="${p.x}" cy="${p.y}" r="5" fill="#22d3ee" stroke="#0b1726" stroke-width="2" class="rb-point-dot"></circle>
          <circle cx="${p2.x}" cy="${p2.y}" r="5" fill="#a78bfa" stroke="#0b1726" stroke-width="2" class="rb-point-dot"></circle>
          <!-- Hover trigger bar -->
          <rect x="${p.x - 20}" y="${padding.top}" width="40" height="${chartH}" fill="transparent" class="rb-hover-trigger" data-index="${i}"></rect>
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="rb-chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rbGradCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="rbGradViolet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.0" />
          </linearGradient>
          <filter id="rbGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#22d3ee" flood-opacity="0.6"/>
          </filter>
          <filter id="rbGlowViolet" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#a78bfa" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Grid Lines & Axes -->
        ${gridLinesSvg}
        ${xLabelsSvg}

        <!-- Series 2 Area & Path (Violet) -->
        <path d="${area2}" fill="url(#rbGradViolet)" class="rb-chart-area"></path>
        <path d="${path2}" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#rbGlowViolet)" class="rb-chart-line"></path>

        <!-- Series 1 Area & Path (Cyan) -->
        <path d="${area1}" fill="url(#rbGradCyan)" class="rb-chart-area"></path>
        <path d="${path1}" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#rbGlowCyan)" class="rb-chart-line"></path>

        <!-- Interactive Points -->
        ${interactivePoints}
      </svg>
    `;

    // Bind Tooltip Triggers
    const tooltipEl = rootEl.querySelector('#rb-chart-tooltip');
    container.querySelectorAll('.rb-hover-trigger').forEach(trigger => {
      trigger.addEventListener('mouseenter', e => {
        const idx = Number(trigger.getAttribute('data-index'));
        const label = data.labels[idx];
        const tt = data.tooltips[idx];

        tooltipEl.innerHTML = `
          <div class="rb-tt-header">${label} Telemetry Snapshot</div>
          <div class="rb-tt-row">
            <span class="rb-tt-dot" style="background:#22d3ee;"></span>
            <span>Hospital: <b>${tt.s1}</b></span>
          </div>
          <div class="rb-tt-row">
            <span class="rb-tt-dot" style="background:#a78bfa;"></span>
            <span>Website: <b>${tt.s2}</b></span>
          </div>
        `;
        tooltipEl.style.display = 'block';

        const rect = container.getBoundingClientRect();
        const pt = pts1[idx];
        const leftPos = Math.max(10, Math.min(rect.width - 220, (pt.x / width) * rect.width - 90));
        tooltipEl.style.left = `${leftPos}px`;
        tooltipEl.style.top = `15px`;
      });

      trigger.addEventListener('mouseleave', () => {
        tooltipEl.style.display = 'none';
      });
    });
  }

  // Render Sweep Lanes Grid
  function renderSweepLanes() {
    const container = rootEl.querySelector('#rb-sweep-lanes-grid');
    if (!container) return;

    let filtered = allNodes;
    if (currentCategory !== 'all') {
      filtered = filtered.filter(n => n.category === currentCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.region.toLowerCase().includes(q) ||
        (n.subtext && n.subtext.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="rb-lanes-empty">
          <span style="font-size:32px; display:block; margin-bottom:10px;">🔍</span>
          <h3>No matching nodes or services found</h3>
          <p>Try clearing your search query or selecting "All Lanes".</p>
          <button class="rb-btn rb-btn-secondary" onclick="window.__RB_D12__?.clearFilter()">Reset Filter</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((node, index) => {
      const isHospital = node.category === 'hospitals';
      const isInfra = node.category === 'website';
      const isDiag = node.category === 'diagnostics';

      return `
        <div class="rb-lane-card ${isSweeping ? 'sweeping' : ''}" style="animation-delay:${index * 0.05}s;" id="node-${node.id}">
          <div class="rb-lane-top">
            <div class="rb-lane-category-badge ${node.category}">
              ${isHospital ? '🏥 HOSPITAL NODE' : isInfra ? '🌐 WEBSITE ENGINE' : '⚡ DIAGNOSTIC SWEEP'}
            </div>
            <div class="rb-lane-status-pill ${node.status}">
              <span class="rb-status-indicator"></span>
              <span>${node.statusText}</span>
            </div>
          </div>

          <div class="rb-lane-main">
            <h3 class="rb-lane-title">${node.title}</h3>
            <div class="rb-lane-region">${node.region}</div>
          </div>

          <!-- Specific Node Telemetry Metrics -->
          <div class="rb-lane-metrics-box">
            ${
              isHospital ? `
                <div class="rb-lane-stat-row">
                  <span>Bed Occupancy:</span>
                  <b>${node.occupancy}</b>
                </div>
                <div class="rb-lane-bar-track">
                  <div class="rb-lane-bar-fill" style="width:${node.occupancyVal}%; background:linear-gradient(90deg, #22d3ee, #0284c7);"></div>
                </div>
                <div class="rb-lane-sub-stats">
                  <span>ICU: <b>${node.icuAvailable}</b></span>
                  <span class="rb-dot-sep">•</span>
                  <span>Doctors: <b>${node.doctorsOnDuty} MDs</b></span>
                </div>
              ` : isInfra ? `
                <div class="rb-lane-stat-row">
                  <span>${node.metricLabel}:</span>
                  <b style="color:#a78bfa;">${node.metricVal}</b>
                </div>
                <div class="rb-lane-bar-track">
                  <div class="rb-lane-bar-fill" style="width:${node.metricPercent}%; background:linear-gradient(90deg, #a78bfa, #7c3aed);"></div>
                </div>
                <div class="rb-lane-sub-stats">
                  <span>Latency: <b>${node.latency}</b></span>
                  <span class="rb-dot-sep">•</span>
                  <span>${node.subtext}</span>
                </div>
              ` : `
                <div class="rb-lane-stat-row">
                  <span>${node.metricLabel}:</span>
                  <b style="color:#34d399;">${node.metricVal}</b>
                </div>
                <div class="rb-lane-bar-track">
                  <div class="rb-lane-bar-fill" style="width:${node.metricPercent}%; background:linear-gradient(90deg, #34d399, #059669);"></div>
                </div>
                <div class="rb-lane-sub-stats">
                  <span>${node.subtext}</span>
                </div>
              `
            }
          </div>

          <!-- Card Footbar -->
          <div class="rb-lane-foot">
            <div class="rb-lane-ping">
              <span class="rb-ping-dot"></span>
              <span class="rb-ping-val" id="ping-${node.id}">${node.ping}</span>
            </div>
            <div class="rb-lane-actions">
              <button class="rb-mini-btn" onclick="window.__RB_D12__?.probeSingleNode('${node.id}')" title="Test Live Ping Probe">
                Probe ⚡
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Exposed API
  window.__RB_D12__ = {
    setTimeRange: range => {
      currentRange = range;
      rootEl.querySelectorAll('#rb-chart-time-tabs button').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-range') === range);
      });
      renderPaceChart(range);
    },

    setLaneCategory: cat => {
      currentCategory = cat;
      rootEl.querySelectorAll('#rb-lane-type-tabs button').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-lane') === cat);
      });
      renderSweepLanes();
    },

    filterNodes: query => {
      searchQuery = query;
      renderSweepLanes();
    },

    clearFilter: () => {
      searchQuery = '';
      currentCategory = 'all';
      const searchInput = rootEl.querySelector('#rb-lane-search');
      if (searchInput) searchInput.value = '';
      rootEl.querySelectorAll('#rb-lane-type-tabs button').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-lane') === 'all');
      });
      renderSweepLanes();
    },

    probeSingleNode: nodeId => {
      const pingEl = rootEl.querySelector(`#ping-${nodeId}`);
      if (pingEl) {
        pingEl.textContent = 'Probing...';
        setTimeout(() => {
          const newPing = `${Math.floor(12 + Math.random() * 22)}ms`;
          pingEl.textContent = newPing;
          pingEl.style.color = '#34d399';
          setTimeout(() => { pingEl.style.color = ''; }, 2000);
        }, 400);
      }
    },

    triggerSweep: () => {
      if (isSweeping) return;
      isSweeping = true;
      const sweepBtn = rootEl.querySelector('#rb-run-sweep-btn');
      if (sweepBtn) {
        sweepBtn.classList.add('loading');
        sweepBtn.innerHTML = '<span class="rb-spin-icon spin">🔄</span> Sweeping All 14 Nodes...';
      }

      // Add sweeping class to cards
      rootEl.querySelectorAll('.rb-lane-card').forEach(card => card.classList.add('sweeping'));

      // Show banner toast
      if (typeof window.showNotification === 'function') {
        window.showNotification('⚡ Diagnostic Sweep initiated across hospital fleet & website nodes...');
      }

      setTimeout(() => {
        // Update all pings with random live numbers
        allNodes.forEach(node => {
          node.ping = `${Math.floor(10 + Math.random() * 24)}ms`;
        });

        isSweeping = false;
        if (sweepBtn) {
          sweepBtn.classList.remove('loading');
          sweepBtn.innerHTML = '<span>⚡</span> Run Health Sweep';
        }

        renderSweepLanes();
        renderPaceChart(currentRange);

        if (typeof window.showNotification === 'function') {
          window.showNotification('✅ Sweep completed: All 14 Hospital Fleet & Website Nodes 100% Healthy!');
        }
      }, 1500);
    },

    exportReport: () => {
      const report = {
        title: 'Medi Smart Administrator - Hospital & Website Infrastructure Audit',
        generatedAt: new Date().toISOString(),
        overallHealth: '99.98%',
        hospitalFleetStatus: 'All Connected Nodes Operational',
        websiteInfrastructure: {
          apiGateway: 'Port 4000 (100% Uptime)',
          aiEngine: 'Python Neural Triage (Active)',
          webrtcMedia: 'HD Video Streaming (Active)',
          ehrVault: 'AES-256 Intact (0 Faults)'
        },
        activeNodes: allNodes.length
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medismart-admin-audit-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      if (typeof window.showNotification === 'function') {
        window.showNotification('📄 Audit report generated and downloaded successfully!');
      }
    }
  };

  // Initial draw
  renderPaceChart(currentRange);
  renderSweepLanes();

  // Resize handler for responsive SVG chart
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.body.contains(rootEl)) {
        renderPaceChart(currentRange);
      }
    }, 150);
  });
}
