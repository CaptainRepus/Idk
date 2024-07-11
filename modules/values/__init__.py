from flask import Blueprint

values_blueprint = Blueprint('values', __name__)

# Importing routes
from . import values