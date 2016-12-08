from gevent import monkey

monkey.patch_all()
from flask import Flask
from core.commands import command_manager
import settings
from core.api import rest_api

#Flask App
app = Flask(__name__, static_url_path='/keec/assets')
app.config.from_object(settings)

#KEEC Rest api
app.register_blueprint(rest_api, url_prefix='/keec/api')

#Commands
manager = command_manager(app)

@app.after_request
def adding_header_content(head):
    head.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    head.headers["Pragma"] = "no-cache"
    head.headers["Expires"] = "0"
    head.headers['Cache-Control'] = 'public, max-age=0'
    return head

@app.route('/keec/')
@app.route('/keec/<path:path>')
def index(path=''):
    return app.send_static_file('views/index.html')

@app.route('/keec/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

if __name__ == "__main__":
    manager.run()
