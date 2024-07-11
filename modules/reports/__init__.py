from flask import Blueprint

reports_blueprint = Blueprint('reports', __name__)

# Import routes after blueprint definition to avoid circular import
from . import routes, new_report, notification, active_reports