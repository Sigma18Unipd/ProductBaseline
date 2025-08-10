from flask import Flask, make_response, redirect, request, jsonify, g
from flask_cors import CORS, cross_origin
import boto3
#import jwt
#import datetime
#import hmac
#import hashlib
#import base64
from utils.jwtUtils import generate_jwt, verify_jwt
from dotenv import load_dotenv
import os
from functools import wraps
from db import db


# ---------- AWS, Cognito, Flask setup ----------
load_dotenv()
AWS_REGION = "eu-west-1"
COGNITO_APP_CLIENT_ID = os.environ.get("COGNITO_APP_CLIENT_ID")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
try:
	client = boto3.client(
		'cognito-idp', 
		region_name=AWS_REGION, 
		aws_access_key_id=AWS_ACCESS_KEY_ID,
		aws_secret_access_key=AWS_SECRET_ACCESS_KEY
	)
	#print("AWS client configurato correttamente")
except Exception as e:
	print(f"Errore configurazione AWS: {e}")

app = Flask(__name__)
cors = CORS(app, supports_credentials=True, origins='*')
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['MONGO_URI'] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/mydb")
 
 

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
		jwtToken = generate_jwt(data['email'])
		response = make_response()
		response.set_cookie(
			'jwtToken',
			jwtToken,
			max_age=24*60*60,
			httponly=True, 
			secure=False,       # False for localhost, change to True for production in HTTPS #TODO
			samesite='Lax'     	
		)
		return response, 200
	except client.exceptions.NotAuthorizedException:
		return jsonify({"error": "Invalid email or password"}), 401
	except client.exceptions.UserNotConfirmedException:
		return jsonify({"error": "User account not confirmed"}), 401
	except client.exceptions.UserNotFoundException:
		return jsonify({"error": "User not found"}), 401
	except client.exceptions.TooManyRequestsException:
		return jsonify({"error": "Too many login attempts. Please try again later"}), 401
	except Exception as e:
		return jsonify({"error": str(e)}), 401

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
		return jsonify({"message": "User registered. Please confirm email."}), 200
	except client.exceptions.LimitExceededException:
		return jsonify({"error": "Email quota limit exceeded"}), 401
	except client.exceptions.UsernameExistsException:
		return jsonify({"error": "User already exists"}), 401
	except Exception as e:
		return jsonify({"error": str(e)}), 401

@app.route('/confirm', methods=['POST'])
def confirm():
	data = request.get_json()
	try:
		client.confirm_sign_up(
			ClientId = COGNITO_APP_CLIENT_ID,
			Username = data['email'],
			ConfirmationCode = data['otp']
		)
		return jsonify({"message": "User confirmed successfully."}), 200
	except client.exceptions.UserNotFoundException:
		return jsonify({"error": "User not found"}), 401
	except client.exceptions.CodeMismatchException:
		return jsonify({"error": "Code not valid"}), 401
	except client.exceptions.ExpiredCodeException:
		return jsonify({"error": "Code Expired"}), 401
	except Exception as e:
		return jsonify({"error": str(e)}), 401





# ---------- Protected Routes ----------
def protected(f):
	@wraps(f)
	def decorated_function(*args, **kwargs):
		jwt_token = request.cookies.get('jwtToken')
		payload = verify_jwt(jwt_token)
		if not jwt_token or not payload:
			return redirect("/login"), 302
		g.email = payload['email']
		return f(*args, **kwargs)
	return decorated_function


@app.route('/dashboard', methods=['POST'])
@protected
def dashboard():
	return jsonify({"email": g.email}), 200
 
@app.route('/api/flows', methods=['POST'])
@protected
def get_workflows():
	cursor = db.workflows.find({"email": g.email})
	flows = [
		{
			"id": str(flow["_id"]),
			"name": flow["name"],
			"contents": flow["contents"],
		} for flow in cursor
	]
	print (f"Flows for {g.email}: {flows}")
	return jsonify(flows), 200

# ---------- RUN ----------
if __name__ == '__main__':
	app.run(debug=True)