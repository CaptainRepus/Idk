import os
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import openai
from replit import db as replit_db
import random

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
                "content": "You are a creative writer."
            }, {
                "role":
                "user",
                "content":
                f"Write a very very short sales industry story featuring {random_name}."
            }],
            max_tokens=250)
        ai_story = response.choices[0].message['content'].strip()
        return jsonify({"story": ai_story})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_blueprint.route('/index')
def index():
    if 'username' in session:
        return render_template('chat/index.html', username=session['username'])
    return redirect(url_for('auth.login'))

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