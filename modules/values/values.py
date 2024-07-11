from flask import render_template
from . import values_blueprint

@values_blueprint.route('/values')
def values():
    return render_template('values/values.html')