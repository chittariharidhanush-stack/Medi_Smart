async function testBookingFlow() {
  console.log('--- TESTING PATIENT REQUEST -> DOCTOR CONFIRMATION FLOW ---');

  // 1. Patient Login
  console.log('\n[1] Logging in as Patient (Rahul Kumar)...');
  const patLoginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@medismart.local', password: 'Patient@123', role: 'patient' })
  });
  const patAuth = await patLoginRes.json();
  if (!patAuth.token) throw new Error('Patient login failed: ' + JSON.stringify(patAuth));
  console.log(`✓ Patient logged in: ${patAuth.user.name} (ID: ${patAuth.user.id})`);

  // 2. Doctor Login
  console.log('\n[2] Logging in as Doctor (Dr. Ananya Rao)...');
  const docLoginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor@medismart.local', password: 'Doctor@123', role: 'doctor' })
  });
  const docAuth = await docLoginRes.json();
  if (!docAuth.token) throw new Error('Doctor login failed: ' + JSON.stringify(docAuth));
  console.log(`✓ Doctor logged in: ${docAuth.user.name} (ID: ${docAuth.user.id})`);

  // 3. Patient Sends Appointment Request
  const todayStr = new Date().toISOString().slice(0, 10);
  console.log(`\n[3] Patient sending appointment request to Dr. ${docAuth.user.name} for Today (${todayStr}) at 11:30...`);
  const bookRes = await fetch('http://localhost:4000/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patAuth.token}`
    },
    body: JSON.stringify({
      doctor: docAuth.user.id,
      department: 'Cardiology',
      date: todayStr,
      time: '11:30',
      reason: 'Chest tightness and shortness of breath during exercise'
    })
  });
  const newAppt = await bookRes.json();
  if (!newAppt.id || newAppt.status !== 'pending') {
    throw new Error('Appointment booking failed: ' + JSON.stringify(newAppt));
  }
  console.log(`✓ Appointment request created! ID: ${newAppt.id}, Status: ${newAppt.status}`);

  // 4. Doctor Checks Today's Appointments & Finds Pending Request
  console.log(`\n[4] Doctor querying today's appointments schedule...`);
  const docApptsRes = await fetch('http://localhost:4000/api/appointments/doctor', {
    headers: { Authorization: `Bearer ${docAuth.token}` }
  });
  const docAppts = await docApptsRes.json();
  const receivedAppt = docAppts.find(a => a.id === newAppt.id);
  if (!receivedAppt) {
    throw new Error('Appointment request did not appear in doctor appointments list!');
  }
  if (receivedAppt.status !== 'pending') {
    throw new Error(`Expected status 'pending', got '${receivedAppt.status}'`);
  }
  console.log(`✓ Request successfully reflected in Doctor schedule! Patient: ${receivedAppt.patient?.name}, Status: ${receivedAppt.status}`);

  // 5. Doctor Confirms Appointment
  console.log(`\n[5] Doctor clicking 'Confirm Request'...`);
  const confirmRes = await fetch(`http://localhost:4000/api/appointments/${newAppt.id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${docAuth.token}`
    },
    body: JSON.stringify({ status: 'confirmed' })
  });
  const confirmedAppt = await confirmRes.json();
  if (confirmedAppt.status !== 'confirmed') {
    throw new Error('Doctor confirmation failed: ' + JSON.stringify(confirmedAppt));
  }
  console.log(`✓ Doctor confirmed appointment! Status: ${confirmedAppt.status}`);

  // 6. Patient Checks Appointments & Verifies 'Confirmed' Status
  console.log(`\n[6] Patient verifying reflected confirmation status...`);
  const patApptsRes = await fetch('http://localhost:4000/api/appointments/my', {
    headers: { Authorization: `Bearer ${patAuth.token}` }
  });
  const patAppts = await patApptsRes.json();
  const patReflectedAppt = patAppts.find(a => a.id === newAppt.id);
  if (!patReflectedAppt) {
    throw new Error('Appointment not found in patient appointments list!');
  }
  if (patReflectedAppt.status !== 'confirmed') {
    throw new Error(`Expected status 'confirmed' for patient, got '${patReflectedAppt.status}'`);
  }
  console.log(`✓ CONFIRMED status successfully reflected on Patient side! Status: ${patReflectedAppt.status}, Doctor: ${patReflectedAppt.doctor?.name}`);

  console.log('\n==========================================================');
  console.log('>>> COMPLETE DOCTOR-PATIENT APPOINTMENT FLOW PASSED 100% <<<');
  console.log('==========================================================\n');
}

testBookingFlow().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
