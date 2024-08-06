from flask import render_template, jsonify, request, session
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
    user_role = session.get('role', '')
    return render_template('backofficeDashboard.html', user_role=user_role)

@bp.route('/api/data')
def get_data():
    users_with_role = []
    cars = []

    for key in replit_db.keys():
        data = replit_db[key]
        serializable_data = convert_to_serializable(data)

        if key.isdigit():
            if isinstance(serializable_data, dict) and 'role' in serializable_data:
                users_with_role.append({"key": key, **serializable_data})
        else:
            if isinstance(serializable_data, dict) and 'brand' in serializable_data and 'model' in serializable_data:
                cars.append({"key": key, **serializable_data})

    print(f"Users with role: {users_with_role}")  # Debugging
    print(f"Cars: {cars}")  # Debugging

    return jsonify({"users": users_with_role, "cars": cars})

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

    if not (fullname and role and level and pin):
        return jsonify({"error": "Missing required fields"}), 400

    hashed_pin = generate_password_hash(pin)
    replit_db[pin] = {
        'fullname': fullname,
        'pin': hashed_pin,
        'level': level,
        'role': role
    }
    return jsonify({"message": "User added successfully"}), 200

@bp.route('/api/add_car', methods=['POST'])
def add_car():
    brand = request.json.get('brand')
    model = request.json.get('model')

    if not (brand and model):
        return jsonify({"error": "Missing required fields"}), 400

    car_key = f"{brand}_{model}"
    replit_db[car_key] = {
        'brand': brand,
        'model': model
    }
    return jsonify({"message": "Car added successfully"}), 200
