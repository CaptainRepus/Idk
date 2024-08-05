from flask import render_template, jsonify, request
from . import backoffice_blueprint as bp
from replit import db as replit_db
from collections.abc import Iterable

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
