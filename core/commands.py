from flask_script import Manager
from gevent import spawn

from core import data

import settings

def command_manager(app):
    manager = Manager(app, with_default_commands=None)

    @manager.command
    def load_models():
        return spawn(data.load_model_data)

    @manager.command
    def start():
        try:
            sub_commands = [load_models()]
            app.run(host=settings.SERVER_HOST, port=settings.SERVER_PORT)
        except KeyboardInterrupt:
            pass
    return manager
