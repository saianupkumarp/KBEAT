# coding: utf-8
from datetime import datetime
from flask import send_file
from flask.json import jsonify
import ujson as json
from core import data
from os import path
import subprocess
import requests
import settings

def run_task(args):
    print "running task"
    simEngine = "http://localhost:9001"
    simHeaders = {'Content-type': 'application/json; charset=UTF-8'}
    # data1 = '{"txtBldgName":"Anup","txtBldgAddress":"Tunisia","cmbBldgType":"Hôtel, 3 Etoiles","cmbBldgLocation":"GAFSA","txtBldgNumFloor":1,"txtBldgCondArea":100,"cmbBldgShape":"Hexagon","txtBldgAzi":0,"txtFloorHeight":2,"txtLengX1":10,"txtLengY1":10,"txtLengX2":10,"txtLengY2":10,"txtLengX3":10,"txtLengY3":10,"txtFloorArea":100,"cmbSouthWall":"Mur Pas d’Isolation","cmbNorthWall":"Mur Pas d’Isolation","cmbEastWall":"Mur Pas d’Isolation","cmbWestWall":"Mur Pas d’Isolation","cmbRoof":"Toit Pas d’Isolation","cmbFirstFloorContact":"Sol","txtWinSouthOverhang":0.5,"txtWinSouthFp":0.5,"cmbHotWaterSystem":"Réservoir système DHW au gaz","cmbBldgSystem":"Systeme Monobloc Volume d’Air Variable","txtHeatSetTemp":20,"txtCoolSetTemp":24,"rdbtnWinWwr":true,"southpercent":30,"northpercent":30,"eastpercent":30,"westpercent":30,"glasstype":"Simple Claire","txtSkyltType":"Flat","txtSkyltCvr":13}'
    result = requests.post(simEngine, data=args, headers=simHeaders)
    print result.status_code
    return result.text

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
