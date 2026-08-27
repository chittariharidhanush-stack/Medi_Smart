import { initStrands } from './components/Strands.js';
import { initMagicBento } from './components/MagicBento.js';
import { initStaggeredMenu } from './components/StaggeredMenu.js';
import { renderDashboard12, initDashboard12 } from './components/Dashboard12.js';
import { renderHospitalDashboard, initHospitalDashboard } from './components/HospitalDashboard.js';

const API = window.__MEDI_API__ || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:4000/api' : '/api');
const app = document.getElementById('app');
const savedPrefs = JSON.parse(localStorage.getItem('medi_accessibility') || '{}');

const state = {
  user: JSON.parse(localStorage.getItem('medi_user') || 'null'),
  token: localStorage.getItem('medi_token') || '',
  role: sessionStorage.getItem('medi_role') || '',
  section: 'overview',
  data: {},
  lang: localStorage.getItem('medi_lang') || 'en',
  disability: savedPrefs.disability || 'none',
  voice: savedPrefs.disability === 'blind',
  motionSOS: localStorage.getItem('medi_motion_sos') !== 'off',
  sosTimer: null,
  sosActive: false,
  motionBound: false,
  lastShock: 0,
  queueIndex: 0,
  aiChatOpen: false,
  aiMessages: [
    { sender: 'ai', text: 'Hello! I am your Medi-AI Medical Assistant. How can I help you with symptoms, appointments, clinical notes, or emergency triage today?' }
  ],
  lastAutoFill: null
};

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

const langs = {
  en: { name: 'English', speech: 'en-IN' },
  hi: { name: 'हिन्दी', speech: 'hi-IN' },
  te: { name: 'తెలుగు', speech: 'te-IN' },
  ta: { name: 'தமிழ்', speech: 'ta-IN' }
};

const T = {
  en: {
    home: 'Home', about: 'About', features: 'Features', services: 'Services', contact: 'Contact', help: 'Help Center',
    getStarted: 'Get Started', hero: 'Healthcare that moves with you.', heroSub: 'One intelligent platform for patients, doctors, hospitals and platform administrators.',
    selectRole: 'Select your role', selectRoleSub: 'Choose your role first. Your dedicated login will appear next.',
    patient: 'Patient', doctor: 'Doctor', hospital: 'Hospital', admin: 'Platform Administrator',
    continue: 'Continue', changeRole: 'Change role', login: 'Login', email: 'Email', password: 'Password', signIn: 'Sign in',
    access: 'ACCESS', voice: 'Voice Assistant', language: 'Language', accessibility: 'Accessibility',
    disability: 'Accessibility support', none: 'No disability', blind: 'Blind / Screen reader user', lowVision: 'Low vision', motor: 'Motor / mobility support',
    blindHelp: 'Blind mode automatically reads the page and enables voice commands.', motion: 'Motion SOS', motionOn: 'Motion SOS enabled', motionOff: 'Motion SOS disabled',
    sos: 'Emergency SOS', sosText: 'Emergency alert starts a 30-second countdown. Cancel before it ends.', cancel: 'Cancel Alert', sent: 'Alert Sent',
    nearby: 'Nearest authorized hospital notified', location: 'Location', dashboard: 'Dashboard',
    overview: 'Overview', appointments: 'Appointments', records: 'Medical Records', prescriptions: 'Prescriptions',
    profile: 'My Profile', settings: 'Settings', book: 'Book Appointment', history: 'Consultation History',
    today: "Today's Appointments", queue: 'Patient Queue', consult: 'Consultation', followup: 'Follow-up Patients',
    doctors: 'Doctors', patients: 'Patients', departments: 'Departments', reports: 'Reports & Analytics', users: 'Users',
    hospitals: 'Hospitals', emergency: 'Emergency Cases', analytics: 'Reports & Analytics', logout: 'Logout',
    menu: 'Menu', close: 'Close', onlineConsult: 'Online Consultation', qrHealthBadge: 'Emergency QR Badge',
    aiAssistant: 'AI Assistant', exploreFeatures: 'Explore All Features',
    listening: 'Listening. Tell me what you need.', voiceHint: 'Try: overview, appointments, queue, consult, records, prescriptions, profile, settings, emergency.', accessSaved: 'Accessibility preference saved.'
  },
  hi: {
    home: 'होम', about: 'परिचय', features: 'विशेषताएँ', services: 'सेवाएँ', contact: 'संपर्क', help: 'सहायता केंद्र',
    getStarted: 'शुरू करें', hero: 'स्वास्थ्य सेवा अब आपके साथ।', heroSub: 'मरीज़, डॉक्टर, अस्पताल और प्लेटफ़ॉर्म प्रशासक के लिए एक स्मार्ट प्लेटफ़ॉर्म।',
    selectRole: 'अपनी भूमिका चुनें', selectRoleSub: 'पहले भूमिका चुनें। उसके बाद संबंधित लॉगिन दिखाई देगा।',
    patient: 'मरीज़', doctor: 'डॉक्टर', hospital: 'अस्पताल', admin: 'प्लेटफ़ॉर्म प्रशासक',
    continue: 'जारी रखें', changeRole: 'भूमिका बदलें', login: 'लॉगिन', email: 'ईमेल', password: 'पासवर्ड', signIn: 'साइन इन',
    access: 'प्रवेश', voice: 'वॉइस सहायक', language: 'भाषा', accessibility: 'सुलभता',
    disability: 'सुलभता सहायता', none: 'कोई विकलांगता नहीं', blind: 'दृष्टिबाधित / स्क्रीन रीडर', lowVision: 'कम दृष्टि', motor: 'गतिशीलता सहायता',
    blindHelp: 'ब्लाइंड मोड पेज पढ़ता है और वॉइस कमांड चालू करता है।', motion: 'मोशन SOS', motionOn: 'मोशन SOS चालू', motionOff: 'मोशन SOS बंद',
    sos: 'आपातकालीन SOS', sosText: 'आपातकालीन अलर्ट 30 सेकंड की उलटी गिनती के बाद भेजा जाएगा।', cancel: 'अलर्ट रद्द करें', sent: 'अलर्ट भेजा गया',
    nearby: 'निकटतम अधिकृत अस्पताल को सूचना भेजी गई', location: 'स्थान', dashboard: 'डैशबोर्ड',
    overview: 'अवलोकन', appointments: 'अपॉइंटमेंट', records: 'मेडिकल रिकॉर्ड', prescriptions: 'प्रिस्क्रिप्शन',
    profile: 'मेरी प्रोफ़ाइल', settings: 'सेटिंग्स', book: 'अपॉइंटमेंट बुक करें', history: 'परामर्श इतिहास',
    today: 'आज के अपॉइंटमेंट', queue: 'मरीज़ कतार', consult: 'परामर्श', followup: 'फॉलो-अप मरीज़',
    doctors: 'डॉक्टर', patients: 'मरीज़', departments: 'विभाग', reports: 'रिपोर्ट और विश्लेषण', users: 'उपयोगकर्ता',
    hospitals: 'अस्पताल', emergency: 'आपातकालीन मामले', analytics: 'रिपोर्ट और विश्लेषण', logout: 'लॉगआउट',
    menu: 'मेनू', close: 'बंद करें', onlineConsult: 'ऑनलाइन वीडियो परामर्श', qrHealthBadge: 'आपातकालीन क्यूआर कार्ड',
    aiAssistant: 'एआई सहायक', exploreFeatures: 'सभी विशेषताएँ देखें',
    listening: 'सुन रहा हूँ। बताइए आपको क्या चाहिए।', voiceHint: 'कहें: अवलोकन, अपॉइंटमेंट, कतार, रिकॉर्ड, प्रिस्क्रिप्शन, प्रोफ़ाइल, सेटिंग्स या आपातकाल।', accessSaved: 'सुलभता पसंद सहेजी गई।'
  },
  te: {
    home: 'హోమ్', about: 'గురించి', features: 'ఫీచర్లు', services: 'సేవలు', contact: 'సంప్రదించండి', help: 'సహాయ కేంద్రం',
    getStarted: 'ప్రారంభించండి', hero: 'ఆరోగ్య సేవ మీతో ముందుకు.', heroSub: 'రోగులు, వైద్యులు, ఆసుపత్రులు మరియు ప్లాట్‌ఫారమ్ నిర్వాహకుల కోసం స్మార్ట్ ప్లాట్‌ఫారమ్.',
    selectRole: 'మీ పాత్రను ఎంచుకోండి', selectRoleSub: 'ముందుగా పాత్రను ఎంచుకోండి. తరువాత దానికి సంబంధించిన లాగిన్ కనిపిస్తుంది.',
    patient: 'రోగి', doctor: 'వైద్యుడు', hospital: 'ఆసుపత్రి', admin: 'ప్లాట్‌ఫారమ్ నిర్వాహకుడు',
    continue: 'కొనసాగించండి', changeRole: 'పాత్ర మార్చండి', login: 'లాగిన్', email: 'ఈమెయిల్', password: 'పాస్‌వర్డ్', signIn: 'సైన్ ఇన్',
    access: 'ప్రవేశం', voice: 'వాయిస్ సహాయకుడు', language: 'భాష', accessibility: 'అందుబాటు',
    disability: 'అందుబాటు సహాయం', none: 'వైకల్యం లేదు', blind: 'దృష్టి లోపం / స్క్రీన్ రీడర్', lowVision: 'తక్కువ చూపు', motor: 'కదలిక సహాయం',
    blindHelp: 'బ్లైండ్ మోడ్ పేజీని చదివి వాయిస్ కమాండ్లను ప్రారంభిస్తుంది.', motion: 'మోషన్ SOS', motionOn: 'మోషన్ SOS ప్రారంభించబడింది', motionOff: 'మోషన్ SOS నిలిపివేయబడింది',
    sos: 'అత్యవసర SOS', sosText: '30 సెకన్ల కౌంట్‌డౌన్ తర్వాత అత్యవసర సమాచారం పంపబడుతుంది.', cancel: 'అలర్ట్ రద్దు', sent: 'అలర్ట్ పంపబడింది',
    nearby: 'సమీపంలోని అధీకృత ఆసుపత్రికి సమాచారం పంపబడింది', location: 'స్థానం', dashboard: 'డ్యాష్‌బోర్డ్',
    overview: 'అవలోకనం', appointments: 'అపాయింట్‌మెంట్లు', records: 'మెడికల్ రికార్డులు', prescriptions: 'ప్రిస్క్రిప్షన్లు',
    profile: 'నా ప్రొఫైల్', settings: 'సెట్టింగ్స్', book: 'అపాయింట్‌మెంట్ బుక్ చేయండి', history: 'కన్సల్టేషన్ చరిత్ర',
    today: 'ఈరోజు అపాయింట్‌మెంట్లు', queue: 'రోగుల క్యూ', consult: 'కన్సల్టేషన్', followup: 'ఫాలో-అప్ రోగులు',
    doctors: 'వైద్యులు', patients: 'రోగులు', departments: 'విభాగాలు', reports: 'రిపోర్టులు & విశ్లేషణ', users: 'యూజర్లు',
    hospitals: 'ఆసుపత్రులు', emergency: 'అత్యవసర కేసులు', analytics: 'రిపోర్టులు & విశ్లేషణ', logout: 'లాగ్ అవుట్',
    menu: 'మెనూ', close: 'మూసివేయి', onlineConsult: 'ఆన్‌లైన్ వీడియో కన్సల్టేషన్', qrHealthBadge: 'ఎమర్జెన్సీ క్యూఆర్ కార్డ్',
    aiAssistant: 'AI సహాయకుడు', exploreFeatures: 'అన్ని ఫీచర్లను చూడండి',
    listening: 'వింటున్నాను. మీకు కావలసినది చెప్పండి.', voiceHint: 'డ్యాష్‌బోర్డ్, అపాయింట్‌మెంట్లు, రికార్డులు, ప్రిస్క్రిప్షన్లు, ప్రొఫైల్, సెట్టింగ్స్ లేదా అత్యవసరం అని చెప్పండి.', accessSaved: 'అందుబాటు ఎంపిక సేవ్ చేయబడింది.'
  },
  ta: {
    home: 'முகப்பு', about: 'பற்றி', features: 'அம்சங்கள்', services: 'சேவைகள்', contact: 'தொடர்பு', help: 'உதவி மையம்',
    getStarted: 'தொடங்குங்கள்', hero: 'சுகாதாரம் உங்களுடன் நகர்கிறது.', heroSub: 'நோயாளிகள், மருத்துவர்கள், மருத்துவமனைகள் மற்றும் நிர்வாகிகளுக்கான ஸ்மார்ட் தளம்.',
    selectRole: 'உங்கள் பங்கை தேர்வு செய்யவும்', selectRoleSub: 'முதலில் பங்கை தேர்வு செய்யவும். அதற்கான உள்நுழைவு அடுத்ததாக வரும்.',
    patient: 'நோயாளர்', doctor: 'மருத்துவர்', hospital: 'மருத்துவமனை', admin: 'தள நிர்வாகி',
    continue: 'தொடரவும்', changeRole: 'பங்கை மாற்றவும்', login: 'உள்நுழைவு', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', signIn: 'உள்நுழைக',
    access: 'அணுகல்', voice: 'குரல் உதவியாளர்', language: 'மொழி', accessibility: 'அணுகல்தன்மை',
    disability: 'அணுகல் உதவி', none: 'இயலாமை இல்லை', blind: 'பார்வையற்றவர் / ஸ்கிரீன் ரீடர்', lowVision: 'குறைந்த பார்வை', motor: 'இயக்கம் உதவி',
    blindHelp: 'பார்வையற்றவர் பயன்முறை பக்கத்தை வாசித்து குரல் கட்டளைகளை இயக்கும்.', motion: 'மோஷன் SOS', motionOn: 'மோஷன் SOS இயக்கப்பட்டது', motionOff: 'மோஷன் SOS முடக்கப்பட்டது',
    sos: 'அவசர SOS', sosText: '30 விநாடி கவுண்ட்டவுனுக்குப் பிறகு அவசர தகவல் அனுப்பப்படும்.', cancel: 'அலர்ட்டை ரத்து செய்', sent: 'அலர்ட் அனுப்பப்பட்டது',
    nearby: 'அருகிலுள்ள அங்கீகரிக்கப்பட்ட மருத்துவமனைக்கு தகவல் அனுப்பப்பட்டது', location: 'இருப்பிடம்', dashboard: 'டாஷ்போர்டு',
    overview: 'மேலோட்டம்', appointments: 'அப்பாயிண்ட்மெண்ட்கள்', records: 'மருத்துவ பதிவுகள்', prescriptions: 'மருந்துச் சீட்டுகள்',
    profile: 'என் சுயவிவரம்', settings: 'அமைப்புகள்', book: 'அப்பாயிண்ட்மெண்ட் பதிவு', history: 'ஆலோசனை வரலாறு',
    today: 'இன்றைய அப்பாயிண்ட்மெண்ட்கள்', queue: 'நோயாளர் வரிசை', consult: 'ஆலோசனை', followup: 'தொடர் நோயாளிகள்',
    doctors: 'மருத்துவர்கள்', patients: 'நோயாளிகள்', departments: 'துறைகள்', reports: 'அறிக்கைகள் & பகுப்பாய்வு', users: 'பயனர்கள்',
    hospitals: 'மருத்துவமனைகள்', emergency: 'அவசர வழக்குகள்', analytics: 'அறிக்கைகள் & பகுப்பாய்வு', logout: 'வெளியேறு',
    menu: 'மெனு', close: 'மூடு', onlineConsult: 'ஆன்லைன் வீடியோ ஆலோசனை', qrHealthBadge: 'அவசர QR அட்டை',
    aiAssistant: 'AI உதவியாளர்', exploreFeatures: 'அனைத்து அம்சங்களையும் காண்க',
    listening: 'கேட்கிறேன். உங்களுக்கு என்ன வேண்டும் என்று சொல்லுங்கள்.', voiceHint: 'டாஷ்போர்டு, அப்பாயிண்ட்மெண்ட், பதிவுகள், மருந்துச் சீட்டுகள், சுயவிவரம், அமைப்புகள் அல்லது அவசரம் என்று சொல்லுங்கள்.', accessSaved: 'அணுகல் விருப்பம் சேமிக்கப்பட்டது.'
  }
};

const t = k => (T[state.lang] && T[state.lang][k]) || T.en[k] || k;

const roles = {
  patient: { titleKey: 'patient', icon: '🧑‍🦽', desc: 'Appointments, records, prescriptions, QR badge and emergency SOS support.' },
  doctor: { titleKey: 'doctor', icon: '🩺', desc: 'Today schedule, patient queue, AI clinical consultations, telemedicine and prescriptions.' },
  hospital: { titleKey: 'hospital', icon: '🏥', desc: 'Hospital doctors, patients, departments, appointments and emergency cases.' },
  admin: { titleKey: 'admin', icon: '🛡️', desc: 'Platform users, hospital networks, EHR audits, analytics and emergency dispatch monitoring.' }
};

const api = async (path, opt = {}) => {
  const r = await fetch(API + path, {
    ...opt,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    }
  });
  const d = await r.json().catch(() => ({ message: 'Server response error' }));
  if (!r.ok) throw Error(d.message || 'Request failed');
  return d;
};

const save = () => {
  localStorage.setItem('medi_user', JSON.stringify(state.user));
  localStorage.setItem('medi_token', state.token);
};

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langs[state.lang]?.speech || 'en-IN';
  u.rate = state.disability === 'blind' ? 0.95 : 1;
  speechSynthesis.speak(u);
}

function setLang(lang) {
  if (!langs[lang]) return;
  state.lang = lang;
  localStorage.setItem('medi_lang', lang);
  document.documentElement.lang = lang;
  render();
  if (state.disability === 'blind') setTimeout(() => speak(document.body.innerText.slice(0, 1100)), 250);
}

function setDisability(value) {
  state.disability = value;
  state.voice = value === 'blind';
  localStorage.setItem('medi_accessibility', JSON.stringify({ disability: value }));
  document.body.classList.toggle('blind-mode', value === 'blind');
  document.body.classList.toggle('low-vision', value === 'lowVision');
  document.body.classList.toggle('motor-mode', value === 'motor');
  render(false);
  speak(t('accessSaved'));
  if (value === 'blind') setTimeout(() => speak(document.body.innerText.slice(0, 1100)), 300);
}

function showNotification(message, isSOS = false) {
  let banner = document.getElementById('notification-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'notification-banner';
    document.body.appendChild(banner);
  }
  banner.textContent = message;
  banner.className = isSOS ? 'sos-alert-type' : '';
  banner.style.display = 'block';
  setTimeout(() => {
    if (banner) banner.style.display = 'none';
  }, 3500);
}

