/* ============================================
   RECARBON - IndexedDB Database Module
   ============================================ */

const RecarbonDB = (() => {
  const DB_NAME = 'recarbon-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'contact_submissions';
  let db = null;

  const init = () => {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open database'));
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('created_at', 'created_at', { unique: false });
          store.createIndex('email', 'email', { unique: false });
        }
      };
    });
  };

  const addSubmission = async (data) => {
    const database = await init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const submission = {
        ...data,
        created_at: new Date().toISOString()
      };

      const request = store.add(submission);
      request.onerror = () => reject(new Error('Failed to add submission'));
      request.onsuccess = () => resolve(submission);
    });
  };

  const getAllSubmissions = async () => {
    const database = await init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('created_at');
      
      // Get all records ordered by created_at descending
      const request = index.getAll();
      request.onerror = () => reject(new Error('Failed to get submissions'));
      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by created_at descending (newest first)
        resolve(results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      };
    });
  };

  const clearAllSubmissions = async () => {
    const database = await init();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onerror = () => reject(new Error('Failed to clear submissions'));
      request.onsuccess = () => resolve();
    });
  };

  return {
    init,
    addSubmission,
    getAllSubmissions,
    clearAllSubmissions
  };
})();
