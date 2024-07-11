from flask import render_template
from . import reports_blueprint

@reports_blueprint.route('/notification')
def notification():
    return render_template('reports/notification.html')