// Global SOS Trigger
async function triggerSOS() {
  const log = document.getElementById('sos-log');
  if (log) log.innerHTML = "<span style='color:var(--accent);'>Fetching location & broadcasting emergency alerts...</span>";
  showNotification("Initiating Emergency SOS broadcast...", true);

  const mockContacts = state.user?.emergencyContacts || [
    { name: "Jane Doe", phone: "+1234567890", relationship: "Spouse / Emergency Contact" }
  ];

  const processResponse = (lat, lng) => {
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    api('/sos', { method: 'POST', body: JSON.stringify({ lat, lng, patient_id: state.user?.id || 1 }) }).catch(() => {});
    
    if (log) {
      log.innerHTML = `
        <div class="mock-sms-log">
          <div class="mock-sms-header">
            <span>🚨 EMERGENCY SOS BROADCAST SENT</span>
            <span>GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
          </div>
          <div><b>Patient:</b> ${esc(state.user?.name || "Rahul Kumar")}</div>
          <div><b>Location Map:</b> <a href="${mapLink}" target="_blank" style="color:var(--accent); text-decoration:underline;">${mapLink}</a></div>
          <div><b>Notified Emergency Contact:</b> ${mockContacts[0].name} (${mockContacts[0].phone})</div>
          <div style="margin-top:6px; color:#a2b9d0;"><em>Mock SMS broadcast dispatched to backend terminal & hospital network.</em></div>
        </div>
      `;
    }
    showNotification("🚨 SOS Alert Broadcast Successfully!", true);
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      processResponse(position.coords.latitude, position.coords.longitude);
    }, () => {
      processResponse(17.3850, 78.4867);
    }, { timeout: 5000 });
  } else {
    processResponse(17.3850, 78.4867);
  }
}

// WebRTC Simulation
let localMediaStream = null;
let isMicMuted = false;
let isCamOff = false;

window.startVideoCall = async function() {
  const localVideo = document.getElementById('local-video');
  const videoStatus = document.getElementById('video-status');
  try {
    if (!localMediaStream) {
      localMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }
    if (localVideo) {
      localVideo.srcObject = localMediaStream;
      localVideo.style.display = "block";
    }
    const placeholder = document.getElementById('video-placeholder');
    if (placeholder) placeholder.style.display = "none";
    if (videoStatus) videoStatus.innerHTML = "<span class='dot-live'></span> Camera connected · Live HD 720p";
    showNotification("Camera & Microphone connected successfully.");
  } catch (err) {
    if (videoStatus) videoStatus.innerHTML = "<span class='dot-live'></span> Simulation Mode (Camera Active)";
    const placeholder = document.getElementById('video-placeholder');
    if (placeholder) placeholder.innerHTML = "<span>🩺</span><b>Camera Stream Connected (Simulated)</b><small>WebRTC session active</small>";
    showNotification("Consultation session connected (Simulated stream).");
  }
};

window.toggleMute = function() {
  if (localMediaStream) {
    const audioTrack = localMediaStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      isMicMuted = !audioTrack.enabled;
    }
  } else {
    isMicMuted = !isMicMuted;
  }
  showNotification(isMicMuted ? "Microphone Muted" : "Microphone Active");
  const btn = document.getElementById('btn-mute');
  if (btn) btn.textContent = isMicMuted ? "🔇 Unmute Mic" : "🎙️ Mute Mic";
};

window.toggleVideo = function() {
  if (localMediaStream) {
    const videoTrack = localMediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      isCamOff = !videoTrack.enabled;
    }
  } else {
    isCamOff = !isCamOff;
  }
  showNotification(isCamOff ? "Camera Turned Off" : "Camera Turned On");
  const btn = document.getElementById('btn-cam');
  if (btn) btn.textContent = isCamOff ? "📷 Turn Camera On" : "📹 Turn Camera Off";
};

window.stopVideoCall = function() {
  if (localMediaStream) {
    localMediaStream.getTracks().forEach(track => track.stop());
    localMediaStream = null;
  }
  const localVideo = document.getElementById('local-video');
  if (localVideo) {
    localVideo.srcObject = null;
    localVideo.style.display = "none";
  }
  const placeholder = document.getElementById('video-placeholder');
  if (placeholder) placeholder.style.display = "flex";
  const videoStatus = document.getElementById('video-status');
  if (videoStatus) videoStatus.innerHTML = "Offline · Standby";
  showNotification("Consultation call ended.");
};

window.setNotePreset = function(text) {
  const area = document.getElementById('doctor-notes');
  if (area) area.value = text;
};

