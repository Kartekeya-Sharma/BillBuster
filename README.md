# BillBuster

A modern expense tracking and bill splitting application built with React, TypeScript, and Flask.

## Features

- 📱 User Authentication with Firebase
- 📷 Bill Scanning and OCR
- 💰 Expense Tracking and Splitting
- 👥 Group Management
- 🔔 In-app Notifications
- 📊 Balance Tracking
- 📱 Responsive Design

## Tech Stack

### Frontend

- React with TypeScript
- Tailwind CSS for styling
- Firebase Authentication
- Firebase Cloud Messaging for notifications
- Framer Motion for animations

### Backend

- Flask (Python)
- Firebase Admin SDK
- Gunicorn for production

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Firebase account
- Git

## Setup Instructions

### Frontend Setup

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the client directory:

   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the server directory with your Firebase credentials:

   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   ```

5. Start the Flask server:
   ```bash
   python run.py
   ```

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Create a Firestore Database
4. Set up Firebase Cloud Messaging
5. Add your web app to the Firebase project
6. Download the Firebase configuration

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables
4. Deploy

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
