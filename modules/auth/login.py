from flask import render_template, request, redirect, url_for, session
from . import auth_blueprint
from replit import db as replit_db
from werkzeug.security import check_password_hash

@auth_blueprint.route('/auth_login', methods=['GET', 'POST'])
def auth_login():
    if request.method == 'POST':
        pin1 = request.form['pin1']
        pin2 = request.form['pin2']
        pin3 = request.form['pin3']
        pin4 = request.form['pin4']
        pin5 = request.form['pin5']
        pin = pin1 + pin2 + pin3 + pin4 + pin5

        user_data = replit_db.get(pin)
        if user_data and check_password_hash(user_data['pin'], pin):
            session['username'] = pin
            session['fullname'] = user_data.get('fullname', 'User')
            session['level'] = user_data.get('level', 1)
            return redirect(url_for('chat.index'))
        return 'Nesprávny PIN'
    return render_template('auth/login.html')