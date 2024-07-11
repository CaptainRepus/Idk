from flask import render_template
from . import improve_blueprint

@improve_blueprint.route('/help_us_improve')
def help_us_improve():
    return render_template('improve/help_us_improve.html')