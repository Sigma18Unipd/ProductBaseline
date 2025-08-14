import uuid
from flask import Flask, make_response, redirect, request, jsonify, g
from flask_cors import CORS, cross_origin
import boto3
from FlaskAppSingleton import FlaskAppSingleton
from MongoDBSingleton import MongoDBSingleton
from utils.jwtUtils import generateJwt, verifyJwt
from dotenv import load_dotenv
import os
from functools import wraps
#import jwt
#import datetime
#import hmac
#import hashlib
#import base64





# ---------- AWS, Cognito, Flask, DB setup ----------
load_dotenv()
AWS_REGION = "eu-west-1"
COGNITO_APP_CLIENT_ID = os.environ.get("COGNITO_APP_CLIENT_ID")
try:
	client = boto3.client(
		'cognito-idp', 
		region_name=AWS_REGION, 
		aws_access_key_id= os.environ.get("AWS_ACCESS_KEY_ID"),
		aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY")
	)
except Exception as e:
	print(f"Errore configurazione AWS: {e}")

flask_singleton = FlaskAppSingleton()
app = flask_singleton.get_app()

cors = CORS(app, supports_credentials=True, origins='*')
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['MONGO_URI'] = os.environ.get("MONGO_URI", "mongodb://mongo:27017/mydb")

mongo_singleton = MongoDBSingleton(app)
db = mongo_singleton.get_db()



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
		jwtToken = generateJwt(data['email'])
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


def protected(f):
	@wraps(f)
	def decorated_function(*args, **kwargs):
		try:
			jwtToken = request.cookies.get('jwtToken')
			payload = verifyJwt(jwtToken)
			if not jwtToken or not payload:
				return redirect("/login"), 302
			g.email = payload['email']
		except Exception as e:
			return redirect("/login"), 302
		return f(*args, **kwargs)
	return decorated_function

# ---------- Protected Routes ----------
@app.route('/dashboard', methods=['POST'])
@protected
def dashboard():
	cursor = db.workflows.find({"email": g.email})
	flows = [
		{
			"id": str(flow["_id"]),
			"name": flow["name"],
			"contents": flow["contents"],
		} for flow in cursor
	]
	return jsonify({"email": g.email, "flows": flows}), 200

@app.route('/logout', methods=['POST'])
@protected
def logout():
	response = make_response()
	response.set_cookie(
		'jwtToken',
		'',
		max_age=0,
		httponly=True,
		secure=False,  # False for localhost, change to True for production in HTTPS #TODO
		samesite='Lax'
	)
	return response, 200

@app.route('/api/new', methods=['POST'])
@protected
def new_workflow():
	clientEmail = g.email
	data = request.get_json()
	name = data.get('name')
	if not name:
		return jsonify({"error": "Workflow name is required"}), 401
	new_id = str(uuid.uuid4())
	try:
		db.workflows.insert_one({
			"_id": new_id,
			"email": clientEmail,
			"name": name,
			"contents": {}
		})
		return jsonify({"id": new_id}), 200
	except Exception as e:
		return jsonify({"error": str(e)}), 401

@app.route('/api/flows/<id>', methods=['POST'])
@protected
def get_workflow(id):
	flow = db.workflows.find_one({"_id": id, "email": g.email})
	if not flow:
		return jsonify({"error": "Workflow not found"}), 401
	return jsonify({
		"id": str(flow["_id"]),
		"name": flow["name"],
		"contents": '{"nodes":[{"data":{"seconds":"3","title":"System - Wait (seconds)"},"id":"node-1","position":{"x":0,"y":0},"type":"systemWaitSeconds","measured":{"width":267,"height":78}},{"data":{"botToken":"7881088601:AAGWV8WQ5_dqYk6vRhpnoHFfDDRJ9A9JagQ","chatId":"-4976500325","message":"AAAAH"},"id":"node-2","position":{"x":365.28229165249184,"y":152.9319670169303},"type":"telegramSendBotMessage","measured":{"width":307,"height":78},"selected":false,"dragging":false},{"data":{"seconds":"5","title":"System - Wait (seconds)"},"id":"node-3","position":{"x":628.2431953008505,"y":-25.305289506398537},"type":"systemWaitSeconds","measured":{"width":267,"height":78},"selected":false,"dragging":false},{"data":{"botToken":"7881088601:AAGWV8WQ5_dqYk6vRhpnoHFfDDRJ9A9JagQ","chatId":"-4976500325","message":"GENERATETHIS"},"id":"node-4","position":{"x":921.7247207675637,"y":133.19699475376487},"type":"telegramSendBotMessage","measured":{"width":307,"height":78},"selected":true,"dragging":false}],"edges":[{"id":"edge-1","source":"node-1","target":"node-2"},{"id":"edge-2","source":"node-2","target":"node-3"},{"id":"edge-3","source":"node-3","target":"node-4"}]}'
	}), 200
	
@app.route('/api/flows/<id>/delete', methods=['DELETE'])
@protected
def delete_workflow(id):
	flow = db.workflows.find_one({"_id": id, "email": g.email})
	if not flow:
		return jsonify({"error": "Workflow not found"}), 401
	try:
		db.workflows.delete_one({"_id": id, "email": g.email})
		return jsonify({"message": "Workflow deleted successfully"}), 200
	except Exception as e:
		return jsonify({"error": str(e)}), 401

 
 
 
 
 
 
 
 
 
 
 
 
	
@app.route('/api/flows/<id>/save', methods=['POST'])
@protected
def save_workflow(id):
	data = request.get_json()
	flow = db.workflows.find_one({"_id": id, "email": g.email})
	if not flow:
		return jsonify({"error": "Workflow not found"}), 404
	try:
		db.workflows.update_one(
			{"_id": id, "email": g.email},
			{"$set": {"contents": data["contents"]}}
		)
		return jsonify({"message": "Workflow saved successfully"}), 200
	except Exception as e:
		print(f"Error saving workflow: {e}")
		return jsonify({"error": str(e)}), 500




#@app.route('/api/flows/<id>/run', methods=['POST'])
#@protected
#def run_workflow(id):
#	flow = db.workflows.find_one({"_id": id, "email": g.email})
#	if not flow:
#		return jsonify({"error": "Workflow not found"}), 404
#	contents = flow.get("contents", {})
#	try:
#		#return runner.run(contents)
#		return jsonify({"message": "Not implemented :)", "contents": contents}), 200
#	except Exception as e:
#		print(f"Error running workflow: {e}")
#		return jsonify({"error": str(e)}), 500
#
#@app.route('/api/prompt', methods=['POST'])
#@protected
#def ai_flow():
#	data = request.get_json()
#	prompt = data.get('prompt', '')
#	if not prompt:
#		return jsonify({"error": "Prompt is required"}), 400
#	try:
#		response = ""
#		#response = process_prompt(prompt) :)))
#		return jsonify(response), 200
#	except Exception as e:
#		print(f"Error processing prompt: {e}")
#		return jsonify({"error": str(e)}), 500
#
#### TODO TODO TODO TODO !! 
## NON TESTATI!
#
#
#@cross_origin
#@app.route('/api/prompt', methods=['POST'])
#def ai_flow():
#  data = request.get_json()
#  prompt = data.get('prompt', '')
#  if not prompt:
#    return jsonify({"error": "Prompt is required"}), 400
#  try:
#    response = process_prompt(prompt)
#    return jsonify(response), 200
#  except Exception as e:
#    print(f"Error processing prompt: {e}")
#    return jsonify({"error": str(e)}), 500


# ---------- RUN ----------
if __name__ == '__main__':
	app.run(debug=True)