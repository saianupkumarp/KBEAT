from flask import Blueprint, abort, jsonify, request, current_app

from core import data, tasks

#Rest API
rest_api = Blueprint('rest_api', __name__)

def _paginate(items, **options):
    offset = options.get('offset', 0)
    count = options.get('count', 0)
    items = items[offset:offset + count if count > 0 else None]

    return dict(objects=items, metadata=dict(count=len(items), offset=offset))

@rest_api.route('/config')
def get_config():
    return jsonify(app_name=current_app.config['APP_NAME'], locales=data.get_locales())

@rest_api.route('/models')
def get_models():
    i18n = request.args.get('locale', 'en')
    return jsonify(_paginate([models.to_primitive() for models in data.get_models()]))

@rest_api.route('/model/<model_name>')
def get_model(model_name):
    model = data.get_model(model_name)
    print model
    i18n = request.args.get('locale', 'en')
    return jsonify(model.to_primitive()) if model else abort(404)

@rest_api.route('/models/<model_name>', methods=['POST'])
def run_model(model_name):
    print "start"
    result = tasks.run_task(request.data, model_name)
    args = request.data if request.data else ''
    return result
    # return jsonify(tasks.run_task(model=model, args=args))

@rest_api.route('/runsim')
def get_sim():
    model = tasks.run_sim()
    return model
