from gevent import monkey, get_hub
from datetime import datetime
from codecs import open
from os import listdir, path
from os.path import isfile

monkey.patch_all()

import ujson as json
import yaml
from core.schema import Model, Task
import settings
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson import json_util
import gridfs
import time, copy

client = MongoClient(settings.MONGO_HOST,settings.MONGO_PORT)

db = client[settings.MONGO_DBNAME]
Models = db['model']
Tasks = db['task']

def get_locales():
    locales_path = path.join(settings.STATIC_ROOT, 'locales')
    return [path.splitext(f)[0] for f in listdir(locales_path) if f.endswith('.json')]

def get_model(model_name):
    model_data = Models.find_one({"name": model_name})
    return Model(model_data, strict=False) if model_data else None

def get_models(count=0):
    return [Model(model, strict=False) for model in Models.find().limit(count)]

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

def get_task(task_id):
    task_data = Tasks.find_one({"_id": ObjectId(task_id)})
    task_data['id'] = str(task_id)
    if not task_data:
        return None
    task = Task(task_data, strict = False)
    task.model = get_model(task_data['country'].lower())
    return task

def get_tasks():
    tasks = [get_task(task['_id']) for task in Tasks.find({}, {"_id":1, "created":1}).sort("created", -1)]
    tasks = [task.to_primitive(role='DTO') for task in tasks if task]
    return {"tasks": tasks}

def get_task_result(task_id):
    task = Tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        return None
    if task.get('status', '') == 'RUNNING':
        time.sleep(10)
        return get_task_result(task_id)
    if task.get('status', '') == 'COMPLETED':
        bepuObj = []
        pseObj = []
        lvdObj = []
        bepuPieData = []
        for outputType in task.get('result'):
            if outputType == 'userOutput' or outputType == 'standardOutput':
                if task.get('result').get(outputType).get('bepu'):
                    obj = outputType.split("Output",1)[0]
                    obj = {}
                    obj['key'] = 'Your Building' if outputType.split("Output",1)[0].title() == 'User' else 'SASO Baseline'
                    obj['values'] = task.get('result').get(outputType).get('bepu')
                    bepuObj.append(obj)
                if task.get('result').get(outputType).get('pse'):
                    obj = outputType.split("Output",1)[0]
                    obj = {}
                    obj['key'] = 'Your Building' if outputType.split("Output",1)[0].title() == 'User' else 'SASO Baseline'
                    obj['values'] = task.get('result').get(outputType).get('pse')
                    pseObj.append(obj)
                if task.get('result').get(outputType).get('lvd'):
                    obj = outputType.split("Output",1)[0]
                    obj = {}
                    obj['key'] = 'Your Building' if outputType.split("Output",1)[0].title() == 'User' else 'SASO Baseline'
                    for elem in task.get('result').get(outputType).get('lvd'):
                        obj['values'] = elem['values']
                    lvdObj.append(obj)
        bepuPieData = copy.deepcopy(task.get('result').get('userOutput').get('bepu'))
        bepuPieData.pop()
        calObj={}
        for key,value in task.get('request').iteritems():
            calObj[key]= (value.title() if isinstance(value, unicode) else value)
        report = {
            'id': task_id,
            'bepuComparisonData': bepuObj,
            'pseBarData': task.get('result').get('userOutput').get('pse'),
            'lvdData': lvdObj,
            'bepuPieData': bepuPieData,
            'compliant': task.get('result').get('compliant'),
            'ngEnergyDiff': task.get('result').get('energyDiff'),
            'energyDiff': "{:,.0f}".format(abs(task.get('result').get('energyDiff'))),
            'calibrationData': calObj
        }
        print report
    return report
