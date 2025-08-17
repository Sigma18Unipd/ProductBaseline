from flask_pymongo import PyMongo
from flask import current_app, g
from werkzeug.local import LocalProxy
from pymongo.errors import DuplicateKeyError, OperationFailure
from bson.objectid import ObjectId
from bson.errors import InvalidId
# https://www.mongodb.com/resources/products/compatibilities/setting-up-flask-with-mongodb



class MongoDBSingleton:
    _instance = None
    mongo = None

    def __new__(cls, app=None):
        if cls._instance is None:
            cls._instance = super(MongoDBSingleton, cls).__new__(cls)
            cls._instance.mongo = PyMongo(app)
        return cls._instance

    def get_db(self):
        return self.mongo.db # pyright: ignore[reportAttributeAccessIssue]