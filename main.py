import os
from flask import Flask, render_template, redirect, url_for, session
import openai

app = Flask(__name__)
app.secret_key = 'supersecretkey'

# OpenAI API key configuration
openai.api_key = os.getenv("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")

# Blueprints
from modules.auth import auth_blueprint
from modules.reports import reports_blueprint
from modules.chat import chat_blueprint  # Import chat blueprint
from modules.values import values_blueprint
from modules.personal_growth import personal_growth_blueprint
from modules.improve import improve_blueprint

app.register_blueprint(auth_blueprint, url_prefix='/auth')
app.register_blueprint(chat_blueprint, url_prefix='/chat')  # Register chat blueprint
app.register_blueprint(reports_blueprint, url_prefix='/reports')
app.register_blueprint(values_blueprint, url_prefix='/values')
app.register_blueprint(personal_growth_blueprint, url_prefix='/personal_growth')
app.register_blueprint(improve_blueprint, url_prefix='/improve')

@app.route('/')
def welcome():
    if 'username' in session:
        return redirect(url_for('chat.index'))  # Ensure /chat prefix is used
    return render_template('welcome.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)