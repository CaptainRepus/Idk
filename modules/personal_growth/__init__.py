from flask import Blueprint

personal_growth_blueprint = Blueprint('personal_growth', __name__)

# Import routes after blueprint definition to avoid circular import errors
from . import routes