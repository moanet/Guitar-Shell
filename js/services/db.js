// ==========================================
// js/services/db.js
// 作用：帮你把乐谱文件永久保存在浏览器（手机）里，刷新也不会丢
// ==========================================
const DB_NAME = 'GuitarShellDB';
const STORE_NAME = 'scores';
const DB_VERSION = 1;

// 打开数据库
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 创建仓库，主键是 id，自动生成
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export const dbService = {
  // 添加一本谱子
  async addScore(name, fileBlob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = { name, fileBlob, createdAt: Date.now() };
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result); // 返回新生成的 id
      request.onerror = () => reject(request.error);
    });
  },

  // 获取所有谱子
  async getAllScores() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        // 按创建时间倒序排列
        const scores = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(scores);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // 删除一本谱子
  async deleteScore(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