window.generateAISummary = async function() {
  const notes = document.getElementById('doctor-notes')?.value || 'Patient reports mild fever and cough for 3 days.';
  const output = document.getElementById('ai-output');
  if (!output) return;
  output.style.display = 'block';
  output.innerHTML = "<div style='color:var(--accent); padding:10px;'>✨ AI Assistant is analyzing patient history and generating comprehensive summary...</div>";

  // Get selected patient ID from consultation appointment selector
  const apptSelect = document.getElementById('consult-appt');
  let patientId = '';
  if (apptSelect) {
    const selectedAppt = (state.data.appointments || []).find(a => a.id === apptSelect.value);
    if (selectedAppt) patientId = selectedAppt.patientId;
  }

  try {
    const res = await api('/ai/summarize', { method: 'POST', body: JSON.stringify({ notes, patientId }) });
    const data = res.data;
    const po = data.patientOverview;
    output.innerHTML = `
      <div class="ai-result-box">
        <div class="ai-header-tag">🤖 AI Patient History Summary</div>
        <div class="ai-disclaimer">
          <em>⚠️ ${esc(data.disclaimer || 'For reference only. Clinical judgment required.')}</em>
        </div>

        ${po ? `<div class="ai-section-item">
          <strong>👤 1. Patient Overview</strong>
          <div class="ai-detail-grid">
            <span><b>Name:</b> ${esc(po.name)}</span>
            <span><b>Blood Group:</b> ${esc(po.bloodGroup)}</span>
            <span><b>Allergies:</b> <span class="ai-alert-text">${esc(po.allergies)}</span></span>
            <span><b>Conditions:</b> ${esc(po.conditions)}</span>
            <span><b>Total Visits:</b> ${po.totalVisits}</span>
            <span><b>Total Rx:</b> ${po.totalPrescriptions}</span>
          </div>
        </div>` : ''}

        <div class="ai-section-item">
          <strong>📋 2. Previous Visit Summary</strong>
          ${(data.previousVisits || []).length ? data.previousVisits.map(v => `
            <div class="ai-visit-row">
              <span class="ai-visit-date">${esc(v.date)}</span>
              <span>Dr. ${esc(v.doctor)} · ${esc(v.department)}</span>
              <span><b>Reason:</b> ${esc(v.reason)}</span>
              <span><b>Diagnosis:</b> ${esc(v.diagnosis)}</span>
            </div>
          `).join('') : '<p class="ai-empty">No previous visits recorded.</p>'}
        </div>

        <div class="ai-section-item">
          <strong>🔄 3. Frequently Reported Issues</strong>
          ${(data.frequentIssues || []).length ? `<div class="ai-freq-pills">${data.frequentIssues.map(i => `<span class="ai-freq-pill">${esc(i.issue)} <b>(${i.count}x)</b></span>`).join('')}</div>` : '<p class="ai-empty">Not enough data to identify patterns.</p>'}
        </div>

        <div class="ai-section-item">
          <strong>🩺 4. Current Consultation Summary</strong>
          <p>${esc(data.currentConsultation)}</p>
        </div>

        <div class="ai-section-item">
          <strong>🔁 5. Follow-Up History</strong>
          ${(data.followUpHistory || []).length ? data.followUpHistory.map(f => `
            <div class="ai-visit-row">
              <span class="ai-visit-date">${esc(f.date)}</span>
              <span>${esc(f.department)} — ${esc(f.diagnosis)}</span>
            </div>
          `).join('') : '<p class="ai-empty">No follow-up history available.</p>'}
        </div>

        <div class="ai-section-item">
          <strong>⚠️ 6. Important Medical Notes</strong>
          ${(data.importantNotes || []).map(n => `<div class="ai-important-note">${esc(n)}</div>`).join('')}
        </div>

        ${(data.previousPrescriptions || []).length ? `<div class="ai-section-item">
          <strong>💊 Previous Prescriptions</strong>
          ${data.previousPrescriptions.map(p => `
            <div class="ai-visit-row">
              <span class="ai-visit-date">${esc(p.date)}</span>
              <span>Dr. ${esc(p.doctor)}: ${esc(p.medicines)}</span>
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    `;
    showNotification("AI Patient History Summary generated successfully.");
  } catch (e) {
    output.innerHTML = `<div class="error">${esc(e.message)}</div>`;
  }
};

window.generateEmergencyQR = async function() {
  const resDiv = document.getElementById('qr-result');
  if (!resDiv) return;
  const patientId = state.user?.id || 1;
  const qrUrl = `${API}/emergency/qr/${patientId}`;

  resDiv.innerHTML = `
    <div class="qr-card-container">
      <div class="qr-badge-box">
        <img src="${qrUrl}" alt="Emergency Access QR Badge" style="width:160px; height:160px;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'160\\' height=\\'160\\' viewBox=\\'0 0 160 160\\'><rect width=\\'160\\' height=\\'160\\' fill=\\'white\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23041221\\' font-size=\\'12\\'>QR HEALTH BADGE</text></svg>'">
        <small style="color:#041221; font-weight:800; margin-top:8px;">ID: ${esc(state.user?.qrHealthId || 'MEDI-8921')}</small>
      </div>
      <div class="qr-patient-meta">
        <h3>${esc(state.user?.name || 'Rahul Kumar')}</h3>
        <p style="color:var(--muted); font-size:14px; margin:0 0 10px;">Scannable Emergency Identity for Paramedics & Hospital Triage</p>
        <div class="qr-pills">
          <span class="qr-pill">Blood: <b>${esc(state.user?.bloodGroup || 'O+')}</b></span>
          <span class="qr-pill">Allergies: <b>${esc(state.user?.allergies || 'Penicillin')}</b></span>
          <span class="qr-pill">Condition: <b>${esc(state.user?.conditions || 'Asthma')}</b></span>
          <span class="qr-pill">Phone: <b>${esc(state.user?.phone || '9000000000')}</b></span>
        </div>
      </div>
    </div>
  `;
};

window.callNextPatient = function() {
  state.queueIndex = (state.queueIndex || 0) + 1;
  loudAlert();
  showNotification(`📢 Token #0${state.queueIndex} called to Doctor Consultation Room!`);
  render(false);
};

window.sendFollowupReminder = function(patientName, phone) {
  showNotification(`📲 Automated follow-up reminder sent to ${patientName} (${phone}) via SMS!`);
};

window.saveProfileData = async function(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    name: form.name?.value,
    phone: form.phone?.value,
    bloodGroup: form.bloodGroup?.value,
    dateOfBirth: form.dateOfBirth?.value,
    specialization: form.specialization?.value,
    department: form.department?.value,
    address: form.address?.value,
    allergies: form.allergies?.value,
    conditions: form.conditions?.value
  };

  try {
    const res = await api(`/users/${state.user.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    state.user = { ...state.user, ...res.user };
    save();
    showNotification("✅ Profile details updated and synced successfully!");
    render(false);
  } catch (err) {
    alert("Could not update profile: " + err.message);
  }
};

// ----------------------------------------------------
// AI ASSISTANT & AUTO-FILL HANDLERS
// ----------------------------------------------------
window.aiMatchDepartment = async function() {
  const symInput = document.getElementById('ai-symptom-input');
  const symptoms = symInput?.value || document.getElementById('reason')?.value || 'fever and headache';
  if (!symptoms) {
    alert("Please enter symptoms in the AI box first.");
    return;
  }
  showNotification("🤖 Analyzing symptoms with Medi-AI...");

  try {
    const res = await api('/ai/suggest-booking', {
      method: 'POST',
      body: JSON.stringify({ symptoms })
    });
    
    const deptEl = document.getElementById('department');
    const reasonEl = document.getElementById('reason');
    const docEl = document.getElementById('doctor');

    if (deptEl) deptEl.value = res.department;
    if (reasonEl) reasonEl.value = `Patient symptoms: ${symptoms}. AI Recommended Dept: ${res.department}`;
    if (docEl && res.recommendedDoctorId) {
      docEl.value = res.recommendedDoctorId;
    }
    showNotification(`✨ AI auto-matched: ${res.department} (${res.recommendedDoctorName})`);
  } catch (err) {
    console.error(err);
  }
};

window.aiSuggestRx = async function() {
  const diag = document.getElementById('diagnosis')?.value || document.getElementById('doctor-notes')?.value || 'viral fever';
  showNotification("🤖 Generating AI prescription recommendations...");

  try {
    const res = await api('/ai/suggest-rx', {
      method: 'POST',
      body: JSON.stringify({ diagnosis: diag })
    });

    const med = res.medicines?.[0];
    if (med) {
      const rxMed = document.getElementById('rx-med');
      const rxDose = document.getElementById('rx-dose');
      const rxFreq = document.getElementById('rx-freq');
      const rxDuration = document.getElementById('rx-duration');
      const rxInstructions = document.getElementById('rx-instructions');

      if (rxMed) rxMed.value = med.name;
      if (rxDose) rxDose.value = med.dosage;
      if (rxFreq) rxFreq.value = med.frequency;
      if (rxDuration) rxDuration.value = med.duration;
      if (rxInstructions) rxInstructions.value = res.instructions;

      showNotification(`✨ Auto-filled prescription: ${med.name} (${med.dosage})`);
    }
  } catch (err) {
    console.error(err);
  }
};

window.toggleAIChat = function() {
  state.aiChatOpen = !state.aiChatOpen;
  renderAIChatWidget();
};

window.sendAIMessage = async function(customText) {
  const input = document.getElementById('ai-chat-input');
  const text = customText || input?.value;
  if (!text) return;
  if (input) input.value = '';

  state.aiMessages.push({ sender: 'user', text });
  renderAIChatWidget();

  try {
    const res = await api('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        role: state.user?.role || 'guest',
        lang: state.lang
      })
    });

    state.aiMessages.push({
      sender: 'ai',
      text: res.reply,
      suggestions: res.suggestions,
      autoFill: res.autoFill
    });
    state.lastAutoFill = res.autoFill;
  } catch (e) {
    state.aiMessages.push({
      sender: 'ai',
      text: "I am having trouble connecting to the medical AI service right now. Please try again."
    });
  }

  renderAIChatWidget();
  const box = document.getElementById('ai-chat-messages');
  if (box) box.scrollTop = box.scrollHeight;
};

window.applyAutoFill = function() {
  const f = state.lastAutoFill;
  if (!f) return;

  // Check which form is currently visible and populate
  const deptEl = document.getElementById('department');
  const reasonEl = document.getElementById('reason');
  const diagEl = document.getElementById('diagnosis');
  const treatEl = document.getElementById('treatment');
  const docNotesEl = document.getElementById('doctor-notes');
  const rxMedEl = document.getElementById('rx-med');
  const rxDoseEl = document.getElementById('rx-dose');
  const rxFreqEl = document.getElementById('rx-freq');
  const rxDurationEl = document.getElementById('rx-duration');
  const rxInstructionsEl = document.getElementById('rx-instructions');

  let filledAny = false;

  if (deptEl && f.department) { deptEl.value = f.department; filledAny = true; }
  if (reasonEl && f.reason) { reasonEl.value = f.reason; filledAny = true; }
  if (docNotesEl && f.reason) { docNotesEl.value = f.reason; filledAny = true; }
  if (diagEl && f.diagnosis) { diagEl.value = f.diagnosis; filledAny = true; }
  if (treatEl && f.treatment) { treatEl.value = f.treatment; filledAny = true; }

  if (f.medicines && f.medicines.length > 0 && rxMedEl) {
    const m = f.medicines[0];
    if (rxMedEl) rxMedEl.value = m.name;
    if (rxDoseEl) rxDoseEl.value = m.dosage;
    if (rxFreqEl) rxFreqEl.value = m.frequency;
    if (rxDurationEl) rxDurationEl.value = m.duration;
    if (rxInstructionsEl) rxInstructionsEl.value = f.treatment || "Take as prescribed.";
    filledAny = true;
  }

  if (filledAny) {
    showNotification("✨ Form fields auto-filled by Medi-AI Assistant!");
    window.toggleAIChat();
  } else {
    // If not in a form, switch to book or consult
    if (state.user?.role === 'doctor') {
      state.section = 'consult';
      render();
      setTimeout(() => window.applyAutoFill(), 200);
    } else if (state.user?.role === 'patient') {
      state.section = 'book';
      render();
      setTimeout(() => window.applyAutoFill(), 200);
    } else {
      showNotification("Please navigate to a form or login to apply fields.");
    }
  }
};

function renderAIChatWidget() {
  let widget = document.getElementById('medi-ai-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'medi-ai-widget';
    document.body.appendChild(widget);
  }

  if (!state.aiChatOpen) {
    widget.innerHTML = `
      <button class="ai-floating-trigger" onclick="toggleAIChat()" aria-label="Open AI Assistant">
        <span class="ai-sparkle">✨</span>
        <span class="ai-btn-text">Medi-AI Assistant</span>
      </button>
    `;
    return;
  }

  widget.innerHTML = `
    <div class="ai-chat-window">
      <div class="ai-chat-header">
        <div class="ai-chat-title">
          <span class="ai-avatar">🤖</span>
          <div>
            <b>Medi-AI Assistant</b>
            <small style="display:block; color:var(--accent); font-size:11px;">● Online · Clinical & Symptom AI</small>
          </div>
        </div>
        <button class="mini" onclick="toggleAIChat()" style="background:transparent; border:0; color:#fff; font-size:16px;">✕</button>
      </div>

      <div class="ai-chat-messages" id="ai-chat-messages">
        ${state.aiMessages.map(m => `
          <div class="ai-message-row ${m.sender}">
            <div class="ai-message-bubble">
              ${esc(m.text)}
              ${m.autoFill ? `
                <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.15);">
                  <button class="mini primary" onclick="applyAutoFill()">✨ Auto-Fill Form Fields</button>
                </div>
              ` : ''}
            </div>
            ${m.suggestions ? `
              <div class="ai-quick-suggestions">
                ${m.suggestions.map(s => `
                  <button class="ai-chip" onclick="sendAIMessage('${esc(s)}')">${esc(s)}</button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="ai-chat-footer">
        <form onsubmit="event.preventDefault(); sendAIMessage();" style="display:flex; gap:8px;">
          <input id="ai-chat-input" placeholder="Ask about symptoms, dosages, forms..." autocomplete="off" />
          <button class="primary" type="submit">Send</button>
        </form>
      </div>
    </div>
  `;
}

function langControls() {
  const hideAccessibility = state.user && (state.user.role === 'admin' || state.user.role === 'hospital');
  return `
    <div class="access-tools">
      <label class="select-tool">
        <span>🌐 ${t('language')}</span>
        <select id="language-select" aria-label="${t('language')}">
          ${Object.entries(langs).map(([k, v]) => `<option value="${k}" ${state.lang === k ? 'selected' : ''}>${v.name}</option>`).join('')}
        </select>
      </label>
      ${!hideAccessibility ? `
      <label class="select-tool">
        <span>♿ ${t('accessibility')}</span>
        <select id="disability-select" aria-label="${t('disability')}">
          <option value="none" ${state.disability === 'none' ? 'selected' : ''}>${t('none')}</option>
          <option value="blind" ${state.disability === 'blind' ? 'selected' : ''}>${t('blind')}</option>
          <option value="lowVision" ${state.disability === 'lowVision' ? 'selected' : ''}>${t('lowVision')}</option>
          <option value="motor" ${state.disability === 'motor' ? 'selected' : ''}>${t('motor')}</option>
        </select>
      </label>
      ` : ''}
    </div>
  `;
}

// Navigation structure per role
const doctorNavList = [
  { id: 'overview', icon: '📊', label: 'Overview', desc: 'Clinical overview & quick stats' },
  { id: 'today', icon: '📅', label: "Today's Appointments", desc: 'Active patient visits for today' },
  { id: 'queue', icon: '⏳', label: 'Patient Queue', desc: 'Live tokens & waiting room' },
  { id: 'consult', icon: '🩺', label: 'Consultation', desc: 'AI assistant & clinical diagnosis' },
  { id: 'video', icon: '🎥', label: 'Online Consultation', desc: 'Live WebRTC telemedicine room' },
  { id: 'records', icon: '📄', label: 'Medical Records', desc: 'Patient EHR & lab reports vault' },
  { id: 'prescriptions', icon: '💊', label: 'Prescriptions', desc: 'Digital Rx issuer & history' },
  { id: 'followup', icon: '🔁', label: 'Follow-up Patients', desc: 'Track next visits & send alerts' },
  { id: 'profile', icon: '👤', label: 'My Profile', desc: 'Doctor credentials & timings' },
  { id: 'settings', icon: '⚙️', label: 'Settings', desc: 'Preferences & accessibility' },
  { id: 'sos', icon: '🚨', label: 'Emergency SOS', desc: 'Broadcast emergency coordinates', isSOS: true }
];

const patientNavList = [
  { id: 'overview', icon: '📊', label: 'Overview', desc: 'Personal health summary & alerts' },
  { id: 'book', icon: '➕', label: 'Book Appointment', desc: 'Schedule visit with doctor' },
  { id: 'appointments', icon: '📅', label: 'Appointments', desc: 'Upcoming scheduled visits' },
  { id: 'video', icon: '🎥', label: 'Online Consultation', desc: 'Live video telemedicine room' },
  { id: 'history', icon: '📜', label: 'Consultation History', desc: 'Past diagnoses & treatments' },
  { id: 'records', icon: '📄', label: 'Medical Records', desc: 'Lab tests & health documents' },
  { id: 'prescriptions', icon: '💊', label: 'Prescriptions', desc: 'Active digital medicine orders' },
  { id: 'qrcard', icon: '💳', label: 'Emergency QR Badge', desc: 'Scannable health ID badge' },
  { id: 'profile', icon: '👤', label: 'My Profile', desc: 'Emergency contacts & vitals' },
  { id: 'settings', icon: '⚙️', label: 'Settings', desc: 'Language & accessibility' },
  { id: 'sos', icon: '🚨', label: 'Emergency SOS', desc: 'Trigger 30s emergency alert', isSOS: true }
];

const hospitalNavList = [
  { id: 'overview', icon: '📊', label: 'Overview', desc: 'Hospital bed capacity, live analytics & telemetry' },
  { id: 'manage-doctors', icon: '🩺', label: 'Manage Doctors', desc: 'Add, approve, suspend & manage doctors' },
  { id: 'doctors', icon: '📋', label: 'Doctors Directory', desc: 'Hospital medical staff directory' },
  { id: 'schedules', icon: '🗓️', label: 'Schedules & Slots', desc: 'Doctor availability & consultation slots' },
  { id: 'patients', icon: '👥', label: 'Patients & Admissions', desc: 'Live patient entry, triage & admission logs' },
  { id: 'appointments', icon: '📅', label: 'Appointments', desc: 'Departmental booking logs' },
  { id: 'activity', icon: '📡', label: 'Activity Tracking', desc: 'Doctor & patient login/logout tracking' },
  { id: 'departments', icon: '🏢', label: 'Departments & Wards', desc: 'ICU, ER Trauma, Cardiology, General Ward' },
  { id: 'reports', icon: '📈', label: 'Reports & Analytics', desc: 'Hospital operational & patient inflow trends' },
  { id: 'profile', icon: '👤', label: 'Hospital Profile', desc: 'Address, GPS & emergency hotlines' },
  { id: 'settings', icon: '⚙️', label: 'Settings', desc: 'Capacity thresholds & notifications' }
];

const adminNavList = [
  { id: 'overview', icon: '📊', label: 'Overview', desc: 'Hospital status & website telemetry dashboard' },
  { id: 'users', icon: '👥', label: 'Users Management', desc: 'All platform accounts & roles' },
  { id: 'hospitals', icon: '🏥', label: 'Hospital Management', desc: 'Create, edit & manage hospital accounts' },
  { id: 'activity', icon: '📡', label: 'Activity Logs', desc: 'Platform-wide login & activity monitoring' },
  { id: 'reports', icon: '📈', label: 'Reports & Analytics', desc: 'Platform growth & response metrics' },
  { id: 'settings', icon: '⚙️', label: 'Settings', desc: 'Global platform configurations' }
];

function getNavListForRole(role) {
  if (role === 'doctor') return doctorNavList;
  if (role === 'hospital') return hospitalNavList;
  if (role === 'admin') return adminNavList;
  return patientNavList;
}

function header() {
  const currentNav = state.user ? getNavListForRole(state.user.role) : [];
  const currentItem = currentNav.find(n => n.id === state.section) || { label: t('overview'), icon: '📊' };

  return `
    <header class="topbar">
      <div class="top-left-wrap">
        <button class="menu-toggle-btn sm-global-toggle" type="button" aria-label="Open Features Menu">
          <span class="menu-toggle-icon">☰</span>
          <span class="menu-toggle-label">${t('menu')}</span>
          ${state.user ? `<span class="menu-active-badge">${currentItem.icon} ${currentItem.label}</span>` : `<span class="menu-active-badge">✦ All Features</span>`}
        </button>
        <button class="brand" data-action="home" aria-label="Medi Smart Home">✦ MEDI<span>SMART</span></button>
      </div>

      <div class="top-tools">
        ${langControls()}
        <button class="glass-btn" data-action="voice" aria-label="${t('voice')}">🎙 ${t('voice')}</button>
        ${state.user ? `
          <span class="user-chip">${roles[state.user.role]?.icon || '👤'} ${esc(state.user.name)}</span>
          <button class="glass-btn" data-action="logout">${t('logout')}</button>
        ` : `
          <button class="primary" data-action="roles">${t('getStarted')} →</button>
        `}
      </div>
    </header>
  `;
}

function home() {
  return `
    ${header()}
    <main class="home">
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">AI • ${t('accessibility').toUpperCase()} • SOS</div>
          <h1>${t('hero')}</h1>
          <p>${t('heroSub')}</p>
          <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:20px;">
            <button class="primary big" data-action="roles">${t('getStarted')} <b>→</b></button>
            <button class="glass-btn big sm-global-toggle" type="button" id="btn-explore-features">
              ☰ ${t('exploreFeatures')}
            </button>
          </div>
          <div class="trust">
            <span>● Multilingual AI Telemedicine</span>
            <span>● Blind & Low Vision Access</span>
            <span>● 30s GPS Emergency SOS</span>
            <span>● Digital Prescriptions & EHR</span>
          </div>
        </div>
        <div class="scene" aria-hidden="true">
          <div class="orb orb-a"></div>
          <div class="orb orb-b"></div>
          <div class="orb orb-c"></div>
          <div class="ring ring-a"></div>
          <div class="ring ring-b"></div>
          <div class="ring ring-c"></div>
          <div class="heart">✚</div>
          <div class="float-card card-a">❤️ <b>24/7</b><small>Emergency Ready</small></div>
          <div class="float-card card-b">🧠 <b>Smart Care</b><small>Connected records</small></div>
          <div class="float-card card-c">🎙️ <b>Voice AI</b><small>Hands-free control</small></div>
          <div class="holo">MEDI<br>SMART</div>
        </div>
      </section>

      <section id="capabilities" style="margin-top:50px; scroll-margin-top: 90px;">
        <div class="section-head">
          <div class="eyebrow">REACT BITS • MAGIC BENTO GRID</div>
          <h1>Platform Capabilities</h1>
          <p>Interactive 3D bento card grid with spotlight mouse tracking & glowing borders. Click any capability to test.</p>
        </div>
        <div id="magic-bento-container"></div>
      </section>
    </main>
  `;
}

function rolesPage() {
  return `
    ${header()}
    <main class="center-page">
      <div class="section-head">
        <div class="eyebrow">SECURE • ACCESSIBLE • MULTILINGUAL</div>
        <h1>${t('selectRole')}</h1>
        <p>${t('selectRoleSub')}</p>
      </div>
      <section class="access-panel">
        <div>
          <h2>♿ ${t('accessibility')}</h2>
          <p>${t('blindHelp')}</p>
        </div>
        <select id="disability-page">
          <option value="none">${t('none')}</option>
          <option value="blind">${t('blind')}</option>
          <option value="lowVision">${t('lowVision')}</option>
          <option value="motor">${t('motor')}</option>
        </select>
      </section>
      <div class="role-grid">
        ${Object.entries(roles).map(([k, r]) => `
          <button class="role-card" data-role="${k}" aria-label="${t(r.titleKey)}">
            <div class="role-icon">${r.icon}</div>
            <h2>${t(r.titleKey)}</h2>
            <p>${r.desc}</p>
            <span>${t('continue')} →</span>
          </button>
        `).join('')}
      </div>
    </main>
  `;
}

function demoFor(role) {
  return ({
    patient: 'patient@medismart.local / Patient@123',
    doctor: 'doctor@medismart.local / Doctor@123',
    hospital: 'hospital@medismart.local / Hospital@123',
    admin: 'admin@medismart.local / Admin@123'
  })[role] || 'patient@medismart.local / Patient@123';
}

window.fillDemoLogin = function(role) {
  const demoAccounts = {
    patient: { email: 'patient@medismart.local', pass: 'Patient@123' },
    doctor: { email: 'doctor@medismart.local', pass: 'Doctor@123' },
    hospital: { email: 'hospital@medismart.local', pass: 'Hospital@123' },
    admin: { email: 'admin@medismart.local', pass: 'Admin@123' }
  };
  const currentRole = role || state.role || 'patient';
  const acc = demoAccounts[currentRole] || demoAccounts.patient;
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  if (emailEl) emailEl.value = acc.email;
  if (passEl) passEl.value = acc.pass;
  showNotification(`Auto-filled ${currentRole} demo credentials!`);
};

function login() {
  const roleKey = state.role && roles[state.role] ? state.role : 'patient';
  if (!state.role) state.role = roleKey;
  const r = roles[roleKey];

  return `
    ${header()}
    <main class="center-page">
      <div class="login-card">
        <button class="back" data-action="roles">← ${t('changeRole')}</button>
        <div class="role-icon">${r.icon}</div>
        <div class="eyebrow">${t(r.titleKey).toUpperCase()} ${t('access')}</div>
        <h1>${t(r.titleKey)} ${t('login')}</h1>
        <p>${r.desc}</p>
        <div id="error" aria-live="assertive"></div>
        <form id="login-form">
          <label>${t('email')}
            <input id="email" name="email" type="email" required autocomplete="username" placeholder="user@medismart.local">
          </label>
          <label>${t('password')}
            <input id="password" name="password" type="password" required autocomplete="current-password" placeholder="••••••••">
          </label>
          <button class="primary" type="submit" id="btn-login-submit">${t('signIn')} →</button>
        </form>
        <div class="demo" style="margin-top:14px; padding:12px 14px; background:rgba(35,215,197,0.06); border:1px dashed rgba(35,215,197,0.4); border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <span style="font-size:12.5px; color:#c9d8e8;">🔑 <b>Demo:</b> ${demoFor(roleKey)}</span>
          <button type="button" class="mini primary" onclick="fillDemoLogin('${roleKey}')">⚡ Auto Fill</button>
        </div>
      </div>
    </main>
  `;
}

function card(title, value, sub, icon) {
  return `
    <div class="metric">
      <div class="metric-icon">${icon}</div>
      <div>
        <strong>${esc(value)}</strong>
        <span>${title}</span>
        <small>${sub || ''}</small>
      </div>
    </div>
  `;
}

function table(title, headers, rows) {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>${title}</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="empty">No records available</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ----------------------------------------------------
// PATIENT CONTENT VIEWS (FULL DISPLAY)
// ----------------------------------------------------
function patientContent() {
  const d = state.data;
  switch (state.section) {
    case 'book':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>📅 Book a Medical Appointment</h2>
              <p style="color:var(--muted); margin:0;">Choose an authorized specialist doctor, department and preferred consultation time.</p>
            </div>
            <button class="glass-btn" type="button" onclick="toggleAIChat()">🤖 Ask Medi-AI</button>
          </div>

          <div class="ai-assistant-bar" style="margin:16px 0; padding:14px; background:rgba(35,215,197,0.08); border:1px solid rgba(35,215,197,0.3); border-radius:14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <span style="font-size:18px;">✨</span>
            <b style="color:var(--accent); font-size:13.5px;">AI Symptom Matcher:</b>
            <input id="ai-symptom-input" placeholder="Type symptoms (e.g. chest discomfort, high fever, skin rash)..." style="flex:1; min-width:200px;" />
            <button class="mini primary" type="button" onclick="aiMatchDepartment()">🤖 Auto-Select Doctor & Dept</button>
          </div>

          <form id="book-form" class="form-grid">
            <label>Select Specialist Doctor
              <select id="doctor" required onchange="onDoctorSelectChange(this.value)">
                ${(d.doctors || []).map(x => `<option value="${x.id}">${esc(x.name)} · ${esc(x.specialization || x.department)}</option>`).join('')}
              </select>
            </label>
            <label>Medical Department
              <input id="department" required value="${esc(d.doctors?.[0]?.department || 'General Medicine')}">
            </label>
            <label>Preferred Date
              <input id="date" type="date" required value="${new Date().toISOString().slice(0, 10)}" onchange="onDoctorSelectChange()">
            </label>
            <label>Preferred Time Slot
              <input id="time" type="time" required value="10:30">
            </label>
            <div class="wide" id="slot-picker-container">
              <label style="font-size:12px; color:var(--muted); margin-bottom:6px; display:block;">Hospital-Approved Available Slots (Click to Select):</label>
              <div style="display:flex; flex-wrap:wrap; gap:8px;" id="available-slot-buttons">
                <button type="button" class="mini" onclick="document.getElementById('time').value='09:00'">09:00 AM</button>
                <button type="button" class="mini" onclick="document.getElementById('time').value='09:30'">09:30 AM</button>
                <button type="button" class="mini primary" onclick="document.getElementById('time').value='10:30'">10:30 AM</button>
                <button type="button" class="mini" onclick="document.getElementById('time').value='11:00'">11:00 AM</button>
                <button type="button" class="mini" onclick="document.getElementById('time').value='14:00'">02:00 PM</button>
                <button type="button" class="mini" onclick="document.getElementById('time').value='15:30'">03:30 PM</button>
              </div>
            </div>
            <label class="wide">Symptoms / Reason for Visit
              <textarea id="reason" placeholder="Describe your symptoms or reason for medical consultation..." required></textarea>
            </label>
            <div class="wide" style="display:flex; gap:12px;">
              <button class="primary" type="submit">Confirm & Book Appointment</button>
            </div>
          </form>
        </section>
      `;

    case 'video':
      return `
        <section class="panel">
          <h2>🎥 Online Video Consultation (WebRTC Telemedicine)</h2>
          <p>Connect with your doctor in real time with high-definition audio, video, and medical screen sharing.</p>
          <div class="video-consult-container">
            <div class="video-grid">
              <div class="video-box-wrap">
                <video id="local-video" autoplay playsinline muted style="display:none;"></video>
                <div id="video-placeholder" class="video-placeholder">
                  <span>📹</span>
                  <b>Patient Camera Stream</b>
                  <small>Click "Start Camera" below to join telemedicine session</small>
                </div>
                <div class="video-label" id="video-status">Standby</div>
              </div>
            </div>
            <div class="video-controls">
              <button class="primary" onclick="startVideoCall()">📹 Start Local Camera</button>
              <button class="glass-btn" id="btn-mute" onclick="toggleMute()">🎙️ Mute Mic</button>
              <button class="glass-btn" id="btn-cam" onclick="toggleVideo()">📷 Toggle Video</button>
              <button class="danger" onclick="stopVideoCall()">🔴 End Call</button>
            </div>
          </div>
        </section>
      `;

    case 'qrcard':
      return `
        <section class="panel">
          <h2>💳 Emergency Access QR Health Badge</h2>
          <p>Instant digital identification card for paramedics, ambulance emergency teams, and hospital triage.</p>
          <button class="primary" onclick="generateEmergencyQR()" style="margin-bottom:15px;">Generate / Refresh My QR Card</button>
          <div id="qr-result">
            <div class="qr-card-container">
              <div class="qr-badge-box">
                <img src="${API}/emergency/qr/${state.user?.id || 1}" alt="QR Badge" style="width:160px; height:160px;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'160\\' height=\\'160\\' viewBox=\\'0 0 160 160\\'><rect width=\\'160\\' height=\\'160\\' fill=\\'white\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23041221\\' font-size=\\'12\\'>QR HEALTH BADGE</text></svg>'">
                <small style="color:#041221; font-weight:800; margin-top:8px;">ID: ${esc(state.user?.qrHealthId || 'MEDI-8921')}</small>
              </div>
              <div class="qr-patient-meta">
                <h3>${esc(state.user?.name || 'Rahul Kumar')}</h3>
                <p style="color:var(--muted); font-size:14px; margin:0 0 10px;">Scannable Emergency Identity for Paramedics & Hospital Triage</p>
                <div class="qr-pills">
                  <span class="qr-pill">Blood: <b>${esc(state.user?.bloodGroup || 'O+')}</b></span>
                  <span class="qr-pill">Allergies: <b>${esc(state.user?.allergies || 'Penicillin')}</b></span>
                  <span class="qr-pill">Condition: <b>${esc(state.user?.conditions || 'Asthma')}</b></span>
                  <span class="qr-pill">Phone: <b>${esc(state.user?.phone || '9000000000')}</b></span>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;

    case 'appointments':
      return table(
        t('appointments'),
        ['Doctor', 'Date', 'Time Slot', 'Department', 'Reason / Symptoms', 'Status', 'Action'],
        (d.appointments || []).map(a => `
          <tr style="${a.status === 'confirmed' ? 'background:rgba(16,185,129,0.06);' : a.status === 'pending' ? 'background:rgba(245,158,11,0.05);' : ''}">
            <td><b>🩺 ${esc(a.doctor?.name || 'Assigned Doctor')}</b></td>
            <td>${a.date}</td>
            <td><b>${a.time}</b></td>
            <td>${esc(a.department)}</td>
            <td>${esc(a.reason || 'Routine Visit')}</td>
            <td>
              <span class="status-pill ${a.status === 'confirmed' ? 'confirmed' : a.status === 'pending' ? 'pending' : 'cancelled'}" style="${a.status === 'confirmed' ? 'box-shadow:0 0 10px rgba(16,185,129,0.4); font-weight:700;' : ''}">
                ${a.status === 'confirmed' ? '✅ Confirmed' : a.status === 'pending' ? '⏳ Pending Doctor Confirmation' : a.status}
              </span>
            </td>
            <td>
              ${a.status === 'confirmed' ? `
                <button class="mini primary" onclick="state.section='video'; render();">🎥 Join Video Room</button>
              ` : a.status === 'pending' ? `
                <span style="font-size:12px; color:#f59e0b; font-weight:600;">⚡ Doctor Reviewing Request</span>
              ` : `
                <span style="font-size:12px; color:var(--muted);">${a.status}</span>
              `}
            </td>
          </tr>
        `)
      );

    case 'history':
      return table(
        t('history'),
        ['Date', 'Doctor', 'Department', 'Diagnosis', 'Treatment Notes'],
        (d.appointments || []).filter(a => a.status === 'completed' || a.diagnosis).map(a => `
          <tr>
            <td>${a.date}</td>
            <td><b>${esc(a.doctor?.name)}</b></td>
            <td>${esc(a.department)}</td>
            <td><span style="color:var(--accent); font-weight:600;">${esc(a.diagnosis || 'General Checkup')}</span></td>
            <td>${esc(a.treatmentNotes || 'Advised rest and follow-up medication.')}</td>
          </tr>
        `)
      );

    case 'records':
      return table(
        t('records'),
        ['Document Title', 'Type', 'Date', 'Uploaded By', 'Action'],
        (d.records || []).map(r => `
          <tr>
            <td><b>📄 ${esc(r.title)}</b></td>
            <td><span class="type-pill">${esc(r.type)}</span></td>
            <td>${esc(r.date?.slice(0, 10) || 'Recent')}</td>
            <td>${esc(r.uploadedByUser?.name || 'Attending Physician')}</td>
            <td><button class="mini" onclick="alert('Viewing Medical Record: ${esc(r.title)}')">👁 View</button></td>
          </tr>
        `)
      );

    case 'prescriptions':
      return table(
        t('prescriptions'),
        ['Doctor', 'Date', 'Prescribed Medicines', 'Special Instructions'],
        (d.prescriptions || []).map(p => `
          <tr>
            <td><b>🩺 ${esc(p.doctor?.name || 'Dr. Ananya Rao')}</b></td>
            <td>${esc(p.date?.slice(0, 10))}</td>
            <td>${(p.medicines || []).map(m => `<b>${esc(m.name)}</b> (${esc(m.dosage)}, ${esc(m.frequency)})`).join('<br>')}</td>
            <td>${esc(p.instructions || 'Take as instructed.')}</td>
          </tr>
        `)
      );

    case 'profile':
      return `
        <section class="panel">
          <h2>👤 My Patient Profile & Health Identity</h2>
          <p>Keep your emergency medical information, blood group, allergies, and contact details up to date.</p>
          <form onsubmit="saveProfileData(event)" class="form-grid">
            <label>Full Name<input name="name" value="${esc(state.user.name)}" required></label>
            <label>Phone Number<input name="phone" value="${esc(state.user.phone || '9000000000')}" required></label>
            <label>Blood Group
              <select name="bloodGroup">
                <option value="O+" ${state.user.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${state.user.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
                <option value="A+" ${state.user.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${state.user.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${state.user.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${state.user.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${state.user.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${state.user.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
              </select>
            </label>
            <label>Date of Birth<input name="dateOfBirth" type="date" value="${esc(state.user.dateOfBirth || '1995-05-15')}"></label>
            <label class="wide">Known Allergies<input name="allergies" value="${esc(state.user.allergies || 'Penicillin')}" placeholder="E.g., Penicillin, Peanuts, Sulfa"></label>
            <label class="wide">Medical Conditions<input name="conditions" value="${esc(state.user.conditions || 'Asthma')}" placeholder="E.g., Asthma, Hypertension, Diabetes"></label>
            <label class="wide">Residential Address<textarea name="address" rows="2">${esc(state.user.address || 'Flat 402, Green Meadows, Hyderabad')}</textarea></label>
            <div class="wide" style="display:flex; gap:12px;">
              <button class="primary" type="submit">💾 Save Profile Details</button>
            </div>
          </form>
        </section>
      `;

    case 'settings':
      return `
        <section class="panel">
          <h2>⚙️ Patient Accessibility & Application Settings</h2>
          <p>Customize your language, accessibility modes, motion SOS sensors, and notifications.</p>
          <div class="form-grid">
            <label>Interface Language
              <select onchange="setLang(this.value)">
                ${Object.entries(langs).map(([k, v]) => `<option value="${k}" ${state.lang === k ? 'selected' : ''}>${v.name}</option>`).join('')}
              </select>
            </label>
            <label>Accessibility Mode
              <select onchange="setDisability(this.value)">
                <option value="none" ${state.disability === 'none' ? 'selected' : ''}>${t('none')}</option>
                <option value="blind" ${state.disability === 'blind' ? 'selected' : ''}>${t('blind')}</option>
                <option value="lowVision" ${state.disability === 'lowVision' ? 'selected' : ''}>${t('lowVision')}</option>
                <option value="motor" ${state.disability === 'motor' ? 'selected' : ''}>${t('motor')}</option>
              </select>
            </label>
            <div class="wide" style="background:rgba(255,255,255,0.04); padding:16px; border-radius:12px; border:1px solid var(--line);">
              <h3 style="margin:0 0 8px;">📳 Motion & Fall Shock Detection</h3>
              <p style="color:var(--muted); font-size:13.5px; margin:0 0 12px;">Automatically triggers Emergency SOS if a sudden drop/shock event is detected via device accelerometer.</p>
              <button class="glass-btn" onclick="enableMotion()">${state.motionSOS ? '✅ ' + t('motionOn') : '❌ ' + t('motionOff')}</button>
            </div>
          </div>
        </section>
      `;

    default:
      return `
        <div class="metrics">
          ${card(t('appointments'), d.appointments?.length || 0, 'Scheduled visits', '📅')}
          ${card(t('prescriptions'), d.prescriptions?.length || 0, 'Digital prescriptions', '💊')}
          ${card(t('records'), d.records?.length || 0, 'Secure EHR files', '📄')}
          ${card('Health ID', state.user.qrHealthId || 'MEDI-ID', 'Emergency QR Badge', '▦')}
        </div>

        <div class="split">
          <section class="panel">
            <div class="panel-head">
              <h2>📅 Upcoming Appointments</h2>
              <button class="mini" onclick="state.section='book'; render();">+ Book New</button>
            </div>
            ${(d.appointments || []).slice(0, 4).map(a => `
              <div class="list-row" style="${a.status === 'confirmed' ? 'border-left:3px solid #10b981;' : a.status === 'pending' ? 'border-left:3px solid #f59e0b;' : ''}">
                <div>
                  <b>🩺 ${esc(a.doctor?.name || 'Specialist Doctor')}</b>
                  <small style="display:block; color:var(--muted);">${esc(a.department)} · ${a.date} at ${a.time}</small>
                </div>
                <span class="status-pill ${a.status === 'confirmed' ? 'confirmed' : a.status === 'pending' ? 'pending' : 'cancelled'}" style="${a.status === 'confirmed' ? 'box-shadow:0 0 8px rgba(16,185,129,0.35); font-weight:700;' : ''}">
                  ${a.status === 'confirmed' ? '✅ Confirmed' : a.status === 'pending' ? '⏳ Pending' : a.status}
                </span>
                ${a.status === 'confirmed' ? `
                  <button class="mini primary" onclick="state.section='video'; render();">🎥 Video</button>
                ` : `
                  <button class="mini" onclick="state.section='appointments'; render();">View</button>
                `}
              </div>
            `).join('') || '<p class="empty">No upcoming appointments scheduled.</p>'}
            <div style="margin-top:15px; display:flex; gap:10px;">
              <button class="glass-btn" onclick="state.section='appointments'; render();">📅 All Appointments</button>
              <button class="glass-btn" onclick="state.section='video'; render();">🎥 Join Video Room</button>
              <button class="glass-btn" onclick="state.section='qrcard'; render();">💳 My QR Badge</button>
            </div>
          </section>

          <section class="panel sos-panel">
            <h2>🚨 Emergency SOS (Simulated SMS & GPS)</h2>
            <p>Click below to broadcast your live GPS coordinates to emergency contacts & nearest hospitals.</p>
            <button class="sos-btn danger" onclick="triggerSOS()">🚨 TRIGGER EMERGENCY SOS 🚨</button>
            <div id="sos-log"></div>
          </section>
        </div>
      `;
  }
}

// ----------------------------------------------------
// DOCTOR CONTENT VIEWS (FULL DISPLAY)
// ----------------------------------------------------
function doctorContent() {
  const d = state.data;
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todaysList = (d.appointments || []).filter(a => a.date === todayDateStr || a.status === 'pending' || a.status === 'confirmed');

  switch (state.section) {
    case 'today':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>📅 Today's Clinical Schedule & Patient Requests</h2>
              <p style="color:var(--muted); margin:0;">Real-time queue of patient requests, confirmed slots, and consultation workflow.</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <span class="status-pill pending" style="font-weight:700; font-size:12px;">⚡ ${todaysList.filter(a => a.status === 'pending').length} Pending Requests</span>
              <button class="primary mini" onclick="state.section='consult'; render();">🩺 AI Consultation Studio</button>
            </div>
          </div>
          <div class="table-wrap" style="margin-top:15px;">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Date & Time Slot</th>
                  <th>Department</th>
                  <th>Reason / Symptoms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${todaysList.map(a => `
                  <tr style="${a.status === 'pending' ? 'background:rgba(245,158,11,0.08); border-left:3px solid #f59e0b;' : a.status === 'confirmed' ? 'background:rgba(34,211,238,0.04); border-left:3px solid #22d3ee;' : ''}">
                    <td>
                      <b>🧑‍🦽 ${esc(a.patient?.name || 'Patient')}</b>
                      ${a.status === 'pending' ? `<span style="display:block; font-size:11px; color:#f59e0b; font-weight:700;">⚡ New Patient Request</span>` : ''}
                    </td>
                    <td>
                      <b>${a.time}</b>
                      <small style="display:block; color:var(--muted); font-size:11.5px;">${a.date === todayDateStr ? '📅 Today' : a.date}</small>
                    </td>
                    <td>${esc(a.department)}</td>
                    <td>${esc(a.reason || 'General Checkup')}</td>
                    <td>
                      <span class="status-pill ${a.status === 'confirmed' ? 'confirmed' : a.status === 'pending' ? 'pending' : a.status === 'completed' ? 'confirmed' : 'cancelled'}" style="${a.status === 'confirmed' ? 'box-shadow:0 0 10px rgba(34,211,238,0.3); font-weight:700;' : ''}">
                        ${a.status === 'confirmed' ? '✅ Confirmed' : a.status === 'pending' ? '⏳ Pending Confirmation' : a.status}
                      </span>
                    </td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                      ${a.status === 'pending' ? `
                        <button class="mini primary" style="background:#10b981; border-color:#059669; color:#fff; font-weight:700;" onclick="updateAppt('${a.id}', 'confirmed')">✅ Confirm Request</button>
                        <button class="mini" style="color:#ef4444;" onclick="updateAppt('${a.id}', 'cancelled')">❌ Decline</button>
                      ` : ''}
                      ${a.status === 'confirmed' ? `
                        <button class="mini" onclick="state.section='consult'; render();">🩺 Consult</button>
                        <button class="mini" onclick="state.section='video'; render();">🎥 Video</button>
                        <button class="mini" onclick="updateAppt('${a.id}', 'completed')">Done</button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('') || `<tr><td colspan="6" class="empty">No appointments scheduled for today.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `;

    case 'queue':
      const queuePatients = (d.appointments || []).filter(a => ['pending', 'confirmed'].includes(a.status));
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>⏳ Live Patient Waiting Queue</h2>
              <p style="color:var(--muted); margin:0;">Real-time token queue management for clinic triage & consultation room.</p>
            </div>
            <button class="primary" onclick="callNextPatient()">📢 Call Next Patient</button>
          </div>

          <div class="queue-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:20px;">
            ${queuePatients.map((p, idx) => `
              <div class="queue-card ${idx === 0 ? 'queue-card-active' : ''}" style="background:rgba(16,36,60,0.85); border:1px solid ${idx === 0 ? 'var(--accent)' : 'var(--line)'}; border-radius:16px; padding:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="queue-token" style="background:${idx === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; color:${idx === 0 ? '#041221' : '#fff'}; font-weight:800; padding:4px 10px; border-radius:8px; font-size:13px;">TOKEN #${String(idx + 1).padStart(2, '0')}</span>
                  <span style="font-size:12px; color:var(--muted);">${idx === 0 ? '🟢 In Room' : `⏳ Est. ${(idx + 1) * 12} mins`}</span>
                </div>
                <h3 style="margin:14px 0 6px; font-size:18px;">${esc(p.patient?.name || 'Patient')}</h3>
                <p style="color:var(--muted); font-size:13px; margin:0 0 12px;">Department: ${esc(p.department)} · Time: ${p.time}</p>
                <div style="display:flex; gap:8px;">
                  <button class="mini" onclick="state.section='consult'; render();">🩺 Start Consult</button>
                  <button class="mini" onclick="state.section='video'; render();">🎥 Live Video</button>
                </div>
              </div>
            `).join('') || `
              <div class="empty-box" style="padding:30px; text-align:center; color:var(--muted); grid-column:1/-1;">
                No patients currently in the waiting queue.
              </div>
            `}
          </div>
        </section>
      `;

    case 'video':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>🎥 Doctor Telemedicine & Clinical Context Studio</h2>
              <p style="color:var(--muted); margin:0;">Live WebRTC consultation feed with simultaneous patient history, allergies, and EHR summary.</p>
            </div>
            <button class="primary mini" onclick="loadPatientContextForVideo()">🔄 Refresh Patient Context</button>
          </div>

          <div style="display:grid; grid-template-columns:1.1fr 0.9fr; gap:20px; margin-top:16px; align-items:start;" class="telemed-studio-grid">
            <div class="video-consult-container">
              <div class="video-grid">
                <div class="video-box-wrap">
                  <video id="local-video" autoplay playsinline muted style="display:none;"></video>
                  <div id="video-placeholder" class="video-placeholder">
                    <span>🩺</span>
                    <b>Doctor Video Feed Standby</b>
                    <small>Click "Start Camera Feed" below to connect with patient</small>
                  </div>
                  <div class="video-label" id="video-status">Standby</div>
                </div>
              </div>
              <div class="video-controls" style="margin-top:12px;">
                <button class="primary" onclick="startVideoCall()">📹 Start Camera Feed</button>
                <button class="glass-btn" id="btn-mute" onclick="toggleMute()">🎙️ Mute Mic</button>
                <button class="glass-btn" id="btn-cam" onclick="toggleVideo()">📷 Toggle Video</button>
                <button class="danger" onclick="stopVideoCall()">🔴 End Call</button>
              </div>
            </div>

            <div class="patient-context-panel" style="background:rgba(13,27,46,0.92); border:1px solid rgba(35,215,197,0.35); border-radius:18px; padding:18px; box-shadow:0 15px 40px rgba(0,0,0,0.35);">
              <h3 style="margin:0 0 10px; color:var(--accent); display:flex; align-items:center; gap:8px;">
                <span>📋</span> Patient Consultation Context
              </h3>
              
              <div style="margin-bottom:14px;">
                <label style="font-size:12px; color:#c9d8e8; font-weight:700; display:block; margin-bottom:5px;">Select Patient in Call:
                  <select id="video-patient-select" style="width:100%; padding:10px; background:#071522; border:1px solid var(--line); color:#fff; border-radius:10px;" onchange="loadPatientContextForVideo(this.value)">
                    ${(d.appointments || []).map(a => `<option value="${a.patientId}">${esc(a.patient?.name || 'Patient')} · ${a.date} (${esc(a.reason || 'Consultation')})</option>`).join('') || '<option value="">No active patient</option>'}
                  </select>
                </label>
              </div>

              <div id="video-patient-context-body">
                <div style="padding:20px; text-align:center; color:var(--muted); font-size:13px;">
                  Select a patient above or click refresh to load full EHR history.
                </div>
              </div>
            </div>
          </div>
        </section>
      `;

    case 'consult':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>🩺 AI Consultation Assistant & Clinical Diagnosis</h2>
              <p style="color:var(--muted); margin:0;">Type or speak clinical notes to automatically generate AI summaries, key observations, and follow-up reminders.</p>
            </div>
            <button class="glass-btn" type="button" onclick="toggleAIChat()">🤖 Consult Medi-AI</button>
          </div>
          
          <div style="margin:14px 0; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <span style="font-size:12px; color:var(--muted);">Quick Presets:</span>
            <button class="mini" onclick="setNotePreset('Patient reports mild fever, dry cough, and fatigue for 3 days. Temperature 100.4 F.')">🤒 Fever & Cough</button>
            <button class="mini" onclick="setNotePreset('Post-op hypertension checkup, blood pressure 135/85, mild morning dizziness.')">🫀 Hypertension Check</button>
            <button class="mini" onclick="setNotePreset('Pediatric patient with skin rash and seasonal allergies after penicillin exposure.')">👶 Allergy Review</button>
          </div>

          <div class="form-grid">
            <label class="wide">Clinical Consultation Notes
              <textarea id="doctor-notes" rows="4" placeholder="E.g., Patient Rahul reports mild fever, dry cough and throat irritation for 3 days..."></textarea>
            </label>
          </div>
          
          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="primary" onclick="generateAISummary()">✨ Generate AI Summary</button>
            <button class="glass-btn" onclick="aiSuggestRx()">💊 Auto-Suggest Medications</button>
          </div>

          <div id="ai-output" style="display:none; margin-top:15px;"></div>
          
          <hr style="border:0; border-top:1px solid var(--line); margin:25px 0;" />
          
          <form id="consult-form" class="form-grid">
            <label>Select Appointment / Patient
              <select id="consult-appt" required>
                ${(d.appointments || []).map(a => `<option value="${a.id}">${esc(a.patient?.name)} · ${a.date} ${a.time}</option>`).join('')}
              </select>
            </label>
            <label class="wide">Final Medical Diagnosis
              <textarea id="diagnosis" rows="2" placeholder="Clinical diagnosis summary..." required></textarea>
            </label>
            <label class="wide">Treatment Plan & Prescription Notes
              <textarea id="treatment" rows="3" placeholder="Medication dosage, lifestyle advice, follow-up..." required></textarea>
            </label>
            <div class="wide" style="display:flex; gap:12px; flex-wrap:wrap;">
              <button class="primary" type="submit">Complete Consultation & Save to EHR</button>
              <button class="glass-btn" type="button" onclick="state.section='prescriptions'; render();">💊 Issue Prescription</button>
            </div>
          </form>
        </section>
      `;

    case 'records':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>📄 Patient Medical Records & EHR Vault</h2>
              <p style="color:var(--muted); margin:0;">Search and review diagnostic reports, lab tests, and past hospital visits.</p>
            </div>
            <button class="mini" onclick="alert('Upload new record: Select file and patient.')">+ Upload Record</button>
          </div>
          <div class="table-wrap" style="margin-top:15px;">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Document Title</th>
                  <th>Record Type</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${(d.records || []).map(r => `
                  <tr>
                    <td><b>${esc(r.patient?.name || 'Rahul Kumar')}</b></td>
                    <td>📄 ${esc(r.title)}</td>
                    <td><span class="type-pill">${esc(r.type)}</span></td>
                    <td>${esc(r.date?.slice(0, 10) || 'Recent')}</td>
                    <td><button class="mini" onclick="alert('Reviewing record: ${esc(r.title)}')">👁 View EHR</button></td>
                  </tr>
                `).join('') || `<tr><td colspan="5" class="empty">No medical records uploaded yet.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `;

    case 'prescriptions':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>💊 Digital Prescription Issuer</h2>
              <p style="color:var(--muted); margin:0;">Issue digitally verified, encrypted prescriptions directly to patient medical records.</p>
            </div>
            <button class="glass-btn" type="button" onclick="aiSuggestRx()">✨ AI Suggest Meds</button>
          </div>

          <form id="rx-form" class="form-grid" style="margin-top:15px;">
            <label>Select Patient
              <select id="rx-patient" required>
                ${[...new Map((d.appointments || []).map(a => [a.patientId, a.patient])).values()].filter(Boolean).map(p => `
                  <option value="${p.id}">${esc(p.name)}</option>
                `).join('') || `<option value="1">Rahul Kumar</option>`}
              </select>
            </label>
            <label>Medicine Name & Strength
              <input id="rx-med" placeholder="E.g., Amoxicillin 500mg" required>
            </label>
            <label>Dosage & Unit
              <input id="rx-dose" placeholder="E.g., 1 tablet" required>
            </label>
            <label>Frequency
              <input id="rx-freq" placeholder="E.g., Twice daily after meals" required>
            </label>
            <label>Duration
              <input id="rx-duration" placeholder="E.g., 5 days" required>
            </label>
            <label class="wide">Instructions & Precautions
              <textarea id="rx-instructions" placeholder="E.g., Take with plenty of water. Avoid alcohol. Complete full course."></textarea>
            </label>
            <div class="wide">
              <button class="primary" type="submit">✍️ Issue & Sign Digital Prescription</button>
            </div>
          </form>
        </section>
      `;

    case 'followup':
      return `
        <section class="panel">
          <h2>🔁 Follow-up Patients Tracker</h2>
          <p>Monitor patient recovery milestones and dispatch automated SMS reminders for upcoming follow-up appointments.</p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Last Consultation</th>
                  <th>Diagnosis</th>
                  <th>Next Follow-up Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${(d.appointments || []).map(a => `
                  <tr>
                    <td><b>${esc(a.patient?.name || 'Rahul Kumar')}</b></td>
                    <td>${a.date}</td>
                    <td>${esc(a.diagnosis || 'Routine Health Checkup')}</td>
                    <td>${new Date(Date.now() + 604800000).toISOString().slice(0, 10)}</td>
                    <td><span class="status-pill confirmed">Follow-up Due</span></td>
                    <td>
                      <button class="mini" onclick="sendFollowupReminder('${esc(a.patient?.name || 'Rahul')}', '${esc(a.patient?.phone || '9000000000')}')">📲 Send SMS Reminder</button>
                    </td>
                  </tr>
                `).join('') || `<tr><td colspan="6" class="empty">No follow-up patients found.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `;

    case 'profile':
      return `
        <section class="panel">
          <h2>👤 Doctor Profile & Credentials</h2>
          <p>Update your clinical specialization, medical registration number, department, and consultation hours.</p>
          <form onsubmit="saveProfileData(event)" class="form-grid">
            <label>Doctor Full Name<input name="name" value="${esc(state.user.name)}" required></label>
            <label>Phone Number<input name="phone" value="${esc(state.user.phone || '9876543210')}" required></label>
            <label>Clinical Specialization<input name="specialization" value="${esc(state.user.specialization || 'Cardiology')}" required></label>
            <label>Department<input name="department" value="${esc(state.user.department || 'Cardiology')}" required></label>
            <label class="wide">Affiliated Hospital<input value="${esc(state.user.hospitalName || 'Medi Smart City Hospital')}" readonly></label>
            <label class="wide">Professional Bio & Experience
              <textarea name="address" rows="3">${esc(state.user.address || 'Senior Consultant with over 10 years of clinical experience in preventive and interventional cardiology.')}</textarea>
            </label>
            <div class="wide">
              <button class="primary" type="submit">💾 Save Profile Changes</button>
            </div>
          </form>
        </section>
      `;

    case 'settings':
      return `
        <section class="panel">
          <h2>⚙️ Doctor Workspace & Accessibility Settings</h2>
          <p>Configure language preferences, clinical alerts, and audio synthesizer options.</p>
          <div class="form-grid">
            <label>Interface Language
              <select onchange="setLang(this.value)">
                ${Object.entries(langs).map(([k, v]) => `<option value="${k}" ${state.lang === k ? 'selected' : ''}>${v.name}</option>`).join('')}
              </select>
            </label>
            <label>Accessibility Mode
              <select onchange="setDisability(this.value)">
                <option value="none" ${state.disability === 'none' ? 'selected' : ''}>${t('none')}</option>
                <option value="blind" ${state.disability === 'blind' ? 'selected' : ''}>${t('blind')}</option>
                <option value="lowVision" ${state.disability === 'lowVision' ? 'selected' : ''}>${t('lowVision')}</option>
                <option value="motor" ${state.disability === 'motor' ? 'selected' : ''}>${t('motor')}</option>
              </select>
            </label>
          </div>
        </section>
      `;

    default:
      return `
        <div class="metrics">
          ${card(t('today'), todaysList.length, 'Scheduled visits', '📅')}
          ${card('Patients', new Set((d.appointments || []).map(a => a.patientId)).size || 1, 'Connected patients', '👥')}
          ${card('Queue Wait', `${Math.max(1, queuePatientsCount(d))} Patients`, 'Live clinic queue', '⏳')}
          ${card(t('followup'), (d.appointments || []).filter(a => a.status === 'confirmed').length || 1, 'Follow-up visits', '🔁')}
        </div>

        <div class="split">
          <section class="panel">
            <div class="panel-head">
              <h2>📅 Today's Appointments</h2>
              <button class="mini" onclick="state.section='today'; render();">View All</button>
            </div>
            ${todaysList.slice(0, 4).map(a => `
              <div class="list-row">
                <div>
                  <b>${esc(a.patient?.name || 'Rahul Kumar')}</b>
                  <small style="display:block; color:var(--muted);">${a.time} · ${esc(a.department)}</small>
                </div>
                <span class="status-pill ${a.status}">${a.status}</span>
                <button class="mini" onclick="state.section='consult'; render();">🩺 Consult</button>
              </div>
            `).join('') || '<p class="empty">No appointments scheduled for today.</p>'}
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>⚡ Clinical Quick Launchpad</h2>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
              <button class="glass-btn" style="padding:18px; text-align:left;" onclick="state.section='consult'; render();">
                <span style="font-size:24px; display:block; margin-bottom:6px;">🩺</span>
                <b>AI Consultation</b>
                <small style="display:block; color:var(--muted);">Clinical notes & diagnosis</small>
              </button>
              <button class="glass-btn" style="padding:18px; text-align:left;" onclick="state.section='video'; render();">
                <span style="font-size:24px; display:block; margin-bottom:6px;">🎥</span>
                <b>Video Room</b>
                <small style="display:block; color:var(--muted);">Telemedicine call</small>
              </button>
              <button class="glass-btn" style="padding:18px; text-align:left;" onclick="state.section='queue'; render();">
                <span style="font-size:24px; display:block; margin-bottom:6px;">⏳</span>
                <b>Patient Queue</b>
                <small style="display:block; color:var(--muted);">Live clinic triage</small>
              </button>
              <button class="glass-btn" style="padding:18px; text-align:left;" onclick="state.section='prescriptions'; render();">
                <span style="font-size:24px; display:block; margin-bottom:6px;">💊</span>
                <b>Write Rx</b>
                <small style="display:block; color:var(--muted);">Digital prescriptions</small>
              </button>
            </div>
          </section>
        </div>
      `;
  }
}

function queuePatientsCount(d) {
  return (d.appointments || []).filter(a => ['pending', 'confirmed'].includes(a.status)).length;
}

// ----------------------------------------------------
// HOSPITAL CONTENT VIEWS
// ----------------------------------------------------
function hospitalContent() {
  const d = state.data;
  switch (state.section) {
    case 'manage-doctors':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>🩺 Manage Hospital Doctors</h2>
              <p style="color:var(--muted); margin:0;">Add new doctors, approve registrations, suspend or remove doctor accounts.</p>
            </div>
          </div>

          <div class="ai-assistant-bar" style="margin:16px 0; padding:18px; background:rgba(35,215,197,0.08); border:1px solid rgba(35,215,197,0.3); border-radius:14px;">
            <h3 style="margin:0 0 14px; color:var(--accent);">➕ Add New Doctor</h3>
            <form id="add-doctor-form" class="form-grid">
              <label>Doctor Full Name<input id="doc-name" placeholder="Dr. Full Name" required></label>
              <label>Email Address<input id="doc-email" type="email" placeholder="doctor@email.com" required></label>
              <label>Password<input id="doc-password" type="password" placeholder="Min 8 characters" required></label>
              <label>Phone<input id="doc-phone" placeholder="Phone number"></label>
              <label>Specialization<input id="doc-specialization" placeholder="e.g., Cardiology"></label>
              <label>Department
                <select id="doc-department">
                  <option>General Medicine</option><option>Cardiology</option><option>Neurology</option>
                  <option>Dermatology</option><option>Pediatrics</option><option>Orthopedics</option>
                  <option>ENT</option><option>Ophthalmology</option><option>Psychiatry</option>
                  <option>Oncology</option><option>Emergency</option>
                </select>
              </label>
              <label>Initial Status
                <select id="doc-status">
                  <option value="approved">Approved (Active immediately)</option>
                  <option value="pending">Pending (Needs approval)</option>
                </select>
              </label>
              <div class="wide"><button class="primary" type="submit">➕ Add Doctor to Hospital</button></div>
            </form>
          </div>

          <div class="table-wrap" style="margin-top:15px;">
            <table>
              <thead>
                <tr><th>Doctor Name</th><th>Email</th><th>Department</th><th>Specialization</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${(d.doctors || []).map(doc => `
                  <tr>
                    <td><b>🩺 ${esc(doc.name)}</b></td>
                    <td>${esc(doc.email)}</td>
                    <td>${esc(doc.department || 'Unassigned')}</td>
                    <td>${esc(doc.specialization || '-')}</td>
                    <td><span class="status-pill ${doc.status === 'approved' ? 'confirmed' : doc.status === 'suspended' ? 'cancelled' : 'pending'}">${esc(doc.status || 'active')}</span></td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap;">
                      ${doc.status !== 'approved' ? `<button class="mini" onclick="manageDoctorStatus('${doc.id}', 'approved')">✅ Approve</button>` : ''}
                      ${doc.status !== 'suspended' ? `<button class="mini" onclick="manageDoctorStatus('${doc.id}', 'suspended')">⛔ Suspend</button>` : ''}
                      ${doc.status === 'suspended' ? `<button class="mini" onclick="manageDoctorStatus('${doc.id}', 'approved')">🔄 Reactivate</button>` : ''}
                      <button class="mini" onclick="manageDoctorStatus('${doc.id}', 'rejected')" style="color:#ff4d67;">🗑 Remove</button>
                    </td>
                  </tr>
                `).join('') || `<tr><td colspan="6" class="empty">No doctors in this hospital yet. Add one above.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `;

    case 'schedules':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>🗓️ Doctor Schedule & Slot Management</h2>
              <p style="color:var(--muted); margin:0;">Manage doctor availability, consultation time slots, and online consultation timings.</p>
            </div>
          </div>

          <div style="margin:16px 0;">
            <label style="color:#c9d8e8; font-weight:700; font-size:13px;">Select Doctor
              <select id="schedule-doctor" style="width:100%; margin-top:7px; background:#071522; border:1px solid var(--line); color:white; border-radius:11px; padding:13px;" onchange="loadDoctorSchedule()">
                <option value="">-- Select a Doctor --</option>
                ${(d.doctors || []).filter(doc => doc.status === 'approved').map(doc => `<option value="${doc.id}">${esc(doc.name)} — ${esc(doc.department || 'General')}</option>`).join('')}
              </select>
            </label>
          </div>

          <div id="schedule-content">
            <div class="empty" style="padding:30px; text-align:center; color:var(--muted);">Select a doctor above to view and manage their schedule.</div>
          </div>

          <div style="margin-top:20px; padding:16px; background:rgba(35,215,197,0.06); border:1px solid rgba(35,215,197,0.2); border-radius:14px;">
            <h3 style="margin:0 0 12px; color:var(--accent);">➕ Add Quick Slot</h3>
            <form id="add-slot-form" class="form-grid">
              <label>Day
                <select id="slot-day">
                  <option>monday</option><option>tuesday</option><option>wednesday</option>
                  <option>thursday</option><option>friday</option><option>saturday</option><option>sunday</option>
                </select>
              </label>
              <label>Start Time<input id="slot-start" type="time" value="09:00" required></label>
              <label>End Time<input id="slot-end" type="time" value="09:30" required></label>
              <label>Type
                <select id="slot-type">
                  <option value="in-person">In-Person</option>
                  <option value="online">Online Consultation</option>
                </select>
              </label>
              <div class="wide"><button class="primary" type="submit">➕ Add Slot to Schedule</button></div>
            </form>
          </div>

          ${(d.schedules || []).map(s => `
            <div style="margin-top:20px;">
              <h3 style="color:var(--accent);">📋 ${esc(s.doctor?.name || 'Doctor')} — Schedule</h3>
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Day</th><th>Start</th><th>End</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    ${(s.slots || []).slice(0, 30).map(slot => `
                      <tr>
                        <td style="text-transform:capitalize;">${esc(slot.day)}</td>
                        <td>${esc(slot.startTime)}</td>
                        <td>${esc(slot.endTime)}</td>
                        <td><span class="type-pill">${esc(slot.type)}</span></td>
                        <td><span class="status-pill ${slot.status === 'available' ? 'confirmed' : slot.status === 'disabled' ? 'cancelled' : 'pending'}">${esc(slot.status)}</span></td>
                        <td>
                          ${slot.status === 'available' ? `<button class="mini" onclick="updateSlotStatus('${slot.id}', 'disabled')">Disable</button> <button class="mini" onclick="updateSlotStatus('${slot.id}', 'blocked')">Block</button>` : `<button class="mini" onclick="updateSlotStatus('${slot.id}', 'available')">Enable</button>`}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `).join('')}
        </section>
      `;

    case 'activity':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>📡 Activity Tracking Dashboard</h2>
              <p style="color:var(--muted); margin:0;">Monitor doctor and patient login/logout activity and last active times.</p>
            </div>
          </div>

          <h3 style="margin:20px 0 10px; color:var(--accent);">🩺 Doctor Activity</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Doctor Name</th><th>Department</th><th>Login Time</th><th>Logout Time</th><th>Last Active</th><th>Status</th></tr></thead>
              <tbody>
                ${(d.doctorActivity || []).map(a => `
                  <tr>
                    <td><b>${esc(a.doctor?.name || 'Doctor')}</b></td>
                    <td>${esc(a.doctor?.department || '-')}</td>
                    <td>${a.activity?.loginTime ? new Date(a.activity.loginTime).toLocaleString() : '<span style="color:var(--muted);">Never</span>'}</td>
                    <td>${a.activity?.logoutTime ? new Date(a.activity.logoutTime).toLocaleString() : '<span style="color:var(--muted);">—</span>'}</td>
                    <td>${a.activity?.lastActiveTime ? new Date(a.activity.lastActiveTime).toLocaleString() : '<span style="color:var(--muted);">—</span>'}</td>
                    <td><span class="status-pill ${a.activity?.loginTime && !a.activity?.logoutTime ? 'confirmed' : 'pending'}">${a.activity?.loginTime && (!a.activity?.logoutTime || a.activity.loginTime > a.activity.logoutTime) ? 'Online' : 'Offline'}</span></td>
                  </tr>
                `).join('') || `<tr><td colspan="6" class="empty">No doctor activity data available.</td></tr>`}
              </tbody>
            </table>
          </div>

          <h3 style="margin:20px 0 10px; color:var(--accent);">👥 Patient Activity</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Patient Name</th><th>Phone</th><th>Login Time</th><th>Logout Time</th><th>Last Active</th><th>Status</th></tr></thead>
              <tbody>
                ${(d.patientActivity || []).map(a => `
                  <tr>
                    <td><b>${esc(a.patient?.name || 'Patient')}</b></td>
                    <td>${esc(a.patient?.phone || '-')}</td>
                    <td>${a.activity?.loginTime ? new Date(a.activity.loginTime).toLocaleString() : '<span style="color:var(--muted);">Never</span>'}</td>
                    <td>${a.activity?.logoutTime ? new Date(a.activity.logoutTime).toLocaleString() : '<span style="color:var(--muted);">—</span>'}</td>
                    <td>${a.activity?.lastActiveTime ? new Date(a.activity.lastActiveTime).toLocaleString() : '<span style="color:var(--muted);">—</span>'}</td>
                    <td><span class="status-pill ${a.activity?.loginTime && !a.activity?.logoutTime ? 'confirmed' : 'pending'}">${a.activity?.loginTime && (!a.activity?.logoutTime || a.activity.loginTime > a.activity.logoutTime) ? 'Online' : 'Offline'}</span></td>
                  </tr>
                `).join('') || `<tr><td colspan="6" class="empty">No patient activity data available.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `;

    case 'doctors':
      return table('Hospital Doctors Directory', ['Doctor Name', 'Department', 'Specialization', 'Status'], (d.doctors || []).map(doc => `
        <tr><td><b>🩺 ${esc(doc.name)}</b></td><td>${esc(doc.department)}</td><td>${esc(doc.specialization)}</td><td><span class="status-pill ${doc.status === 'approved' ? 'confirmed' : doc.status === 'suspended' ? 'cancelled' : 'pending'}">${esc(doc.status || 'Active')}</span></td></tr>
      `));
    case 'patients':
      return `
        <div style="display:flex; flex-direction:column; gap:20px;">
          <section class="panel" style="margin-bottom:0;">
            <div class="panel-head">
              <div>
                <h2>👥 Patient Admissions & Entry Telemetry</h2>
                <p style="color:var(--muted); margin:0;">Real-time log of patients admitted to hospital wards, triaged, and allocated beds.</p>
              </div>
              <button class="mini primary" onclick="window.__HOSP_D12__?.openAdmitModal()">➕ Log Patient Entry</button>
            </div>
          </section>
          ${renderHospitalDashboard(d)}
        </div>
      `;
    case 'appointments':
      return table('Hospital Appointments', ['Doctor', 'Patient', 'Date', 'Time', 'Department', 'Status'], (d.appointments || []).map(a => `
        <tr><td>${esc(a.doctor?.name || '-')}</td><td>${esc(a.patient?.name || '-')}</td><td>${a.date}</td><td>${a.time}</td><td>${esc(a.department)}</td><td><span class="status-pill ${a.status}">${a.status}</span></td></tr>
      `));
    case 'reports':
      return `
        <div style="display:flex; flex-direction:column; gap:20px;">
          <section class="panel" style="margin-bottom:0;">
            <div class="panel-head">
              <div>
                <h2>📈 Hospital Operations & Patient Inflow Analytics</h2>
                <p style="color:var(--muted); margin:0;">Continuous telemetry of bed occupancy, patient admission velocity, and ward sweep lanes.</p>
              </div>
            </div>
          </section>
          ${renderHospitalDashboard(d)}
        </div>
      `;
    case 'departments':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>🏢 Hospital Medical Departments & Ward Capacities</h2>
              <p style="color:var(--muted); margin:0;">Real-time overview of medical departments, on-duty clinical staff, and bed allocation.</p>
            </div>
            <button class="mini primary" onclick="window.__HOSP_D12__?.openBedModal()">🛏️ Update Bed Counts</button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-top:16px;">
            <div class="metric"><div class="metric-icon">🚨</div><div><strong>ICU & Critical Care</strong><span>4 Doctors · 6/24 Beds Free</span></div></div>
            <div class="metric"><div class="metric-icon">🚑</div><div><strong>Emergency & Trauma</strong><span>5 Doctors · 12/20 Beds Free</span></div></div>
            <div class="metric"><div class="metric-icon">❤️</div><div><strong>Cardiology Ward</strong><span>4 Doctors · 8/28 Beds Free</span></div></div>
            <div class="metric"><div class="metric-icon">🧠</div><div><strong>Neurology Unit</strong><span>2 Doctors · 5/18 Beds Free</span></div></div>
            <div class="metric"><div class="metric-icon">👶</div><div><strong>Pediatrics & Neonatal</strong><span>3 Doctors · 16/24 Beds Free</span></div></div>
            <div class="metric"><div class="metric-icon">🩺</div><div><strong>General Medical & Surgical</strong><span>6 Doctors · 32/86 Beds Free</span></div></div>
          </div>
        </section>
      `;
    case 'profile':
      return `
        <section class="panel">
          <h2>👤 Hospital Profile & Details</h2>
          <form onsubmit="saveProfileData(event)" class="form-grid">
            <label>Hospital Name<input name="name" value="${esc(state.user.name)}" required></label>
            <label>Phone<input name="phone" value="${esc(state.user.phone || '04023456789')}" required></label>
            <label class="wide">Address<textarea name="address" rows="2">${esc(state.user.address || 'Main Road, Hyderabad')}</textarea></label>
            <div class="wide"><button class="primary" type="submit">💾 Save Hospital Profile</button></div>
          </form>
        </section>
      `;
    case 'settings':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>⚙️ Hospital Capacity & Threshold Settings</h2>
              <p style="color:var(--muted); margin:0;">Configure automated bed shortage alerts, triage escalation, and patient sync policies.</p>
            </div>
          </div>
          <div class="form-grid" style="margin-top:20px;">
            <label>Bed Critical Shortage Threshold
              <select>
                <option selected>Alert when available beds &lt; 15%</option>
                <option>Alert when available beds &lt; 10%</option>
                <option>Alert when available beds &lt; 5%</option>
              </select>
            </label>
            <label>Emergency Triage Auto-Routing
              <select>
                <option selected>Automatic Fast-Track Queue</option>
                <option>Manual Nurse Assignment</option>
              </select>
            </label>
            <label>Patient Entry Live Sync Rate
              <select>
                <option selected>Instant Webhook Relay</option>
                <option>Every 10 Seconds</option>
              </select>
            </label>
            <div class="wide">
              <button class="primary" onclick="showNotification('Hospital notification and capacity thresholds saved!')">💾 Save Settings</button>
            </div>
          </div>
        </section>
      `;
    case 'overview':
    default:
      return renderHospitalDashboard(d);
  }
}

// ----------------------------------------------------
// ADMIN CONTENT VIEWS
// ----------------------------------------------------
function adminContent() {
  const d = state.data;
  switch (state.section) {
    case 'users':
      return table('Platform Users', ['Name', 'Email', 'Role', 'Status'], (d.users || []).map(u => `
        <tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td><span class="type-pill">${esc(u.role)}</span></td><td><span class="status-pill ${u.active !== false ? 'confirmed' : 'cancelled'}">${u.active !== false ? 'Active' : 'Inactive'}</span></td></tr>
      `));
    case 'hospitals':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>🏥 Hospital Account Management</h2>
              <p style="color:var(--muted); margin:0;">Only administrators can create hospital accounts. Provide credentials to the hospital offline.</p>
            </div>
          </div>

          <div class="ai-assistant-bar" style="margin:16px 0; padding:18px; background:rgba(35,215,197,0.08); border:1px solid rgba(35,215,197,0.3); border-radius:14px;">
            <h3 style="margin:0 0 14px; color:var(--accent);">➕ Create New Hospital Account</h3>
            <form id="add-hospital-form" class="form-grid">
              <label>Hospital Name<input id="hosp-name" placeholder="Hospital Full Name" required></label>
              <label>Email Address<input id="hosp-email" type="email" placeholder="hospital@email.com" required></label>
              <label>Password<input id="hosp-password" type="password" placeholder="Min 8 characters" required></label>
              <label>Phone<input id="hosp-phone" placeholder="Phone number"></label>
              <label class="wide">Address<input id="hosp-address" placeholder="Full address"></label>
              <label>Latitude<input id="hosp-lat" type="number" step="any" placeholder="e.g., 17.3850"></label>
              <label>Longitude<input id="hosp-lng" type="number" step="any" placeholder="e.g., 78.4867"></label>
              <div class="wide"><button class="primary" type="submit">➕ Create Hospital Account</button></div>
            </form>
          </div>

          <div class="table-wrap" style="margin-top:15px;">
            <table>
              <thead><tr><th>Hospital Name</th><th>Email</th><th>Address</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${(d.hospitals || []).map(h => `
                  <tr>
                    <td><b>\ud83c\udfe5 ${esc(h.name)}</b></td>
                    <td>${esc(h.email)}</td>
                    <td>${esc(h.address || '-')}</td>
                    <td>${esc(h.phone || '-')}</td>
                    <td><span class="status-pill ${h.active !== false ? 'confirmed' : 'cancelled'}">${h.active !== false ? 'Active' : 'Inactive'}</span></td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap;">
                      ${h.active !== false ? `<button class="mini" onclick="adminHospitalStatus('${h.id}', false)">\u26d4 Deactivate</button>` : `<button class="mini" onclick="adminHospitalStatus('${h.id}', true)">\u2705 Activate</button>`}
                      <button class="mini" onclick="adminDeleteHospital('${h.id}')" style="color:#ff4d67;">\ud83d\uddd1 Delete</button>
                    </td>
                  </tr>
                `).join('') || `<tr><td colspan="6" class="empty">No hospitals registered yet.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `;
    case 'activity':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>\ud83d\udce1 Platform Activity Logs</h2>
              <p style="color:var(--muted); margin:0;">Monitor all login, logout, and activity events across the platform.</p>
            </div>
          </div>
          <div class="table-wrap" style="margin-top:15px;">
            <table>
              <thead><tr><th>User</th><th>Role</th><th>Action</th><th>Timestamp</th></tr></thead>
              <tbody>
                ${(d.activityLogs || []).slice(0, 50).map(log => `
                  <tr>
                    <td><b>${esc(log.userName || 'Unknown')}</b></td>
                    <td><span class="type-pill">${esc(log.userRole || log.role)}</span></td>
                    <td><span class="status-pill ${log.action === 'login' ? 'confirmed' : log.action === 'logout' ? 'cancelled' : 'pending'}">${esc(log.action)}</span></td>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                `).join('') || `<tr><td colspan="4" class="empty">No activity logs yet.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      `;
    case 'reports':
      return `
        <div style="display:flex; flex-direction:column; gap:20px;">
          <section class="panel" style="margin-bottom:0;">
            <div class="panel-head">
              <div>
                <h2>📈 Platform Growth & Telemetry Reports</h2>
                <p style="color:var(--muted); margin:0;">Continuous hospital fleet telemetry and platform performance telemetry.</p>
              </div>
            </div>
          </section>
          ${renderDashboard12(d)}
        </div>
      `;
    case 'settings':
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>⚙️ Platform & Infrastructure Settings</h2>
              <p style="color:var(--muted); margin:0;">Configure global API gateways, hospital telemetry thresholds, and zero-trust security policies.</p>
            </div>
          </div>
          <div class="form-grid" style="margin-top:20px;">
            <label>API Gateway Cluster Endpoint
              <input value="https://api.medismart.health" readonly>
            </label>
            <label>Telemetry Heartbeat Rate
              <select>
                <option selected>High Fidelity (Every 5 seconds)</option>
                <option>Standard (Every 30 seconds)</option>
                <option>Economy (Every 2 minutes)</option>
              </select>
            </label>
            <label>Hospital Fleet Auto-Sync & Failover
              <select>
                <option selected>Enabled (Automatic routing)</option>
                <option>Manual Verification Required</option>
              </select>
            </label>
            <label>Security Encryption Level
              <input value="AES-GCM-256 (Strict Zero-Trust)" readonly>
            </label>
            <div class="wide">
              <button class="primary" onclick="showNotification('Platform infrastructure settings saved successfully!')">💾 Save Configurations</button>
            </div>
          </div>
        </section>
      `;
    case 'overview':
    default:
      return renderDashboard12(d);
  }
}

// ----------------------------------------------------
// DASHBOARD FULL DISPLAY WRAPPER
// ----------------------------------------------------
function dashboard() {
  const navList = getNavListForRole(state.user.role);
  const currentItem = navList.find(n => n.id === state.section) || navList[0];

  return `
    ${header()}
    <div class="dash-full-display">
      <div class="dash-top-bar">
        <div class="dash-title-group">
          <div class="dash-role-badge">
            ${roles[state.user.role]?.icon || '👤'} ${t(roles[state.user.role]?.titleKey || state.user.role).toUpperCase()} ${t('dashboard').toUpperCase()}
          </div>
          <h1>${currentItem.icon} ${currentItem.label}</h1>
        </div>

        <div class="dash-actions-bar">
          <button class="glass-btn sm-global-toggle" type="button" aria-label="Open Features Menu">
            <span>☰</span> ${t('menu')} (${navList.length} Features)
          </button>
          <button class="glass-btn" data-action="voice">🎙 ${t('voice')}</button>
          ${state.user.role !== 'hospital' && state.user.role !== 'admin' ? `
            <button class="danger" data-action="sos">🚨 ${t('sos')}</button>
          ` : ''}
        </div>
      </div>

      <div class="dash-feature-content">
        ${
          state.user.role === 'patient' ? patientContent() :
          state.user.role === 'doctor' ? doctorContent() :
          state.user.role === 'hospital' ? hospitalContent() :
          adminContent()
        }
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// STAGGERED MENU OVERLAY (MINIMIZED AT START)
// ----------------------------------------------------
function initStaggeredMenuRoot() {
  const menuRoot = document.getElementById('staggered-menu-root');
  if (!menuRoot) return;

  const currentNav = state.user ? getNavListForRole(state.user.role) : [
    { id: 'home', icon: '🏠', label: 'Home Landing Page', desc: 'Overview & 3D capabilities' },
    { id: 'roles', icon: '🔑', label: 'Get Started / Select Role', desc: 'Patient, Doctor, Hospital, Admin login' },
    { id: 'ai', icon: '✨', label: 'Medi-AI Medical Assistant', desc: 'Interactive clinical & symptom AI' },
    { id: 'video', icon: '🎥', label: 'WebRTC Telemedicine Room', desc: 'Live video & audio consultation' },
    { id: 'qrcard', icon: '💳', label: 'Emergency QR Health Badge', desc: 'Instant scannable health ID' },
    { id: 'sos', icon: '🚨', label: 'Emergency SOS Alert', desc: 'Simulated 30s GPS emergency broadcast', isSOS: true }
  ];

  menuRoot.innerHTML = `
    <div class="staggered-menu-wrapper" data-position="right">
      <div class="sm-prelayers" aria-hidden="true">
        <div class="sm-prelayer" style="background: #0d1b2e;"></div>
        <div class="sm-prelayer" style="background: #142c4b;"></div>
        <div class="sm-prelayer" style="background: #1d3557;"></div>
      </div>

      <aside class="staggered-menu-panel">
        <div class="sm-panel-inner">
          <div class="sm-drawer-head">
            <div>
              <div class="sm-drawer-role">
                ${state.user ? `${roles[state.user.role]?.icon || '👤'} ${t(state.user.role).toUpperCase()}` : '✦ MEDI SMART ECOSYSTEM'}
              </div>
              <h2 style="margin:4px 0 0; font-family:'Space Grotesk'; font-size:22px; color:#fff;">
                ${state.user ? esc(state.user.name) : 'All Healthcare Features'}
              </h2>
            </div>
            <button class="sm-close-btn" aria-label="Close Menu">✕</button>
          </div>

          <p style="color:var(--muted); font-size:13px; margin:0 0 15px;">
            Select any feature below to switch views instantly in full display:
          </p>

          <ul class="sm-panel-list" data-numbering="true">
            ${currentNav.map((it) => `
              <li class="sm-panel-itemWrap">
                <a class="sm-panel-item sm-menu-link ${state.section === it.id ? 'active' : ''} ${it.isSOS ? 'sos-item' : ''}" 
                   href="#" 
                   data-nav-id="${it.id}">
                  <span class="sm-item-icon">${it.icon}</span>
                  <span class="sm-panel-itemLabel">${it.label}</span>
                </a>
              </li>
            `).join('')}
          </ul>

          <div class="sm-socials">
            <h3 class="sm-socials-title">Quick Actions</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
              <button class="mini primary" onclick="toggleAIChat(); window.__MEDI_MENU__?.close();">✨ Medi-AI</button>
              <button class="mini" onclick="triggerSOS(); window.__MEDI_MENU__?.close();">🚨 Emergency SOS</button>
              <button class="mini" data-action="voice">🎙 Voice</button>
              ${state.user ? `<button class="mini" data-action="logout">🚪 Logout</button>` : ''}
            </div>
          </div>
        </div>
      </aside>
    </div>
  `;

  initStaggeredMenu(menuRoot, {
    position: 'right',
    colors: ['#0d1b2e', '#142c4b', '#1d3557'],
    accentColor: '#23d7c5'
  });

  // Bind nav click events inside staggered menu
  menuRoot.querySelectorAll('[data-nav-id]').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const navId = link.dataset.navId;
      window.__MEDI_MENU__?.close?.();

      if (!state.user) {
        if (navId === 'home') { location.hash = ''; state.role = ''; render(); }
        else if (navId === 'roles') { location.hash = 'roles'; state.role = ''; render(); }
        else if (navId === 'ai') { toggleAIChat(); }
        else if (navId === 'sos') { triggerSOS(); }
        else { location.hash = 'roles'; render(); }
        return;
      }

      if (navId === 'sos') {
        sos();
      } else {
        state.section = navId;
        render();
        if (state.disability === 'blind') speak(t(state.section));
      }
    };
  });
}

// ----------------------------------------------------
// DATA LOADING
// ----------------------------------------------------
async function load() {
  if (!state.user || !state.token) return;
  const r = state.user.role;
  try {
    if (r === 'patient') {
      const [appointments, records, prescriptions, doctors] = await Promise.all([
        api('/appointments/my').catch(() => []),
        api('/records').catch(() => []),
        api('/prescriptions').catch(() => []),
        api('/doctors').catch(() => [])
      ]);
      state.data = { appointments, records, prescriptions, doctors };
    } else if (r === 'doctor') {
      const [appointments, records, prescriptions] = await Promise.all([
        api('/appointments/doctor').catch(() => []),
        api('/records').catch(() => []),
        api('/prescriptions').catch(() => [])
      ]);
      state.data = { appointments, records, prescriptions };
      if (state.section === 'video') {
        setTimeout(() => loadPatientContextForVideo(), 150);
      }
    } else if (r === 'hospital') {
      const [appointments, doctors, patients, schedules, docAct, patAct, capacity, patientEntries] = await Promise.all([
        api('/appointments').catch(() => []),
        api('/hospital/doctors').catch(() => []),
        api('/hospital/patients').catch(() => []),
        api('/hospital/schedules').catch(() => []),
        api('/hospital/activity/doctors').catch(() => []),
        api('/hospital/activity/patients').catch(() => []),
        api('/hospital/capacity').catch(() => null),
        api('/hospital/patient-entries').catch(() => [])
      ]);
      state.data = {
        appointments, doctors, patients, schedules,
        doctorActivity: docAct, patientActivity: patAct,
        capacity, patientEntries
      };
    } else {
      const [users, hospitals, activityLogs] = await Promise.all([
        api('/admin/users').catch(() => []),
        api('/admin/hospitals').catch(() => []),
        api('/admin/activity').catch(() => [])
      ]);
      state.data = { users, hospitals, activityLogs };
    }
  } catch (e) {
    console.error(e);
  }
  render(false);
  if (state.disability === 'blind') setTimeout(() => speak(document.body.innerText.slice(0, 1300)), 250);
  bindMotion();
}

// ----------------------------------------------------
// GLOBAL HANDLERS FOR HOSPITAL & ADMIN (Changes 2, 3, 4, 5, 8)
// ----------------------------------------------------
window.manageDoctorStatus = async function(id, status) {
  try {
    await api(`/hospital/doctors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showNotification(`Doctor status updated to: ${status}`);
    await load();
  } catch (e) {
    alert(e.message);
  }
};

window.updateSlotStatus = async function(slotId, status) {
  try {
    await api(`/hospital/slots/${slotId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showNotification(`Slot status updated to: ${status}`);
    await load();
  } catch (e) {
    alert(e.message);
  }
};

window.adminHospitalStatus = async function(id, active) {
  try {
    await api(`/admin/hospitals/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ active })
    });
    showNotification(`Hospital account ${active ? 'activated' : 'deactivated'}.`);
    await load();
  } catch (e) {
    alert(e.message);
  }
};

window.adminDeleteHospital = async function(id) {
  if (!confirm('Are you sure you want to deactivate and remove this hospital?')) return;
  try {
    await api(`/admin/hospitals/${id}`, { method: 'DELETE' });
    showNotification('Hospital deactivated successfully.');
    await load();
  } catch (e) {
    alert(e.message);
  }
};

window.onDoctorSelectChange = function(doctorId) {
  const docId = doctorId || document.getElementById('doctor')?.value;
  const doc = (state.data.doctors || []).find(d => d.id === docId);
  const deptInput = document.getElementById('department');
  if (doc && deptInput) deptInput.value = doc.department || doc.specialization || 'General Medicine';
};

window.loadDoctorSchedule = function() {
  const docId = document.getElementById('schedule-doctor')?.value;
  const content = document.getElementById('schedule-content');
  if (!content) return;
  if (!docId) {
    content.innerHTML = `<div class="empty" style="padding:30px; text-align:center; color:var(--muted);">Select a doctor above to view and manage their schedule.</div>`;
    return;
  }
  const sched = (state.data.schedules || []).find(s => s.doctorId === docId);
  if (!sched || !sched.slots || !sched.slots.length) {
    content.innerHTML = `<div class="empty" style="padding:20px; text-align:center; color:var(--muted);">No custom slots for this doctor yet. Use "Add Quick Slot" below to create weekly slots.</div>`;
    return;
  }
  content.innerHTML = `
    <div style="margin-top:14px;">
      <h3 style="color:var(--accent); font-size:16px; margin:0 0 10px;">📋 ${esc(sched.doctor?.name || 'Doctor')} Schedule Slots</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Day</th><th>Start</th><th>End</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${sched.slots.map(slot => `
              <tr>
                <td style="text-transform:capitalize;"><b>${esc(slot.day)}</b></td>
                <td>${esc(slot.startTime)}</td>
                <td>${esc(slot.endTime)}</td>
                <td><span class="type-pill">${esc(slot.type)}</span></td>
                <td><span class="status-pill ${slot.status === 'available' ? 'confirmed' : slot.status === 'disabled' ? 'cancelled' : 'pending'}">${esc(slot.status)}</span></td>
                <td>
                  ${slot.status === 'available' ? `<button class="mini" onclick="updateSlotStatus('${slot.id}', 'disabled')">Disable</button> <button class="mini" onclick="updateSlotStatus('${slot.id}', 'blocked')">Block</button>` : `<button class="mini" onclick="updateSlotStatus('${slot.id}', 'available')">Enable</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

window.loadPatientContextForVideo = async function(patientId) {
  const container = document.getElementById('video-patient-context-body');
  if (!container) return;

  const select = document.getElementById('video-patient-select');
  const pid = patientId || select?.value || state.data.appointments?.[0]?.patientId || '1';

  container.innerHTML = `<div style="padding:15px; color:var(--accent); text-align:center;">✨ Fetching complete EHR & AI history...</div>`;

  try {
    const res = await api(`/consultation/patient-context/${pid}`);
    const d = res.data;
    const po = d.patientOverview;

    container.innerHTML = `
      <div style="font-size:13px; display:grid; gap:12px;">
        ${po ? `
          <div style="background:rgba(255,255,255,0.04); padding:12px; border-radius:10px; border:1px solid var(--line);">
            <div style="font-weight:700; color:#fff; font-size:14px; margin-bottom:4px;">${esc(po.name)}</div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
              <span class="qr-pill">Blood: <b>${esc(po.bloodGroup)}</b></span>
              <span class="qr-pill" style="border-color:#ff4d67; color:#ff8b99;">Allergies: <b>${esc(po.allergies)}</b></span>
              <span class="qr-pill">Condition: <b>${esc(po.conditions)}</b></span>
              <span class="qr-pill">Visits: <b>${po.totalVisits}</b></span>
            </div>
          </div>
        ` : ''}

        <div style="background:rgba(35,215,197,0.06); padding:12px; border-radius:10px; border:1px solid rgba(35,215,197,0.25);">
          <div style="font-weight:700; color:var(--accent); margin-bottom:6px;">⚠️ Key Medical Notes</div>
          ${(d.importantNotes || []).map(n => `<div style="font-size:12px; color:#e1effa; margin-bottom:4px;">${esc(n)}</div>`).join('')}
        </div>

        <div>
          <div style="font-weight:700; color:#c9d8e8; margin-bottom:6px;">📋 Previous Consultations</div>
          ${(d.previousVisits || []).slice(0, 3).map(v => `
            <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:8px; margin-bottom:6px; font-size:12px; border:1px solid var(--line);">
              <div style="display:flex; justify-content:space-between; color:var(--muted);">
                <span>${esc(v.date)} · ${esc(v.department)}</span>
                <span class="status-pill confirmed">${esc(v.status)}</span>
              </div>
              <div style="margin-top:3px;"><b>Diagnosis:</b> ${esc(v.diagnosis)}</div>
              <div style="color:var(--muted); margin-top:2px;"><b>Notes:</b> ${esc(v.treatmentNotes)}</div>
            </div>
          `).join('') || '<div style="color:var(--muted); font-size:12px;">No past consultations.</div>'}
        </div>

        <div>
          <div style="font-weight:700; color:#c9d8e8; margin-bottom:6px;">💊 Active Prescriptions</div>
          ${(d.previousPrescriptions || []).slice(0, 2).map(p => `
            <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:8px; margin-bottom:6px; font-size:12px; border:1px solid var(--line);">
              <div style="color:var(--accent); font-weight:600;">${esc(p.medicines)}</div>
              <div style="color:var(--muted); font-size:11px; margin-top:2px;">${esc(p.instructions)}</div>
            </div>
          `).join('') || '<div style="color:var(--muted); font-size:12px;">No active prescriptions.</div>'}
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="error" style="font-size:12px;">${esc(e.message)}</div>`;
  }
};

async function doLogin(form) {
  const errEl = document.getElementById('error');
  if (errEl) errEl.innerHTML = '';

  const emailInput = form?.querySelector('#email') || form?.email || document.getElementById('email');
  const passwordInput = form?.querySelector('#password') || form?.password || document.getElementById('password');
  const email = (emailInput?.value || '').trim();
  const password = (passwordInput?.value || '').trim();
  const role = state.role || 'patient';

  if (!email || !password) {
    if (errEl) errEl.innerHTML = `<div class="error" role="alert">Please enter both email and password.</div>`;
    return;
  }

  const submitBtn = document.getElementById('btn-login-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Signing in...';
  }

  try {
    const d = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    state.user = d.user;
    state.token = d.token;
    save();
    state.section = 'overview';
    showNotification(`Welcome back, ${d.user.name}!`);
    await load();
  } catch (e) {
    console.error('Login error:', e);
    if (errEl) errEl.innerHTML = `<div class="error" role="alert">${esc(e.message || 'Login failed')}</div>`;
    speak(e.message || 'Login failed');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = `${t('signIn')} →`;
    }
  }
}

async function doBook(form) {
  try {
    const selectedDoctorId = form.doctor.value;
    const selectedDoctor = (state.data?.doctors || []).find(d => d.id === selectedDoctorId);
    const doctorName = selectedDoctor?.name || 'Specialist Doctor';

    await api('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctor: selectedDoctorId,
        department: form.department.value,
        date: form.date.value,
        time: form.time.value,
        reason: form.reason.value
      })
    });
    showNotification(`✅ Appointment request sent to ${doctorName}! Reflected in doctor schedule.`);
    state.section = 'appointments';
    await load();
  } catch (e) {
    alert(e.message);
  }
}

async function doConsult(form) {
  try {
    await api(`/appointments/${form['consult-appt'].value}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'completed',
        diagnosis: form.diagnosis.value,
        treatmentNotes: form.treatment.value
      })
    });
    showNotification("Consultation diagnosis & treatment saved!");
    state.section = 'today';
    await load();
  } catch (e) {
    alert(e.message);
  }
}

async function doRx(form) {
  try {
    await api('/prescriptions', {
      method: 'POST',
      body: JSON.stringify({
        patientId: form['rx-patient'].value,
        appointmentId: '',
        medicines: [{
          name: form['rx-med'].value,
          dosage: form['rx-dose'].value,
          frequency: form['rx-freq'].value,
          duration: form['rx-duration'].value
        }],
        instructions: form['rx-instructions'].value
      })
    });
    showNotification("Prescription issued successfully!");
    state.section = 'records';
    await load();
  } catch (e) {
    alert(e.message);
  }
}

async function updateAppt(id, status) {
  try {
    await api(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    // Optimistic local state update
    if (state.data && Array.isArray(state.data.appointments)) {
      const target = state.data.appointments.find(a => a.id === id);
      if (target) {
        target.status = status;
      }
    }
    const statusMsg = status === 'confirmed' ? '✅ Appointment confirmed! Patient has been notified.' : status === 'completed' ? '✓ Consultation marked as completed!' : `Appointment marked as ${status}.`;
    showNotification(statusMsg);
    render();
    await load();
  } catch (e) {
    alert(e.message);
  }
}

function loudAlert() {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) {
      const c = new C();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = 880;
      g.gain.value = .12;
      o.connect(g);
      g.connect(c.destination);
      o.start();
      setTimeout(() => { o.stop(); c.close(); }, 700);
    }
  } catch {}
}

