from flask import Blueprint, session, redirect, url_for
from . import auth_blueprint

@auth_blueprint.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return redirect(url_for('auth.login'))