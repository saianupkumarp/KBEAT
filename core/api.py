from flask import Blueprint, abort, jsonify, request

from core import data, tasks

#Rest API
rest_api = Blueprint('rest_api', __name__)



@rest_api.route('/model')
def get_model():
    model = data.get_model()
    i18n = request.args.get('locale', 'en')
    return jsonify(model.to_primitive()) if model else abort(404)

@rest_api.route('/model/<model_name>', methods=['POST'])
def run_model(model_name):
    # model = data.get_model(model_name)
    args = request.data if request.data else ''
    print args
    return
    # return jsonify(tasks.run_task(model=model, args=args))

@rest_api.route('/runsim')
def get_sim():
    model = tasks.run_sim()
    return model
