from flask import render_template, jsonify
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
    db_data = {}
    for key in replit_db.keys():
        db_data[key] = convert_to_serializable(replit_db[key])
        print(f"Key: {key}, Data: {replit_db[key]}")  # Debugging

    print(f"Database: {db_data}")  # Debugging
    return jsonify(db_data)
