'use strict';

const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const users = [];
const appointments = [];
const prescriptions = [];
const medicalRecords = [];
const notifications = [];
const emergencyAlerts = [];
const sessions = new Map();

const id = () => crypto.randomUUID();
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
    id: id(),
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
    active: true,
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
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function nearestHospital(latitude, longitude) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return null;
  const hospitals = users.filter(u => u.role === 'hospital' && u.active && Number.isFinite(u.latitude) && Number.isFinite(u.longitude));
  return hospitals.map(h => ({ hospital:h, distanceKm:distanceKm(Number(latitude),Number(longitude),h.latitude,h.longitude) }))
    .sort((a,b)=>a.distanceKm-b.distanceKm)[0] || null;
}

function seed() {
  if (users.length) return;
  const hospital = addUser({ name: 'Medi Smart City Hospital', email: 'hospital@medismart.local', password: 'Hospital@123', role: 'hospital', hospitalName: 'Medi Smart City Hospital', address: 'Main Road, Hyderabad', latitude: 17.3850, longitude: 78.4867, approved: true });
  addUser({ name: 'Dr. Ananya Rao', email: 'doctor@medismart.local', password: 'Doctor@123', role: 'doctor', specialization: 'Cardiology', department: 'Cardiology', hospitalId: hospital.id, hospitalName: hospital.name, approved: true });
  const patient = addUser({ name: 'Rahul Kumar', email: 'patient@medismart.local', password: 'Patient@123', role: 'patient', phone: '9000000000', bloodGroup: 'O+', approved: true });
  addUser({ name: 'Medi Smart Administrator', email: 'admin@medismart.local', password: 'Admin@123', role: 'admin', approved: true });
  const doctor = users.find((u) => u.role === 'doctor');
  const appointment = {
    id: id(), patientId: patient.id, doctorId: doctor.id, department: doctor.department,
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '10:30',
    reason: 'Routine consultation', status: 'confirmed', diagnosis: '', treatmentNotes: '', createdAt: now()
  };
  appointments.push(appointment);
  prescriptions.push({ id: id(), patientId: patient.id, doctorId: doctor.id, appointmentId: appointment.id, medicines: [{ name: 'Paracetamol', dosage: '500 mg', frequency: 'After food, twice daily', duration: '3 days' }], instructions: 'Take with water and rest well.', date: now() });
  medicalRecords.push({ id: id(), patientId: patient.id, uploadedBy: doctor.id, title: 'Routine Check-up', type: 'lab', description: 'Sample demo medical record.', date: now() });
  notifications.push({ id: id(), userId: patient.id, message: 'Your demo appointment is confirmed.', type: 'appointment', read: false, createdAt: now() });
}
seed();

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Vary': 'Origin'
  });
  res.end(body);
}

function fail(res, status, message) { send(res, status, { message }); }

