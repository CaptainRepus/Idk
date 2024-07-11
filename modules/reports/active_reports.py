from flask import render_template
from . import reports_blueprint

@reports_blueprint.route('/active_reports')
def active_reports():
    return render_template('reports/active_reports.html')