import os
import random
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import openai
from replit import db

# Initialize OpenAI API key
my_secret = os.environ['Functu3000']
openai.api_key = my_secret

@chat_blueprint.route('/index')
def index():
    if 'username' in session:
        return render_template('chat/index.html', username=session['username'])
    return redirect(url_for('auth.login'))

@chat_blueprint.route('/get_initial_messages', methods=['GET'])
def get_initial_messages():
    try:
        username = session.get('username', 'User')

        # Generate a motivational quote
        motivational_quote_prompt = "Give me a motivational quote for the day."
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": motivational_quote_prompt}],
            max_tokens=50
        )
        motivational_quote = response.choices[0].message['content'].strip()

        # Generate a sales story
        random_name = random.choice(db["names"])
        sales_story_prompt = f"Tell me a motivational story from the sales industry involving {random_name}."
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": sales_story_prompt}],
            max_tokens=150
        )
        sales_story = response.choices[0].message['content'].strip()

        messages = [
            {"content": f"Welcome back, {username}!", "type": "received"},
            {"content": motivational_quote, "type": "received"},
            {"content": "Team Photo", "type": "received"},
            {"content": "https://example.com/team_photo.jpg", "type": "image"},  # Replace with your actual team photo URL
            {"content": f"Your current level: 1235 🚀 Keep up the great work to reach the next level!", "type": "received"},
            {"content": sales_story, "type": "received"},
            {"content": "Are you ready to conquer the day?", "type": "received"}
        ]
        return jsonify({"messages": messages})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@chat_blueprint.route('/get_story', methods=['POST'])
def get_story():
    try:
        random_name = random.choice(db["names"])
        sales_story_prompt = f"Tell me a motivational story from the sales industry involving {random_name}."
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": sales_story_prompt}],
            max_tokens=150
        )
        sales_story = response.choices[0].message['content'].strip()
        return jsonify({"story": sales_story})
    except Exception as e:
        return jsonify({"error": str(e)}), 500