from flask import Flask
from typing import Optional

class FlaskAppSingleton:
    _instance: Optional['FlaskAppSingleton'] = None
    
    def __new__(cls) -> 'FlaskAppSingleton':
        if cls._instance is None:
            cls._instance = super(FlaskAppSingleton, cls).__new__(cls)
        return cls._instance
    
    def __init__(self) -> None:
        if not hasattr(self, 'app'):
            self.app = Flask(__name__)
    
    def get_app(self) -> Flask:
        return self.app