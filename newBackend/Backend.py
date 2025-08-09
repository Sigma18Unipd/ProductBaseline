from flask import Flask, make_response, redirect, request, jsonify
from flask_cors import CORS, cross_origin
import boto3
import jwt
import datetime
import hmac
import hashlib
import base64
from utils.jwtUtils import generate_jwt, verify_jwt





# ---------- AWS, Cognito, Flask setup ----------
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
cors = CORS(app, supports_credentials=True, origins='*')
app.config['CORS_HEADERS'] = 'Content-Type'

 
 
 

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
@app.route('/dashboard', methods=['POST'])
def dashboard():
	jwtToken = request.cookies.get('jwtToken')
	if not jwtToken:
		return redirect("/login"), 302
	decodedJwt = verify_jwt(jwtToken)
	if decodedJwt:
		return jsonify({"email": decodedJwt['email']}), 200
	else:
		return redirect("/login"), 302
 




# ---------- RUN ----------
if __name__ == '__main__':
	app.run(debug=True)