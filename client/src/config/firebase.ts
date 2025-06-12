import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBE2E1ecHuqv0V3Xx6GCKbRGCErXEORN94",
  authDomain: "billbuster-695f9.firebaseapp.com",
  projectId: "billbuster-695f9",
  storageBucket: "billbuster-695f9.firebasestorage.app",
  messagingSenderId: "845681470991",
  appId: "1:845681470991:web:b9f584a859138f4a40fd7a",
  measurementId: "G-EETKGC8XWP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

// Function to get FCM token
export const getFCMToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey:
        "BK9iDIHXQQOehMli4Do7rgENBZwUobwzwgEVtLPcMyvyFXba19-Oj6YaS_m0J4PGzkdCy6AKZ-9Dl1_Md7aiEEo",
    });
    if (currentToken) {
      return currentToken;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (err) {
    console.log("An error occurred while retrieving token:", err);
    return null;
  }
};

export default app;