async function getLocation() {
  if (!navigator.geolocation) throw Error('Location is not supported by this device.');
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
    )
  );
}

async function sos(trigger = 'manual-sos') {
  if (state.sosActive) return;
  state.sosActive = true;
  let remaining = 30;
  const overlay = document.createElement('div');
  overlay.className = 'sos-overlay';
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="sos-modal">
      <div class="sos-pulse">🚨</div>
      <h1>${t('sos')}</h1>
      <p>${t('sosText')}</p>
      <div class="countdown" id="sos-count">30</div>
      <p id="sos-status">${t('cancel')} before the timer reaches zero.</p>
      <button class="cancel-sos" id="cancel-sos">${t('cancel')}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  speak(`${t('sos')}. ${t('sosText')}`);
  loudAlert();

  const cancel = () => {
    clearInterval(state.sosTimer);
    state.sosActive = false;
    overlay.remove();
    speak(t('cancel'));
  };

  document.getElementById('cancel-sos').onclick = cancel;

  state.sosTimer = setInterval(async () => {
    remaining--;
    const countEl = document.getElementById('sos-count');
    if (countEl) countEl.textContent = remaining;
    loudAlert();

    if (remaining <= 0) {
      clearInterval(state.sosTimer);
      const statusEl = document.getElementById('sos-status');
      if (statusEl) statusEl.textContent = 'Sending your location to the nearest authorized hospital...';
      try {
        const loc = await getLocation();
        const result = await api('/emergency', { method: 'POST', body: JSON.stringify({ trigger, ...loc }) });
        overlay.querySelector('.sos-modal').innerHTML = `
          <div class="sos-pulse">✓</div>
          <h1>${t('sent')}</h1>
          <p>${t('nearby')}.</p>
          <p><b>${esc(result.nearestHospital?.name || 'Medi Smart Hospital Network')}</b></p>
          <p>${t('location')}: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}</p>
          <button class="primary" id="close-sos">Close</button>
        `;
        document.getElementById('close-sos').onclick = () => {
          overlay.remove();
          state.sosActive = false;
        };
        speak(`${t('sent')}. ${t('nearby')}.`);
      } catch (e) {
        overlay.querySelector('.sos-modal').innerHTML = `
          <h1>Alert could not be sent</h1>
          <p>${esc(e.message)}</p>
          <button class="primary" id="close-sos">Close</button>
        `;
        document.getElementById('close-sos').onclick = () => {
          overlay.remove();
          state.sosActive = false;
        };
        speak(e.message);
      }
    }
  }, 1000);
}

