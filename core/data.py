from gevent import monkey, get_hub
from datetime import datetime
from codecs import open
from os import listdir, path
from os.path import isfile

monkey.patch_all()

import ujson as json
import yaml
from core.schema import Model
import settings
from pymongo import MongoClient
import gridfs

client = MongoClient(settings.MONGO_HOST,settings.MONGO_PORT)

db = client[settings.MONGO_DBNAME]
Models = db['model']


def get_model():
    model_data = Models.find_one()
    return Model(model_data, strict=False) if model_data else None


def load_model_data():
    hub = get_hub()
    watcher = hub.loop.stat(settings.DATA_ROOT)

    while True:
        for filename in listdir(settings.DATA_ROOT):
            file_path = path.join(settings.DATA_ROOT, filename)

            if isfile(file_path) and filename.endswith('.schema'):
                with open(file_path, mode='rU', encoding='utf-8') as descriptor_file:
                    model = Model(yaml.load(descriptor_file))
                    Models.update({"name": model.name}, model.to_native(), upsert = True)
        hub.wait(watcher)
