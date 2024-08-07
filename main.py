import os
from flask import Flask, render_template, redirect, url_for, session, send_from_directory
import openai

# Blueprints
from modules.auth import auth_blueprint
from modules.chat import chat_blueprint
from modules.backoffice import backoffice_blueprint  # Import backoffice blueprint

app = Flask(__name__)
app.secret_key = 'supersecretkey'

# OpenAI API key configuration
my_secret = "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"
openai.api_key = my_secret

app.register_blueprint(auth_blueprint, url_prefix='/auth')
app.register_blueprint(chat_blueprint, url_prefix='/chat')
app.register_blueprint(backoffice_blueprint, url_prefix='/backoffice')  # Register backoffice blueprint

@app.route('/')
def welcome():
    if 'username' in session:
        return redirect(url_for('chat.index'))
    return redirect(url_for('auth.login'))

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/static/<path:filename>')
def staticfiles(filename):
    return send_from_directory(os.path.join(app.root_path, 'static'), filename, mimetype='application/javascript')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)