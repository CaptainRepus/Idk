from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import openai
import os
import logging
from replit import db
from models import User

# Initialize OpenAI API key directly
openai.api_key = "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"

logging.basicConfig(level=logging.DEBUG)

chat_blueprint = Blueprint('chat', __name__)

@chat_blueprint.route('/index')
def index():
    if 'username' in session:
        username = session['fullname']
        level = db.get(f"user_level:{username}", 1)
        return render_template('chat/index.html', username=username, level=level)
    return redirect(url_for('auth.login'))

@chat_blueprint.route('/get_story', methods=['POST'])
def get_story():
    try:
        user = User.query.order_by(db.func.random()).first()
        random_name = user.fullname if user else "Alex"

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative writer."},
                {"role": "user", "content": f"Write a short sales industry story featuring {random_name}."}
            ],
            max_tokens=250
        )
        ai_story = response.choices[0].message['content'].strip()
        return jsonify({"story": ai_story})
    except Exception as e:
        logging.error(f"Error in get_story: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500