function enableMotion() {
  state.motionSOS = !state.motionSOS;
  localStorage.setItem('medi_motion_sos', state.motionSOS ? 'on' : 'off');
  if (state.motionSOS) requestMotionPermission();
  render(false);
  bindMotion();
}

async function requestMotionPermission() {
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      const p = await DeviceMotionEvent.requestPermission();
      if (p !== 'granted') {
        state.motionSOS = false;
        localStorage.setItem('medi_motion_sos', 'off');
      }
    }
  } catch {}
}

function bindMotion() {
  if (state.motionBound || !state.user || state.user.role !== 'patient') return;
  state.motionBound = true;
  window.addEventListener('devicemotion', e => {
    if (!state.motionSOS || state.sosActive) return;
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    if (mag > 25 && Date.now() - state.lastShock > 15000) {
      state.lastShock = Date.now();
      speak(t('sos'));
      sos('motion-shock');
    }
  });
}

// ----------------------------------------------------
// ENHANCED INTERACTIVE VOICE ASSISTANT (HUD & SPEECH)
// ----------------------------------------------------
let activeVoiceRecognition = null;

function voice() {
  // Stop any active speech synthesis or recognition first
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (activeVoiceRecognition) {
    try { activeVoiceRecognition.stop(); } catch {}
    activeVoiceRecognition = null;
  }

  // Remove any existing voice modal overlay
  document.getElementById('voice-hud-modal-overlay')?.remove();

  const role = state.user?.role || 'guest';
  const roleHints = {
    patient: ['Book appointment', 'My prescriptions', 'Emergency SOS', 'Medical records', 'Telemedicine video', 'Consultation history'],
    doctor: ['Today appointments', 'AI summary', 'Waiting queue', 'Video consultation', 'Patient records', 'Issue prescription'],
    hospital: ['Manage doctors', 'Doctor directory', 'Schedules and slots', 'Activity tracking', 'Emergency cases', 'Hospital profile'],
    admin: ['Hospital management', 'Users management', 'Activity logs', 'Emergency cases', 'Patient directory'],
    guest: ['Get started', 'Login as Patient', 'Login as Doctor', 'Login as Hospital', 'Emergency SOS']
  };

  const chips = roleHints[role] || roleHints.guest;

  const overlay = document.createElement('div');
  overlay.id = 'voice-hud-modal-overlay';
  overlay.className = 'voice-hud-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="voice-hud-modal">
      <button style="position:absolute; right:16px; top:16px; background:none; border:none; color:var(--muted); font-size:20px; cursor:pointer;" id="voice-hud-close" aria-label="Close Voice Assistant">✕</button>
      <div style="font-size:36px; margin-bottom:4px;">🎙️</div>
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 4px; color:#fff;">Medi-AI Voice Assistant</h2>
      <p style="color:var(--accent); font-size:13.5px; margin:0;" id="voice-hud-status">● Listening... Speak your medical command</p>

      <div class="voice-wave-container" id="voice-wave-bars">
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
        <div class="voice-wave-bar"></div>
      </div>

      <div class="voice-transcript-box" id="voice-hud-transcript">
        <span style="color:var(--muted); font-style:italic;">Listening to microphone... Speak clearly</span>
      </div>

      <div style="margin-top:14px; text-align:left;">
        <span style="font-size:12px; color:var(--muted); display:block; margin-bottom:6px;">Sample Voice Commands (or Click to Run):</span>
        <div class="voice-chips">
          ${chips.map(c => `<button class="voice-chip" onclick="processVoiceCommand('${c.toLowerCase()}')">💬 "${c}"</button>`).join('')}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('voice-hud-close');
  const closeVoice = () => {
    if (activeVoiceRecognition) {
      try { activeVoiceRecognition.stop(); } catch {}
      activeVoiceRecognition = null;
    }
    overlay.remove();
  };
  if (closeBtn) closeBtn.onclick = closeVoice;

  // Check Web Speech API Support
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    const statusEl = document.getElementById('voice-hud-status');
    const transcriptEl = document.getElementById('voice-hud-transcript');
    if (statusEl) statusEl.innerHTML = "<span style='color:#ff8b99;'>⚠️ Microphone Speech API not supported in this browser</span>";
    if (transcriptEl) transcriptEl.innerHTML = "<span>Speech recognition is supported in Chrome, Edge & Safari. You can click any sample command above.</span>";
    return;
  }

  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  const r = new R();
  activeVoiceRecognition = r;
  r.lang = langs[state.lang]?.speech || 'en-IN';
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 3;

  r.onstart = () => {
    const statusEl = document.getElementById('voice-hud-status');
    if (statusEl) statusEl.innerHTML = "<span style='color:var(--accent);'>● Active & Listening... Speak now</span>";
  };

  r.onresult = e => {
    let interim = '';
    let finalTranscript = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }

    const transcriptEl = document.getElementById('voice-hud-transcript');
    if (transcriptEl) {
      transcriptEl.innerHTML = `<span><b>Heard:</b> "${esc(finalTranscript || interim)}"</span>`;
    }

    if (finalTranscript) {
      processVoiceCommand(finalTranscript.toLowerCase());
    }
  };

  r.onerror = e => {
    const statusEl = document.getElementById('voice-hud-status');
    const transcriptEl = document.getElementById('voice-hud-transcript');
    if (e.error === 'no-speech') {
      if (statusEl) statusEl.innerHTML = "<span style='color:#ffd27d;'>⏳ No speech detected. Please speak or click a command.</span>";
    } else if (e.error === 'not-allowed') {
      if (statusEl) statusEl.innerHTML = "<span style='color:#ff7083;'>🚫 Microphone permission blocked. Click a sample command below.</span>";
      if (transcriptEl) transcriptEl.innerHTML = "<span>Microphone access was denied. Enable mic in browser settings to speak.</span>";
    } else {
      if (statusEl) statusEl.innerHTML = `<span style='color:#ff8b99;'>Notice: ${esc(e.error)}</span>`;
    }
  };

  r.onend = () => {
    activeVoiceRecognition = null;
  };

  try {
    r.start();
  } catch (err) {
    console.warn('Voice start warning:', err);
  }
}

