from flask import Blueprint, render_template

reports_blueprint = Blueprint('reports', __name__)

@reports_blueprint.route('/new_report')
def new_report():
    return render_template('reports/new_report.html')

@reports_blueprint.route('/active_reports')
def active_reports():
    return render_template('reports/active_reports.html')

@reports_blueprint.route('/notification')
def notification():
    return render_template('reports/notification.html')