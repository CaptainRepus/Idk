from flask import render_template
from . import reports_blueprint

@reports_blueprint.route('/new_report')
def new_report():
    return render_template('reports/new_report.html')