window.processVoiceCommand = function(text) {
  const q = String(text || '').toLowerCase().trim();
  const hit = (...words) => words.some(w => q.includes(w));

  const statusEl = document.getElementById('voice-hud-status');
  const transcriptEl = document.getElementById('voice-hud-transcript');
  const overlay = document.getElementById('voice-hud-modal-overlay');

  if (statusEl) statusEl.innerHTML = "<span>⚡ Executing Command...</span>";
  if (transcriptEl) transcriptEl.innerHTML = `<span><b>Running:</b> "${esc(q)}"</span>`;

  // Stop active recognition
  if (activeVoiceRecognition) {
    try { activeVoiceRecognition.stop(); } catch {}
    activeVoiceRecognition = null;
  }

  // Auto close HUD after short delay
  setTimeout(() => {
    if (overlay) overlay.remove();
  }, 900);

  // 1. Emergency SOS Trigger
  if (hit('emergency', 'sos', 'help', 'ambulance', 'आपात', 'आपत्कालीन', 'అత్యవసర', 'அவசர')) {
    sos('voice-command');
    return;
  }

  // 2. Guest / Logged-out Commands
  if (!state.user) {
    if (hit('patient')) {
      state.role = 'patient';
      location.hash = 'login';
      render();
      speak("Switched to Patient login.");
    } else if (hit('doctor')) {
      state.role = 'doctor';
      location.hash = 'login';
      render();
      speak("Switched to Doctor login.");
    } else if (hit('hospital')) {
      state.role = 'hospital';
      location.hash = 'login';
      render();
      speak("Switched to Hospital login.");
    } else if (hit('admin')) {
      state.role = 'admin';
      location.hash = 'login';
      render();
      speak("Switched to Admin login.");
    } else {
      location.hash = 'roles';
      render();
      speak("Opening roles selection.");
    }
    return;
  }

  const role = state.user.role;

  // 3. Universal Navigation
  if (hit('overview', 'dashboard', 'home', 'अवलोकन', 'అవలోకనం', 'மேலோட்டம்')) {
    state.section = 'overview';
    render();
    return speak("Navigated to Overview.");
  }
  if (hit('profile', 'account', 'प्रोफ़ाइल', 'ప్రొఫైల్', 'சுயவிவரம்')) {
    state.section = 'profile';
    render();
    return speak("Navigated to Profile.");
  }
  if (hit('setting', 'settings', 'accessibility', 'सेटिंग', 'సెట్టింగ్', 'அமைப்பு')) {
    state.section = 'settings';
    render();
    return speak("Navigated to Settings.");
  }

  // 4. Patient Voice Commands
  if (role === 'patient') {
    if (hit('book', 'schedule appointment', 'book appointment', 'बुक', 'బుక్')) {
      state.section = 'book';
      render();
      speak("Opening appointment booking form.");
    } else if (hit('appointment', 'my appointments', 'bookings', 'अपॉइंटमेंट', 'అపాయింట్')) {
      state.section = 'appointments';
      render();
      speak("Opening your appointments.");
    } else if (hit('prescription', 'medicine', 'medicines', 'rx', 'drugs', 'प्रिस्क्रिप्शन', 'ప్రిస్క్రిప్షన్', 'மருந்து')) {
      state.section = 'prescriptions';
      render();
      speak("Opening your digital prescriptions.");
    } else if (hit('record', 'medical record', 'ehr', 'lab', 'documents', 'रिकॉर्ड', 'రికార్డు', 'பதிவு')) {
      state.section = 'records';
      render();
      speak("Opening medical records vault.");
    } else if (hit('history', 'consultation history', 'past visits')) {
      state.section = 'history';
      render();
      speak("Opening consultation history.");
    } else if (hit('video', 'telemedicine', 'call doctor', 'camera', 'वीडियो')) {
      state.section = 'video';
      render();
      speak("Joining telemedicine room.");
    } else if (hit('qr', 'health id', 'badge', 'card')) {
      state.section = 'qrcard';
      render();
      speak("Displaying Emergency QR Health Badge.");
    } else {
      speak("Command not recognized for Patient. Try saying book appointment, my prescriptions, or emergency.");
    }
    return;
  }

  // 5. Doctor Voice Commands
  if (role === 'doctor') {
    if (hit('today', 'appointment', 'todays appointments', 'schedule', 'अपॉइंटमेंट')) {
      state.section = 'today';
      render();
      speak("Showing today's scheduled consultations.");
    } else if (hit('queue', 'waiting', 'waiting queue', 'patient queue', 'कतार', 'క్యూ', 'வரிசை')) {
      state.section = 'queue';
      render();
      speak("Opening live patient waiting queue.");
    } else if (hit('summary', 'ai summary', 'summarize', 'clinical notes')) {
      state.section = 'consult';
      render();
      setTimeout(() => window.generateAISummary?.(), 300);
      speak("Generating AI consultation summary.");
    } else if (hit('consult', 'consultation', 'diagnose', 'clinical', 'परामर्श', 'కన్సల్టేషన్')) {
      state.section = 'consult';
      render();
      speak("Opening AI clinical consultation studio.");
    } else if (hit('video', 'telemedicine', 'call patient', 'room', 'video feed', 'वीडियो')) {
      state.section = 'video';
      render();
      speak("Opening doctor telemedicine context studio.");
    } else if (hit('prescription', 'prescriptions', 'issue rx', 'medication', 'प्रिस्क्रिप्शन')) {
      state.section = 'prescriptions';
      render();
      speak("Opening digital prescription issuer.");
    } else if (hit('record', 'patient records', 'ehr', 'vault', 'lab', 'रिकॉर्ड')) {
      state.section = 'records';
      render();
      speak("Opening patient EHR records.");
    } else {
      speak("Command not recognized for Doctor. Try saying today's appointments, AI summary, or waiting queue.");
    }
    return;
  }

  // 6. Hospital Voice Commands
  if (role === 'hospital') {
    if (hit('manage doctor', 'manage doctors', 'add doctor', 'approve doctor', 'doctors list')) {
      state.section = 'manage-doctors';
      render();
      speak("Opening doctor management dashboard.");
    } else if (hit('doctor', 'doctors', 'staff', 'directory')) {
      state.section = 'doctors';
      render();
      speak("Opening hospital doctor directory.");
    } else if (hit('schedule', 'schedules', 'slots', 'slot', 'availability')) {
      state.section = 'schedules';
      render();
      speak("Opening doctor schedule and slot manager.");
    } else if (hit('activity', 'tracking', 'login logs', 'logins', 'status')) {
      state.section = 'activity';
      render();
      speak("Opening doctor and patient activity tracking.");
    } else if (hit('patient', 'patients', 'admitted', 'entry', 'admissions', 'inflow')) {
      state.section = 'patients';
      render();
      speak("Showing patient entry and admissions telemetry.");
    } else if (hit('appointment', 'appointments', 'bookings')) {
      state.section = 'appointments';
      render();
      speak("Showing hospital appointment bookings.");
    } else if (hit('department', 'departments', 'wards', 'ward')) {
      state.section = 'departments';
      render();
      speak("Showing hospital medical departments and wards.");
    } else if (hit('bed', 'beds', 'capacity', 'occupancy', 'overview', 'dashboard', 'stats', 'analytics', 'telemetry')) {
      state.section = 'overview';
      render();
      speak("Opening hospital bed capacity and patient inflow analytics dashboard.");
    } else {
      speak("Command not recognized for Hospital. Try saying overview, bed capacity, patient admissions, manage doctors, or schedules.");
    }
    return;
  }

  // 7. Admin Voice Commands
  if (role === 'admin') {
    if (hit('hospital', 'hospitals', 'manage hospital', 'create hospital')) {
      state.section = 'hospitals';
      render();
      speak("Opening hospital account management.");
    } else if (hit('user', 'users', 'accounts', 'platform')) {
      state.section = 'users';
      render();
      speak("Opening users management.");
    } else if (hit('activity', 'activity log', 'logs', 'audit', 'tracking')) {
      state.section = 'activity';
      render();
      speak("Opening platform-wide activity logs.");
    } else if (hit('reports', 'analytics', 'telemetry', 'performance', 'overview', 'dashboard', 'status', 'sweep')) {
      state.section = 'overview';
      render();
      speak("Opening hospital status and website telemetry dashboard.");
    } else {
      speak("Command not recognized for Admin. Try saying overview, hospital management, users, or activity logs.");
    }
    return;
  }
};

