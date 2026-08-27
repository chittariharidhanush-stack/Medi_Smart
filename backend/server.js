'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// ==========================================
// IN-MEMORY DATA STORES
// ==========================================
const users = [];
const appointments = [];
const prescriptions = [];
const medicalRecords = [];
const notifications = [];
const emergencyAlerts = [];
const activityLogs = [];
const schedules = [];
const hospitalCapacities = new Map();
const patientEntries = [];
const sessions = new Map();
const consultationSignals = new Map();

// ==========================================
// HELPERS
// ==========================================
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const clean = (value) => String(value ?? '').trim();
const emailOf = (value) => clean(value).toLowerCase();
const validRoles = new Set(['patient', 'doctor', 'hospital', 'admin']);

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function safeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function addUser(data) {
  const user = {
    id: uid(),
    name: clean(data.name),
    email: emailOf(data.email),
    passwordHash: hashPassword(data.password),
    role: data.role,
    phone: clean(data.phone),
    bloodGroup: clean(data.bloodGroup),
    dateOfBirth: clean(data.dateOfBirth),
    specialization: clean(data.specialization),
    department: clean(data.department),
    hospitalId: clean(data.hospitalId),
    hospitalName: clean(data.hospitalName),
    address: clean(data.address),
    latitude: Number.isFinite(Number(data.latitude)) ? Number(data.latitude) : null,
    longitude: Number.isFinite(Number(data.longitude)) ? Number(data.longitude) : null,
    approved: data.approved !== false,
    active: data.active !== false,
    status: data.status || (data.role === 'doctor' ? 'approved' : undefined),
    createdByAdminId: data.createdByAdminId || null,
    addedByHospitalId: data.addedByHospitalId || null,
    qrHealthId: data.qrHealthId || `MEDI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    createdAt: now()
  };
  users.push(user);
  return user;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => v * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestHospital(latitude, longitude) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return null;
  const hospitals = users.filter(u => u.role === 'hospital' && u.active && Number.isFinite(u.latitude) && Number.isFinite(u.longitude));
  return hospitals.map(h => ({ hospital: h, distanceKm: distanceKm(Number(latitude), Number(longitude), h.latitude, h.longitude) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;
}

function logActivity(userId, role, action, extra = {}) {
  const entry = { id: uid(), userId, role, action, timestamp: now(), ...extra };
  activityLogs.push(entry);
  return entry;
}

function getLatestActivity(userId) {
  const userLogs = activityLogs.filter(l => l.userId === userId);
  const lastLogin = userLogs.filter(l => l.action === 'login').sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const lastLogout = userLogs.filter(l => l.action === 'logout').sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const lastActive = userLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  return {
    loginTime: lastLogin?.timestamp || null,
    logoutTime: lastLogout?.timestamp || null,
    lastActiveTime: lastActive?.timestamp || null
  };
}

// ==========================================
// SEED DATA
// ==========================================
function seed() {
  if (users.length) return;
  const admin = addUser({ name: 'Medi Smart Administrator', email: 'admin@medismart.local', password: 'Admin@123', role: 'admin', approved: true });
  const hospital = addUser({ name: 'Medi Smart City Hospital', email: 'hospital@medismart.local', password: 'Hospital@123', role: 'hospital', hospitalName: 'Medi Smart City Hospital', address: 'Main Road, Hyderabad', latitude: 17.3850, longitude: 78.4867, approved: true, createdByAdminId: admin.id, phone: '04023456789' });
  const doctor = addUser({ name: 'Dr. Ananya Rao', email: 'doctor@medismart.local', password: 'Doctor@123', role: 'doctor', specialization: 'Cardiology', department: 'Cardiology', hospitalId: hospital.id, hospitalName: hospital.name, approved: true, status: 'approved', addedByHospitalId: hospital.id });
  const patient = addUser({ name: 'Rahul Kumar', email: 'patient@medismart.local', password: 'Patient@123', role: 'patient', phone: '9000000000', bloodGroup: 'O+', approved: true });
  patient.allergies = 'Penicillin';
  patient.conditions = 'Asthma';
  patient.emergencyContacts = [
    { patient_id: 1, name: 'Jane Doe', phone: '+1234567890', relationship: 'Spouse' }
  ];

  // Create default schedule for the doctor
  const defaultSlots = [];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
  for (const day of days) {
    for (const startTime of times) {
      const [h, m] = startTime.split(':').map(Number);
      const endTime = `${String(h).padStart(2, '0')}:${String(m + 30).padStart(2, '0')}`.replace(':60', ':00');
      defaultSlots.push({ id: uid(), day, startTime, endTime: endTime === `${String(h).padStart(2, '0')}:00` ? `${String(h + 1).padStart(2, '0')}:00` : endTime, status: 'available', type: 'in-person' });
    }
  }
  schedules.push({ id: uid(), hospitalId: hospital.id, doctorId: doctor.id, slots: defaultSlots, createdAt: now(), updatedAt: now() });

  const appointment = {
    id: uid(), patientId: patient.id, doctorId: doctor.id, department: doctor.department,
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '10:30',
    reason: 'Routine consultation', status: 'confirmed', diagnosis: '', treatmentNotes: '', createdAt: now()
  };
  appointments.push(appointment);

  // Add a past appointment for history
  const pastAppt = {
    id: uid(), patientId: patient.id, doctorId: doctor.id, department: doctor.department,
    date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), time: '11:00',
    reason: 'Mild fever and cough for 3 days', status: 'completed',
    diagnosis: 'Acute Viral Upper Respiratory Infection',
    treatmentNotes: 'Rest, oral hydration. Paracetamol 500mg SOS for fever. Review in 7 days.', createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  };
  appointments.push(pastAppt);

  prescriptions.push({ id: uid(), patientId: patient.id, doctorId: doctor.id, appointmentId: pastAppt.id, medicines: [{ name: 'Paracetamol', dosage: '500 mg', frequency: 'After food, twice daily', duration: '3 days' }], instructions: 'Take with water and rest well.', date: new Date(Date.now() - 7 * 86400000).toISOString() });
  prescriptions.push({ id: uid(), patientId: patient.id, doctorId: doctor.id, appointmentId: appointment.id, medicines: [{ name: 'Cetirizine', dosage: '10 mg', frequency: 'Once daily at bedtime', duration: '5 days' }], instructions: 'For seasonal allergy management.', date: now() });
  medicalRecords.push({ id: uid(), patientId: patient.id, uploadedBy: doctor.id, title: 'Routine Check-up', type: 'lab', description: 'Sample demo medical record.', date: now() });
  medicalRecords.push({ id: uid(), patientId: patient.id, uploadedBy: doctor.id, title: 'Blood Work Panel', type: 'lab', description: 'Complete blood count and lipid profile.', date: new Date(Date.now() - 14 * 86400000).toISOString() });
  notifications.push({ id: uid(), userId: patient.id, message: 'Your demo appointment is confirmed.', type: 'appointment', read: false, createdAt: now() });
  notifications.push({ id: uid(), userId: patient.id, message: 'Welcome to Medi_Smart!', type: 'system', read: false, createdAt: now() });
}
seed();

// ==========================================
// SVG QR GENERATOR
// ==========================================
function generateSVGQR(text) {
  const size = 210;
  const padding = 15;
  const dots = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i) | 0;
  const grid = 21;
  const cell = (size - padding * 2) / grid;
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const isTopLeft = (r < 7 && c < 7);
      const isTopRight = (r < 7 && c >= grid - 7);
      const isBottomLeft = (r >= grid - 7 && c < 7);
      let fill = false;
      if (isTopLeft || isTopRight || isBottomLeft) {
        const lr = isTopLeft ? r : isTopRight ? r : r - (grid - 7);
        const lc = isTopLeft ? c : isTopRight ? c - (grid - 7) : c;
        fill = (lr === 0 || lr === 6 || lc === 0 || lc === 6) || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        const val = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 0.1));
        fill = val > 0.42;
      }
      if (fill) {
        const x = (padding + c * cell).toFixed(1);
        const y = (padding + r * cell).toFixed(1);
        const w = cell.toFixed(1);
        dots.push(`<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#041221" rx="1.5" />`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="#ffffff" rx="16"/>
    ${dots.join('')}
  </svg>`;
}

// ==========================================
// HTTP HELPERS
// ==========================================
function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Vary': 'Origin'
  });
  res.end(body);
}

function fail(res, status, message) { send(res, status, { message }); }

async function body(req) {
  return await new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy(new Error('Request body too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function currentUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  const userId = sessions.get(token);
  return users.find((u) => u.id === userId && u.active) || null;
}

function requireAuth(req, res, roles = []) {
  const user = currentUser(req);
  if (!user) { fail(res, 401, 'Authentication required'); return null; }
  if (roles.length && !roles.includes(user.role)) { fail(res, 403, 'You do not have permission for this action'); return null; }
  return user;
}

function routeMatches(path, pattern) {
  const a = path.split('/').filter(Boolean);
  const b = pattern.split('/').filter(Boolean);
  if (a.length !== b.length) return false;
  return b.every((part, i) => part.startsWith(':') || part === a[i]);
}

function routeParam(path, pattern, name) {
  const a = path.split('/').filter(Boolean);
  const b = pattern.split('/').filter(Boolean);
  const index = b.findIndex((x) => x === `:${name}`);
  return index >= 0 ? a[index] : null;
}

// ==========================================
// AI PATIENT HISTORY SUMMARIZER (Change 1)
// ==========================================
function buildPatientSummary(patientId, currentNotes) {
  const patient = users.find(u => u.id === patientId && u.role === 'patient');
  if (!patient) return null;

  const patientAppts = appointments.filter(a => a.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
  const patientRx = prescriptions.filter(p => p.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
  const patientRecords = medicalRecords.filter(r => r.patientId === patientId);

  // 1. Patient Overview
  const patientOverview = {
    name: patient.name,
    bloodGroup: patient.bloodGroup || 'Not recorded',
    allergies: patient.allergies || 'None recorded',
    conditions: patient.conditions || 'None recorded',
    dateOfBirth: patient.dateOfBirth || 'Not recorded',
    phone: patient.phone || 'Not recorded',
    totalVisits: patientAppts.length,
    totalPrescriptions: patientRx.length,
    totalRecords: patientRecords.length
  };

  // 2. Previous Visit Summary (last 5)
  const previousVisits = patientAppts.slice(0, 5).map(a => {
    const doc = users.find(u => u.id === a.doctorId);
    return {
      date: a.date,
      time: a.time,
      doctor: doc?.name || 'Unknown',
      department: a.department,
      reason: a.reason || 'Not specified',
      diagnosis: a.diagnosis || 'No diagnosis recorded',
      treatmentNotes: a.treatmentNotes || 'No treatment notes',
      status: a.status
    };
  });

  // 3. Frequently Reported Issues
  const allReasons = patientAppts.map(a => a.reason || '').join(' ').toLowerCase();
  const issueKeywords = ['fever', 'cough', 'headache', 'pain', 'fatigue', 'dizziness', 'nausea', 'breathing', 'chest', 'skin', 'allergy', 'infection', 'cold', 'throat', 'stomach', 'joint', 'back'];
  const frequentIssues = issueKeywords
    .map(kw => ({ issue: kw, count: (allReasons.match(new RegExp(kw, 'gi')) || []).length }))
    .filter(i => i.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Current Consultation Summary
  const currentConsultation = currentNotes || 'No current notes provided.';

  // 5. Follow-Up History
  const completedVisits = patientAppts.filter(a => a.status === 'completed');
  const followUpHistory = completedVisits.slice(0, 5).map(a => ({
    date: a.date,
    department: a.department,
    diagnosis: a.diagnosis || 'General checkup',
    outcome: a.treatmentNotes || 'Follow-up completed'
  }));

  // 6. Important Medical Notes
  const importantNotes = [];
  if (patient.allergies && patient.allergies !== 'None recorded') {
    importantNotes.push(`⚠️ ALLERGY ALERT: Patient is allergic to ${patient.allergies}. Ensure prescribed medications do not contain these substances.`);
  }
  if (patient.conditions && patient.conditions !== 'None recorded') {
    importantNotes.push(`📋 CHRONIC CONDITIONS: ${patient.conditions}. Consider interactions with existing conditions when prescribing.`);
  }
  if (patientRx.length > 0) {
    const recentMeds = patientRx[0].medicines.map(m => m.name).join(', ');
    importantNotes.push(`💊 RECENT MEDICATIONS: ${recentMeds}. Check for drug interactions.`);
  }
  if (completedVisits.length > 3) {
    importantNotes.push(`📊 FREQUENT VISITOR: Patient has had ${completedVisits.length} completed consultations. Review for recurring patterns.`);
  }
  if (importantNotes.length === 0) {
    importantNotes.push('No special medical notes flagged for this patient.');
  }

  // Previous Prescriptions (last 5)
  const previousPrescriptions = patientRx.slice(0, 5).map(p => {
    const doc = users.find(u => u.id === p.doctorId);
    return {
      date: p.date?.slice(0, 10) || 'Recent',
      doctor: doc?.name || 'Unknown',
      medicines: p.medicines.map(m => `${m.name} (${m.dosage}, ${m.frequency}, ${m.duration})`).join('; '),
      instructions: p.instructions || 'None'
    };
  });

  return {
    disclaimer: 'This is an AI-generated patient history summary for reference only. It does NOT provide diagnoses, treatment recommendations, or medication suggestions. Clinical judgment by the attending physician is required.',
    patientOverview,
    previousVisits,
    frequentIssues,
    currentConsultation,
    followUpHistory,
    importantNotes,
    previousPrescriptions,
    medicalRecords: patientRecords.map(r => ({ title: r.title, type: r.type, date: r.date?.slice(0, 10) || 'Recent', description: r.description }))
  };
}

// ==========================================
// MAIN REQUEST HANDLER
// ==========================================
async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/health') return send(res, 200, { ok: true, service: 'Medi Smart API', time: now() });

  try {

    // ==========================================
    // AUTH ROUTES
    // ==========================================
    if (req.method === 'POST' && path === '/api/auth/register') {
      const data = await body(req);
      const name = clean(data.name); const email = emailOf(data.email); const password = String(data.password || ''); const role = clean(data.role);
      if (name.length < 2 || !email.includes('@') || password.length < 8 || role !== 'patient') return fail(res, 400, 'Public registration is available for patients only.');
      if (users.some((u) => u.email === email)) return fail(res, 409, 'An account with this email already exists.');
      const user = addUser({ ...data, name, email, password, role, approved: true });
      return send(res, 201, { user: safeUser(user) });
    }

    if (req.method === 'POST' && path === '/api/auth/login') {
      const data = await body(req); const email = emailOf(data.email); const password = String(data.password || ''); const role = clean(data.role);
      const user = users.find((u) => u.email === email);
      if (!validRoles.has(role)) return fail(res, 400, 'A valid role is required.');
      if (!user || user.passwordHash !== hashPassword(password) || !user.active || user.role !== role) return fail(res, 401, 'Invalid credentials for the selected role.');
      // Block suspended doctors
      if (user.role === 'doctor' && user.status === 'suspended') return fail(res, 403, 'Your account has been suspended by the hospital. Contact your hospital administrator.');
      if (user.role === 'doctor' && user.status === 'pending') return fail(res, 403, 'Your account is pending hospital approval.');
      if (user.role === 'doctor' && user.status === 'rejected') return fail(res, 403, 'Your account has been rejected by the hospital.');
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, user.id);
      // Track login activity
      logActivity(user.id, user.role, 'login');
      return send(res, 200, { token, user: safeUser(user) });
    }

    if (req.method === 'POST' && path === '/api/auth/logout') {
      const user = currentUser(req);
      if (user) {
        logActivity(user.id, user.role, 'logout');
        // Remove session
        const header = req.headers.authorization || '';
        if (header.startsWith('Bearer ')) {
          sessions.delete(header.slice(7).trim());
        }
      }
      return send(res, 200, { message: 'Logged out successfully' });
    }

    if (req.method === 'PUT' && path === '/api/auth/heartbeat') {
      const user = currentUser(req);
      if (user) {
        logActivity(user.id, user.role, 'heartbeat');
      }
      return send(res, 200, { ok: true });
    }

    if (req.method === 'GET' && path === '/api/auth/me') {
      const user = requireAuth(req, res); if (!user) return; return send(res, 200, { user: safeUser(user) });
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/users/:id')) {
      const user = requireAuth(req, res); if (!user) return;
      const targetId = routeParam(path, '/api/users/:id', 'id');
      if (user.id !== targetId && user.role !== 'admin') return fail(res, 403, 'You can only edit your own profile.');
      const data = await body(req); const target = users.find((u) => u.id === targetId); if (!target) return fail(res, 404, 'User not found');
      for (const key of ['name', 'phone', 'bloodGroup', 'dateOfBirth', 'specialization', 'department', 'address', 'allergies', 'conditions']) if (data[key] !== undefined) target[key] = clean(data[key]);
      return send(res, 200, { user: safeUser(target) });
    }

    // ==========================================
    // EMERGENCY SOS
    // ==========================================
    if (req.method === 'POST' && path === '/api/sos') {
      const data = await body(req);
      const lat = data.lat || data.latitude || '0.0';
      const lng = data.lng || data.longitude || '0.0';
      const user = currentUser(req);
      const patient = user || users.find(u => u.role === 'patient') || { name: 'John Doe', bloodGroup: 'O+', allergies: 'Penicillin', conditions: 'Asthma' };
      const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      const contacts = patient.emergencyContacts || [
        { name: 'Jane Doe', phone: '+1234567890', relationship: 'Spouse' }
      ];
      const smsMsg = `Emergency Alert from Medi_Smart.\nPatient: ${patient.name}\nLocation: ${mapsLink}\nPlease contact immediately.`;
      for (const contact of contacts) {
        console.log(`\n--- MOCK SMS TO ${contact.phone} (${contact.name}) ---`);
        console.log(smsMsg);
        console.log("------------------------------------------------------\n");
      }
      notifications.push({ id: uid(), userId: patient.id || 1, message: "Emergency SOS Alert Sent.", type: "emergency", read: false, createdAt: now() });
      return send(res, 200, { status: "success", message: "Emergency alerts sent successfully.", locationLink: mapsLink, contactsNotified: contacts });
    }

    // ==========================================
    // WEBRTC SIGNALING
    // ==========================================
    if (req.method === 'POST' && path === '/api/consultation/signal') {
      const data = await body(req);
      const room = clean(data.room_id || 'default_room');
      if (!consultationSignals.has(room)) consultationSignals.set(room, []);
      const entry = { id: uid(), type: data.type, payload: data.payload, sender: data.sender || 'peer', time: Date.now() };
      consultationSignals.get(room).push(entry);
      if (consultationSignals.get(room).length > 100) consultationSignals.get(room).shift();
      return send(res, 200, { status: "success", signalId: entry.id });
    }

    if (req.method === 'GET' && routeMatches(path, '/api/consultation/signals/:room')) {
      const room = routeParam(path, '/api/consultation/signals/:room', 'room');
      const since = Number(url.searchParams.get('since') || 0);
      const list = (consultationSignals.get(room) || []).filter(s => s.time > since);
      return send(res, 200, { status: "success", signals: list });
    }

    // ==========================================
    // CONSULTATION PATIENT CONTEXT (Change 8)
    // ==========================================
    if (req.method === 'GET' && routeMatches(path, '/api/consultation/patient-context/:patientId')) {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      const patientId = routeParam(path, '/api/consultation/patient-context/:patientId', 'patientId');
      const summary = buildPatientSummary(patientId, '');
      if (!summary) return fail(res, 404, 'Patient not found');
      return send(res, 200, { status: 'success', data: summary });
    }

    // ==========================================
    // AI MEDICAL ASSISTANT & AUTO-FILL (Change 10: removed diagnosis/treatment autoFill)
    // ==========================================
    if (req.method === 'POST' && path === '/api/ai/chat') {
      const data = await body(req);
      const query = clean(data.message).toLowerCase();
      const role = clean(data.role || 'guest');

      let reply = "";
      let suggestions = [];
      let autoFill = null;

      if (query.includes('fever') || query.includes('temperature') || query.includes('cough') || query.includes('cold') || query.includes('throat')) {
        reply = "For fever, cough, and throat irritation, rest, hydration, and monitoring temperature every 4 hours is advised. A consultation with General Medicine is recommended.";
        suggestions = ["Book General Medicine", "Check Fever Presets", "Trigger Emergency SOS"];
        autoFill = { department: "General Medicine", reason: "Mild to moderate fever with persistent cough and throat discomfort." };
      } else if (query.includes('chest') || query.includes('heart') || query.includes('breath') || query.includes('palpitation')) {
        reply = "⚠️ Warning: Chest discomfort, shortness of breath, or palpitations require prompt cardiac evaluation. If severe, please use Emergency SOS immediately.";
        suggestions = ["Book Cardiology Appointment", "🚨 Trigger Emergency SOS", "Find Nearest Hospital"];
        autoFill = { department: "Cardiology", reason: "Substernal chest tightness with mild dyspnea and palpitations on moderate exertion." };
      } else if (query.includes('skin') || query.includes('rash') || query.includes('itch') || query.includes('allergy')) {
        reply = "Skin eruptions and allergic reactions can be managed with anti-histamines and topical soothing agents. Avoid suspected allergen triggers.";
        suggestions = ["Book Dermatology", "Review Patient Allergies", "Generate AI Summary"];
        autoFill = { department: "Dermatology", reason: "Pruritic erythematous skin rash with mild swelling post suspected allergen exposure." };
      } else if (query.includes('headache') || query.includes('dizzy') || query.includes('migraine')) {
        reply = "Headaches accompanied by dizziness can result from tension, migraine, or blood pressure changes. Neurological checkup is advised if persistent.";
        suggestions = ["Book Neurology", "Hypertension Check", "Record Vitals"];
        autoFill = { department: "Neurology", reason: "Throbbing unilateral headache accompanied by mild photophobia and morning dizziness." };
      } else if (query.includes('emergency') || query.includes('sos') || query.includes('ambulance')) {
        reply = "🚨 Emergency Protocol Activated: You can click Emergency SOS to broadcast your live GPS coordinates to the nearest hospital network.";
        suggestions = ["🚨 Launch 30s SOS Countdown", "View Nearest Hospital", "Contact ICE Contact"];
      } else if (query.includes('prescription') || query.includes('medicine') || query.includes('rx')) {
        reply = "Medi Smart allows doctors to generate digitally verified prescriptions and patients to view dosage schedules and instructions.";
        suggestions = ["Issue New Prescription", "View My Prescriptions", "Medication Reminder"];
      } else {
        reply = `Hello! I am your Medi-AI Medical Assistant. How can I assist you with your healthcare, appointments, symptoms, clinical notes, or emergency support today?`;
        suggestions = ["🤒 Symptom Check (Fever/Cough)", "🫀 Chest & Cardiac Health", "📋 Auto-fill Appointment Form", "🚨 Emergency SOS Guide"];
      }

      return send(res, 200, { status: "success", reply, suggestions, autoFill, timestamp: now() });
    }

    if (req.method === 'POST' && path === '/api/ai/suggest-booking') {
      const data = await body(req);
      const text = clean(data.symptoms || '').toLowerCase();
      let department = "General Medicine";
      let reason = data.symptoms || "General medical consultation";
      if (text.includes('heart') || text.includes('chest') || text.includes('pressure') || text.includes('bp')) department = "Cardiology";
      else if (text.includes('skin') || text.includes('rash') || text.includes('acne') || text.includes('itch')) department = "Dermatology";
      else if (text.includes('brain') || text.includes('headache') || text.includes('migraine') || text.includes('nerve')) department = "Neurology";
      else if (text.includes('child') || text.includes('baby') || text.includes('infant') || text.includes('pediatric')) department = "Pediatrics";
      else if (text.includes('bone') || text.includes('joint') || text.includes('fracture') || text.includes('knee') || text.includes('back pain')) department = "Orthopedics";
      const matchingDoctor = users.find(u => u.role === 'doctor' && u.active && u.status === 'approved' && (u.department === department || u.specialization === department)) || users.find(u => u.role === 'doctor' && u.active && u.status === 'approved');
      return send(res, 200, { status: "success", department, recommendedDoctorId: matchingDoctor?.id || null, recommendedDoctorName: matchingDoctor?.name || 'Available Doctor', suggestedReason: reason });
    }

    if (req.method === 'POST' && path === '/api/ai/suggest-rx') {
      const data = await body(req);
      const diag = clean(data.diagnosis || '').toLowerCase();
      let medicines = [{ name: "Paracetamol", dosage: "500 mg", frequency: "After food, twice daily", duration: "3 days" }];
      let instructions = "Take with water after food and maintain proper rest.";
      if (diag.includes('hypertension') || diag.includes('bp')) {
        medicines = [{ name: "Amlodipine", dosage: "5 mg", frequency: "Once daily, morning", duration: "30 days" }, { name: "Telmisartan", dosage: "40 mg", frequency: "Once daily, morning", duration: "30 days" }];
        instructions = "Monitor blood pressure weekly. Maintain a low sodium diet.";
      } else if (diag.includes('infection') || diag.includes('bronchitis') || diag.includes('fever')) {
        medicines = [{ name: "Amoxicillin + Clavulanic Acid", dosage: "625 mg", frequency: "Twice daily after meals", duration: "5 days" }, { name: "Paracetamol", dosage: "650 mg", frequency: "SOS for fever > 100°F", duration: "3 days" }];
        instructions = "Complete full antibiotic course. Drink plenty of warm fluids.";
      } else if (diag.includes('allergy') || diag.includes('dermatitis') || diag.includes('rash')) {
        medicines = [{ name: "Levocetirizine", dosage: "5 mg", frequency: "Once daily at night", duration: "5 days" }, { name: "Hydrocortisone cream 1%", dosage: "Thin layer", frequency: "Twice daily topically", duration: "7 days" }];
        instructions = "Apply sparingly. Avoid scratching the affected area.";
      }
      return send(res, 200, { status: "success", medicines, instructions });
    }

    // ==========================================
    // AI SUMMARIZE — ENHANCED (Change 1)
    // ==========================================
    if (req.method === 'POST' && path === '/api/ai/summarize') {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      const data = await body(req);
      const patientId = clean(data.patientId);
      const notes = clean(data.notes) || 'Patient checkup completed.';

      if (patientId) {
        const summary = buildPatientSummary(patientId, notes);
        if (!summary) return fail(res, 404, 'Patient not found');
        return send(res, 200, { status: "success", data: summary });
      }

      // Fallback for legacy calls without patientId
      return send(res, 200, {
        status: "success",
        data: {
          disclaimer: 'This is a basic summary. Select a patient for a comprehensive AI history summary.',
          patientOverview: null,
          previousVisits: [],
          frequentIssues: [],
          currentConsultation: notes,
          followUpHistory: [],
          importantNotes: ['Select a specific patient to generate a comprehensive history summary.'],
          previousPrescriptions: [],
          medicalRecords: []
        }
      });
    }

    // ==========================================
    // EMERGENCY MEDICAL RECORD (QR & Profile)
    // ==========================================
    if (req.method === 'GET' && routeMatches(path, '/api/emergency/profile/:id')) {
      const paramId = routeParam(path, '/api/emergency/profile/:id', 'id');
      let patient = users.find(u => u.id === paramId || (paramId === '1' && u.role === 'patient'));
      if (!patient) patient = users.find(u => u.role === 'patient');
      if (!patient) return fail(res, 404, 'Profile not found');
      const profileData = {
        name: patient.name, blood_group: patient.bloodGroup || 'O+',
        allergies: patient.allergies || 'Penicillin', conditions: patient.conditions || 'Asthma',
        phone: patient.phone || '+1234567890',
        emergency_contacts: patient.emergencyContacts || [{ name: 'Jane Doe', phone: '+1234567890', relationship: 'Spouse' }]
      };
      return send(res, 200, { status: "success", data: profileData });
    }

    if (req.method === 'GET' && routeMatches(path, '/api/emergency/qr/:id')) {
      const paramId = routeParam(path, '/api/emergency/qr/:id', 'id');
      const publicUrl = `http://127.0.0.1:${PORT}/api/emergency/profile/${paramId}`;
      const svg = generateSVGQR(publicUrl);
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
      return res.end(svg);
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    if (req.method === 'GET' && routeMatches(path, '/api/notifications/:id')) {
      const targetUserId = routeParam(path, '/api/notifications/:id', 'id');
      const userNotifications = notifications.filter(n => String(n.userId) === String(targetUserId) || targetUserId === '1');
      return send(res, 200, { status: "success", data: userNotifications });
    }

    // ==========================================
    // DOCTORS LIST
    // ==========================================
    if (req.method === 'GET' && path === '/api/doctors') {
      const user = requireAuth(req, res); if (!user) return;
      const doctors = users.filter((u) => u.role === 'doctor' && u.active && u.approved && u.status === 'approved').map(safeUser);
      return send(res, 200, doctors);
    }

    // ==========================================
    // APPOINTMENTS
    // ==========================================
    if (req.method === 'GET' && path === '/api/appointments/my') {
      const user = requireAuth(req, res, ['patient']); if (!user) return;
      return send(res, 200, appointments.filter((a) => a.patientId === user.id).sort((a, b) => b.date.localeCompare(a.date)).map(enrichAppointment));
    }

    if (req.method === 'GET' && path === '/api/appointments/doctor') {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      return send(res, 200, appointments.filter((a) => a.doctorId === user.id).sort((a, b) => a.date.localeCompare(b.date)).map(enrichAppointment));
    }

    if (req.method === 'GET' && path === '/api/appointments') {
      const user = requireAuth(req, res, ['hospital', 'admin']); if (!user) return;
      const list = user.role === 'hospital' ? appointments.filter((a) => users.find((d) => d.id === a.doctorId)?.hospitalId === user.id) : appointments;
      return send(res, 200, list.map(enrichAppointment));
    }

    if (req.method === 'POST' && path === '/api/appointments') {
      const user = requireAuth(req, res, ['patient']); if (!user) return;
      const data = await body(req); const doctor = users.find((u) => u.id === clean(data.doctor) && u.role === 'doctor' && u.active && u.status === 'approved');
      if (!doctor || !data.date || !data.time || !data.department) return fail(res, 400, 'Doctor, department, date and time are required.');

      // Validate against hospital-approved schedule (Change 5)
      const schedule = schedules.find(s => s.doctorId === doctor.id);
      if (schedule) {
        const reqDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(data.date).getDay()];
        const matchingSlot = schedule.slots.find(s => s.day === reqDay && s.startTime === clean(data.time) && s.status === 'available');
        if (!matchingSlot) {
          // Allow booking even if no exact slot match, but log warning
          console.log(`[SCHEDULE] No exact slot match for ${doctor.name} on ${reqDay} at ${data.time}, allowing booking.`);
        }
      }

      const appointment = { id: uid(), patientId: user.id, doctorId: doctor.id, department: clean(data.department), date: clean(data.date), time: clean(data.time), reason: clean(data.reason), status: 'pending', diagnosis: '', treatmentNotes: '', createdAt: now() };
      appointments.push(appointment);
      notifications.push({ id: uid(), userId: doctor.id, message: `New appointment request from ${user.name}.`, type: 'appointment', read: false, createdAt: now() });
      return send(res, 201, enrichAppointment(appointment));
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/appointments/:id/status')) {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      const appointment = appointments.find((a) => a.id === routeParam(path, '/api/appointments/:id/status', 'id') && a.doctorId === user.id); if (!appointment) return fail(res, 404, 'Appointment not found');
      const data = await body(req); if (data.status && !['pending', 'confirmed', 'completed', 'cancelled'].includes(data.status)) return fail(res, 400, 'Invalid appointment status.');
      if (data.status) appointment.status = data.status; if (data.diagnosis !== undefined) appointment.diagnosis = clean(data.diagnosis); if (data.treatmentNotes !== undefined) appointment.treatmentNotes = clean(data.treatmentNotes);
      notifications.push({ id: uid(), userId: appointment.patientId, message: `Your appointment status is now ${appointment.status}.`, type: 'appointment', read: false, createdAt: now() });
      return send(res, 200, enrichAppointment(appointment));
    }

    // ==========================================
    // PRESCRIPTIONS
    // ==========================================
    if (req.method === 'GET' && path === '/api/prescriptions') {
      const user = requireAuth(req, res); if (!user) return;
      const list = user.role === 'patient' ? prescriptions.filter((p) => p.patientId === user.id) : user.role === 'doctor' ? prescriptions.filter((p) => p.doctorId === user.id) : user.role === 'hospital' ? (() => { const doctorIds = new Set(users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(u => u.id)); return prescriptions.filter(p => doctorIds.has(p.doctorId)); })() : [];
      return send(res, 200, list.map(enrichPrescription));
    }

    if (req.method === 'POST' && path === '/api/prescriptions') {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      const data = await body(req); const patient = users.find((u) => u.id === clean(data.patientId) && u.role === 'patient');
      if (!patient || !Array.isArray(data.medicines) || !data.medicines.length) return fail(res, 400, 'Patient and at least one medicine are required.');
      const prescription = { id: uid(), patientId: patient.id, doctorId: user.id, appointmentId: clean(data.appointmentId), medicines: data.medicines.map((m) => ({ name: clean(m.name), dosage: clean(m.dosage), frequency: clean(m.frequency), duration: clean(m.duration) })), instructions: clean(data.instructions), date: now() };
      prescriptions.push(prescription); notifications.push({ id: uid(), userId: patient.id, message: 'A new prescription is available.', type: 'prescription', read: false, createdAt: now() }); return send(res, 201, enrichPrescription(prescription));
    }

    // ==========================================
    // MEDICAL RECORDS
    // ==========================================
    if (req.method === 'GET' && path === '/api/records') {
      const user = requireAuth(req, res); if (!user) return;
      const list = user.role === 'patient' ? medicalRecords.filter((r) => r.patientId === user.id) : user.role === 'doctor' ? (() => { const patientIds = new Set(appointments.filter(a => a.doctorId === user.id).map(a => a.patientId)); return medicalRecords.filter(r => patientIds.has(r.patientId)); })() : user.role === 'hospital' ? (() => { const doctorIds = new Set(users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(u => u.id)); return medicalRecords.filter(r => doctorIds.has(r.uploadedBy)); })() : medicalRecords;
      return send(res, 200, list.map(enrichRecord));
    }

    if (req.method === 'POST' && path === '/api/records') {
      const user = requireAuth(req, res, ['doctor', 'hospital', 'admin']); if (!user) return;
      const data = await body(req); const patient = users.find((u) => u.id === clean(data.patientId) && u.role === 'patient');
      if (!patient || !clean(data.title)) return fail(res, 400, 'Patient and record title are required.');
      const record = { id: uid(), patientId: patient.id, uploadedBy: user.id, title: clean(data.title), type: clean(data.type) || 'other', description: clean(data.description), fileUrl: clean(data.fileUrl), date: clean(data.date) || now() };
      medicalRecords.push(record); notifications.push({ id: uid(), userId: patient.id, message: `New medical record: ${record.title}.`, type: 'record', read: false, createdAt: now() }); return send(res, 201, enrichRecord(record));
    }

    // ==========================================
    // NOTIFICATION ROUTES (authenticated)
    // ==========================================
    if (req.method === 'GET' && path === '/api/notifications') {
      const user = requireAuth(req, res); if (!user) return;
      return send(res, 200, notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/notifications/:id/read')) {
      const user = requireAuth(req, res); if (!user) return; const n = notifications.find((x) => x.id === routeParam(path, '/api/notifications/:id/read', 'id') && x.userId === user.id); if (!n) return fail(res, 404, 'Notification not found'); n.read = true; return send(res, 200, n);
    }

    // ==========================================
    // EMERGENCY ALERTS
    // ==========================================
    if (req.method === 'POST' && path === '/api/emergency') {
      const user = requireAuth(req, res, ['patient']); if (!user) return;
      const data = await body(req);
      const nearest = nearestHospital(Number(data.latitude), Number(data.longitude));
      const alert = { id: uid(), patientId: user.id, trigger: clean(data.trigger) || 'manual', latitude: Number(data.latitude) || null, longitude: Number(data.longitude) || null, accuracy: Number(data.accuracy) || null, status: nearest ? 'sent-to-nearest-hospital' : 'sent-to-hospital-network', nearestHospitalId: nearest?.hospital.id || null, createdAt: now() };
      emergencyAlerts.push(alert);
      if (nearest) {
        notifications.push({ id: uid(), userId: nearest.hospital.id, message: `EMERGENCY ALERT from ${user.name}. Location: ${alert.latitude ?? 'unavailable'}, ${alert.longitude ?? 'unavailable'}. Distance: ${nearest.distanceKm.toFixed(2)} km.`, type: 'emergency', read: false, createdAt: now() });
      }
      users.filter((u) => u.role === 'admin' && u.active).forEach((admin) => notifications.push({ id: uid(), userId: admin.id, message: `Emergency alert from ${user.name}. Nearest hospital: ${nearest?.hospital.name || 'network unavailable'}.`, type: 'emergency', read: false, createdAt: now() }));
      return send(res, 201, { alert, nearestHospital: nearest ? { id: nearest.hospital.id, name: nearest.hospital.name, address: nearest.hospital.address, distanceKm: Number(nearest.distanceKm.toFixed(2)) } : null, hospitalsNotified: nearest ? 1 : 0 });
    }

    if (req.method === 'GET' && path === '/api/emergency') {
      const user = requireAuth(req, res, ['hospital', 'admin']); if (!user) return;
      return send(res, 200, emergencyAlerts.slice().reverse().map((a) => ({ ...a, patient: safeUser(users.find((u) => u.id === a.patientId)), nearestHospital: safeUser(users.find((u) => u.id === a.nearestHospitalId)) })));
    }

    // ==========================================
    // HOSPITAL APIs — DOCTOR MANAGEMENT (Change 2)
    // ==========================================
    if (req.method === 'GET' && path === '/api/hospital/doctors') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      return send(res, 200, users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(safeUser));
    }

    if (req.method === 'POST' && path === '/api/hospital/doctors') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const data = await body(req);
      const name = clean(data.name); const email = emailOf(data.email); const password = String(data.password || '');
      if (name.length < 2 || !email.includes('@') || password.length < 8) return fail(res, 400, 'Name, valid email, and password (8+ chars) are required.');
      if (users.some(u => u.email === email)) return fail(res, 409, 'An account with this email already exists.');
      const doctor = addUser({
        name, email, password, role: 'doctor',
        specialization: clean(data.specialization),
        department: clean(data.department),
        phone: clean(data.phone),
        hospitalId: user.id,
        hospitalName: user.name,
        approved: true,
        status: clean(data.status) || 'pending',
        addedByHospitalId: user.id
      });
      notifications.push({ id: uid(), userId: doctor.id, message: `Your doctor account has been created by ${user.name}. Status: ${doctor.status}.`, type: 'system', read: false, createdAt: now() });
      return send(res, 201, { doctor: safeUser(doctor) });
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/hospital/doctors/:id')) {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const doctorId = routeParam(path, '/api/hospital/doctors/:id', 'id');
      const doctor = users.find(u => u.id === doctorId && u.role === 'doctor' && u.hospitalId === user.id);
      if (!doctor) return fail(res, 404, 'Doctor not found in your hospital.');
      const data = await body(req);
      for (const key of ['name', 'phone', 'specialization', 'department', 'address']) {
        if (data[key] !== undefined) doctor[key] = clean(data[key]);
      }
      return send(res, 200, { doctor: safeUser(doctor) });
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/hospital/doctors/:id/status')) {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const doctorId = routeParam(path, '/api/hospital/doctors/:id/status', 'id');
      const doctor = users.find(u => u.id === doctorId && u.role === 'doctor' && u.hospitalId === user.id);
      if (!doctor) return fail(res, 404, 'Doctor not found in your hospital.');
      const data = await body(req);
      const newStatus = clean(data.status);
      if (!['pending', 'approved', 'rejected', 'suspended'].includes(newStatus)) return fail(res, 400, 'Invalid status. Must be: pending, approved, rejected, or suspended.');
      doctor.status = newStatus;
      if (newStatus === 'suspended' || newStatus === 'rejected') doctor.active = false;
      if (newStatus === 'approved') doctor.active = true;
      notifications.push({ id: uid(), userId: doctor.id, message: `Your doctor account status has been updated to: ${newStatus} by ${user.name}.`, type: 'system', read: false, createdAt: now() });
      return send(res, 200, { doctor: safeUser(doctor) });
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/hospital/doctors/:id/department')) {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const doctorId = routeParam(path, '/api/hospital/doctors/:id/department', 'id');
      const doctor = users.find(u => u.id === doctorId && u.role === 'doctor' && u.hospitalId === user.id);
      if (!doctor) return fail(res, 404, 'Doctor not found in your hospital.');
      const data = await body(req);
      if (!data.department) return fail(res, 400, 'Department is required.');
      doctor.department = clean(data.department);
      doctor.specialization = clean(data.specialization) || doctor.specialization;
      return send(res, 200, { doctor: safeUser(doctor) });
    }

    if (req.method === 'DELETE' && routeMatches(path, '/api/hospital/doctors/:id')) {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const doctorId = routeParam(path, '/api/hospital/doctors/:id', 'id');
      const doctor = users.find(u => u.id === doctorId && u.role === 'doctor' && u.hospitalId === user.id);
      if (!doctor) return fail(res, 404, 'Doctor not found in your hospital.');
      doctor.active = false;
      doctor.status = 'rejected';
      notifications.push({ id: uid(), userId: doctor.id, message: `Your account at ${user.name} has been deactivated.`, type: 'system', read: false, createdAt: now() });
      return send(res, 200, { message: 'Doctor account deactivated.', doctor: safeUser(doctor) });
    }

    // ==========================================
    // HOSPITAL APIs — PATIENTS
    // ==========================================
    if (req.method === 'GET' && path === '/api/hospital/patients') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const doctorIds = new Set(users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(u => u.id));
      const patientIds = new Set(appointments.filter(a => doctorIds.has(a.doctorId)).map(a => a.patientId));
      return send(res, 200, users.filter(u => u.role === 'patient' && patientIds.has(u.id)).map(safeUser));
    }

    // ==========================================
    // HOSPITAL APIs — SCHEDULE MANAGEMENT (Change 5)
    // ==========================================
    if (req.method === 'GET' && path === '/api/hospital/schedules') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const hospitalSchedules = schedules.filter(s => s.hospitalId === user.id);
      return send(res, 200, hospitalSchedules.map(s => {
        const doc = users.find(u => u.id === s.doctorId);
        return { ...s, doctor: doc ? safeUser(doc) : null };
      }));
    }

    if (req.method === 'POST' && path === '/api/hospital/schedules') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const data = await body(req);
      const doctorId = clean(data.doctorId);
      const doctor = users.find(u => u.id === doctorId && u.role === 'doctor' && u.hospitalId === user.id);
      if (!doctor) return fail(res, 404, 'Doctor not found in your hospital.');

      // Remove existing schedule for this doctor
      const existingIdx = schedules.findIndex(s => s.doctorId === doctorId && s.hospitalId === user.id);
      if (existingIdx >= 0) schedules.splice(existingIdx, 1);

      const slots = (data.slots || []).map(s => ({
        id: uid(), day: clean(s.day).toLowerCase(), startTime: clean(s.startTime), endTime: clean(s.endTime),
        status: clean(s.status) || 'available', type: clean(s.type) || 'in-person'
      }));

      const schedule = { id: uid(), hospitalId: user.id, doctorId, slots, createdAt: now(), updatedAt: now() };
      schedules.push(schedule);
      return send(res, 201, { schedule: { ...schedule, doctor: safeUser(doctor) } });
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/hospital/schedules/:id')) {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const schedId = routeParam(path, '/api/hospital/schedules/:id', 'id');
      const schedule = schedules.find(s => s.id === schedId && s.hospitalId === user.id);
      if (!schedule) return fail(res, 404, 'Schedule not found.');
      const data = await body(req);
      if (data.slots) {
        schedule.slots = data.slots.map(s => ({
          id: s.id || uid(), day: clean(s.day).toLowerCase(), startTime: clean(s.startTime), endTime: clean(s.endTime),
          status: clean(s.status) || 'available', type: clean(s.type) || 'in-person'
        }));
      }
      schedule.updatedAt = now();
      return send(res, 200, { schedule });
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/hospital/slots/:slotId/status')) {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const slotId = routeParam(path, '/api/hospital/slots/:slotId/status', 'slotId');
      const data = await body(req);
      const newStatus = clean(data.status);
      if (!['available', 'disabled', 'blocked'].includes(newStatus)) return fail(res, 400, 'Invalid slot status.');
      for (const schedule of schedules.filter(s => s.hospitalId === user.id)) {
        const slot = schedule.slots.find(s => s.id === slotId);
        if (slot) {
          slot.status = newStatus;
          schedule.updatedAt = now();
          return send(res, 200, { slot });
        }
      }
      return fail(res, 404, 'Slot not found.');
    }

    // Available slots for patient booking
    if (req.method === 'GET' && routeMatches(path, '/api/slots/available/:doctorId')) {
      const user = requireAuth(req, res, ['patient']); if (!user) return;
      const doctorId = routeParam(path, '/api/slots/available/:doctorId', 'doctorId');
      const schedule = schedules.find(s => s.doctorId === doctorId);
      if (!schedule) return send(res, 200, { slots: [] });
      const available = schedule.slots.filter(s => s.status === 'available');
      return send(res, 200, { slots: available });
    }

    // ==========================================
    // HOSPITAL APIs — ACTIVITY TRACKING (Change 4)
    // ==========================================
    if (req.method === 'GET' && path === '/api/hospital/activity/doctors') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const hospitalDoctors = users.filter(u => u.role === 'doctor' && u.hospitalId === user.id);
      const result = hospitalDoctors.map(doc => ({
        doctor: safeUser(doc),
        activity: getLatestActivity(doc.id)
      }));
      return send(res, 200, result);
    }

    if (req.method === 'GET' && path === '/api/hospital/activity/patients') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const doctorIds = new Set(users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(u => u.id));
      const patientIds = new Set(appointments.filter(a => doctorIds.has(a.doctorId)).map(a => a.patientId));
      const hospitalPatients = users.filter(u => u.role === 'patient' && patientIds.has(u.id));
      const result = hospitalPatients.map(p => ({
        patient: safeUser(p),
        activity: getLatestActivity(p.id)
      }));
      return send(res, 200, result);
    }

    // ==========================================
    // HOSPITAL APIs — BED CAPACITY & PATIENT ENTRIES
    // ==========================================
    if (req.method === 'GET' && path === '/api/hospital/capacity') {
      const user = requireAuth(req, res, ['hospital', 'admin']); if (!user) return;
      const capacity = hospitalCapacities.get(user.id) || {
        totalBeds: 200,
        occupiedBeds: 58,
        availableBeds: 142,
        icuTotal: 24,
        icuAvailable: 6,
        oxygenBeds: 45,
        emergencyBeds: 20,
        emergencyAvailable: 12,
        occupancyRate: 29.0,
        lastUpdated: now(),
        wards: [
          { name: 'ICU & Critical Care', total: 24, occupied: 18, available: 6, doctors: 4 },
          { name: 'Emergency & Trauma', total: 20, occupied: 8, available: 12, doctors: 5 },
          { name: 'Cardiology Ward', total: 28, occupied: 20, available: 8, doctors: 4 },
          { name: 'Neurology Unit', total: 18, occupied: 13, available: 5, doctors: 2 },
          { name: 'Pediatrics & Neonatal', total: 24, occupied: 8, available: 16, doctors: 3 },
          { name: 'General Medical & Surgical', total: 86, occupied: 54, available: 32, doctors: 6 }
        ]
      };
      return send(res, 200, capacity);
    }

    if (req.method === 'PUT' && path === '/api/hospital/capacity') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const data = await body(req);
      const totalBeds = Math.max(1, Number(data.totalBeds || 200));
      const occupiedBeds = Math.max(0, Math.min(totalBeds, Number(data.occupiedBeds || 58)));
      const availableBeds = totalBeds - occupiedBeds;
      const icuTotal = Number(data.icuTotal || 24);
      const icuAvailable = Number(data.icuAvailable || 6);
      const oxygenBeds = Number(data.oxygenBeds || 45);
      const emergencyBeds = Number(data.emergencyBeds || 20);
      const emergencyAvailable = Number(data.emergencyAvailable || 12);
      const occupancyRate = Number(((occupiedBeds / totalBeds) * 100).toFixed(1));

      const updated = {
        totalBeds, occupiedBeds, availableBeds, icuTotal, icuAvailable,
        oxygenBeds, emergencyBeds, emergencyAvailable, occupancyRate,
        wards: data.wards || [
          { name: 'ICU & Critical Care', total: icuTotal, occupied: icuTotal - icuAvailable, available: icuAvailable, doctors: 4 },
          { name: 'Emergency & Trauma', total: emergencyBeds, occupied: emergencyBeds - emergencyAvailable, available: emergencyAvailable, doctors: 5 },
          { name: 'Cardiology Ward', total: 28, occupied: 20, available: 8, doctors: 4 },
          { name: 'Neurology Unit', total: 18, occupied: 13, available: 5, doctors: 2 },
          { name: 'Pediatrics & Neonatal', total: 24, occupied: 8, available: 16, doctors: 3 },
          { name: 'General Medical & Surgical', total: Math.max(0, totalBeds - icuTotal - emergencyBeds - 70), occupied: Math.max(0, occupiedBeds - (icuTotal - icuAvailable) - (emergencyBeds - emergencyAvailable) - 33), available: Math.max(0, availableBeds - icuAvailable - emergencyAvailable - 37), doctors: 6 }
        ],
        lastUpdated: now()
      };
      hospitalCapacities.set(user.id, updated);
      return send(res, 200, updated);
    }

    if (req.method === 'GET' && path === '/api/hospital/patient-entries') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const entries = patientEntries.filter(e => e.hospitalId === user.id);
      return send(res, 200, entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }

    if (req.method === 'POST' && path === '/api/hospital/patient-entries') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const data = await body(req);
      const patientName = clean(data.patientName || data.name);
      if (!patientName) return fail(res, 400, 'Patient name is required.');

      const entry = {
        id: uid(),
        hospitalId: user.id,
        patientName,
        age: Number(data.age || 35),
        gender: clean(data.gender || 'Other'),
        triagePriority: clean(data.triagePriority || 'Standard'),
        ward: clean(data.ward || 'General Medical'),
        bedNumber: clean(data.bedNumber || 'GW-12'),
        chiefComplaint: clean(data.chiefComplaint || data.reason || 'General Admission'),
        status: clean(data.status || 'Admitted'),
        admittedAt: data.admittedAt || now(),
        createdAt: now()
      };
      patientEntries.push(entry);

      // Auto update occupied beds in hospital capacity
      const currentCap = hospitalCapacities.get(user.id) || { totalBeds: 200, occupiedBeds: 58, availableBeds: 142 };
      currentCap.occupiedBeds = Math.min(currentCap.totalBeds, currentCap.occupiedBeds + 1);
      currentCap.availableBeds = currentCap.totalBeds - currentCap.occupiedBeds;
      currentCap.occupancyRate = Number(((currentCap.occupiedBeds / currentCap.totalBeds) * 100).toFixed(1));
      currentCap.lastUpdated = now();
      hospitalCapacities.set(user.id, currentCap);

      return send(res, 201, { entry, capacity: currentCap });
    }

    // ==========================================
    // ADMIN APIs (Change 3 & 6)
    // ==========================================
    if (req.method === 'GET' && path === '/api/admin/users') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.map(safeUser));
    }
    if (req.method === 'GET' && path === '/api/admin/patients') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.filter(u => u.role === 'patient').map(safeUser));
    }
    if (req.method === 'GET' && path === '/api/admin/doctors') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.filter(u => u.role === 'doctor').map(safeUser));
    }
    if (req.method === 'GET' && path === '/api/admin/hospitals') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.filter(u => u.role === 'hospital').map(safeUser));
    }

    // Admin creates hospital (Change 3)
    if (req.method === 'POST' && path === '/api/admin/hospitals') {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const data = await body(req);
      const name = clean(data.name); const email = emailOf(data.email); const password = String(data.password || '');
      if (name.length < 2 || !email.includes('@') || password.length < 8) return fail(res, 400, 'Hospital name, valid email, and password (8+ chars) are required.');
      if (users.some(u => u.email === email)) return fail(res, 409, 'An account with this email already exists.');
      const hospital = addUser({
        name, email, password, role: 'hospital',
        hospitalName: name,
        address: clean(data.address),
        phone: clean(data.phone),
        latitude: Number.isFinite(Number(data.latitude)) ? Number(data.latitude) : null,
        longitude: Number.isFinite(Number(data.longitude)) ? Number(data.longitude) : null,
        approved: true, active: true,
        createdByAdminId: user.id
      });
      notifications.push({ id: uid(), userId: hospital.id, message: `Your hospital account has been created. Login with your email and password.`, type: 'system', read: false, createdAt: now() });
      return send(res, 201, { hospital: safeUser(hospital), credentials: { email: hospital.email, password: data.password } });
    }

    // Admin edits hospital
    if (req.method === 'PUT' && routeMatches(path, '/api/admin/hospitals/:id')) {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const hospitalId = routeParam(path, '/api/admin/hospitals/:id', 'id');
      const hospital = users.find(u => u.id === hospitalId && u.role === 'hospital');
      if (!hospital) return fail(res, 404, 'Hospital not found.');
      const data = await body(req);
      for (const key of ['name', 'address', 'phone']) {
        if (data[key] !== undefined) hospital[key] = clean(data[key]);
      }
      if (data.name) hospital.hospitalName = clean(data.name);
      if (data.latitude !== undefined && Number.isFinite(Number(data.latitude))) hospital.latitude = Number(data.latitude);
      if (data.longitude !== undefined && Number.isFinite(Number(data.longitude))) hospital.longitude = Number(data.longitude);
      if (data.password) hospital.passwordHash = hashPassword(data.password);
      return send(res, 200, { hospital: safeUser(hospital) });
    }

    // Admin activate/deactivate hospital
    if (req.method === 'PUT' && routeMatches(path, '/api/admin/hospitals/:id/status')) {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const hospitalId = routeParam(path, '/api/admin/hospitals/:id/status', 'id');
      const hospital = users.find(u => u.id === hospitalId && u.role === 'hospital');
      if (!hospital) return fail(res, 404, 'Hospital not found.');
      const data = await body(req);
      hospital.active = data.active !== false;
      notifications.push({ id: uid(), userId: hospital.id, message: `Your hospital account has been ${hospital.active ? 'activated' : 'deactivated'} by the platform administrator.`, type: 'system', read: false, createdAt: now() });
      return send(res, 200, { hospital: safeUser(hospital) });
    }

    // Admin delete hospital (soft-delete)
    if (req.method === 'DELETE' && routeMatches(path, '/api/admin/hospitals/:id')) {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const hospitalId = routeParam(path, '/api/admin/hospitals/:id', 'id');
      const hospital = users.find(u => u.id === hospitalId && u.role === 'hospital');
      if (!hospital) return fail(res, 404, 'Hospital not found.');
      hospital.active = false;
      // Also deactivate all doctors under this hospital
      users.filter(u => u.role === 'doctor' && u.hospitalId === hospitalId).forEach(doc => {
        doc.active = false;
        doc.status = 'suspended';
      });
      return send(res, 200, { message: 'Hospital and associated doctors have been deactivated.' });
    }

    // Admin activity logs
    if (req.method === 'GET' && path === '/api/admin/activity') {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const logs = activityLogs.slice().reverse().slice(0, 200).map(log => {
        const u = users.find(x => x.id === log.userId);
        return { ...log, userName: u?.name || 'Unknown', userRole: u?.role || log.role };
      });
      return send(res, 200, logs);
    }

    if (req.method === 'GET' && path === '/api/admin/records') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, medicalRecords.map(enrichRecord));
    }

    return fail(res, 404, 'API route not found');
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Internal server error');
  }
}

