/*
  Firebase Service Wrapper (compat)
  - Replace the `firebaseConfig` object with your project's values from the Firebase console.
  - This file uses the compat SDK loaded via CDN in the HTML files.
*/
(function () {
  // firebaseConfig may be injected during CI/deploy as a generated file
  // or provided at runtime via `window.__FIREBASE_CONFIG__`.
  const defaultConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  const firebaseConfig = (window && window.__FIREBASE_CONFIG__) ? window.__FIREBASE_CONFIG__ : defaultConfig;

  let _initialized = false;
  let _db = null;

  function init() {
    try {
      if (_initialized) return;
      if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded.');
        return;
      }

      firebase.initializeApp(firebaseConfig);
      _db = firebase.firestore();
      _initialized = true;
      console.info('Firebase initialized');
    } catch (err) {
      console.warn('Firebase init error', err);
    }
  }

  async function saveSubmission(data) {
    init();
    if (!_db) throw new Error('Firestore not initialized');

    const payload = {
      ...data,
      created_at: new Date().toISOString()
    };

    const ref = await _db.collection('contact_submissions').add(payload);
    return { id: ref.id, ...payload };
  }

  async function fetchSubmissions() {
    init();
    if (!_db) throw new Error('Firestore not initialized');

    const snap = await _db.collection('contact_submissions').orderBy('created_at', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  window.FirebaseService = {
    init,
    saveSubmission,
    fetchSubmissions
  };
})();
