// ==========================================
// js/services/vault.js
// 作用：在本机加密保存敏感串（目前只有坚果云应用密码）
//
// 方案：AES-GCM 256 加密，密钥以「不可导出」的 CryptoKey 形式存进独立 IndexedDB。
//   - 明文不落 localStorage、不落日志、不进备份文件；
//   - 密钥 extractable=false，页面脚本无法把它导出成字节，只能拿来做加解密；
//   - 独立库 GuitarShellVault，不掺进主库 GuitarShellDB，避免影响乐谱数据。
//
// 边界（别夸大）：这不是「防本机攻击者」。同源脚本（比如被注入的第三方代码）
// 仍可调用 decrypt 拿到明文；真正的防线是设备锁 + 只装可信扩展 + 以后补 CSP。
// 它挡的是：随手翻 localStorage、复制浏览器数据、把备份文件发给别人。
// ==========================================

const DB_NAME = 'GuitarShellVault';
const STORE = 'secrets';
const DB_VERSION = 1;

function openVault() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'name' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const subtle = () => (globalThis.crypto && globalThis.crypto.subtle) || null;

export const vaultService = {
  // 需要 HTTPS 或 localhost 才有 crypto.subtle；局域网 http 页拿不到
  isSupported() {
    try {
      return typeof indexedDB !== 'undefined' && !!subtle();
    } catch (err) {
      return false;
    }
  },

  async save(name, plain) {
    if (!name || typeof plain !== 'string' || !plain) return false;
    const cryptoApi = subtle();
    if (!cryptoApi) throw new Error('当前环境不支持加密保存（请用 HTTPS 或 localhost 打开）');

    const key = await cryptoApi.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await cryptoApi.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));

    const db = await openVault();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      // structured clone 支持 CryptoKey，不可导出的密钥也能被存回来继续用
      store.put({ name, key, iv, data, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async load(name) {
    const cryptoApi = subtle();
    if (!cryptoApi || !name) return '';
    let record = null;
    try {
      const db = await openVault();
      record = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).get(name);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[vault] 读取失败:', err.message);
      return '';
    }

    if (!record || !record.key || !record.data) return '';
    try {
      const plain = await cryptoApi.decrypt({ name: 'AES-GCM', iv: record.iv }, record.key, record.data);
      return new TextDecoder().decode(plain);
    } catch (err) {
      // 密钥与密文不匹配（比如库被清过一半），当成没保存
      console.warn('[vault] 解密失败，已忽略:', err.message);
      return '';
    }
  },

  async clear(name) {
    if (!name) return false;
    try {
      const db = await openVault();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(name);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[vault] 清除失败:', err.message);
      return false;
    }
  }
};