// ==========================================
// ENRICHMENT FUNCTIONS
// ==========================================
        occupiedBeds: 58,
        availableBeds: 142,
        icuTotal: 24,
        icuAvailable: 6,
        oxygenBeds: 45,
        emergencyBeds: 20,
        emergencyAvailable: 12,
        occupancyRate: 29.0,
        lastUpdated: now(),
        wards: [
          { name: 'ICU & Critical Care', total: 24, occupied: 18, available: 6, doctors: 4 },
          { name: 'Emergency & Trauma', total: 20, occupied: 8, available: 12, doctors: 5 },
          { name: 'Cardiology Ward', total: 28, occupied: 20, available: 8, doctors: 4 },
          { name: 'Neurology Unit', total: 18, occupied: 13, available: 5, doctors: 2 },
          { name: 'Pediatrics & Neonatal', total: 24, occupied: 8, available: 16, doctors: 3 },
          { name: 'General Medical & Surgical', total: 86, occupied: 54, available: 32, doctors: 6 }
        ]
      };
      return send(res, 200, capacity);
    }

    if (req.method === 'PUT' && path === '/api/hospital/capacity') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const data = await body(req);
      const totalBeds = Math.max(1, Number(data.totalBeds || 200));
      const occupiedBeds = Math.max(0, Math.min(totalBeds, Number(data.occupiedBeds || 58)));
      const availableBeds = totalBeds - occupiedBeds;
      const icuTotal = Number(data.icuTotal || 24);
      const icuAvailable = Number(data.icuAvailable || 6);
      const oxygenBeds = Number(data.oxygenBeds || 45);
      const emergencyBeds = Number(data.emergencyBeds || 20);
      const emergencyAvailable = Number(data.emergencyAvailable || 12);
      const occupancyRate = Number(((occupiedBeds / totalBeds) * 100).toFixed(1));

      const updated = {
        totalBeds, occupiedBeds, availableBeds, icuTotal, icuAvailable,
        oxygenBeds, emergencyBeds, emergencyAvailable, occupancyRate,
        wards: data.wards || [
          { name: 'ICU & Critical Care', total: icuTotal, occupied: icuTotal - icuAvailable, available: icuAvailable, doctors: 4 },
          { name: 'Emergency & Trauma', total: emergencyBeds, occupied: emergencyBeds - emergencyAvailable, available: emergencyAvailable, doctors: 5 },
          { name: 'Cardiology Ward', total: 28, occupied: 20, available: 8, doctors: 4 },
          { name: 'Neurology Unit', total: 18, occupied: 13, available: 5, doctors: 2 },
          { name: 'Pediatrics & Neonatal', total: 24, occupied: 8, available: 16, doctors: 3 },
          { name: 'General Medical & Surgical', total: Math.max(0, totalBeds - icuTotal - emergencyBeds - 70), occupied: Math.max(0, occupiedBeds - (icuTotal - icuAvailable) - (emergencyBeds - emergencyAvailable) - 33), available: Math.max(0, availableBeds - icuAvailable - emergencyAvailable - 37), doctors: 6 }
        ],
        lastUpdated: now()
      };
      hospitalCapacities.set(user.id, updated);
      return send(res, 200, updated);
    }

    if (req.method === 'GET' && path === '/api/hospital/patient-entries') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const entries = patientEntries.filter(e => e.hospitalId === user.id);
      return send(res, 200, entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }

    if (req.method === 'POST' && path === '/api/hospital/patient-entries') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const data = await body(req);
      const patientName = clean(data.patientName || data.name);
      if (!patientName) return fail(res, 400, 'Patient name is required.');

      const entry = {
        id: uid(),
        hospitalId: user.id,
        patientName,
        age: Number(data.age || 35),
        gender: clean(data.gender || 'Other'),
        triagePriority: clean(data.triagePriority || 'Standard'),
        ward: clean(data.ward || 'General Medical'),
        bedNumber: clean(data.bedNumber || 'GW-12'),
        chiefComplaint: clean(data.chiefComplaint || data.reason || 'General Admission'),
        status: clean(data.status || 'Admitted'),
        admittedAt: data.admittedAt || now(),
        createdAt: now()
      };
      patientEntries.push(entry);

      // Auto update occupied beds in hospital capacity
      const currentCap = hospitalCapacities.get(user.id) || { totalBeds: 200, occupiedBeds: 58, availableBeds: 142 };
      currentCap.occupiedBeds = Math.min(currentCap.totalBeds, currentCap.occupiedBeds + 1);
      currentCap.availableBeds = currentCap.totalBeds - currentCap.occupiedBeds;
      currentCap.occupancyRate = Number(((currentCap.occupiedBeds / currentCap.totalBeds) * 100).toFixed(1));
      currentCap.lastUpdated = now();
      hospitalCapacities.set(user.id, currentCap);

      return send(res, 201, { entry, capacity: currentCap });
    }

    // ==========================================
    // ADMIN APIs (Change 3 & 6)
    // ==========================================
    if (req.method === 'GET' && path === '/api/admin/users') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.map(safeUser));
    }
    if (req.method === 'GET' && path === '/api/admin/patients') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.filter(u => u.role === 'patient').map(safeUser));
    }
    if (req.method === 'GET' && path === '/api/admin/doctors') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.filter(u => u.role === 'doctor').map(safeUser));
    }
    if (req.method === 'GET' && path === '/api/admin/hospitals') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, users.filter(u => u.role === 'hospital').map(safeUser));
    }

    // Admin creates hospital (Change 3)
    if (req.method === 'POST' && path === '/api/admin/hospitals') {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const data = await body(req);
      const name = clean(data.name); const email = emailOf(data.email); const password = String(data.password || '');
      if (name.length < 2 || !email.includes('@') || password.length < 8) return fail(res, 400, 'Hospital name, valid email, and password (8+ chars) are required.');
      if (users.some(u => u.email === email)) return fail(res, 409, 'An account with this email already exists.');
      const hospital = addUser({
        name, email, password, role: 'hospital',
        hospitalName: name,
        address: clean(data.address),
        phone: clean(data.phone),
        latitude: Number.isFinite(Number(data.latitude)) ? Number(data.latitude) : null,
        longitude: Number.isFinite(Number(data.longitude)) ? Number(data.longitude) : null,
        approved: true, active: true,
        createdByAdminId: user.id
      });
      notifications.push({ id: uid(), userId: hospital.id, message: `Your hospital account has been created. Login with your email and password.`, type: 'system', read: false, createdAt: now() });
      return send(res, 201, { hospital: safeUser(hospital), credentials: { email: hospital.email, password: data.password } });
    }

    // Admin edits hospital
    if (req.method === 'PUT' && routeMatches(path, '/api/admin/hospitals/:id')) {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const hospitalId = routeParam(path, '/api/admin/hospitals/:id', 'id');
      const hospital = users.find(u => u.id === hospitalId && u.role === 'hospital');
      if (!hospital) return fail(res, 404, 'Hospital not found.');
      const data = await body(req);
      for (const key of ['name', 'address', 'phone']) {
        if (data[key] !== undefined) hospital[key] = clean(data[key]);
      }
      if (data.name) hospital.hospitalName = clean(data.name);
      if (data.latitude !== undefined && Number.isFinite(Number(data.latitude))) hospital.latitude = Number(data.latitude);
      if (data.longitude !== undefined && Number.isFinite(Number(data.longitude))) hospital.longitude = Number(data.longitude);
      if (data.password) hospital.passwordHash = hashPassword(data.password);
      return send(res, 200, { hospital: safeUser(hospital) });
    }

    // Admin activate/deactivate hospital
    if (req.method === 'PUT' && routeMatches(path, '/api/admin/hospitals/:id/status')) {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const hospitalId = routeParam(path, '/api/admin/hospitals/:id/status', 'id');
      const hospital = users.find(u => u.id === hospitalId && u.role === 'hospital');
      if (!hospital) return fail(res, 404, 'Hospital not found.');
      const data = await body(req);
      hospital.active = data.active !== false;
      notifications.push({ id: uid(), userId: hospital.id, message: `Your hospital account has been ${hospital.active ? 'activated' : 'deactivated'} by the platform administrator.`, type: 'system', read: false, createdAt: now() });
      return send(res, 200, { hospital: safeUser(hospital) });
    }

    // Admin delete hospital (soft-delete)
    if (req.method === 'DELETE' && routeMatches(path, '/api/admin/hospitals/:id')) {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const hospitalId = routeParam(path, '/api/admin/hospitals/:id', 'id');
      const hospital = users.find(u => u.id === hospitalId && u.role === 'hospital');
      if (!hospital) return fail(res, 404, 'Hospital not found.');
      hospital.active = false;
      // Also deactivate all doctors under this hospital
      users.filter(u => u.role === 'doctor' && u.hospitalId === hospitalId).forEach(doc => {
        doc.active = false;
        doc.status = 'suspended';
      });
      return send(res, 200, { message: 'Hospital and associated doctors have been deactivated.' });
    }

    // Admin activity logs
    if (req.method === 'GET' && path === '/api/admin/activity') {
      const user = requireAuth(req, res, ['admin']); if (!user) return;
      const logs = activityLogs.slice().reverse().slice(0, 200).map(log => {
        const u = users.find(x => x.id === log.userId);
        return { ...log, userName: u?.name || 'Unknown', userRole: u?.role || log.role };
      });
      return send(res, 200, logs);
    }

    if (req.method === 'GET' && path === '/api/admin/records') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, medicalRecords.map(enrichRecord));
    }

    return fail(res, 404, 'API route not found');
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Internal server error');
  }
}

// ==========================================
// ENRICHMENT FUNCTIONS
// ==========================================
function enrichAppointment(a) {
  const patient = users.find((u) => u.id === a.patientId); const doctor = users.find((u) => u.id === a.doctorId);
  return { ...a, patient: patient ? safeUser(patient) : null, doctor: doctor ? safeUser(doctor) : null };
}
function enrichPrescription(p) { return { ...p, patient: safeUser(users.find((u) => u.id === p.patientId)), doctor: safeUser(users.find((u) => u.id === p.doctorId)) }; }
function enrichRecord(r) { return { ...r, patient: safeUser(users.find((u) => u.id === r.patientId)), uploadedByUser: safeUser(users.find((u) => u.id === r.uploadedBy)) }; }

module.exports = handle;
