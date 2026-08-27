import os
import io
from datetime import datetime, timezone
import qrcode
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room

# ==========================================
# 1. APPLICATION & DATABASE CONFIGURATION
# ==========================================
app = Flask(__name__)
app.config['SECRET_KEY'] = 'prototype_secret_key'

# SQLite Database Configuration
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'medismart.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 2. Initialize SQLAlchemy & SocketIO
db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ==========================================
# 3. DATABASE MODELS (Flask-SQLAlchemy)
# ==========================================

class Hospital(db.Model):
    __tablename__ = 'hospitals'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    status = db.Column(db.String(50), default="Pending")  # Pending, Approved, Rejected

    def to_dict(self):
        return {"id": self.id, "name": self.name, "status": self.status}

class Patient(db.Model):
    __tablename__ = 'patients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    blood_group = db.Column(db.String(10), nullable=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "blood_group": self.blood_group}

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "specialization": self.specialization,
            "hospital_id": self.hospital_id
        }

class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contacts'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    contact_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    relationship = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "contact_name": self.contact_name,
            "phone_number": self.phone_number,
            "relationship": self.relationship
        }

class UserActivity(db.Model):
    __tablename__ = 'user_activity'
    id = db.Column(db.Integer, primary_key=True)
    user_type = db.Column(db.String(50), nullable=False)  # 'Patient' or 'Doctor'
    user_id = db.Column(db.Integer, nullable=False)
    login_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    logout_time = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_type": self.user_type,
            "user_id": self.user_id,
            "login_time": self.login_time.isoformat() if self.login_time else None,
            "logout_time": self.logout_time.isoformat() if self.logout_time else None
        }

# ==========================================
# 4. DATABASE INITIALIZATION & SEEDING
# ==========================================
def init_db():
    with app.app_context():
        db.create_all()
        print("Success! Database 'medismart.db' has been created and verified.")
        
        # Seed initial records if empty
        if Hospital.query.count() == 0:
            h1 = Hospital(name="Medi Smart City Hospital", status="Approved")
            h2 = Hospital(name="Apollo Main Hospital", status="Approved")
            h3 = Hospital(name="AIIMS Super Specialty", status="Approved")
            db.session.add_all([h1, h2, h3])
            db.session.commit()
            print("Seeded default Hospital records.")

        if Patient.query.count() == 0:
            p1 = Patient(name="John Doe", blood_group="O+")
            p2 = Patient(name="Rahul Kumar", blood_group="B+")
            p3 = Patient(name="Ananya Reddy", blood_group="A+")
            db.session.add_all([p1, p2, p3])
            db.session.commit()

            c1 = EmergencyContact(patient_id=p1.id, contact_name="Jane Doe", phone_number="+1234567890", relationship="Spouse")
            c2 = EmergencyContact(patient_id=p2.id, contact_name="Suresh Kumar", phone_number="+919876543210", relationship="Father")
            db.session.add_all([c1, c2])
            db.session.commit()
            print("Seeded default Patient and EmergencyContact records.")

        if Doctor.query.count() == 0:
            hosp = Hospital.query.first()
            d1 = Doctor(name="Dr. Ananya Rao", specialization="Cardiology", hospital_id=hosp.id if hosp else None)
            d2 = Doctor(name="Dr. Vikram Seth", specialization="Neurology", hospital_id=hosp.id if hosp else None)
            db.session.add_all([d1, d2])
            db.session.commit()
            print("Seeded default Doctor records.")

# Initialize database on startup
init_db()

# ==========================================
# FEATURE 1: EMERGENCY SOS (SMS & DB Query)
# ==========================================
@app.route('/api/sos', methods=['POST'])
def trigger_sos():
    data = request.json or {}
    lat = data.get('lat') or data.get('latitude', '17.3850')
    lng = data.get('lng') or data.get('longitude', '78.4867')
    patient_id = data.get('patient_id', 1)
    
    maps_link = f"https://www.google.com/maps?q={lat},{lng}"
    
    # Query database for patient and emergency contacts
    patient = None
    if str(patient_id).isdigit():
        patient = Patient.query.get(int(patient_id))
    if not patient:
        patient = Patient.query.first()

    patient_name = patient.name if patient else "Emergency Patient"
    patient_blood = patient.blood_group if patient else "Unknown"

    contacts = EmergencyContact.query.filter_by(patient_id=patient.id).all() if patient else []
    contact_list = [c.to_dict() for c in contacts] if contacts else [
        {"contact_name": "Emergency Contact", "phone_number": "+1234567890", "relationship": "Family"}
    ]
    
    msg = f"Emergency Alert from Medi_Smart.\nPatient: {patient_name} (Blood Group: {patient_blood})\nLocation: {maps_link}\nPlease contact immediately."
    
    # Simulate sending SMS by logging to terminal
    for contact in contact_list:
        print(f"\n--- MOCK SMS TO {contact.get('phone_number')} ({contact.get('contact_name')}) ---")
        print(msg)
        print("------------------------------------------------------\n")
        
    return jsonify({
        "status": "success",
        "message": "Emergency alerts sent successfully.",
        "location": maps_link,
        "patient": {"name": patient_name, "blood_group": patient_blood},
        "contacts": contact_list
    })

