const DB_NAME = 'GuitarShellDB';
const STORE_NAME = 'scores';
const LOG_STORE_NAME = 'logs';
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
        db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export const dbService = {
  // ===== 乐谱相关 =====
  async addScore(name, fileBlob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = { name, fileBlob, createdAt: Date.now() };
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllScores() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const scores = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(scores);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteScore(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // ===== 练琴记录相关 =====
  async addLog(logData) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LOG_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LOG_STORE_NAME);
      const record = { ...logData, createdAt: Date.now() };
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllLogs() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LOG_STORE_NAME, 'readonly');
      const store = tx.objectStore(LOG_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const logs = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(logs);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteLog(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LOG_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LOG_STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 🌟 新增：获取某个曲目最近一次的打分记录
  async getLatestLogByName(name) {
    const logs = await this.getAllLogs();
    return logs.find(log => log.name === name) || null;
  }
};
