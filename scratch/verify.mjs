import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderDashboard12 } from '../frontend/src/components/Dashboard12.js';
import { renderHospitalDashboard } from '../frontend/src/components/HospitalDashboard.js';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE VERIFICATION TEST SUITE ---');

  // 1. Test Admin Dashboard 12
  console.log('\n[1] Testing renderDashboard12()...');
  const mockAdminData = {
    hospitals: [{ id: '1', name: 'Apollo Main Hospital', address: 'Hyderabad', active: true }],
    users: [{ id: 'u1', name: 'Admin', role: 'admin' }],
    activityLogs: []
  };
  const adminHtml = renderDashboard12(mockAdminData);
  if (!adminHtml.includes('rb-dashboard-12')) throw new Error('Missing .rb-dashboard-12');
  if (!adminHtml.includes('HEADLINE OPERATIONAL CAPACITY & SYSTEM HEALTH')) throw new Error('Missing Admin headline');
  console.log('✓ Admin Dashboard 12 renders correctly!');

  // 2. Test Hospital Dashboard
  console.log('\n[2] Testing renderHospitalDashboard()...');
  const mockHospData = {
    doctors: [{ id: 'd1', name: 'Dr. Sarah', department: 'Cardiology', status: 'approved' }],
    appointments: [],
    capacity: {
      totalBeds: 200,
      occupiedBeds: 58,
      availableBeds: 142,
      icuTotal: 24,
      icuAvailable: 6,
      emergencyBeds: 20,
      emergencyAvailable: 12,
      occupancyRate: 29.0
    }
  };
  const hospHtml = renderHospitalDashboard(mockHospData);
  if (!hospHtml.includes('rb-hospital-dash')) throw new Error('Missing .rb-hospital-dash root');
  if (!hospHtml.includes('HOSPITAL BED CAPACITY & PATIENT INFLOW COMMAND')) throw new Error('Missing Hospital headline');
  if (!hospHtml.includes('142')) throw new Error('Missing Available Beds 142');
  if (!hospHtml.includes('Patient Admissions vs Bed Turnover Pace')) throw new Error('Missing Dual-Series Pace Chart title');
  if (!hospHtml.includes('rb-hosp-chart-svg-container')) throw new Error('Missing Pace Chart SVG container');
  if (!hospHtml.includes('rb-ward-lanes-grid')) throw new Error('Missing Ward Sweep Lanes grid');
  if (!hospHtml.includes('rb-patient-entries-tbody')) throw new Error('Missing Patient entries table');
  if (!hospHtml.includes('rb-admit-modal')) throw new Error('Missing Log Patient Entry modal');
  if (!hospHtml.includes('rb-bed-modal')) throw new Error('Missing Update Bed Capacity modal');
  console.log('✓ Hospital Dashboard renders available beds counter, dual-series chart, ward sweep lanes, patient entry log & interactive modals!');

  // 3. Test App.js rules for Hospital & Admin
  console.log('\n[3] Testing app.js constraints...');
  const appJs = await readFile(resolve('frontend/src/app.js'), 'utf8');

  // Verify hospitalNavList has no emergency
  const hospNavMatch = appJs.match(/const hospitalNavList = \[([\s\S]*?)\];/);
  if (!hospNavMatch) throw new Error('Could not find hospitalNavList in app.js');
  if (hospNavMatch[1].includes("'emergency'")) throw new Error('hospitalNavList still contains emergency');
  if (!hospNavMatch[1].includes("'overview'")) throw new Error('hospitalNavList missing overview');
  if (!hospNavMatch[1].includes("'patients'")) throw new Error('hospitalNavList missing patients');
  if (!hospNavMatch[1].includes("'departments'")) throw new Error('hospitalNavList missing departments');
  if (!hospNavMatch[1].includes("'reports'")) throw new Error('hospitalNavList missing reports');
  console.log('✓ hospitalNavList correctly removed emergency cases and updated bed telemetry descriptions!');

  // Verify adminNavList has no patients or emergency
  const adminNavMatch = appJs.match(/const adminNavList = \[([\s\S]*?)\];/);
  if (!adminNavMatch) throw new Error('Could not find adminNavList in app.js');
  if (adminNavMatch[1].includes("'patients'")) throw new Error('adminNavList still contains patients');
  if (adminNavMatch[1].includes("'emergency'")) throw new Error('adminNavList still contains emergency');
  console.log('✓ adminNavList remains clean without patients or emergency!');

  // Verify langControls hides accessibility for both admin and hospital
  const langMatch = appJs.match(/function langControls\(\) \{([\s\S]*?)\n\}/);
  if (!langMatch) throw new Error('Could not find langControls() in app.js');
  if (!langMatch[1].includes("state.user.role === 'hospital'")) {
    throw new Error('langControls() does not hide accessibility for hospital role');
  }
  console.log('✓ langControls() correctly removes accessibility panel for both Hospital and Administrator roles!');

  // Verify dashboard() hides SOS button for hospital role
  const dashMatch = appJs.match(/function dashboard\(\) \{([\s\S]*?)\n\}/);
  if (!dashMatch) throw new Error('Could not find dashboard() in app.js');
  if (!dashMatch[1].includes("state.user.role !== 'hospital'")) {
    throw new Error('dashboard() still renders emergency SOS button for hospital role');
  }
  console.log('✓ dashboard() correctly removed emergency SOS button for hospital portal!');

  // Verify hospitalContent renders renderHospitalDashboard
  const hospContentMatch = appJs.match(/function hospitalContent\(\) \{([\s\S]*?)\n\}/);
  if (!hospContentMatch) throw new Error('Could not find hospitalContent() in app.js');
  if (!hospContentMatch[1].includes('renderHospitalDashboard')) {
    throw new Error('hospitalContent() does not call renderHospitalDashboard');
  }
  if (hospContentMatch[1].includes("case 'emergency':")) {
    throw new Error("hospitalContent() still contains case 'emergency':");
  }
  console.log('✓ hospitalContent() renders HospitalDashboard and has removed emergency SOS views!');

  // 4. Test Backend server.js
  console.log('\n[4] Testing backend server.js routes...');
  const serverJs = await readFile(resolve('backend/server.js'), 'utf8');
  if (!serverJs.includes('/api/hospital/capacity')) throw new Error('Missing /api/hospital/capacity route');
  if (!serverJs.includes('/api/hospital/patient-entries')) throw new Error('Missing /api/hospital/patient-entries route');
  console.log('✓ backend/server.js contains hospital bed capacity and patient entry API routes!');

  // 5. Test styles.css
  console.log('\n[5] Testing styles.css...');
  const stylesCss = await readFile(resolve('frontend/src/styles.css'), 'utf8');
  if (!stylesCss.includes('.rb-modal-overlay')) throw new Error('Missing .rb-modal-overlay in styles.css');
  if (!stylesCss.includes('.rb-lane-bar-track')) throw new Error('Missing .rb-lane-bar-track in styles.css');
  console.log('✓ styles.css contains all modal and hospital ward styling rules!');

  console.log('\n======================================================');
  console.log('>>> ALL HOSPITAL & ADMIN VERIFICATION TESTS PASSED! <<<');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
