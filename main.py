import os
from flask import Flask, render_template, redirect, url_for, session, send_from_directory
import openai

# Blueprints
from modules.auth import auth_blueprint
from modules.chat import chat_blueprint  # Import chat blueprint

app = Flask(__name__)
app.secret_key = 'supersecretkey'

# OpenAI API key configuration
my_secret = os.environ['Functu3000']
openai.api_key = my_secret

app.register_blueprint(auth_blueprint, url_prefix='/auth')
app.register_blueprint(chat_blueprint, url_prefix='/chat')  # Register chat blueprint


@app.route('/')
def welcome():
    if 'username' in session:
        return redirect(url_for('chat.index'))
    return render_template('welcome.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/static/<path:filename>')
def staticfiles(filename):
    return send_from_directory(os.path.join(app.root_path, 'static'), filename, mimetype='application/javascript')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)