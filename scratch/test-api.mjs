async function test() {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hospital@medismart.local', password: 'Hospital@123', role: 'hospital' })
  });
  const auth = await loginRes.json();
  console.log('Login Result:', auth.user ? `${auth.user.name} (${auth.user.role})` : 'FAILED', auth);

  const capRes = await fetch('http://localhost:4000/api/hospital/capacity', {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  const cap = await capRes.json();
  console.log('Hospital Capacity:', cap);

  const admitRes = await fetch('http://localhost:4000/api/hospital/patient-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({
      patientName: 'Kavita Sen',
      age: 42,
      gender: 'Female',
      triagePriority: 'Urgent',
      ward: 'ICU & Critical Care',
      bedNumber: 'ICU-07',
      chiefComplaint: 'Post-cardiac intervention recovery'
    })
  });
  const admitData = await admitRes.json();
  console.log('Patient Admission Recorded:', admitData.entry?.patientName, 'New Available Beds:', admitData.capacity?.availableBeds);
}

test().catch(console.error);
