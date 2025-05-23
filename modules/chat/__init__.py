import os
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import openai
from replit import db as replit_db
import random
from datetime import datetime, date
import logging
from collections.abc import Mapping, Iterable

chat_blueprint = Blueprint('chat', __name__)

openai.api_key = "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"

def convert_to_standard(obj):
    if isinstance(obj, Mapping):  # Check if obj is a dictionary-like object
        return {key: convert_to_standard(value) for key, value in obj.items()}
    elif isinstance(obj, Iterable) and not isinstance(obj, (str, bytes)):  # Check if obj is a list-like object
        return [convert_to_standard(item) for item in obj]
    else:
        return obj  # Return the object as is if it's neither a dict nor a list

def get_random_fullname():
    user_keys = list(replit_db.keys())
    if not user_keys:
        return "Alex"  # Return None if no users are found

    random_key = random.choice(user_keys)
    user_data = replit_db[random_key]
    return user_data['fullname']

@chat_blueprint.route('/get_story', methods=['POST'])
def get_story():
    try:
        random_name = get_random_fullname()
        logging.debug(f"Selected random name: {random_name}")

        if not random_name:
            return jsonify({"error": "No users found in the database."}), 404

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": "You are a creative writer."
            }, {
                "role": "user",
                "content": f"Write a very short sales industry story in Slovak featuring {random_name}."
            }],
            max_tokens=250
        )

        # Ensure 'choices' is a list and parse the response properly
        if isinstance(response.choices, list) and len(response.choices) > 0:
            ai_story = response.choices[0]['message']['content'].strip()  # Correct key access

            logging.debug(f"AI story generated: {ai_story}")
            return jsonify({"story": ai_story})
        else:
            raise ValueError("OpenAI API response structure is not as expected")

    except Exception as e:
        logging.error(f"Error in get_story: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@chat_blueprint.route('/submit_report', methods=['POST'])
def submit_report():
    report_data = request.json
    customer_name = report_data.get("customerName")
    author = report_data.get("author")

    if customer_name and author:
        existing_reports = replit_db.get(customer_name, [])
        if not isinstance(existing_reports, list):
            existing_reports = list(observed_to_dict(existing_reports))

        # Add the current date to the report data
        report_data['created_at'] = datetime.now().strftime('%Y-%m-%d')

        existing_reports.append(report_data)
        replit_db[customer_name] = existing_reports

        user_data = replit_db.get(author, {})
        report_count = user_data.get('report_count', 0) + 1
        user_data['report_count'] = report_count

        # Calculate the new level
        new_level = report_count // 3 + 1
        user_data['level'] = new_level

        replit_db[author] = user_data

        # Include the new level in the response if it was increased
        return jsonify({"message": "Report bol úspešne odoslaný!", "new_level": new_level}), 200

    return jsonify({"error": "Chýba meno klienta"}), 400

def observed_to_dict(obj):
    """
    Helper function to recursively convert objects to regular dict.
    """
    if hasattr(obj, 'items'):
        return {k: observed_to_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [observed_to_dict(i) for i in obj]
    else:
        return obj

        
@chat_blueprint.route('/get_reports', methods=['GET'])
def get_reports():
    all_reports = []
    for key in replit_db.keys():
        customer_reports = replit_db[key]
        for report in customer_reports:
            all_reports.append(observed_to_dict(report))  # Convert to regular dict
    return jsonify({"reports": all_reports[:28]})


@chat_blueprint.route('/index')
def index():
    if 'username' in session:
        username = session['username']
        level = replit_db.get('level', 1)
        # Get the last welcome message date from the session if available
        last_welcome_date = session.get('last_welcome_date', '')
        return render_template('chat/index.html', username=username, level=level, last_welcome_date=last_welcome_date)
    return redirect(url_for('auth.login'))

@chat_blueprint.route('/update_welcome_date', methods=['POST'])
def update_welcome_date():
    # Update the session with the current date as the last welcome date
    session['last_welcome_date'] = datetime.now().strftime('%Y-%m-%d')
    return jsonify({"message": "Welcome date updated"})


@chat_blueprint.route('/send_message', methods=['POST'])
def send_message():
    user_message = request.json.get('message')
    try:
        response = openai.ChatCompletion.create(model="gpt-4o-mini",
        messages=[
                    {
                    "role": "user",
                    "content": user_message
                    },
                ],
        max_tokens=150)
        ai_message = response.choices[0].message['content'].strip()
        return jsonify({"message": ai_message})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_blueprint.route('/get_today_reports', methods=['GET'])
def get_today_reports():
    try:
        # Get today's date
        today = date.today().isoformat()
        # Store today's reports
        today_reports = []
        # Iterate through all the keys (assumed customer names) in the database
        for key in replit_db.keys():
            reports = replit_db[key] if isinstance(replit_db[key], list) else []
            for report in reports:
                # Check if the report is from today
                report_date = report.get('created_at', '')
                if report_date.startswith(today):
                    today_reports.append(report)
        return jsonify(today_reports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_blueprint.route('/get_funny_story', methods=['POST'])
def get_funny_story():
    try:
        random_name = get_random_fullname()
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": "Si kreatívny rozprávkár."
            }, {
                "role": "user",
                "content": f"Vytvor najkrátší vtipný príbeh s {random_name}."
            }],
            max_tokens=150
        )
        ai_story = response.choices[0]['message']['content'].strip()
        return jsonify({"message": ai_story})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_blueprint.route('/get_random_message', methods=['GET'])
