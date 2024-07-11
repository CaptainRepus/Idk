from flask import render_template
from . import personal_growth_blueprint

@personal_growth_blueprint.route('/personal_growth')
def personal_growth():
    return render_template('personal_growth/personal_growth.html')