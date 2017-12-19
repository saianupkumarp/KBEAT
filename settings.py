from os import path
import tempfile

# Flask
APP_NAME = 'keec'
DEBUG = True
SERVER_HOST = 'localhost'
SERVER_PORT = 1080
SECRET_KEY = '8lsbAgXecB'

# Localization
CURRENT_TIMEZONE = 'Asia/Riyadh'
FALLBACK_LOCALE = 'en'

# Paths
APP_ROOT = path.dirname(path.abspath(__file__))
DATA_ROOT = path.join(APP_ROOT, 'models')
STATIC_ROOT = path.join(APP_ROOT, 'static')
OUTPUT_ROOT = tempfile.gettempdir()

#MongoDB
MONGO_HOST = 'localhost'
MONGO_PORT = 27017
MONGO_DBNAME = 'keec'

# Compress
COMPRESS_MIN_SIZE = 50
COMPRESS_MIMETYPES = [
                        'text/html',
                        'text/css',
                        'text/xml',
                        'application/json',
                        'application/javascript',
                        'image/jpeg',
                        'image/png'
                    ]