importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBE2E1ecHuqv0V3Xx6GCKbRGCErXEORN94",
  authDomain: "billbuster-695f9.firebaseapp.com",
  projectId: "billbuster-695f9",
  storageBucket: "billbuster-695f9.firebasestorage.app",
  messagingSenderId: "845681470991",
  appId: "1:845681470991:web:b9f584a859138f4a40fd7a",
  measurementId: "G-EETKGC8XWP",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
