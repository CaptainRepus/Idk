from flask import Blueprint

backoffice_blueprint = Blueprint('backoffice', __name__)

from . import dashboard  # Ensure this import exists to include the routes