function mountStrandsBackground() {
  const bgDom = document.getElementById('strands-bg');
  if (!bgDom || bgDom.children.length > 0) return;
  initStrands(bgDom, {
    colors: ["#F97316", "#7C3AED", "#06B6D4"],
    count: 3,
    speed: 0.5,
    amplitude: 1,
    waviness: 1,
    thickness: 0.7,
    glow: 2.6,
    taper: 3,
    spread: 1,
    intensity: 0.6,
    saturation: 1.5,
    opacity: 1,
    scale: 1.5,
    glass: false,
    refraction: 1,
    dispersion: 1,
    glassSize: 1
  });
}

function render(scroll = true) {
  document.documentElement.lang = state.lang;
  document.body.classList.toggle('blind-mode', state.disability === 'blind');
  document.body.classList.toggle('low-vision', state.disability === 'lowVision');
  document.body.classList.toggle('motor-mode', state.disability === 'motor');

  if (state.user) app.innerHTML = dashboard();
  else if (state.role) app.innerHTML = login();
  else if (location.hash === '#roles') app.innerHTML = rolesPage();
  else app.innerHTML = home();

  bind();
  mountPointerFX();
  renderAIChatWidget();

  // Mount MagicBento on Landing Page
  const bentoBox = document.getElementById('magic-bento-container');
  if (bentoBox) {
    bentoBox.innerHTML = `
      <div class="card-grid bento-section">
        <div class="magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow particle-container" style="background-color:rgba(13, 27, 46, 0.85); --glow-color:132, 0, 255; cursor:pointer;" onclick="toggleAIChat()">
          <div class="magic-bento-card__header"><div class="magic-bento-card__label">✨ Smart AI</div></div>
          <div class="magic-bento-card__content">
            <h2 class="magic-bento-card__title">AI Consultation Summary</h2>
            <p class="magic-bento-card__description">Instant clinical notes summary, key observations & follow-up reminders generated automatically.</p>
          </div>
        </div>
        <div class="magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow particle-container" style="background-color:rgba(13, 27, 46, 0.85); --glow-color:132, 0, 255; cursor:pointer;" onclick="triggerSOS()">
          <div class="magic-bento-card__header"><div class="magic-bento-card__label">🚨 Emergency</div></div>
          <div class="magic-bento-card__content">
            <h2 class="magic-bento-card__title">Emergency SOS Broadcast</h2>
            <p class="magic-bento-card__description">Instant GPS tracking broadcast & simulated SMS alerts to emergency contacts and hospitals.</p>
          </div>
        </div>
        <div class="magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow particle-container" style="background-color:rgba(13, 27, 46, 0.85); --glow-color:132, 0, 255; cursor:pointer;" onclick="startVideoCall(); showNotification('WebRTC Camera initialized in test mode.');">
          <div class="magic-bento-card__header"><div class="magic-bento-card__label">🎥 Telemedicine</div></div>
          <div class="magic-bento-card__content">
            <h2 class="magic-bento-card__title">WebRTC Video Consultation</h2>
            <p class="magic-bento-card__description">HD live audio & video streaming with interactive camera and mic controls.</p>
          </div>
        </div>
        <div class="magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow particle-container" style="background-color:rgba(13, 27, 46, 0.85); --glow-color:132, 0, 255; cursor:pointer;" onclick="location.hash='#roles'; render();">
          <div class="magic-bento-card__header"><div class="magic-bento-card__label">💳 Health ID</div></div>
          <div class="magic-bento-card__content">
            <h2 class="magic-bento-card__title">Emergency Access QR Badge</h2>
            <p class="magic-bento-card__description">Secure digital medical identity card & instant profile scanner modal for first responders.</p>
          </div>
        </div>
        <div class="magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow particle-container" style="background-color:rgba(13, 27, 46, 0.85); --glow-color:132, 0, 255; cursor:pointer;" onclick="setDisability('blind')">
          <div class="magic-bento-card__header"><div class="magic-bento-card__label">👁 Inclusive</div></div>
          <div class="magic-bento-card__content">
            <h2 class="magic-bento-card__title">Inclusive Accessibility</h2>
            <p class="magic-bento-card__description">Speech synthesis for blind users & high contrast low-vision motor accessibility controls.</p>
          </div>
        </div>
        <div class="magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow particle-container" style="background-color:rgba(13, 27, 46, 0.85); --glow-color:132, 0, 255; cursor:pointer;" onclick="location.hash='#roles'; render();">
          <div class="magic-bento-card__header"><div class="magic-bento-card__label">🛡 EHR Shield</div></div>
          <div class="magic-bento-card__content">
            <h2 class="magic-bento-card__title">Encrypted Records & Rx</h2>
            <p class="magic-bento-card__description">Digital prescriptions, appointment schedules & medical history vault.</p>
          </div>
        </div>
      </div>
    `;
    initMagicBento(bentoBox, {
      textAutoHide: true,
      enableStars: true,
      enableSpotlight: true,
      enableBorderGlow: true,
      enableTilt: true,
      enableMagnetism: true,
      clickEffect: true,
      spotlightRadius: 300,
      particleCount: 12,
      glowColor: "132, 0, 255"
    });
  }

  initStaggeredMenuRoot();

  // Mount React Bits Pro Dashboard 12 for platform administrator overview / telemetry
  const d12Root = document.getElementById('rb-dashboard-12-root');
  if (d12Root) {
    initDashboard12(d12Root, { data: state.data });
  }

  // Mount Hospital Dashboard for hospital overview / reports / capacity
  const hospRoot = document.getElementById('rb-hospital-dashboard-root');
  if (hospRoot) {
    initHospitalDashboard(hospRoot, { data: state.data, user: state.user });
  }

  if (scroll) window.scrollTo(0, 0);
  if (state.disability === 'blind' && document.activeElement === document.body) {
    setTimeout(() => speak(document.body.innerText.slice(0, 1000)), 150);
  }
}