async function body(req) {
  if (req.body) {
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString());
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  if (req.complete) return {};
  return await new Promise((resolve, reject) => {
    let raw = '';
    const timer = setTimeout(() => reject(new Error('Timeout reading request body')), 3000);
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) { clearTimeout(timer); req.destroy(new Error('Request body too large')); }
    });
    req.on('end', () => {
      clearTimeout(timer);
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', (err) => { clearTimeout(timer); reject(err); });
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

async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/health') return send(res, 200, { ok: true, service: 'Medi Smart API', time: now() });

  try {
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
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, user.id);
      return send(res, 200, { token, user: safeUser(user) });
    }

    if (req.method === 'GET' && path === '/api/auth/me') {
      const user = requireAuth(req, res); if (!user) return; return send(res, 200, { user: safeUser(user) });
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/users/:id')) {
      const user = requireAuth(req, res); if (!user) return;
      const targetId = routeParam(path, '/api/users/:id', 'id');
      if (user.id !== targetId && user.role !== 'admin') return fail(res, 403, 'You can only edit your own profile.');
      const data = await body(req); const target = users.find((u) => u.id === targetId); if (!target) return fail(res, 404, 'User not found');
      for (const key of ['name','phone','bloodGroup','dateOfBirth','specialization','department','address']) if (data[key] !== undefined) target[key] = clean(data[key]);
      return send(res, 200, { user: safeUser(target) });
    }

    if (req.method === 'GET' && path === '/api/doctors') {
      const user = requireAuth(req, res); if (!user) return;
      const doctors = users.filter((u) => u.role === 'doctor' && u.active && u.approved).map(safeUser);
      return send(res, 200, doctors);
    }

    if (req.method === 'GET' && path === '/api/appointments/my') {
      const user = requireAuth(req, res, ['patient']); if (!user) return;
      return send(res, 200, appointments.filter((a) => a.patientId === user.id).sort((a,b) => b.date.localeCompare(a.date)).map(enrichAppointment));
    }

    if (req.method === 'GET' && path === '/api/appointments/doctor') {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      return send(res, 200, appointments.filter((a) => a.doctorId === user.id).sort((a,b) => a.date.localeCompare(b.date)).map(enrichAppointment));
    }

    if (req.method === 'GET' && path === '/api/appointments') {
      const user = requireAuth(req, res, ['hospital','admin']); if (!user) return;
      const list = user.role === 'hospital' ? appointments.filter((a) => users.find((d) => d.id === a.doctorId)?.hospitalId === user.id) : appointments;
      return send(res, 200, list.map(enrichAppointment));
    }

    if (req.method === 'POST' && path === '/api/appointments') {
      const user = requireAuth(req, res, ['patient']); if (!user) return;
      const data = await body(req); const doctor = users.find((u) => u.id === clean(data.doctor) && u.role === 'doctor');
      if (!doctor || !data.date || !data.time || !data.department) return fail(res, 400, 'Doctor, department, date and time are required.');
      const appointment = { id: id(), patientId: user.id, doctorId: doctor.id, department: clean(data.department), date: clean(data.date), time: clean(data.time), reason: clean(data.reason), status: 'pending', diagnosis: '', treatmentNotes: '', createdAt: now() };
      appointments.push(appointment); notifications.push({ id: id(), userId: doctor.id, message: `New appointment request from ${user.name}.`, type: 'appointment', read: false, createdAt: now() });
      return send(res, 201, enrichAppointment(appointment));
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/appointments/:id/status')) {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      const appointment = appointments.find((a) => a.id === routeParam(path, '/api/appointments/:id/status', 'id') && a.doctorId === user.id); if (!appointment) return fail(res, 404, 'Appointment not found');
      const data = await body(req); if (data.status && !['pending','confirmed','completed','cancelled'].includes(data.status)) return fail(res, 400, 'Invalid appointment status.');
      if (data.status) appointment.status = data.status; if (data.diagnosis !== undefined) appointment.diagnosis = clean(data.diagnosis); if (data.treatmentNotes !== undefined) appointment.treatmentNotes = clean(data.treatmentNotes);
      notifications.push({ id: id(), userId: appointment.patientId, message: `Your appointment status is now ${appointment.status}.`, type: 'appointment', read: false, createdAt: now() });
      return send(res, 200, enrichAppointment(appointment));
    }

    if (req.method === 'GET' && path === '/api/prescriptions') {
      const user = requireAuth(req, res); if (!user) return;
      const list = user.role === 'patient' ? prescriptions.filter((p) => p.patientId === user.id) : user.role === 'doctor' ? prescriptions.filter((p) => p.doctorId === user.id) : prescriptions;
      return send(res, 200, list.map(enrichPrescription));
    }

    if (req.method === 'POST' && path === '/api/prescriptions') {
      const user = requireAuth(req, res, ['doctor']); if (!user) return;
      const data = await body(req); const patient = users.find((u) => u.id === clean(data.patientId) && u.role === 'patient');
      if (!patient || !Array.isArray(data.medicines) || !data.medicines.length) return fail(res, 400, 'Patient and at least one medicine are required.');
      const prescription = { id: id(), patientId: patient.id, doctorId: user.id, appointmentId: clean(data.appointmentId), medicines: data.medicines.map((m) => ({ name: clean(m.name), dosage: clean(m.dosage), frequency: clean(m.frequency), duration: clean(m.duration) })), instructions: clean(data.instructions), date: now() };
      prescriptions.push(prescription); notifications.push({ id: id(), userId: patient.id, message: 'A new prescription is available.', type: 'prescription', read: false, createdAt: now() }); return send(res, 201, enrichPrescription(prescription));
    }

    if (req.method === 'GET' && path === '/api/records') {
      const user = requireAuth(req, res); if (!user) return;
      const list = user.role === 'patient' ? medicalRecords.filter((r) => r.patientId === user.id) : user.role === 'doctor' ? (() => { const patientIds = new Set(appointments.filter(a => a.doctorId === user.id).map(a => a.patientId)); return medicalRecords.filter(r => patientIds.has(r.patientId)); })() : user.role === 'hospital' ? (() => { const doctorIds = new Set(users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(u => u.id)); return medicalRecords.filter(r => doctorIds.has(r.uploadedBy) || r.uploadedBy === user.id); })() : medicalRecords;
      return send(res, 200, list.map(enrichRecord));
    }

    if (req.method === 'POST' && path === '/api/records') {
      const user = requireAuth(req, res, ['doctor','hospital','admin']); if (!user) return;
      const data = await body(req); const patient = users.find((u) => u.id === clean(data.patientId) && u.role === 'patient');
      if (!patient || !clean(data.title)) return fail(res, 400, 'Patient and record title are required.');
      const record = { id: id(), patientId: patient.id, uploadedBy: user.id, title: clean(data.title), type: clean(data.type) || 'other', description: clean(data.description), fileUrl: clean(data.fileUrl), date: clean(data.date) || now() };
      medicalRecords.push(record); notifications.push({ id: id(), userId: patient.id, message: `New medical record: ${record.title}.`, type: 'record', read: false, createdAt: now() }); return send(res, 201, enrichRecord(record));
    }

    if (req.method === 'GET' && path === '/api/notifications') {
      const user = requireAuth(req, res); if (!user) return;
      return send(res, 200, notifications.filter((n) => n.userId === user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
    }

    if (req.method === 'PUT' && routeMatches(path, '/api/notifications/:id/read')) {
      const user = requireAuth(req, res); if (!user) return; const n = notifications.find((x) => x.id === routeParam(path, '/api/notifications/:id/read', 'id') && x.userId === user.id); if (!n) return fail(res, 404, 'Notification not found'); n.read = true; return send(res, 200, n);
    }

    if (req.method === 'POST' && path === '/api/emergency') {
      const user = requireAuth(req, res, ['patient']); if (!user) return;
      const data = await body(req);
      const nearest = nearestHospital(Number(data.latitude), Number(data.longitude));
      const alert = { id: id(), patientId: user.id, trigger: clean(data.trigger) || 'manual', latitude: Number(data.latitude) || null, longitude: Number(data.longitude) || null, accuracy: Number(data.accuracy) || null, status: nearest ? 'sent-to-nearest-hospital' : 'sent-to-hospital-network', nearestHospitalId: nearest?.hospital.id || null, createdAt: now() };
      emergencyAlerts.push(alert);
      if (nearest) {
        notifications.push({ id:id(), userId:nearest.hospital.id, message:`EMERGENCY ALERT from ${user.name}. Location: ${alert.latitude ?? 'unavailable'}, ${alert.longitude ?? 'unavailable'}. Distance: ${nearest.distanceKm.toFixed(2)} km.`, type:'emergency', read:false, createdAt:now() });
      }
      users.filter((u) => u.role === 'admin' && u.active).forEach((admin) => notifications.push({ id:id(), userId:admin.id, message:`Emergency alert from ${user.name}. Nearest hospital: ${nearest?.hospital.name || 'network unavailable'}.`, type:'emergency', read:false, createdAt:now() }));
      return send(res, 201, { alert, nearestHospital: nearest ? { id:nearest.hospital.id, name:nearest.hospital.name, address:nearest.hospital.address, distanceKm:Number(nearest.distanceKm.toFixed(2)) } : null, hospitalsNotified: nearest ? 1 : 0 });
    }

    if (req.method === 'GET' && path === '/api/emergency') {
      const user = requireAuth(req, res, ['hospital','admin']); if (!user) return;
      return send(res, 200, emergencyAlerts.slice().reverse().map((a) => ({ ...a, patient: safeUser(users.find((u) => u.id === a.patientId)), nearestHospital: safeUser(users.find((u) => u.id === a.nearestHospitalId)) })));
    }

    if (req.method === 'GET' && path === '/api/hospital/doctors') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      return send(res, 200, users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(safeUser));
    }

    if (req.method === 'GET' && path === '/api/hospital/patients') {
      const user = requireAuth(req, res, ['hospital']); if (!user) return;
      const doctorIds = new Set(users.filter(u => u.role === 'doctor' && u.hospitalId === user.id).map(u => u.id));
      const patientIds = new Set(appointments.filter(a => doctorIds.has(a.doctorId)).map(a => a.patientId));
      return send(res, 200, users.filter(u => u.role === 'patient' && patientIds.has(u.id)).map(safeUser));
    }

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
    if (req.method === 'GET' && path === '/api/admin/appointments') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, appointments.map(enrichAppointment));
    }
    if (req.method === 'GET' && path === '/api/admin/records') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, medicalRecords.map(enrichRecord));
    }
    if (req.method === 'GET' && path === '/api/admin/prescriptions') {
      const user = requireAuth(req, res, ['admin']); if (!user) return; return send(res, 200, prescriptions.map(enrichPrescription));
    }

    return fail(res, 404, 'API route not found');
  } catch (error) {
    console.error(error);
    return fail(res, 500, 'Internal server error');
  }
}

function enrichAppointment(a) {
  const patient = users.find((u) => u.id === a.patientId); const doctor = users.find((u) => u.id === a.doctorId);
  return { ...a, patient: patient ? safeUser(patient) : null, doctor: doctor ? safeUser(doctor) : null };
}
function enrichPrescription(p) { return { ...p, patient: safeUser(users.find((u) => u.id === p.patientId)), doctor: safeUser(users.find((u) => u.id === p.doctorId)) }; }
function enrichRecord(r) { return { ...r, patient: safeUser(users.find((u) => u.id === r.patientId)), uploadedByUser: safeUser(users.find((u) => u.id === r.uploadedBy)) }; }

module.exports = handle;

