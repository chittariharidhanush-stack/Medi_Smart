/**
 * Hospital Dashboard Block (React Bits Pro Dashboard 12 Adapted)
 * Visualizing Hospital Bed Availability, Live Patient Entries Timeline & Dual-Series Pace Chart.
 */

export function renderHospitalDashboard(data = {}) {
  const doctors = data.doctors || [];
  const appointments = data.appointments || [];
  const capacity = data.capacity || {
    totalBeds: 200,
    occupiedBeds: 58,
    availableBeds: 142,
    icuTotal: 24,
    icuAvailable: 6,
    emergencyBeds: 20,
    emergencyAvailable: 12,
    occupancyRate: 29.0
  };

  const totalBeds = capacity.totalBeds || 200;
  const availableBeds = capacity.availableBeds !== undefined ? capacity.availableBeds : 142;
  const occupiedBeds = capacity.occupiedBeds !== undefined ? capacity.occupiedBeds : (totalBeds - availableBeds);
  const occupancyPercent = capacity.occupancyRate || Number(((occupiedBeds / totalBeds) * 100).toFixed(1));
  const activeDoctors = doctors.filter(d => d.status === 'approved').length || (doctors.length > 0 ? doctors.length : 16);

  return `
    <div class="rb-dashboard-12 rb-hospital-dash" id="rb-hospital-dashboard-root">
      <!-- 1. HEADLINE BED CAPACITY & OPERATIONS COMMAND DESK -->
      <section class="rb-desk-card">
        <div class="rb-desk-header">
          <div class="rb-desk-identity">
            <div class="rb-desk-badge">
              <span class="rb-pulse-beacon"></span>
              <span>HOSPITAL BED CAPACITY & PATIENT INFLOW COMMAND</span>
            </div>
            <h1 class="rb-desk-title">Hospital Bed Availability & Patient Admissions</h1>
            <p class="rb-desk-subtitle">
              Live operational telemetry: Real-time bed occupancy, ICU capacity, dynamic patient admission tracking, and department turnover.
            </p>
          </div>
          <div class="rb-desk-actions">
            <button class="rb-btn rb-btn-secondary" id="rb-hosp-bed-btn" onclick="window.__HOSP_D12__?.openBedModal()">
              <span>🛏️</span> Update Bed Capacity
            </button>
            <button class="rb-btn rb-btn-primary" id="rb-hosp-admit-btn" onclick="window.__HOSP_D12__?.openAdmitModal()">
              <span>➕</span> Log Patient Entry
            </button>
          </div>
        </div>

        <!-- Headline Capacity Balance Display -->
        <div class="rb-headline-grid">
          <div class="rb-balance-block">
            <div class="rb-balance-label">TOTAL BED AVAILABILITY & NETWORK OCCUPANCY</div>
            <div class="rb-balance-row">
              <div class="rb-balance-value" id="rb-hosp-avail-beds-val">${availableBeds} <small style="font-size:22px; font-weight:600; color:#94a3b8;">/ ${totalBeds} Beds Free</small></div>
              <div class="rb-trend-pill positive">
                <span class="rb-trend-arrow">↗</span> ${occupancyPercent}% Occupancy
              </div>
            </div>
            <div class="rb-balance-meta">
              <span>Occupied Beds: <b id="rb-hosp-occ-beds-val">${occupiedBeds} Beds</b></span>
              <span class="rb-dot-sep">•</span>
              <span>Available ICU/Ventilators: <b id="rb-hosp-icu-beds-val">${capacity.icuAvailable || 6} / ${capacity.icuTotal || 24} Free</b></span>
              <span class="rb-dot-sep">•</span>
              <span>Turnover Velocity: <b>8.4 pts/hr avg</b></span>
            </div>
          </div>

          <div class="rb-quick-metrics">
            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">🛏️</div>
              <div>
                <div class="rb-chip-label">General Ward Beds</div>
                <div class="rb-chip-value" id="rb-hosp-gen-val">${Math.max(0, availableBeds - (capacity.icuAvailable || 6) - (capacity.emergencyAvailable || 12))} <small class="text-muted">Beds Ready</small></div>
              </div>
            </div>

            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">🩺</div>
              <div>
                <div class="rb-chip-label">ICU & Critical Care</div>
                <div class="rb-chip-value" id="rb-hosp-icu-val">${capacity.icuAvailable || 6} Free <small style="color:#22d3ee; font-weight:700;">/ ${capacity.icuTotal || 24} Total</small></div>
              </div>
            </div>

            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">👥</div>
              <div>
                <div class="rb-chip-label">Today's Patient Entries</div>
                <div class="rb-chip-value" id="rb-hosp-entries-count-chip">38 Admissions</div>
              </div>
            </div>

            <div class="rb-metric-chip">
              <div class="rb-metric-chip-icon">👨‍⚕️</div>
              <div>
                <div class="rb-chip-label">On-Duty Medical Staff</div>
                <div class="rb-chip-value">${activeDoctors} Active MDs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. DUAL-SERIES PATIENT ENTRY & BED TURNOVER PACE CHART -->
      <section class="rb-chart-card">
        <div class="rb-chart-head">
          <div>
            <div class="rb-section-eyebrow">LIVE PATIENT INFLOW PACE</div>
            <h2 class="rb-section-title">Patient Admissions vs Bed Turnover Pace</h2>
            <p class="rb-section-desc">Visualized patient entry velocity updated in real-time alongside discharge rates and triage surges.</p>
          </div>

          <div class="rb-chart-controls">
            <div class="rb-series-legend">
              <span class="rb-legend-item">
                <span class="rb-legend-dot" style="background:#22d3ee; box-shadow:0 0 10px #22d3ee;"></span>
                <span>Patient Admissions / Entry Pace</span>
              </span>
              <span class="rb-legend-item">
                <span class="rb-legend-dot" style="background:#a78bfa; box-shadow:0 0 10px #a78bfa;"></span>
                <span>Patient Discharges / Turnover</span>
              </span>
            </div>

            <div class="rb-time-tabs" id="rb-hosp-chart-time-tabs">
              <button class="rb-time-tab active" data-range="24h" onclick="window.__HOSP_D12__?.setTimeRange('24h')">24h (Hourly)</button>
              <button class="rb-time-tab" data-range="7d" onclick="window.__HOSP_D12__?.setTimeRange('7d')">7 Days</button>
              <button class="rb-time-tab" data-range="30d" onclick="window.__HOSP_D12__?.setTimeRange('30d')">30 Days</button>
              <button class="rb-time-tab" data-range="90d" onclick="window.__HOSP_D12__?.setTimeRange('90d')">Quarter</button>
            </div>
          </div>
        </div>

        <!-- SVG Pace Chart Canvas -->
        <div class="rb-chart-viewport-wrap">
          <div class="rb-chart-viewport" id="rb-hosp-chart-svg-container">
            <!-- Rendered by initHospitalDashboard() -->
          </div>
          <div class="rb-chart-tooltip" id="rb-hosp-chart-tooltip" style="display:none;"></div>
        </div>

        <!-- Chart Pace Summary Footbar -->
        <div class="rb-chart-footbar">
          <div class="rb-foot-kpi">
            <span class="rb-foot-label">Peak Admission Inflow Time</span>
            <span class="rb-foot-val" style="color:#22d3ee;">14:00 - 18:30 IST <small>(+16.2 admissions/hr)</small></span>
          </div>
          <div class="rb-foot-kpi">
            <span class="rb-foot-label">Daily Average Bed Turnover</span>
            <span class="rb-foot-val" style="color:#a78bfa;">28 Discharges / Day <small>(98.2% Bed Recovery)</small></span>
          </div>
          <div class="rb-foot-kpi">
            <span class="rb-foot-label">Current Emergency Bed Buffer</span>
            <span class="rb-foot-val" style="color:#34d399;" id="rb-hosp-foot-buffer">12 Available <small>(Emergency Ward Ready)</small></span>
          </div>
        </div>
      </section>

      <!-- 3. OPERATIONAL WARD SWEEP LANES -->
      <section class="rb-lanes-card">
        <div class="rb-lanes-head">
          <div>
            <div class="rb-section-eyebrow">DEPARTMENT & WARD SWEEP LANES</div>
            <h2 class="rb-section-title">Hospital Department Wards & Bed Availability Lanes</h2>
            <p class="rb-section-desc">Real-time bed allocation, ventilator readiness, and doctor rosters across specialized medical wards.</p>
          </div>

          <div class="rb-lanes-filter-row">
            <div class="rb-lane-search-wrap">
              <span class="rb-search-icon">🔍</span>
              <input type="text" id="rb-ward-search" placeholder="Filter ward, department, ICU..." oninput="window.__HOSP_D12__?.filterWards(this.value)">
            </div>
            <div class="rb-lane-tabs" id="rb-ward-type-tabs">
              <button class="rb-lane-tab active" data-ward="all" onclick="window.__HOSP_D12__?.setWardCategory('all')">All Wards (6)</button>
              <button class="rb-lane-tab" data-ward="critical" onclick="window.__HOSP_D12__?.setWardCategory('critical')">🚨 ICU & Critical</button>
              <button class="rb-lane-tab" data-ward="specialty" onclick="window.__HOSP_D12__?.setWardCategory('specialty')">❤️ Specialized Wards</button>
              <button class="rb-lane-tab" data-ward="general" onclick="window.__HOSP_D12__?.setWardCategory('general')">🩺 General Ward</button>
            </div>
          </div>
        </div>

        <!-- Multi-Lane Display Grid -->
        <div class="rb-sweep-lanes-container" id="rb-ward-lanes-grid">
          <!-- Rendered by initHospitalDashboard() -->
        </div>
      </section>

      <!-- 4. RECENT PATIENT ENTRIES & ADMISSIONS TIMELINE -->
      <section class="panel" style="margin-top:0;">
        <div class="panel-head">
          <div>
            <h2 style="margin:0 0 4px 0;">👥 Live Patient Entry & Admissions Log</h2>
            <p style="color:var(--muted); margin:0;">Real-time timeline of patients admitted, triaged, and assigned to hospital beds.</p>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="mini" onclick="window.__HOSP_D12__?.exportPatientLog()">📥 Export Log</button>
            <button class="mini primary" onclick="window.__HOSP_D12__?.openAdmitModal()">➕ Log Patient</button>
          </div>
        </div>

        <div class="table-wrap" style="margin-top:16px;">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Age / Gender</th>
                <th>Triage Priority</th>
                <th>Assigned Ward</th>
                <th>Bed No.</th>
                <th>Chief Complaint</th>
                <th>Admitted At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="rb-patient-entries-tbody">
              <!-- Rendered by initHospitalDashboard() -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- MODAL: LOG PATIENT ENTRY -->
      <div class="rb-modal-overlay" id="rb-admit-modal" style="display:none;">
        <div class="rb-modal-card">
          <div class="rb-modal-header">
            <h3 style="margin:0; color:#fff; font-size:20px;">➕ Log New Patient Entry / Admission</h3>
            <button class="rb-modal-close" onclick="window.__HOSP_D12__?.closeAdmitModal()">✕</button>
          </div>
          <p style="color:var(--muted); font-size:13px; margin:4px 0 16px 0;">
            Record a new patient entry. This will immediately update the live capacity balance and inflow charts.
          </p>
          <form id="rb-admit-form" onsubmit="window.__HOSP_D12__?.submitPatientEntry(event)" class="form-grid">
            <label class="wide">Patient Full Name
              <input id="admit-name" placeholder="e.g., Rajesh Kumar" required>
            </label>
            <label>Age
              <input id="admit-age" type="number" min="1" max="120" value="38" required>
            </label>
            <label>Gender
              <select id="admit-gender">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>Triage Priority
              <select id="admit-priority">
                <option value="Critical">🔴 Critical (Immediate ICU / ER)</option>
                <option value="Urgent">🟡 Urgent (High Attention)</option>
                <option value="Standard" selected>🟢 Standard (General Admission)</option>
              </select>
            </label>
            <label>Assigned Ward
              <select id="admit-ward">
                <option value="ICU & Critical Care">ICU & Critical Care Ward</option>
                <option value="Emergency & Trauma">Emergency & Trauma Triage</option>
                <option value="Cardiology Ward">Cardiology Ward</option>
                <option value="Neurology Unit">Neurology Unit</option>
                <option value="Pediatrics & Neonatal">Pediatrics & Neonatal Ward</option>
                <option value="General Medical & Surgical" selected>General Medical & Surgical</option>
              </select>
            </label>
            <label>Bed Number
              <input id="admit-bed" placeholder="e.g., GW-24 or ICU-08" value="GW-24" required>
            </label>
            <label class="wide">Chief Complaint / Diagnosis
              <input id="admit-complaint" placeholder="e.g., Acute Respiratory Distress, High Fever, Post-Op Recovery" required>
            </label>
            <div class="wide" style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button class="rb-btn rb-btn-secondary" type="button" onclick="window.__HOSP_D12__?.closeAdmitModal()">Cancel</button>
              <button class="rb-btn rb-btn-primary" type="submit">✅ Confirm Admission & Update Stats</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL: UPDATE BED CAPACITY -->
      <div class="rb-modal-overlay" id="rb-bed-modal" style="display:none;">
        <div class="rb-modal-card">
          <div class="rb-modal-header">
            <h3 style="margin:0; color:#fff; font-size:20px;">🛏️ Update Hospital Bed Capacity</h3>
            <button class="rb-modal-close" onclick="window.__HOSP_D12__?.closeBedModal()">✕</button>
          </div>
          <p style="color:var(--muted); font-size:13px; margin:4px 0 16px 0;">
            Adjust real-time bed numbers, available ICU beds, and emergency ward allocations.
          </p>
          <form id="rb-bed-form" onsubmit="window.__HOSP_D12__?.submitBedCapacity(event)" class="form-grid">
            <label>Total Hospital Beds
              <input id="bed-total" type="number" min="10" max="2000" value="${totalBeds}" required>
            </label>
            <label>Occupied Beds
              <input id="bed-occupied" type="number" min="0" max="2000" value="${occupiedBeds}" required>
            </label>
            <label>Total ICU Beds
              <input id="bed-icu-total" type="number" min="1" max="200" value="${capacity.icuTotal || 24}" required>
            </label>
            <label>Available ICU Beds
              <input id="bed-icu-avail" type="number" min="0" max="200" value="${capacity.icuAvailable || 6}" required>
            </label>
            <label>Total Emergency Ward Beds
              <input id="bed-er-total" type="number" min="1" max="100" value="${capacity.emergencyBeds || 20}" required>
            </label>
            <label>Available Emergency Beds
              <input id="bed-er-avail" type="number" min="0" max="100" value="${capacity.emergencyAvailable || 12}" required>
            </label>
            <div class="wide" style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button class="rb-btn rb-btn-secondary" type="button" onclick="window.__HOSP_D12__?.closeBedModal()">Cancel</button>
              <button class="rb-btn rb-btn-primary" type="submit">💾 Save & Recalculate Capacity</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// In-memory / initial mock data for Hospital Telemetry
const DEFAULT_HOSP_SERIES = {
  '24h': {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:59'],
    series1: [12, 8, 16, 34, 48, 56, 42, 28, 19], // Admissions
    series2: [4, 2, 8, 22, 38, 44, 39, 21, 14],   // Discharges
    tooltips: [
      { s1: '12 Patients Entered', s2: '4 Discharged (Net +8)' },
      { s1: '8 Patients Entered', s2: '2 Discharged (Net +6)' },
      { s1: '16 Patients Entered', s2: '8 Discharged (Net +8)' },
      { s1: '34 Patients Entered', s2: '22 Discharged (Net +12)' },
      { s1: '48 Patients Entered', s2: '38 Discharged (Net +10)' },
      { s1: '56 Patients Entered', s2: '44 Discharged (Net +12)' },
      { s1: '42 Patients Entered', s2: '39 Discharged (Net +3)' },
      { s1: '28 Patients Entered', s2: '21 Discharged (Net +7)' },
      { s1: '19 Patients Entered', s2: '14 Discharged (Net +5)' }
    ]
  },
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series1: [32, 44, 49, 58, 52, 38, 29],
    series2: [24, 38, 41, 46, 48, 30, 22],
    tooltips: [
      { s1: '32 Admissions Logged', s2: '24 Discharges (+8 Bed Delta)' },
      { s1: '44 Admissions Logged', s2: '38 Discharges (+6 Bed Delta)' },
      { s1: '49 Admissions Logged', s2: '41 Discharges (+8 Bed Delta)' },
      { s1: '58 Admissions Logged', s2: '46 Discharges (+12 Bed Delta)' },
      { s1: '52 Admissions Logged', s2: '48 Discharges (+4 Bed Delta)' },
      { s1: '38 Admissions Logged', s2: '30 Discharges (+8 Bed Delta)' },
      { s1: '29 Admissions Logged', s2: '22 Discharges (+7 Bed Delta)' }
    ]
  },
  '30d': {
    labels: ['W1', 'W2', 'W3', 'W4'],
    series1: [210, 260, 295, 270],
    series2: [185, 240, 275, 255],
    tooltips: [
      { s1: '210 Admissions in W1', s2: '185 Discharges' },
      { s1: '260 Admissions in W2', s2: '240 Discharges' },
      { s1: '295 Admissions in W3', s2: '275 Discharges' },
      { s1: '270 Admissions in W4', s2: '255 Discharges' }
    ]
  },
  '90d': {
    labels: ['Month 1', 'Month 2', 'Month 3'],
    series1: [880, 1020, 1140],
    series2: [820, 960, 1080],
    tooltips: [
      { s1: '880 Monthly Admissions', s2: '820 Discharges' },
      { s1: '1,020 Monthly Admissions', s2: '960 Discharges' },
      { s1: '1,140 Monthly Admissions', s2: '1,080 Discharges' }
    ]
  }
};

const DEFAULT_WARS_DATA = [
  {
    id: 'ward-icu',
    category: 'critical',
    title: 'ICU & Critical Care Ward',
    dept: 'Intensive Care Unit',
    totalBeds: 24,
    occupiedBeds: 18,
    availableBeds: 6,
    occupancyPercent: 75,
    doctorsOnDuty: 4,
    features: 'Ventilators: 8 Online • 24/7 Monitoring',
    status: 'operational',
    statusText: '6 BEDS AVAILABLE',
    ping: '14ms'
  },
  {
    id: 'ward-er',
    category: 'critical',
    title: 'Emergency & Trauma Triage',
    dept: 'Emergency Department',
    totalBeds: 20,
    occupiedBeds: 8,
    availableBeds: 12,
    occupancyPercent: 40,
    doctorsOnDuty: 5,
    features: 'Level 1 Trauma • 2 Resus Bays Active',
    status: 'operational',
    statusText: '12 BEDS AVAILABLE',
    ping: '11ms'
  },
  {
    id: 'ward-cardio',
    category: 'specialty',
    title: 'Cardiology & Cardiac Care',
    dept: 'Cardiology Dept',
    totalBeds: 28,
    occupiedBeds: 20,
    availableBeds: 8,
    occupancyPercent: 71,
    doctorsOnDuty: 4,
    features: 'CCU Telemetry • Cath Lab Standby',
    status: 'operational',
    statusText: '8 BEDS AVAILABLE',
    ping: '18ms'
  },
  {
    id: 'ward-neuro',
    category: 'specialty',
    title: 'Neurology & Stroke Center',
    dept: 'Neurology Dept',
    totalBeds: 18,
    occupiedBeds: 13,
    availableBeds: 5,
    occupancyPercent: 72,
    doctorsOnDuty: 2,
    features: 'Stroke Care Unit • EEG Monitored',
    status: 'operational',
    statusText: '5 BEDS AVAILABLE',
    ping: '22ms'
  },
  {
    id: 'ward-pedia',
    category: 'specialty',
    title: 'Pediatrics & Neonatal Care',
    dept: 'Pediatrics Dept',
    totalBeds: 24,
    occupiedBeds: 8,
    availableBeds: 16,
    occupancyPercent: 33,
    doctorsOnDuty: 3,
    features: 'NICU Incubators: 10 Ready',
    status: 'operational',
    statusText: '16 BEDS AVAILABLE',
    ping: '16ms'
  },
  {
    id: 'ward-general',
    category: 'general',
    title: 'General Medical & Surgical Ward',
    dept: 'General Medicine',
    totalBeds: 86,
    occupiedBeds: 54,
    availableBeds: 32,
    occupancyPercent: 63,
    doctorsOnDuty: 6,
    features: 'Post-Op Care & General Recovery',
    status: 'operational',
    statusText: '32 BEDS AVAILABLE',
    ping: '12ms'
  }
];

const INITIAL_PATIENT_ENTRIES = [
  {
    id: 'entry-101',
    patientName: 'Ramesh Varma',
    age: 48,
    gender: 'Male',
    triagePriority: 'Critical',
    ward: 'ICU & Critical Care',
    bedNumber: 'ICU-04',
    chiefComplaint: 'Acute Chest Pain & Dyspnea',
    admittedAt: '2026-08-27T12:30:00.000Z',
    status: 'Admitted'
  },
  {
    id: 'entry-102',
    patientName: 'Priya Sharma',
    age: 32,
    gender: 'Female',
    triagePriority: 'Urgent',
    ward: 'Emergency & Trauma',
    bedNumber: 'ER-08',
    chiefComplaint: 'Fracture & Trauma Assessment',
    admittedAt: '2026-08-27T13:15:00.000Z',
    status: 'Admitted'
  },
  {
    id: 'entry-103',
    patientName: 'Ananya Reddy',
    age: 26,
    gender: 'Female',
    triagePriority: 'Standard',
    ward: 'General Medical & Surgical',
    bedNumber: 'GW-18',
    chiefComplaint: 'Viral Fever & Dehydration',
    admittedAt: '2026-08-27T13:45:00.000Z',
    status: 'Admitted'
  },
  {
    id: 'entry-104',
    patientName: 'Suresh Patel',
    age: 62,
    gender: 'Male',
    triagePriority: 'Urgent',
    ward: 'Cardiology Ward',
    bedNumber: 'CARD-06',
    chiefComplaint: 'Hypertensive Crisis Recovery',
    admittedAt: '2026-08-27T14:10:00.000Z',
    status: 'Admitted'
  }
];

export function initHospitalDashboard(rootEl, options = {}) {
  if (!rootEl) rootEl = document.getElementById('rb-hospital-dashboard-root');
  if (!rootEl) return;

  let currentRange = '24h';
  let currentCategory = 'all';
  let searchQuery = '';
  let isSweeping = false;

  // Local reactive data
  let patientEntriesList = [...INITIAL_PATIENT_ENTRIES];
  let wardsData = [...DEFAULT_WARS_DATA];
  let currentCapacity = options.data?.capacity || {
    totalBeds: 200,
    occupiedBeds: 58,
    availableBeds: 142,
    icuTotal: 24,
    icuAvailable: 6,
    emergencyBeds: 20,
    emergencyAvailable: 12,
    occupancyRate: 29.0
  };

  // Render SVG Pace Chart for Hospital Patient Inflow
  function renderHospitalChart(rangeKey) {
    const container = rootEl.querySelector('#rb-hosp-chart-svg-container');
    if (!container) return;

    const data = DEFAULT_HOSP_SERIES[rangeKey] || DEFAULT_HOSP_SERIES['24h'];
    const width = container.clientWidth || 900;
    const height = 240;
    const padding = { top: 25, right: 30, bottom: 40, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.series1, ...data.series2, 60);
    const count = data.labels.length;

    const getX = index => padding.left + (index / (count - 1)) * chartW;
    const getY = val => padding.top + chartH - (val / maxVal) * chartH;

    const pts1 = data.series1.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));
    const pts2 = data.series2.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));

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

    let gridLinesSvg = '';
    for (let i = 0; i <= 4; i++) {
      const yVal = padding.top + (i / 4) * chartH;
      const label = Math.round(maxVal - (i / 4) * maxVal);
      gridLinesSvg += `
        <line x1="${padding.left}" y1="${yVal}" x2="${width - padding.right}" y2="${yVal}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4 4" />
        <text x="${padding.left - 10}" y="${yVal + 4}" fill="#7c93ab" font-size="11" text-anchor="end" font-family="'Space Grotesk', monospace">${label}</text>
      `;
    }

    let xLabelsSvg = '';
    data.labels.forEach((lbl, i) => {
      const xVal = getX(i);
      xLabelsSvg += `
        <text x="${xVal}" y="${height - 12}" fill="#91a7bd" font-size="12" text-anchor="middle" font-weight="600">${lbl}</text>
        <line x1="${xVal}" y1="${padding.top + chartH}" x2="${xVal}" y2="${padding.top + chartH + 5}" stroke="rgba(255,255,255,0.15)" />
      `;
    });

    let interactivePoints = '';
    pts1.forEach((p, i) => {
      const p2 = pts2[i];
      interactivePoints += `
        <g class="rb-chart-point-group" data-index="${i}">
          <circle cx="${p.x}" cy="${p.y}" r="5" fill="#22d3ee" stroke="#0b1726" stroke-width="2" class="rb-point-dot"></circle>
          <circle cx="${p2.x}" cy="${p2.y}" r="5" fill="#a78bfa" stroke="#0b1726" stroke-width="2" class="rb-point-dot"></circle>
          <rect x="${p.x - 20}" y="${padding.top}" width="40" height="${chartH}" fill="transparent" class="rb-hosp-hover-trigger" data-index="${i}"></rect>
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="rb-chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rbHospGradCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="rbHospGradViolet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.0" />
          </linearGradient>
          <filter id="rbHospGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#22d3ee" flood-opacity="0.6"/>
          </filter>
          <filter id="rbHospGlowViolet" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#a78bfa" flood-opacity="0.6"/>
          </filter>
        </defs>

        ${gridLinesSvg}
        ${xLabelsSvg}

        <path d="${area2}" fill="url(#rbHospGradViolet)" class="rb-chart-area"></path>
        <path d="${path2}" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#rbHospGlowViolet)" class="rb-chart-line"></path>

        <path d="${area1}" fill="url(#rbHospGradCyan)" class="rb-chart-area"></path>
        <path d="${path1}" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#rbHospGlowCyan)" class="rb-chart-line"></path>

        ${interactivePoints}
      </svg>
    `;

    // Tooltips
    const tooltipEl = rootEl.querySelector('#rb-hosp-chart-tooltip');
    container.querySelectorAll('.rb-hosp-hover-trigger').forEach(trigger => {
      trigger.addEventListener('mouseenter', () => {
        const idx = Number(trigger.getAttribute('data-index'));
        const label = data.labels[idx];
        const tt = data.tooltips[idx];

        tooltipEl.innerHTML = `
          <div class="rb-tt-header">${label} Inflow Snapshot</div>
          <div class="rb-tt-row">
            <span class="rb-tt-dot" style="background:#22d3ee;"></span>
            <span>Admissions: <b>${tt.s1}</b></span>
          </div>
          <div class="rb-tt-row">
            <span class="rb-tt-dot" style="background:#a78bfa;"></span>
            <span>Turnover: <b>${tt.s2}</b></span>
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

  // Render Ward Sweep Lanes
  function renderWardLanes() {
    const container = rootEl.querySelector('#rb-ward-lanes-grid');
    if (!container) return;

    let filtered = wardsData;
    if (currentCategory !== 'all') {
      filtered = filtered.filter(w => w.category === currentCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.dept.toLowerCase().includes(q) ||
        w.features.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="rb-lanes-empty">
          <span style="font-size:32px; display:block; margin-bottom:10px;">🔍</span>
          <h3>No matching wards found</h3>
          <p>Clear your search filter to view all department lanes.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((ward, index) => `
      <div class="rb-lane-card ${isSweeping ? 'sweeping' : ''}" style="animation-delay:${index * 0.05}s;" id="ward-${ward.id}">
        <div class="rb-lane-top">
          <div class="rb-lane-category-badge ${ward.category === 'critical' ? 'diagnostics' : ward.category === 'specialty' ? 'website' : 'hospitals'}">
            ${ward.dept.toUpperCase()}
          </div>
          <div class="rb-lane-status-pill operational">
            <span class="rb-status-indicator"></span>
            <span>${ward.availableBeds} BEDS FREE</span>
          </div>
        </div>

        <div class="rb-lane-main">
          <h3 class="rb-lane-title">${ward.title}</h3>
          <div class="rb-lane-region">Capacity: ${ward.occupiedBeds} / ${ward.totalBeds} Beds Occupied (${ward.occupancyPercent}%)</div>
        </div>

        <div class="rb-lane-metrics-box">
          <div class="rb-lane-stat-row">
            <span>Occupancy Rate:</span>
            <b>${ward.occupancyPercent}%</b>
          </div>
          <div class="rb-lane-bar-track">
            <div class="rb-lane-bar-fill" style="width:${ward.occupancyPercent}%; background:linear-gradient(90deg, #22d3ee, #0284c7);"></div>
          </div>
          <div class="rb-lane-sub-stats">
            <span>Staff: <b>${ward.doctorsOnDuty} MDs</b></span>
            <span class="rb-dot-sep">•</span>
            <span>${ward.features}</span>
          </div>
        </div>

        <div class="rb-lane-foot">
          <div class="rb-lane-ping">
            <span class="rb-ping-dot"></span>
            <span id="ping-${ward.id}">${ward.ping}</span>
          </div>
          <div class="rb-lane-actions">
            <button class="rb-mini-btn" onclick="window.__HOSP_D12__?.probeWard('${ward.id}')">Probe ⚡</button>
            <button class="rb-mini-btn" onclick="window.__HOSP_D12__?.openAdmitModal('${ward.title}')">Admit ➕</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render Patient Entries Table
  function renderPatientEntriesTable() {
    const tbody = rootEl.querySelector('#rb-patient-entries-tbody');
    if (!tbody) return;

    if (patientEntriesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty">No patient entries logged yet. Click "Log Patient Entry" above.</td></tr>`;
      return;
    }

    tbody.innerHTML = patientEntriesList.map(entry => {
      const priorityClass = entry.triagePriority === 'Critical' ? 'cancelled' : entry.triagePriority === 'Urgent' ? 'pending' : 'confirmed';
      const priorityIcon = entry.triagePriority === 'Critical' ? '🔴' : entry.triagePriority === 'Urgent' ? '🟡' : '🟢';

      return `
        <tr>
          <td><b>🧑‍🦽 ${entry.patientName}</b></td>
          <td>${entry.age} yrs / ${entry.gender}</td>
          <td><span class="status-pill ${priorityClass}">${priorityIcon} ${entry.triagePriority}</span></td>
          <td><b>${entry.ward}</b></td>
          <td><span class="type-pill">${entry.bedNumber}</span></td>
          <td>${entry.chiefComplaint}</td>
          <td>${new Date(entry.admittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td><span class="status-pill confirmed">${entry.status}</span></td>
          <td>
            <button class="mini" onclick="window.__HOSP_D12__?.dischargePatient('${entry.id}')" title="Discharge and free bed">Discharge 🚪</button>
          </td>
        </tr>
      `;
    }).join('');

    const countChip = rootEl.querySelector('#rb-hosp-entries-count-chip');
    if (countChip) countChip.textContent = `${patientEntriesList.length} Admissions`;
  }

  // Exposed API Methods
  window.__HOSP_D12__ = {
    setTimeRange: range => {
      currentRange = range;
      rootEl.querySelectorAll('#rb-hosp-chart-time-tabs button').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-range') === range);
      });
      renderHospitalChart(range);
    },

    setWardCategory: cat => {
      currentCategory = cat;
      rootEl.querySelectorAll('#rb-ward-type-tabs button').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-ward') === cat);
      });
      renderWardLanes();
    },

    filterWards: q => {
      searchQuery = q;
      renderWardLanes();
    },

    openAdmitModal: (defaultWard = '') => {
      const modal = rootEl.querySelector('#rb-admit-modal');
      if (modal) {
        modal.style.display = 'flex';
        if (defaultWard) {
          const wardSelect = rootEl.querySelector('#admit-ward');
          if (wardSelect) wardSelect.value = defaultWard;
        }
      }
    },

    closeAdmitModal: () => {
      const modal = rootEl.querySelector('#rb-admit-modal');
      if (modal) modal.style.display = 'none';
    },

    openBedModal: () => {
      const modal = rootEl.querySelector('#rb-bed-modal');
      if (modal) modal.style.display = 'flex';
    },

    closeBedModal: () => {
      const modal = rootEl.querySelector('#rb-bed-modal');
      if (modal) modal.style.display = 'none';
    },

    probeWard: wardId => {
      const pingEl = rootEl.querySelector(`#ping-${wardId}`);
      if (pingEl) {
        pingEl.textContent = 'Probing...';
        setTimeout(() => {
          pingEl.textContent = `${Math.floor(10 + Math.random() * 18)}ms`;
          pingEl.style.color = '#34d399';
          setTimeout(() => { pingEl.style.color = ''; }, 2000);
        }, 350);
      }
    },

    submitPatientEntry: async e => {
      e.preventDefault();
      const name = rootEl.querySelector('#admit-name').value;
      const age = rootEl.querySelector('#admit-age').value;
      const gender = rootEl.querySelector('#admit-gender').value;
      const triagePriority = rootEl.querySelector('#admit-priority').value;
      const ward = rootEl.querySelector('#admit-ward').value;
      const bedNumber = rootEl.querySelector('#admit-bed').value;
      const chiefComplaint = rootEl.querySelector('#admit-complaint').value;

      const newEntry = {
        id: `entry-${Date.now()}`,
        patientName: name,
        age: Number(age),
        gender,
        triagePriority,
        ward,
        bedNumber,
        chiefComplaint,
        admittedAt: new Date().toISOString(),
        status: 'Admitted'
      };

      // Add to patient entry list
      patientEntriesList.unshift(newEntry);

      // Adjust bed capacity
      if (currentCapacity.availableBeds > 0) {
        currentCapacity.availableBeds -= 1;
        currentCapacity.occupiedBeds += 1;
        currentCapacity.occupancyRate = Number(((currentCapacity.occupiedBeds / currentCapacity.totalBeds) * 100).toFixed(1));
      }

      // Update ward occupancy
      const targetWard = wardsData.find(w => w.title === ward || w.dept === ward);
      if (targetWard && targetWard.availableBeds > 0) {
        targetWard.availableBeds -= 1;
        targetWard.occupiedBeds += 1;
        targetWard.occupancyPercent = Number(((targetWard.occupiedBeds / targetWard.totalBeds) * 100).toFixed(0));
      }

      // Sync with backend if logged in
      try {
        if (typeof window.api === 'function') {
          await window.api('/hospital/patient-entries', {
            method: 'POST',
            body: JSON.stringify(newEntry)
          });
        }
      } catch (err) {
        console.warn('Patient entry saved locally:', err);
      }

      // Update UI
      window.__HOSP_D12__?.closeAdmitModal();
      renderPatientEntriesTable();
      renderWardLanes();

      const availVal = rootEl.querySelector('#rb-hosp-avail-beds-val');
      if (availVal) availVal.innerHTML = `${currentCapacity.availableBeds} <small style="font-size:22px; font-weight:600; color:#94a3b8;">/ ${currentCapacity.totalBeds} Beds Free</small>`;
      const occVal = rootEl.querySelector('#rb-hosp-occ-beds-val');
      if (occVal) occVal.textContent = `${currentCapacity.occupiedBeds} Beds`;

      // Update chart with live point
      DEFAULT_HOSP_SERIES['24h'].series1[DEFAULT_HOSP_SERIES['24h'].series1.length - 1] += 1;
      renderHospitalChart(currentRange);

      if (typeof window.showNotification === 'function') {
        window.showNotification(`✅ Patient "${name}" successfully admitted to ${ward} (Bed ${bedNumber})!`);
      }
    },

    submitBedCapacity: async e => {
      e.preventDefault();
      const total = Number(rootEl.querySelector('#bed-total').value);
      const occupied = Number(rootEl.querySelector('#bed-occupied').value);
      const icuTotal = Number(rootEl.querySelector('#bed-icu-total').value);
      const icuAvail = Number(rootEl.querySelector('#bed-icu-avail').value);
      const erTotal = Number(rootEl.querySelector('#bed-er-total').value);
      const erAvail = Number(rootEl.querySelector('#bed-er-avail').value);

      currentCapacity = {
        totalBeds: total,
        occupiedBeds: occupied,
        availableBeds: Math.max(0, total - occupied),
        icuTotal,
        icuAvailable: icuAvail,
        emergencyBeds: erTotal,
        emergencyAvailable: erAvail,
        occupancyRate: Number(((occupied / total) * 100).toFixed(1))
      };

      // Update ward objects
      const icuWard = wardsData.find(w => w.id === 'ward-icu');
      if (icuWard) {
        icuWard.totalBeds = icuTotal;
        icuWard.availableBeds = icuAvail;
        icuWard.occupiedBeds = Math.max(0, icuTotal - icuAvail);
        icuWard.occupancyPercent = Number(((icuWard.occupiedBeds / icuTotal) * 100).toFixed(0));
      }

      const erWard = wardsData.find(w => w.id === 'ward-er');
      if (erWard) {
        erWard.totalBeds = erTotal;
        erWard.availableBeds = erAvail;
        erWard.occupiedBeds = Math.max(0, erTotal - erAvail);
        erWard.occupancyPercent = Number(((erWard.occupiedBeds / erTotal) * 100).toFixed(0));
      }

      // Sync backend
      try {
        if (typeof window.api === 'function') {
          await window.api('/hospital/capacity', {
            method: 'PUT',
            body: JSON.stringify(currentCapacity)
          });
        }
      } catch (err) {
        console.warn('Capacity saved locally:', err);
      }

      window.__HOSP_D12__?.closeBedModal();
      renderWardLanes();

      const availVal = rootEl.querySelector('#rb-hosp-avail-beds-val');
      if (availVal) availVal.innerHTML = `${currentCapacity.availableBeds} <small style="font-size:22px; font-weight:600; color:#94a3b8;">/ ${currentCapacity.totalBeds} Beds Free</small>`;
      const occVal = rootEl.querySelector('#rb-hosp-occ-beds-val');
      if (occVal) occVal.textContent = `${currentCapacity.occupiedBeds} Beds`;
      const icuVal = rootEl.querySelector('#rb-hosp-icu-beds-val');
      if (icuVal) icuVal.textContent = `${icuAvail} / ${icuTotal} Free`;

      if (typeof window.showNotification === 'function') {
        window.showNotification('🛏️ Hospital bed availability and capacity metrics updated successfully!');
      }
    },

    dischargePatient: entryId => {
      const idx = patientEntriesList.findIndex(e => e.id === entryId);
      if (idx >= 0) {
        const p = patientEntriesList[idx];
        patientEntriesList.splice(idx, 1);

        // Free bed
        currentCapacity.availableBeds = Math.min(currentCapacity.totalBeds, currentCapacity.availableBeds + 1);
        currentCapacity.occupiedBeds = Math.max(0, currentCapacity.occupiedBeds - 1);
        currentCapacity.occupancyRate = Number(((currentCapacity.occupiedBeds / currentCapacity.totalBeds) * 100).toFixed(1));

        const targetWard = wardsData.find(w => w.title === p.ward || w.dept === p.ward);
        if (targetWard) {
          targetWard.availableBeds = Math.min(targetWard.totalBeds, targetWard.availableBeds + 1);
          targetWard.occupiedBeds = Math.max(0, targetWard.occupiedBeds - 1);
          targetWard.occupancyPercent = Number(((targetWard.occupiedBeds / targetWard.totalBeds) * 100).toFixed(0));
        }

        renderPatientEntriesTable();
        renderWardLanes();

        const availVal = rootEl.querySelector('#rb-hosp-avail-beds-val');
        if (availVal) availVal.innerHTML = `${currentCapacity.availableBeds} <small style="font-size:22px; font-weight:600; color:#94a3b8;">/ ${currentCapacity.totalBeds} Beds Free</small>`;
        const occVal = rootEl.querySelector('#rb-hosp-occ-beds-val');
        if (occVal) occVal.textContent = `${currentCapacity.occupiedBeds} Beds`;

        if (typeof window.showNotification === 'function') {
          window.showNotification(`🚪 Patient "${p.patientName}" discharged. Bed ${p.bedNumber} is now free and sanitized.`);
        }
      }
    },

    exportPatientLog: () => {
      const dataToExport = {
        hospital: options.data?.user?.name || 'Hospital Medical Network',
        generatedAt: new Date().toISOString(),
        capacitySummary: currentCapacity,
        patientEntries: patientEntriesList
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital-admissions-audit-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      if (typeof window.showNotification === 'function') {
        window.showNotification('📥 Hospital admissions and capacity audit log exported successfully!');
      }
    }
  };

  // Initial draw
  renderHospitalChart(currentRange);
  renderWardLanes();
  renderPatientEntriesTable();

  // Responsive resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.body.contains(rootEl)) {
        renderHospitalChart(currentRange);
      }
    }, 150);
  });
}
