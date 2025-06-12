import os
from app import app

# Set the Flask environment
os.environ['FLASK_ENV'] = 'production'

if __name__ == "__main__":
    app.run() 