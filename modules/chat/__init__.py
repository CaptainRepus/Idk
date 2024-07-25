import os
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import openai
from replit import db as replit_db
import random
from datetime import datetime

chat_blueprint = Blueprint('chat', __name__)

my_secret = os.environ['Functu3000']
openai.api_key = my_secret

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
        if not random_name:
            return jsonify({"error": "No users found in the database."}), 404

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "system",
                "content": "Si kreatívny spisovateľ."
            }, {
                "role":
                "user",
                "content":
                f"Napíš veľmi krátky príbeh v slovenčine z oblasti predaja, v ktorom bude hrať {random_name}."
            }],
            max_tokens=250)
        ai_story = response.choices[0].message['content'].strip()
        return jsonify({"story": ai_story})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_blueprint.route('/submit_report', methods=['POST'])
def submit_report():
    report_data = request.json
    customer_name = report_data.get("customerName")
    if customer_name:
        existing_reports = replit_db.get(customer_name, [])

        # Ensure existing_reports is a list
        if not isinstance(existing_reports, list):
            existing_reports = list(observed_to_dict(existing_reports))

        existing_reports.append(report_data)
        replit_db[customer_name] = existing_reports
        return jsonify({"message": "Report successfully submitted!"}), 200
    return jsonify({"error": "Missing customer name"}), 400

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
    return jsonify({"reports": all_reports})

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
        response = openai.ChatCompletion.create(model="gpt-3.5-turbo",
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

