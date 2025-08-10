import os
import bson
from flask import current_app, g
from werkzeug.local import LocalProxy
from flask_pymongo import PyMongo

from pymongo.errors import DuplicateKeyError, OperationFailure
from bson.objectid import ObjectId
from bson.errors import InvalidId
# https://www.mongodb.com/resources/products/compatibilities/setting-up-flask-with-mongodb

mongo = PyMongo()
def get_db(): # singleton
    """
    Configuration method to return db instance
    """
    db = getattr(g, "_database", None)

    if db is None:

        db = g._database = mongo.db
       
    return db

def init_db(app):
    mongo.init_app(app)

db = LocalProxy(get_db)