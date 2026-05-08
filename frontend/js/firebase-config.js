// Firebase config template
// Replace the placeholder values below with your Firebase project's config
// You can find these in the Firebase Console -> Project settings -> SDK setup and configuration
// Important: do NOT commit real keys to public repositories. Add this file to .gitignore if needed.

(function () {
  // Example/template — REPLACE with real values from your Firebase project
  window.__FIREBASE_CONFIG__ = {
    apiKey: "AIzaSyARdsqf7gJU7XTe9xdvZYNzbsJKRQ8kJ_I",
    authDomain: "recarbon-a09b7.firebaseapp.com",
    projectId: "recarbon-a09b7",
    storageBucket: "recarbon-a09b7.firebasestorage.app",
    messagingSenderId: "309718424003",
    appId: "1:309718424003:web:6f34142d512e7d35c04576"
  };

  // Quick sanity log to help debugging when loading the page
  if (window.__FIREBASE_CONFIG__ && window.__FIREBASE_CONFIG__.apiKey && window.__FIREBASE_CONFIG__.apiKey !== 'YOUR_API_KEY') {
    console.info('Firebase config provided via frontend/js/firebase-config.js');
  } else {
    console.warn('Firebase config file loaded but contains placeholder values. Replace with your project config.');
  }
})();
