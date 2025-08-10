import jwt
import datetime
import os

JWT_SECRET = os.environ.get("JWT_SECRET", "your_secret_key")

def generate_jwt(email):
  payload = {
    "email": email,
    "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
  }
  return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt(token):
  try:
    return jwt.decode(token, JWT_SECRET, algorithms="HS256")
  except jwt.ExpiredSignatureError:
    return None