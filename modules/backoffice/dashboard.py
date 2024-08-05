from flask import render_template, jsonify, request
from . import backoffice_blueprint as bp
from replit import db as replit_db
from collections.abc import Iterable
from werkzeug.security import generate_password_hash

def convert_to_serializable(data):
    """Convert non-serializable objects to serializable."""
    if isinstance(data, dict):
        return {k: convert_to_serializable(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_to_serializable(i) for i in data]
    elif 'ObservedDict' in str(type(data)):
        return {k: convert_to_serializable(v) for k, v in data.items()}
    elif 'ObservedList' in str(type(data)):
        return [convert_to_serializable(i) for i in data]
    elif isinstance(data, Iterable) and not isinstance(data, str):
        return [convert_to_serializable(i) for i in data]
    return data

@bp.route('/dashboard')
def dashboard():
    return render_template('backofficeDashboard.html')

@bp.route('/api/data')
def get_data():
    users_with_role = []

    for key in replit_db.keys():
        user_data = replit_db[key]
        serializable_user_data = convert_to_serializable(user_data)

        # Check if key is numeric and user has a role
        if key.isdigit():
            if isinstance(serializable_user_data, dict) and 'role' in serializable_user_data:
                users_with_role.append({"key": key, **serializable_user_data})

    print(f"Users with role: {users_with_role}")  # Debugging

    return jsonify(users_with_role)

@bp.route('/api/delete_user', methods=['POST'])
def delete_user():
    user_key = request.json.get('key')
    if user_key and user_key in replit_db:
        del replit_db[user_key]
        return jsonify({"message": "User deleted successfully"}), 200
    return jsonify({"error": "User not found"}), 404

@bp.route('/api/edit_user', methods=['POST'])
def edit_user():
    user_key = request.json.get('key')
    fullname = request.json.get('fullname')
    role = request.json.get('role')
    level = request.json.get('level')

    if user_key and user_key in replit_db:
        user_data = replit_db[user_key]
        if isinstance(user_data, dict):
            user_data['fullname'] = fullname
            user_data['role'] = role
            user_data['level'] = level
            replit_db[user_key] = user_data
            return jsonify({"message": "User edited successfully"}), 200
    return jsonify({"error": "User not found"}), 404

@bp.route('/api/add_user', methods=['POST'])
def add_user():
    fullname = request.json.get('fullname')
    role = request.json.get('role')
    level = request.json.get('level')
    pin = request.json.get('pin')

    if not pin or len(pin) != 5 or not pin.isdigit():
        return jsonify({"error": "Invalid PIN. Must be a 5-digit number."}), 400

    hashed_pin = generate_password_hash(pin)
    new_key = str(max([int(key) for key in replit_db.keys() if key.isdigit()]) + 1)

    if fullname and role and level and pin:
        replit_db[new_key] = {'fullname': fullname, 'role': role, 'level': level, 'pin': hashed_pin}
        return jsonify({"message": "User added successfully", "key": new_key}), 200
    return jsonify({"error": "Invalid data"}), 400
