# coding: utf-8
from datetime import datetime
from flask import send_file, abort
from flask.json import jsonify
import ujson as json
from core import data
from os import path
import subprocess
import requests
import settings

def run_task(args, country):
    simEngine = "http://52.29.26.174:8080/" + country
    simHeaders = {'Content-type': 'application/json; charset=UTF-8'}
    result = requests.post(simEngine, data=args, headers=simHeaders)
    return result.text #if result.status_code == '200' else abort(404)
