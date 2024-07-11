import os
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import openai

# Initialize OpenAI API key from environment variable directly in the index.py
my_secret = os.environ['Functu3000']
openai.api_key = my_secret

chat_blueprint = Blueprint('chat', __name__)

@chat_blueprint.route('/index')
def index():
    if 'username' in session:
        return render_template('chat/index.html', username=session['username'])
    return redirect(url_for('auth.login'))

@chat_blueprint.route('/send_message', methods=['POST'])
def send_message():
    user_message = request.json.get('message', '')

    try:
        # Use OpenAI API to generate response
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a motivational speaker."},
                {"role": "user", "content": f"Generate a motivational message for: {user_message}"}
            ],
            max_tokens=100
        )
        ai_message = response.choices[0].message.get('content', '').strip()
        return jsonify({"message": ai_message})
    except Exception as e:
        return jsonify({"error": str(e)}), 500