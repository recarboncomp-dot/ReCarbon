/* Auto-generated firebase-service.js — created by CI from secrets */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyARdsqf7gJU7XTe9xdvZYNzbsJKRQ8kJ_I",
    authDomain: "recarbon-a09b7.firebaseapp.com",
    projectId: "recarbon-a09b7",
    storageBucket: "recarbon-a09b7.firebasestorage.app",
    messagingSenderId: "309718424003",
    appId: "1:309718424003:web:6f34142d512e7d35c04576"
  };

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
