import os
import sys

# Add the server directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.app import app

# Set the Flask environment
os.environ['FLASK_ENV'] = 'production'

if __name__ == "__main__":
    app.run() 