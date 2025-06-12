import os
from app import create_app

# Set the Flask environment
os.environ['FLASK_ENV'] = 'production'

# Create the Flask application
app = create_app()

if __name__ == "__main__":
    app.run() 