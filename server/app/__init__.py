from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv
import os
import logging
from logging.handlers import RotatingFileHandler
import json
import base64

# Load environment variables
load_dotenv()

# Create the Flask application instance
app = Flask(__name__)

# Configure CORS for production
if os.getenv('FLASK_ENV') == 'production':
    CORS(app, resources={
        r"/api/*": {
            "origins": [os.getenv('FRONTEND_URL', 'https://billbuster.vercel.app')],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
else:
    CORS(app)

# Configure logging
if not app.debug:
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/billbuster.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Billbuster startup')

# Initialize Firebase Admin
try:
    # Get all required environment variables
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    private_key_id = os.getenv("FIREBASE_PRIVATE_KEY_ID")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    client_id = os.getenv("FIREBASE_CLIENT_ID")
    client_cert_url = os.getenv("FIREBASE_CLIENT_CERT_URL")
    
    # Validate required variables
    if not all([project_id, private_key_id, private_key, client_email, client_id, client_cert_url]):
        missing = [var for var, val in {
            "FIREBASE_PROJECT_ID": project_id,
            "FIREBASE_PRIVATE_KEY_ID": private_key_id,
            "FIREBASE_PRIVATE_KEY": private_key,
            "FIREBASE_CLIENT_EMAIL": client_email,
            "FIREBASE_CLIENT_ID": client_id,
            "FIREBASE_CLIENT_CERT_URL": client_cert_url
        }.items() if not val]
        app.logger.error(f"Missing required environment variables: {', '.join(missing)}")
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    # Clean up the private key
    private_key = private_key.replace('\\n', '\n')
    private_key = private_key.strip('"\'')
    
    # Ensure proper PEM format
    if not private_key.startswith('-----BEGIN PRIVATE KEY-----'):
        private_key = '-----BEGIN PRIVATE KEY-----\n' + private_key
    if not private_key.endswith('-----END PRIVATE KEY-----'):
        private_key = private_key + '\n-----END PRIVATE KEY-----'
    
    # Create the credentials dictionary
    cred_dict = {
        "type": "service_account",
        "project_id": project_id,
        "private_key_id": private_key_id,
        "private_key": private_key,
        "client_email": client_email,
        "client_id": client_id,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": client_cert_url
    }
    
    # Log non-sensitive information
    app.logger.info("Initializing Firebase with project ID: %s", project_id)
    app.logger.info("Client email: %s", client_email)
    
    # Initialize Firebase
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
    app.logger.info("Firebase initialized successfully")
except Exception as e:
    app.logger.error("Failed to initialize Firebase: %s", str(e))
    app.logger.error("Exception type: %s", type(e).__name__)
    app.logger.error("Exception args: %s", e.args)
    raise

# Import routes after app is created
from . import routes

# Register blueprints
app.register_blueprint(routes.main)

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Expose the app instance
app.app = app 