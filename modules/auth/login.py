from flask import render_template, request, redirect, url_for, session
from . import auth_blueprint
from replit import db as replit_db
from werkzeug.security import check_password_hash

@auth_blueprint.route('/auth_login', methods=['GET', 'POST'])
def auth_login():
    if request.method == 'POST':
        pin = ''.join(request.form[f'pin{i}'] for i in range(1, 6))

        user_data = replit_db.get(pin)
        if user_data and check_password_hash(user_data['pin'], pin):
            session['username'] = user_data['fullname']
            session['level'] = user_data.get('level', 1)
            return redirect(url_for('chat.index'))
        return 'Nesprávny PIN'
    return render_template('auth/login.html')