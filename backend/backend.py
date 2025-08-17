import uuid
from flask import json, make_response, redirect, request, jsonify, g
from flask_cors import CORS, cross_origin
import boto3
from flaskAppSingleton import FlaskAppSingleton
from db.mongodbSingleton import MongoDBSingleton
from utils.jwtUtils import generateJwt, verifyJwt
from dotenv import load_dotenv
import os
from functools import wraps
from llm.llmSanitizer import process_prompt
# import jwt
# import datetime
# import hmac
# import hashlib
# import base64


# ---------- AWS, Cognito, Flask, DB setup ----------
load_dotenv()
AWS_REGION = "eu-west-1"
COGNITO_APP_CLIENT_ID = os.environ.get("COGNITO_APP_CLIENT_ID")
try:
    client = boto3.client(
        "cognito-idp",
        region_name=AWS_REGION,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )
except Exception as e:
    print(f"Errore configurazione AWS: {e}")

flask_singleton = FlaskAppSingleton()
app = flask_singleton.get_app()

cors = CORS(app, supports_credentials=True, origins="*")
app.config["CORS_HEADERS"] = "Content-Type"
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://mongo:27017/mydb")

mongo_singleton = MongoDBSingleton(app)
db = mongo_singleton.get_db()


# ---------- Auth Routes ----------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    try:
        res = client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": data["email"],
                "PASSWORD": data["password"],
            },
            ClientId=COGNITO_APP_CLIENT_ID,
        )
        jwtToken = generateJwt(data["email"])
        response = make_response()
        response.set_cookie(
            "jwtToken",
            jwtToken,
            max_age=24 * 60 * 60,
            httponly=True,
            secure=False,  # False for localhost, change to True for production in HTTPS #TODO
            samesite="Lax",
        )
        return response, 200
    except client.exceptions.NotAuthorizedException:
        return jsonify({"error": "Invalid email or password"}), 401
    except client.exceptions.UserNotConfirmedException:
        return jsonify({"error": "User account not confirmed"}), 401
    except client.exceptions.UserNotFoundException:
        return jsonify({"error": "User not found"}), 401
    except client.exceptions.TooManyRequestsException:
        return jsonify(
            {"error": "Too many login attempts. Please try again later"}
        ), 429
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    try:
        client.sign_up(
            ClientId=COGNITO_APP_CLIENT_ID,
            Username=data["email"],
            Password=data["password"],
            UserAttributes=[{"Name": "email", "Value": data["email"]}],
        )
        return jsonify({"message": "User registered. Please confirm email."}), 200
    except client.exceptions.LimitExceededException:
        return jsonify({"error": "Email quota limit exceeded"}), 500
    except client.exceptions.UsernameExistsException:
        return jsonify({"error": "User already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/confirm", methods=["POST"])
def confirm():
    data = request.get_json()
    try:
        client.confirm_sign_up(
            ClientId=COGNITO_APP_CLIENT_ID,
            Username=data["email"],
            ConfirmationCode=data["otp"],
        )
        return jsonify({"message": "User confirmed successfully."}), 200
    except client.exceptions.UserNotFoundException:
        return jsonify({"error": "User not found"}), 404
    except client.exceptions.CodeMismatchException:
        return jsonify({"error": "Code not valid"}), 404
    except client.exceptions.ExpiredCodeException:
        return jsonify({"error": "Code Expired"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def protected(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            jwtToken = request.cookies.get("jwtToken")
            payload = verifyJwt(jwtToken)
            if not jwtToken or not payload:
                return redirect("/login"), 302
            g.email = payload["email"]
        except Exception as e:
            return redirect("/login"), 302
        return f(*args, **kwargs)

    return decorated_function


# ---------- Protected Routes ----------
@app.route("/dashboard", methods=["POST"])
@protected
def dashboard():
    cursor = db.workflows.find({"email": g.email})
    flows = [
        {
            "id": str(flow["_id"]),
            "name": flow["name"],
            "contents": flow["contents"],
        }
        for flow in cursor
    ]
    return jsonify({"email": g.email, "flows": flows}), 200


@app.route("/logout", methods=["POST"])
@protected
def logout():
    response = make_response()
    response.set_cookie(
        "jwtToken",
        "",
        max_age=0,
        httponly=True,
        secure=False,  # False for localhost, change to True for production in HTTPS #TODO
        samesite="Lax",
    )
    return response, 200


@app.route("/api/new", methods=["POST"])
@protected
def new_workflow():
    clientEmail = g.email
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"error": "Workflow name is required"}), 400
    new_id = str(uuid.uuid4())
    try:
        db.workflows.insert_one(
            {"_id": new_id, "email": clientEmail, "name": name, "contents": {}}
        )
        return jsonify({"id": new_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/flows/<id>", methods=["POST"])
@protected
def get_workflow(id):
    flow = db.workflows.find_one({"_id": id, "email": g.email})
    if not flow:
        return jsonify({"error": "Workflow not found"}), 404
    return jsonify(
        {
            "id": str(flow["_id"]),
            "name": flow["name"],
            "contents": flow["contents"],
        }
    ), 200


@app.route("/api/flows/<id>/delete", methods=["DELETE"])
@protected
def delete_workflow(id):
    flow = db.workflows.find_one({"_id": id, "email": g.email})
    if not flow:
        return jsonify({"error": "Workflow not found"}), 404
    try:
        db.workflows.delete_one({"_id": id, "email": g.email})
        return jsonify({"message": "Workflow deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/flows/<id>/save", methods=["POST"])
@protected
def save_workflow(id):
    data = request.get_json()
    print(f"Saving workflow {id} with data: {data}")
    flow = db.workflows.find_one({"_id": id, "email": g.email})
    if not flow:
        return jsonify({"error": "Workflow not found"}), 404
    try:
        db.workflows.update_one(
            {"_id": id, "email": g.email},
            {"$set": {"contents": data["contents"], "name": data["name"]}},
        )
        return jsonify({"message": "Workflow saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/flows/<id>/run", methods=["POST"])
@protected
def run_workflow(id):
    flow = db.workflows.find_one({"_id": id, "email": g.email})
    if not flow:
        return jsonify({"error": "Workflow not found"}), 404
    contents = flow.get("contents", {})
    try:
        # return runner.run(contents)
        return jsonify({"message": "Not implemented :)", "contents": contents}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/prompt", methods=["POST"])
@protected
def ai_workflow():
    data = request.get_json()
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
    try:
        response = process_prompt(prompt)
        return jsonify(response), 200
    except Exception as e:
        print(f"Error processing prompt: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- RUN ----------
if __name__ == "__main__":
    app.run(debug=True)
