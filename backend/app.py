import os
import io
import qrcode
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify, send_file
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'prototype_secret_key'

# Initialize SocketIO for WebRTC (Works entirely in-memory)
socketio = SocketIO(app, cors_allowed_origins="*")

# ==========================================
# MOCK DATABASE (In-Memory Storage)
# ==========================================
mock_db = {
    "patients": {
        1: {"name": "John Doe", "blood_group": "O+", "allergies": "Penicillin", "conditions": "Asthma"}
    },
    "emergency_contacts": [
        {"patient_id": 1, "name": "Jane Doe", "phone": "+1234567890", "relationship": "Spouse"}
    ],
    "notifications": [
        {"user_id": 1, "message": "Welcome to Medi_Smart!", "read": False}
    ]
}

# ==========================================
# FEATURE 1: EMERGENCY SOS (Mock SMS)
# ==========================================
@app.route('/api/sos', methods=['POST'])
def trigger_sos():
    data = request.json or {}
    lat = data.get('lat') or data.get('latitude', '0.0')
    lng = data.get('lng') or data.get('longitude', '0.0')
    patient_id = data.get('patient_id', 1)
    
    maps_link = f"https://www.google.com/maps?q={lat},{lng}"
    patient = mock_db["patients"].get(int(patient_id)) if str(patient_id).isdigit() else None
    if not patient:
        patient = mock_db["patients"].get(1)
        
    contacts = [c for c in mock_db["emergency_contacts"] if c["patient_id"] == 1]
    
    msg = f"Emergency Alert from Medi_Smart.\nPatient: {patient['name']}\nLocation: {maps_link}\nPlease contact immediately."
    
    # Simulate sending SMS by printing to the backend terminal
    for contact in contacts:
        print(f"\n--- MOCK SMS TO {contact['phone']} ({contact['name']}) ---")
        print(msg)
        print("------------------------------------------------------\n")
        
    # Add a mock notification
    mock_db["notifications"].append({"user_id": 1, "message": "Emergency SOS Alert Sent.", "read": False})
        
    return jsonify({"status": "success", "message": "Emergency alerts sent successfully.", "location": maps_link, "contacts": contacts})

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
# FEATURE 3: AI CONSULTATION ENHANCEMENT
# ==========================================
@app.route('/api/ai/summarize', methods=['POST'])
def ai_summarize():
    data = request.json or {}
    notes = data.get('notes', 'No notes provided.')
    
    # Simulating the AI parsing the notes for the prototype
    mock_summary = {
        "visit_summary": f"Patient reports the following: {notes}",
        "key_observations": "Monitor vitals closely over the next 48 hours.",
        "follow_up_reminder": "Schedule a follow-up appointment in one week."
    }
    
    return jsonify({"status": "success", "data": mock_summary})

# ==========================================
# FEATURE 4: EMERGENCY MEDICAL RECORD (QR)
# ==========================================
@app.route('/api/emergency/qr/<int:patient_id>')
def generate_qr(patient_id):
    # In a real app, this points to a frontend view page.
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
    """The endpoint the QR code links to, displaying the mock medical record."""
    patient = mock_db["patients"].get(patient_id)
    if not patient:
        patient = mock_db["patients"].get(1)
    if patient:
        return jsonify({"status": "success", "data": patient})
    return jsonify({"error": "Profile not found"}), 404

# ==========================================
# FEATURE 5: NOTIFICATION SYSTEM
# ==========================================
@app.route('/api/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    # Fetch notifications for the user from our mock database
    user_notifications = [n for n in mock_db["notifications"] if n["user_id"] == user_id]
    return jsonify({"status": "success", "data": user_notifications})

if __name__ == '__main__':
    # socketio.run handles both standard HTTP routes and WebSockets
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
