from datetime import datetime
from uuid import uuid4

from pytz import timezone
from schematics.models import Model as Entity
from schematics.types import BooleanType, DateTimeType, MultilingualStringType, StringType, UUIDType, IntType, DecimalType
from schematics.types.compound import DictType, ListType, ModelType
from schematics.types.serializable import serializable
from schematics.transforms import blacklist
from bson.objectid import ObjectId
import settings


class ModelContainer(Entity):
    id = StringType(required=True)
    label = StringType(default='')
    widthPercent = StringType(default='')
    parameters = ListType(DictType(StringType), default=None)
    openOnEdit = StringType(default='')
    hasShape = StringType(default='')
    shapeDetails = ListType(DictType(StringType), default=None)
    class Options:
        serialize_when_none = False

class ModelStep(Entity):
    id = StringType(required=True)
    label = StringType(required=True, default='')
    containers = ListType(ModelType(ModelContainer), default=None)

    class Options:
        serialize_when_none = False

class Model(Entity):
    name = StringType(required=True, deserialize_from=('name', 'model_name'))
    title = StringType(required=True)
    steps = ListType(ModelType(ModelStep), default=None)

    class Options:
        serialize_when_none = False

class Arguments(Entity):
    txtBldgName = StringType(required=True)
    txtBldgAddress = StringType(required=True)
    cmbBldgType = StringType(required=True)
    cmbBldgLocation = StringType(required=True)
    txtBldgNumFloor = IntType(required=True)
    txtBldgCondArea = IntType(required=True)
    cmbBldgShape = StringType(required=True)
    txtBldgAzi = IntType(required=True)
    txtFloorHeight = IntType(required=True)
    txtLengX1 = IntType(required=True)
    txtLengY1 = IntType(required=True)
    txtLengX2 = IntType(required=True)
    txtLengY2 = IntType(required=True)
    txtLengX3 = IntType(required=True)
    txtLengY3 = IntType(required=True)
    txtFloorArea = IntType(required=True)
    cmbSouthWall = StringType(required=True)
    cmbNorthWall = StringType(required=True)
    cmbEastWall = StringType(required=True)
    cmbWestWall = StringType(required=True)
    cmbRoof = StringType(required=True)
    cmbFirstFloorContact = StringType(required=True)
    txtWinSouthOverhang = DecimalType(required=True)
    txtWinSouthFp = DecimalType(required=True)
    cmbHotWaterSystem = StringType(required=True)
    cmbBldgSystem = StringType(required=True)
    txtHeatSetTemp = IntType(required=True)
    txtCoolSetTemp = IntType(required=True)
    rdbtnWinWwr = BooleanType(default=True)
    southpercent = IntType(required=True)
    northpercent = IntType(required=True)
    eastpercent = IntType(required=True)
    westpercent = IntType(required=True)
    glasstype = StringType(required=True)
    txtSkyltType = StringType(required=True)
    txtSkyltCvr = IntType(required=True)

    class Options:
        serialize_when_none = False

class Task(Entity):
    _id = ObjectId()
    id = StringType(required=True)
    request = ModelType(Arguments, required=True)
    createdTime = DateTimeType(default=lambda: datetime.now(timezone(settings.CURRENT_TIMEZONE)))
    country = StringType(required=True)
    model = ModelType(Model, required=True)
    status = StringType(default='UNKNOWN', choices=('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'COMPLETED', 'CANCELLED'))

    @serializable
    def model_name(self):
        return self.model.name if self.model else None

    class Options:
        serialize_when_none = False
        roles = {
            'default': blacklist('model_name', 'status'),
            'DTO': blacklist('model'),
            'WOM': blacklist('model', 'model_name')
        }