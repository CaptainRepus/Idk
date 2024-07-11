from flask import Blueprint

improve_blueprint = Blueprint('improve', __name__)

def register_routes():
    from . import routes  # Deferred import to avoid circular import