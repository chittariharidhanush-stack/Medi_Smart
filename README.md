# Medi Smart — Enhanced 3D, Accessible, Multilingual Healthcare Platform

## Workflow
Home → Get Started → Select Role → Role-specific Login → Separate Dashboard

Roles: Patient, Doctor, Hospital, Platform Administrator.

## Frontend features
- Dependency-free Node frontend server.
- 4 languages: English, Telugu, Hindi, Tamil.
- Accessibility selection before login: no disability, blind/screen-reader, low vision, motor support.
- Browser speech synthesis for blind mode.
- Browser speech recognition for voice navigation where supported by the browser/device.
- 30-second Emergency SOS countdown with cancellation, location permission, loud browser alert and backend hospital routing.
- Motion/shock SOS for patient devices that expose DeviceMotion events; browser/device permissions and hardware support are required.
- Animated 3D-style medical scene, floating cards, rings, particles, pointer tilt, glass panels, hover sweeps and ambient effects.
- Respects `prefers-reduced-motion`.

## Backend features
- Role-validated authentication.
- Patient appointments.
- Doctor appointment/consultation workflow.
- Digital prescriptions.
- Medical records.
- Hospital patient/doctor/appointment/emergency views.
- Platform admin views.
- Emergency routing to the nearest configured hospital using Haversine distance.
- In-memory demo data (restarts reset data).

## Run
Terminal 1:
```powershell
cd backend
npm install
npm start
```

Terminal 2:
```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Backend health: http://127.0.0.1:4000/api/health

## Demo accounts
- Patient: patient@medismart.local / Patient@123
- Doctor: doctor@medismart.local / Doctor@123
- Hospital: hospital@medismart.local / Hospital@123
- Admin: admin@medismart.local / Admin@123

## Important browser limitations
Voice recognition and device motion are browser/device capabilities. On iOS, DeviceMotion permission may require a user gesture. A web app cannot guarantee physical ambulance dispatch without an authorized hospital/EMS integration. The demo backend records the emergency and notifies the nearest configured Medi Smart hospital account.

## Hyper 3D Visual Layer

This build adds a dependency-free real-time visual layer: a perspective-projected particle field, animated connection network, 3D orbit rings, reactive pointer parallax, glassmorphism, scanline overlay, holographic glitch text, magnetic/tilt cards, hover light sweeps, ripple interactions, scroll reveal, animated dashboard surfaces, SOS visual pulse, and responsive performance fallbacks. It uses Canvas 2D + CSS transforms/animations rather than a heavy WebGL dependency so the project remains easy to run with the existing Node scripts.

For accessibility, `prefers-reduced-motion` disables the continuous visual effects and the canvas layer. The visual effects are decorative and do not replace semantic controls or the screen-reader/voice features.
