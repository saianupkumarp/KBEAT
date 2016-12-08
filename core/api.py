from flask import Blueprint, abort, jsonify, request

from core import data

#Rest API
rest_api = Blueprint('rest_api', __name__)



@rest_api.route('/model')
def get_model():
    model = data.get_model()
    i18n = request.args.get('locale', 'en')
    return jsonify(model.to_primitive()) if model else abort(404)