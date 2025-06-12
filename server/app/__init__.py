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
    # Get the private key and ensure it's properly formatted
    private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
    app.logger.info("Private key length: %d", len(private_key) if private_key else 0)
    
    if not private_key:
        raise ValueError("FIREBASE_PRIVATE_KEY environment variable is not set")
    
    # Clean up the private key
    private_key = private_key.replace('\\n', '\n')
    private_key = private_key.strip('"\'')
    
    # If the key is base64 encoded, decode it
    try:
        if not private_key.startswith('-----BEGIN PRIVATE KEY-----'):
            # Try to decode base64
            decoded_key = base64.b64decode(private_key).decode('utf-8')
            if decoded_key.startswith('-----BEGIN PRIVATE KEY-----'):
                private_key = decoded_key
    except Exception as e:
        app.logger.warning("Failed to decode base64 private key: %s", str(e))
    
    # Ensure proper PEM format
    if not private_key.startswith('-----BEGIN PRIVATE KEY-----'):
        private_key = '-----BEGIN PRIVATE KEY-----\n' + private_key
    if not private_key.endswith('-----END PRIVATE KEY-----'):
        private_key = private_key + '\n-----END PRIVATE KEY-----'
    
    # Ensure proper line breaks
    private_key = private_key.replace('\n', '\\n')
    private_key = private_key.replace('\\n', '\n')
    
    # Log the first few characters of the key (for debugging)
    app.logger.info("Private key starts with: %s", private_key[:50])
    app.logger.info("Private key ends with: %s", private_key[-50:])
    
    # Create the credentials dictionary
    cred_dict = {
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": private_key,
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
    }
    
    # Log the credentials (excluding sensitive data)
    app.logger.info("Initializing Firebase with project ID: %s", cred_dict['project_id'])
    app.logger.info("Client email: %s", cred_dict['client_email'])
    
    # Initialize Firebase
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
    app.logger.info("Firebase initialized successfully")
except Exception as e:
    app.logger.error("Failed to initialize Firebase: %s", str(e))
    app.logger.error("Exception type: %s", type(e).__name__)
    app.logger.error("Exception args: %s", e.args)
    raise

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error('Server Error: %s', error)
    return jsonify({'error': 'Internal server error'}), 500

# Register blueprints
from .routes import main
app.register_blueprint(main)

# Expose the app instance
app.app = app 