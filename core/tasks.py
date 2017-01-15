from datetime import datetime
from flask import send_file
from flask.json import jsonify
import ujson as json
from core import data
from os import path
import subprocess
import settings

def run_sim():
    BatchPath = str(path.join(settings.DATA_ROOT, "run_ak.bat"))
    simRun = subprocess.Popen(BatchPath, shell=True, stdout = subprocess.PIPE)
    stdout, stderr = simRun.communicate()
    print simRun.returncode
    rdSim = open(path.join(settings.DATA_ROOT, "tunbeec_desktop_nogui_exp_v1\PROJECT", "template.SIM"))
    # print rdSim.readlines()
    return send_file(path.join(settings.DATA_ROOT, "tunbeec_desktop_nogui_exp_v1\PROJECT", "template.SIM"))
    # print rdSim.readlines()
    # return rdSim.readlines()