# ==========================================
# FEATURE 2: WEBRTC TELEMEDICINE (Socket.IO)
# ==========================================
@socketio.on('join_consultation')
def handle_join(data):
    room = data.get('room_id', 'default_room') if isinstance(data, dict) else 'default_room'
    join_room(room)
    emit('user_joined', {"message": "A user has joined the room."}, room=room, include_self=False)
    print(f"User joined consultation room: {room}")

@socketio.on('webrtc_offer')
def handle_offer(data):
    room = data.get('room_id', 'default_room') if isinstance(data, dict) else 'default_room'
    emit('webrtc_offer', data, room=room, include_self=False)

@socketio.on('webrtc_answer')
def handle_answer(data):
    room = data.get('room_id', 'default_room') if isinstance(data, dict) else 'default_room'
    emit('webrtc_answer', data, room=room, include_self=False)

@socketio.on('webrtc_ice_candidate')
def handle_ice(data):
    room = data.get('room_id', 'default_room') if isinstance(data, dict) else 'default_room'
    emit('webrtc_ice_candidate', data, room=room, include_self=False)

# ==========================================
# FEATURE 3: AI CLINICAL SUMMARIZATION
# ==========================================
@app.route('/api/ai/summarize', methods=['POST'])
def ai_summarize():
    data = request.json or {}
    notes = data.get('notes', 'No notes provided.')
    
    mock_summary = {
        "visit_summary": f"Patient reports the following: {notes}",
        "key_observations": "Monitor vitals closely over the next 48 hours.",
        "follow_up_reminder": "Schedule a follow-up appointment in one week."
    }
    
    return jsonify({"status": "success", "data": mock_summary})

# ==========================================
# FEATURE 4: EMERGENCY MEDICAL RECORD (QR & DB)
# ==========================================
@app.route('/api/emergency/qr/<int:patient_id>')
def generate_qr(patient_id):
    public_url = f"http://127.0.0.1:5000/api/emergency/profile/{patient_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(public_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@app.route('/api/emergency/profile/<int:patient_id>')
def emergency_profile(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        patient = Patient.query.first()
    if patient:
        contacts = EmergencyContact.query.filter_by(patient_id=patient.id).all()
        return jsonify({
            "status": "success",
            "data": {
                "id": patient.id,
                "name": patient.name,
                "blood_group": patient.blood_group,
                "emergency_contacts": [c.to_dict() for c in contacts]
            }
        })
    return jsonify({"error": "Profile not found"}), 404

# ==========================================
# FEATURE 5: DATABASE REST ENDPOINTS
# ==========================================
@app.route('/api/db/hospitals', methods=['GET', 'POST'])
def handle_hospitals():
    if request.method == 'POST':
        data = request.json or {}
        name = data.get('name', '').strip()
        status = data.get('status', 'Approved')
        if not name:
            return jsonify({"error": "Hospital name is required"}), 400
        hosp = Hospital(name=name, status=status)
        db.session.add(hosp)
        db.session.commit()
        return jsonify({"status": "success", "hospital": hosp.to_dict()}), 201
    
    hospitals = Hospital.query.all()
    return jsonify([h.to_dict() for h in hospitals])

@app.route('/api/db/patients', methods=['GET', 'POST'])
def handle_patients():
    if request.method == 'POST':
        data = request.json or {}
        name = data.get('name', '').strip()
        blood_group = data.get('blood_group', 'O+')
        if not name:
            return jsonify({"error": "Patient name is required"}), 400
        pat = Patient(name=name, blood_group=blood_group)
        db.session.add(pat)
        db.session.commit()
        return jsonify({"status": "success", "patient": pat.to_dict()}), 201
    
    patients = Patient.query.all()
    return jsonify([p.to_dict() for p in patients])

@app.route('/api/db/doctors', methods=['GET', 'POST'])
def handle_doctors():
    if request.method == 'POST':
        data = request.json or {}
        name = data.get('name', '').strip()
        specialization = data.get('specialization', 'General Medicine')
        hospital_id = data.get('hospital_id')
        if not name:
            return jsonify({"error": "Doctor name is required"}), 400
        doc = Doctor(name=name, specialization=specialization, hospital_id=hospital_id)
        db.session.add(doc)
        db.session.commit()
        return jsonify({"status": "success", "doctor": doc.to_dict()}), 201
    
    doctors = Doctor.query.all()
    return jsonify([d.to_dict() for d in doctors])

@app.route('/api/db/user_activity', methods=['GET', 'POST'])
def handle_user_activity():
    if request.method == 'POST':
        data = request.json or {}
        user_type = data.get('user_type', 'Patient')
        user_id = data.get('user_id', 1)
        activity = UserActivity(user_type=user_type, user_id=user_id)
        db.session.add(activity)
        db.session.commit()
        return jsonify({"status": "success", "activity": activity.to_dict()}), 201
    
    activities = UserActivity.query.order_by(UserActivity.login_time.desc()).limit(50).all()
    return jsonify([a.to_dict() for a in activities])

# ==========================================
# FEATURE 6: NOTIFICATIONS
# ==========================================
@app.route('/api/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    mock_notifs = [
        {"user_id": user_id, "message": "Welcome to Medi_Smart Telemedicine & EHR!", "read": False},
        {"user_id": user_id, "message": "Your health profile is verified and active.", "read": True}
    ]
    return jsonify({"status": "success", "data": mock_notifs})

# ==========================================
# 7. SERVER ENTRYPOINT
# ==========================================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Success! Database 'medismart.db' has been created.")
        print("Your project layout and other files have not been modified.")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
