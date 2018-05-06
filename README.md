# KAPSARC Building Stock Energy Efficiency Analysis (KBEAT)  [![python version](https://img.shields.io/badge/python-v2.7.12-yellowgreen.svg)](https://www.python.org/download/releases/2.7/) [![Node version](https://img.shields.io/badge/npm-v4.4.1-green.svg)](http://nodejs.org/download/) [![mit](https://img.shields.io/npm/l/express.svg?style=plastic)](https://opensource.org/licenses/MIT) [![status](https://img.shields.io/pypi/status/Django.svg?style=plastic)]()

KBEAT is a web-based energy analysis tool designed to assist users improve the energy efficiency of residential buildings. Based on KAPSARC’s earlier research including the recent work on building energy productivity has indicated that the potential for reducing energy consumption and demand is significant for both new and existing buildings in the Kingdom of Saudi Arabia (KSA). To tap this potential, a flexible and accessible analysis tool can assist in identifying the specific energy efficiency measures and technologies suitable for individual buildings in various KSA regions.

The current version of the KSA energy efficiency tool performs a comprehensive hourly energy analysis of individual residential buildings and can assist three major stakeholders: building owners, builders, and government agencies including municipalities to verify compliance with current thermal performance standards as well as improve the energy efficiency of new residential buildings in KSA. The online tool, based on a state-of-art whole-building energy simulation program, utilizes hourly weather data for various locations within KSA. The tool is especially helpful to determine the energy performance of various building types and designs.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Prerequisites
 
 * [KBEAT Simulator](https://github.com/KAPSARC/keec-legacy)
 * [Python 2.7][py27]
 * [Flask==0.10.1](https://www.python.org/download/releases/2.7/)
 * Flask-Script==2.0.5
 * Flask-SocketIO==0.5.0
 * six==1.10.0
 * Werkzeug==0.11.11
 * Requests==2.11.0
 * python-pptx==0.6.3
 * reportlab==3.4.0
 * flask-compress==1.4.0

##### And here's the code install the prerequisites packages! :heavy_check_mark:

```python
pip install -r requirements.txt
```

##### Add server, database, LDAP and other configuarations in the below file,

```python
settings.py
```
##### Code to start server! :heavy_check_mark:

```python
python keec.py
```

[py27]: <https://www.python.org/download/releases/2.7/>