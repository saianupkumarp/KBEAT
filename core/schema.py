from datetime import datetime
from uuid import uuid4

from pytz import timezone
from schematics.models import Model as Entity
from schematics.types import BooleanType, DateTimeType, MultilingualStringType, StringType, UUIDType, IntType
from schematics.types.compound import DictType, ListType, ModelType
from schematics.types.serializable import serializable
from schematics.transforms import blacklist
import settings


class ModelContainer(Entity):
    id = StringType(required=True)
    label = StringType(default='')
    widthPercent = StringType(default='')
    parameters = ListType(DictType(StringType), default=None)
    openOnEdit = StringType(default='')
    hasShape = StringType(default='')
    class Options:
        serialize_when_none = False

class ModelStep(Entity):
    id = StringType(required=True)
    label = StringType(required=True, default='')
    containers = ListType(ModelType(ModelContainer), default=None)
    
    class Options:
        serialize_when_none = False

class Model(Entity):
    name = StringType(required=True)
    steps = ListType(ModelType(ModelStep), default=None)

    class Options:
        serialize_when_none = False