def get_random_message():
    try:
        options = [
            '/get_funny_story',    # Route to get funny story
            '/get_motivation'   # Route to get motivation
                  # Route to get team photo
        ]
        # Select a random message type route
        selected_route = random.choice(options)

        # Depending on the selected route, get the corresponding response
        if selected_route == '/get_funny_story':
            return get_funny_story()
        elif selected_route == '/get_motivation':
            return get_motivation()
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_blueprint.route('/get_motivation', methods=['POST'])
def get_motivation():
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": "Si motivačný rečník, ktorý ide povzbudiť zamestnanca na zlepšenie svojich záujmov."
            }, {
                "role": "user",
                "content": "Prosím, vytvor veľmi krátku motiváciu, možno nejaký motivačný citát od nejakého autora/celebrity"
            }],
            max_tokens=50)
        ai_quote = response.choices[0].message['content'].strip()
        return jsonify({"message": ai_quote})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@chat_blueprint.route('/get_notifications', methods=['GET'])
def get_notifications():
    try:
        notifications = replit_db.get('notifications', [])

        # Ensure each notification has a timestamp
        for notification in notifications:
            if 'timestamp' not in notification:
                notification['timestamp'] = datetime.now().isoformat()

        # Convert ObservedList and ObservedDict to standard list and dict recursively
        standard_notifications = convert_to_standard(notifications)

        return jsonify({"notifications": standard_notifications})
    except Exception as e:
        logging.error(f"Error fetching notifications: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500



@chat_blueprint.route('/get_user_level', methods=['GET'])
def get_user_level():
    if 'username' in session:
        username = session['username']
        logging.debug(f"Fetching level for user: {username}")

        user_data = replit_db.get(username, {})
        level = user_data.get('level', 1)

        logging.debug(f"User level: {level}")

        return jsonify({"level": level}), 200

    logging.error("User not logged in or data not found")
    return jsonify({"error": "User not logged in or data not found"}), 400

@chat_blueprint.route('/get_recent_reports', methods=['GET'])
def get_recent_reports():
    try:
        username = session.get('username')
        if not username:
            return jsonify({"error": "User not logged in"}), 401

        # Get all reports for the user
        all_reports = []
        for key in replit_db.keys():
            customer_reports = replit_db[key]
            for report in customer_reports:
                if report.get('author') == username:
                    all_reports.append(observed_to_dict(report))

        # Sort by the creation date and limit to the last 10 reports
        all_reports = sorted(all_reports, key=lambda r: r['created_at'], reverse=True)[:10]

        return jsonify({"reports": all_reports}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
