from flask import render_template, request, redirect, url_for
from . import auth_blueprint
from replit import db as replit_db
from werkzeug.security import generate_password_hash

@auth_blueprint.route('/register', methods=['GET', 'POST'])
def auth_register():
    if request.method == 'POST':
        fullname = request.form['fullname']
        pin1 = request.form['pin1']
        pin2 = request.form['pin2']
        pin3 = request.form['pin3']
        pin4 = request.form['pin4']
        pin5 = request.form['pin5']
        role = request.form['role']
        pin = pin1 + pin2 + pin3 + pin4 + pin5

        hashed_pin = generate_password_hash(pin)
        replit_db[pin] = {
            'fullname': fullname,
            'pin': hashed_pin,
            'level': 1,
            'role': role
        }
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')