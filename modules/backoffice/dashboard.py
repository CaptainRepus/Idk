from flask import render_template, jsonify, request, session
from . import backoffice_blueprint as bp
from replit import db as replit_db
from collections.abc import Iterable
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from requests.exceptions import InvalidHeader
import time


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
    notifications = []

    user_report_count = {}
    today = datetime.today().date()
    last_7_days = [today - timedelta(days=i) for i in range(7)]
    report_statistics = {str(day): {} for day in last_7_days}

    try:
        for key in replit_db.keys():
            data = replit_db[key]
            serializable_data = convert_to_serializable(data)

            if key.isdigit():
                if isinstance(serializable_data, dict) and 'role' in serializable_data:
                    user_data = {"key": key, **serializable_data}
                    author_name = serializable_data.get('fullname')

                    if author_name:
                        user_report_count[author_name] = user_report_count.get(author_name, 0)
                        user_data['report_count'] = user_report_count[author_name]
                        users_with_role.append(user_data)

            elif key == "notifications":
                if isinstance(serializable_data, list):
                    notifications.extend(serializable_data)

            else:
                if isinstance(serializable_data, dict) and 'brand' in serializable_data and 'model' in serializable_data:
                    cars.append({"key": key, **serializable_data})

                elif isinstance(serializable_data, list):
                    for report in serializable_data:
                        author = report.get('author')
                        created_at_str = report.get('created_at')
                        if author and created_at_str:
                            created_at = datetime.strptime(created_at_str, '%Y-%m-%d').date()
                            if created_at in last_7_days:
                                date_str = str(created_at)
                                report_statistics[date_str][author] = report_statistics[date_str].get(author, 0) + 1
                            user_report_count[author] = user_report_count.get(author, 0) + 1

    except InvalidHeader as e:
        if "Invalid Retry-After header" in str(e):
            print("Invalid Retry-After header detected, retrying after a default delay...")
            time.sleep(5)  # Wait for 5 seconds before retrying
            # Optionally, you can try to re-run the request logic here after the delay
        else:
            raise e  # Raise other exceptions

    # Assign report statistics to users
    for user_data in users_with_role:
        fullname = user_data.get('fullname')
        user_data['report_count'] = user_report_count.get(fullname, 0)
        user_data['report_statistics'] = {
            day: report_statistics[day].get(fullname, 0) for day in report_statistics
        }

    # Sort users by report_count in descending order and assign ranks
    users_with_role.sort(key=lambda x: x['report_count'], reverse=True)
    for index, user_data in enumerate(users_with_role):
        user_data['rank'] = index + 1

    return jsonify({"users": users_with_role, "cars": cars, "notifications": notifications})



@bp.route('/api/delete_user', methods=['POST'])
def delete_user():
    user_key = request.json.get('key')
    if user_key and user_key in replit_db:
        del replit_db[user_key]
        return jsonify({"message": "User deleted successfully"}), 200
    return jsonify({"error": "User not found"}), 404

@bp.route('/api/add_user', methods=['POST'])
def add_user():
    fullname = request.json.get('fullname')
    role = request.json.get('role')
    level = request.json.get('level')
    pin = request.json.get('pin')

    if not (fullname and role and level and pin):
        return jsonify({"error": "Missing required fields"}), 400

    if len(pin) != 5 or not pin.isdigit():
        return jsonify({"error": "PIN must be a 5-digit number"}), 400

    # Check if the PIN is already in use
    if pin in replit_db:
        return jsonify({"error": "This PIN is already in use. Please choose a different PIN."}), 400

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

@bp.route('/api/delete_car', methods=['POST'])
def delete_car():
    car_key = request.json.get('key')
    if car_key and car_key in replit_db:
        del replit_db[car_key]
        return jsonify({"message": "Car deleted successfully"}), 200
    return jsonify({"error": "Car not found"}), 404

@bp.route('/api/car_models/<brand>', methods=['GET'])
def get_car_models(brand):
    car_models = []
    for key in replit_db.keys():
        if key.startswith(brand + "_"):
            car_data = replit_db[key]
            car_models.append(car_data['model'])
    return jsonify({"models": car_models}), 200

@bp.route('/api/add_notification', methods=['POST'])
def add_notification():
    title = request.json.get('title')
    content = request.json.get('content')

    if not (title and content):
        return jsonify({"error": "Missing required fields"}), 400

    # Fetch existing notifications, or start with an empty list
    notifications = replit_db.get('notifications', [])

    # Append the new notification with a timestamp
    notifications.append({
        'title': title,
        'content': content,
        'timestamp': datetime.now().isoformat()  # Add timestamp
    })

    # Save the updated list back to the database
    replit_db['notifications'] = notifications

    return jsonify({"message": "Notification added successfully"}), 200



@bp.route('/api/delete_notification', methods=['DELETE'])
def delete_notification():
    notification_title = request.json.get('title')

    if not notification_title:
        return jsonify({"error": "Missing notification title"}), 400

    try:
        # Fetch the current notifications list
        notifications = replit_db.get('notifications', [])

        # Filter out the notification with the matching title
        updated_notifications = [n for n in notifications if n['title'] != notification_title]

        # Update the database with the new list
        replit_db['notifications'] = updated_notifications

        return jsonify({"message": "Notification deleted successfully"}), 200
    except Exception as e:
        logging.error(f"Error deleting notification: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
