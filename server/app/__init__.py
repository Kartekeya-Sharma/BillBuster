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
    # Get the service account JSON from environment variable
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT", "")
    app.logger.info("Service account JSON length: %d", len(service_account_json) if service_account_json else 0)
    
    if not service_account_json:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT environment variable is not set")
    
    # Parse the JSON
    try:
        service_account_info = json.loads(service_account_json)
        app.logger.info("Successfully parsed service account JSON")
    except json.JSONDecodeError as e:
        app.logger.error("Failed to parse service account JSON: %s", str(e))
        raise ValueError("Invalid service account JSON format")
    
    # Log non-sensitive information
    app.logger.info("Initializing Firebase with project ID: %s", service_account_info.get('project_id'))
    app.logger.info("Client email: %s", service_account_info.get('client_email'))
    
    # Initialize Firebase
    cred = credentials.Certificate(service_account_info)
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