from flask import Flask, request, jsonify
import boto3
import jwt
import datetime
import hmac
import hashlib
import base64
from utils.jwtUtils import generate_jwt, verify_jwt



# ---------- AWS e Cognito ----------
COGNITO_APP_CLIENT_ID = "71h9cip98bd95h87rvkqj8jmer"
AWS_REGION = "eu-west-1"
AWS_ACCESS_KEY_ID = "ASIAYLERNPBSDLBV6Z2X"
AWS_SECRET_ACCESS_KEY = "DzPT8OXNtKqUWEVHEDvJH9+MxTqKiyCtwjM0QbSf"

try:
	client = boto3.client(
		'cognito-idp', 
		region_name=AWS_REGION, 
		aws_access_key_id=AWS_ACCESS_KEY_ID,
		aws_secret_access_key=AWS_SECRET_ACCESS_KEY
	)
	print("AWS client configurato correttamente")
except Exception as e:
  print(f"Errore configurazione AWS: {e}")

app = Flask(__name__)



# ---------- Auth Routes ----------
@app.route('/login', methods=['POST'])
def login():
	data = request.get_json()
	try:
		res = client.initiate_auth(
		  AuthFlow='USER_PASSWORD_AUTH',
		  AuthParameters={
		    'USERNAME': data['email'],
		    'PASSWORD': data['password'],
		  },
		  ClientId=COGNITO_APP_CLIENT_ID
		)
		response = jsonify({"token": generate_jwt(data['email'])}), 200
		return response
	except client.exceptions.NotAuthorizedException:
		return jsonify({"error": "Invalid credentials"}), 401



@app.route('/register', methods=['POST'])
def register():
	data = request.get_json()
	try:
		client.sign_up(
      ClientId=COGNITO_APP_CLIENT_ID,
      Username = data['email'],
      Password = data['password'],
      UserAttributes = [{"Name": "email", "Value": data['email']}]
    )
		return jsonify({"message": "User registered. Please confirm email."})
	except Exception as e:
		return jsonify({"error": str(e)}), 400



@app.route('/confirm', methods=['POST'])
def confirm():
  data = request.get_json()
  try:
    client.confirm_sign_up(
      ClientId = COGNITO_APP_CLIENT_ID,
      Username = data['email'],
      ConfirmationCode = data['code']
    )
    return jsonify({"message": "User confirmed successfully."})
  except Exception as e:
  	return jsonify({"error": str(e)}), 400



# ---------- Protected Routes ----------
@app.route('/protected', methods=['GET'])
def protected():
  auth_header = request.headers.get('Authorization')
  if not auth_header:
    return jsonify({"error": "Missing token"}), 401
  token = auth_header.replace("Bearer ", "")
  decoded = verify_jwt(token)
  if decoded:
    return jsonify({"message": f"Hello {decoded['email']}, access granted!"})
  else:
    return jsonify({"error": "Invalid or expired token"}), 403



# ---------- RUN ----------
if __name__ == '__main__':
  app.run(debug=True)