function bind() {
  document.querySelectorAll('[data-action]').forEach(b => {
    b.onclick = () => {
      const a = b.dataset.action;
      if (a === 'roles') {
        state.role = '';
        sessionStorage.removeItem('medi_role');
        location.hash = 'roles';
        render();
      } else if (a === 'home') {
        location.hash = '';
        state.role = '';
        render();
      } else if (a === 'logout') {
        api('/auth/logout', { method: 'POST' }).catch(() => {});
        state.user = null;
        state.token = '';
        state.role = '';
        localStorage.removeItem('medi_user');
        localStorage.removeItem('medi_token');
        sessionStorage.removeItem('medi_role');
        location.hash = '';
        render();
      } else if (a === 'voice') voice();
      else if (a === 'sos') sos();
      else if (a === 'motion') enableMotion();
    };
  });

  document.querySelectorAll('[data-role]').forEach(b => {
    b.onclick = () => {
      state.role = b.dataset.role;
      sessionStorage.setItem('medi_role', state.role);
      location.hash = 'login';
      render();
      if (state.disability === 'blind') setTimeout(() => speak(`${t(state.role)} ${t('login')}`), 200);
    };
  });

  document.querySelectorAll('[data-section]').forEach(b => {
    b.onclick = () => {
      state.section = b.dataset.section;
      render();
      if (state.disability === 'blind') speak(t(state.section));
    };
  });

  // Global toggle buttons & explore features button
  document.querySelectorAll('.sm-global-toggle').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      window.__MEDI_MENU__?.toggle?.();
    };
  });

  const exploreBtn = document.getElementById('btn-explore-features');
  if (exploreBtn) {
    exploreBtn.onclick = (e) => {
      e.preventDefault();
      const capSection = document.getElementById('capabilities');
      if (capSection) {
        capSection.scrollIntoView({ behavior: 'smooth' });
      }
      setTimeout(() => {
        window.__MEDI_MENU__?.open?.();
      }, 350);
    };
  }

  const ls = document.getElementById('language-select');
  if (ls) ls.onchange = e => setLang(e.target.value);
  const ds = document.getElementById('disability-select');
  if (ds) ds.onchange = e => setDisability(e.target.value);
  const dp = document.getElementById('disability-page');
  if (dp) {
    dp.value = state.disability;
    dp.onchange = e => setDisability(e.target.value);
  }

  const lf = document.getElementById('login-form');
  if (lf) lf.onsubmit = e => { e.preventDefault(); doLogin(lf); };
  const bf = document.getElementById('book-form');
  if (bf) bf.onsubmit = e => { e.preventDefault(); doBook(bf); };
  const cf = document.getElementById('consult-form');
  if (cf) cf.onsubmit = e => { e.preventDefault(); doConsult(cf); };
  const rx = document.getElementById('rx-form');
  if (rx) rx.onsubmit = e => { e.preventDefault(); doRx(rx); };

  // Hospital & Admin Forms
  const addDocForm = document.getElementById('add-doctor-form');
  if (addDocForm) addDocForm.onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/hospital/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('doc-name').value,
          email: document.getElementById('doc-email').value,
          password: document.getElementById('doc-password').value,
          phone: document.getElementById('doc-phone').value,
          specialization: document.getElementById('doc-specialization').value,
          department: document.getElementById('doc-department').value,
          status: document.getElementById('doc-status').value
        })
      });
      showNotification('Doctor account created and registered with hospital!');
      await load();
    } catch (err) { alert(err.message); }
  };

  const addSlotForm = document.getElementById('add-slot-form');
  if (addSlotForm) addSlotForm.onsubmit = async e => {
    e.preventDefault();
    const doctorId = document.getElementById('schedule-doctor')?.value;
    if (!doctorId) return alert('Please select a doctor from the dropdown first.');
    try {
      const existingSchedule = (state.data.schedules || []).find(s => s.doctorId === doctorId);
      const slots = [...(existingSchedule?.slots || [])];
      slots.push({
        day: document.getElementById('slot-day').value,
        startTime: document.getElementById('slot-start').value,
        endTime: document.getElementById('slot-end').value,
        type: document.getElementById('slot-type').value,
        status: 'available'
      });
      await api('/hospital/schedules', {
        method: 'POST',
        body: JSON.stringify({ doctorId, slots })
      });
      showNotification('New slot added to doctor schedule!');
      await load();
    } catch (err) { alert(err.message); }
  };

  const addHospForm = document.getElementById('add-hospital-form');
  if (addHospForm) addHospForm.onsubmit = async e => {
    e.preventDefault();
    try {
      const res = await api('/admin/hospitals', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('hosp-name').value,
          email: document.getElementById('hosp-email').value,
          password: document.getElementById('hosp-password').value,
          phone: document.getElementById('hosp-phone').value,
          address: document.getElementById('hosp-address').value,
          latitude: document.getElementById('hosp-lat').value,
          longitude: document.getElementById('hosp-lng').value
        })
      });
      showNotification(`Hospital account created! Provide credentials (Email: ${res.credentials?.email}) to hospital.`);
      await load();
    } catch (err) { alert(err.message); }
  };

  document.querySelectorAll('[data-appt]').forEach(b => {
    b.onclick = () => updateAppt(b.dataset.appt, b.dataset.status);
  });

  if (state.user) bindMotion();
}

// Real-time Appointment Synchronization Poller (every 4 seconds)
let prevAppointmentMap = new Map();

async function syncAppointments() {
  if (!state.user || !state.token) return;
  const role = state.user.role;
  if (role !== 'patient' && role !== 'doctor') return;

  try {
    const endpoint = role === 'patient' ? '/appointments/my' : '/appointments/doctor';
    const latestAppts = await api(endpoint).catch(() => null);

    if (Array.isArray(latestAppts)) {
      let stateChanged = false;

      if (role === 'patient') {
        for (const appt of latestAppts) {
          const prevStatus = prevAppointmentMap.get(appt.id);
          if (prevStatus === 'pending' && appt.status === 'confirmed') {
            loudAlert();
            showNotification(`🎉 Great news! Dr. ${appt.doctor?.name || 'Doctor'} has CONFIRMED your appointment on ${appt.date} at ${appt.time}!`);
            stateChanged = true;
          }
        }
      } else if (role === 'doctor') {
        for (const appt of latestAppts) {
          const prevStatus = prevAppointmentMap.get(appt.id);
          if (!prevStatus && appt.status === 'pending') {
            showNotification(`⚡ New patient appointment request received from ${appt.patient?.name || 'Patient'} for ${appt.time}!`);
            stateChanged = true;
          }
        }
      }

      prevAppointmentMap = new Map(latestAppts.map(a => [a.id, a.status]));
      state.data.appointments = latestAppts;
      if (stateChanged) {
        render();
      }
    }
  } catch {}
}

setInterval(syncAppointments, 4000);

// Periodic heartbeat (every 4 minutes)
setInterval(() => {
  if (state.user && state.token) {
    api('/auth/heartbeat', { method: 'PUT' }).catch(() => {});
  }
}, 4 * 60 * 1000);

function mountPointerFX() {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = e => {
    root.style.setProperty('--mx', (e.clientX / innerWidth * 100).toFixed(2) + '%');
    root.style.setProperty('--my', (e.clientY / innerHeight * 100).toFixed(2) + '%');
    root.style.setProperty('--cursor-x', e.clientX + 'px');
    root.style.setProperty('--cursor-y', e.clientY + 'px');
  };
  if (!root.dataset.pointerBound) {
    addEventListener('pointermove', pointer, { passive: true });
    root.dataset.pointerBound = '1';
  }
  if (reduce) return;

  document.querySelectorAll('.role-card, .feature-grid article, .metric, .panel, .login-card, .access-panel, .float-card, .queue-card').forEach(el => {
    if (el.dataset.tiltBound) return;
    el.dataset.tiltBound = '1';
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
      el.style.setProperty('--lift', '-5px');
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--lift', '0px');
    }, { passive: true });
  });

  document.querySelectorAll('button, .primary, .danger, .glass-btn').forEach(btn => {
    if (btn.dataset.fxBound) return;
    btn.dataset.fxBound = '1';
    btn.classList.add('ripple');
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const dot = document.createElement('i');
      dot.className = 'ripple-dot';
      const size = Math.max(r.width, r.height) * .42;
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = (e.clientX - r.left - size / 2) + 'px';
      dot.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(dot);
      setTimeout(() => dot.remove(), 720);
    }, { passive: true });
  });
}

window.addEventListener('hashchange', render);
window.addEventListener('load', () => {
  mountStrandsBackground();
});

mountStrandsBackground();
if (state.user) {
  load();
} else {
  render();
}
setTimeout(mountPointerFX, 120);
