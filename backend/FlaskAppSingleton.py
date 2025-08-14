from flask import Flask

class FlaskAppSingleton:
  _instance = None

  def __new__(cls):
    if cls._instance is None:
      cls._instance = super(FlaskAppSingleton, cls).__new__(cls)
      cls._instance.app = Flask(__name__)
    return cls._instance

  def get_app(self):
    return self.app