const DB_NAME = 'GuitarShellDB';
const STORE_NAME = 'scores';
const LOG_STORE_NAME = 'logs';
const DB_VERSION = 3; // 🌟 版本号升级到 3

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
  async addScore(name, fileBlob, extraData = {}) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // 🌟 预留字段：tags, lastReadPage, lastReadScrollY, fileHash
      const record = { 
        name, 
        fileBlob, 
        createdAt: Date.now(),
        tags: extraData.tags || [],
        lastReadPage: extraData.lastReadPage || 0,
        lastReadScrollY: extraData.lastReadScrollY || 0,
        fileHash: extraData.fileHash || ''
      };
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

  // ===== 练琴记录相关 =====
  async addLog(logData) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(LOG_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LOG_STORE_NAME);
      // 🌟 预留字段：scoreId (关联曲目)
      const record = { 
        ...logData, 
        createdAt: Date.now(),
        scoreId: logData.scoreId || ''
      };
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

  async getLatestLogByName(name) {
    const logs = await this.getAllLogs();
    return logs.find(log => log.name === name) || null;
  },

  // ===== 全局数据管理 (备份/恢复用) =====
  async clearAllData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, LOG_STORE_NAME], 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.objectStore(LOG_STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async bulkImport(scores, logs) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, LOG_STORE_NAME], 'readwrite');
      const scoreStore = tx.objectStore(STORE_NAME);
      const logStore = tx.objectStore(LOG_STORE_NAME);

      // 剔除 id 让系统重新分配，防止冲突
      scores.forEach(item => {
        delete item.id; 
        scoreStore.add(item);
      });
      logs.forEach(item => {
        delete item.id;
        logStore.add(item);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};