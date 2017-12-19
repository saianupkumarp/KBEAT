from gevent import monkey

monkey.patch_all()
from flask import Flask
from flask_compress import Compress
from core.commands import command_manager
import settings
from core.api import rest_api

#Flask App
app = Flask(__name__, static_url_path='/kbeat/assets')
Compress(app)
app.config.from_object(settings)

#KEEC Rest api
app.register_blueprint(rest_api, url_prefix='/kbeat/api')

#Commands
manager = command_manager(app)

@app.after_request
def adding_header_content(head):
    head.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    head.headers["Pragma"] = "no-cache"
    head.headers["Expires"] = "0"
    head.headers['Cache-Control'] = 'public, max-age=0'
    return head

@app.route('/kbeat/')
@app.route('/kbeat/<path:path>')
def index(path=''):
    return app.send_static_file('views/index.html')

@app.route('/kbeat/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

if __name__ == "__main__":
    manager.run()
