from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import openai

chat_blueprint = Blueprint('chat', __name__)

@chat_blueprint.route('/index')
def index():
    if 'username' in session:
        return render_template('chat/index.html', username=session['username'])
    return redirect(url_for('auth.login'))

@chat_blueprint.route('/send_message', methods=['POST'])
def send_message():
    user_message = request.json.get('message')

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": user_message},
            ],
            max_tokens=150
        )
        ai_message = response.choices[0].message['content'].strip()
        return jsonify({"message": ai_message})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
