// ==========================================
// js/services/webdav.js
// 作用：封装 WebDAV 协议，实现与坚果云的数据收发
// ==========================================
const DAV_BASE_URL = 'https://webdav.taoproxy.dpdns.org/v2/dav/';

/**
 * 分段编码WebDAV路径，处理中文、空格等特殊文件名
 * @param {string} remotePath 例如 "GuitarShell/backup.json"
 * @returns {string}
 */
function encodeWebdavPath(remotePath) {
  return remotePath.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

export const webdavService = {
  // 生成请求头（包含坚果云要求的 Basic Auth）
  getHeaders(username, password) {
    const authStr = btoa(`${username}:${password}`);
    return {
      'Authorization': `Basic ${authStr}`
    };
  },

  // 上传文件（备份数据）
  async upload(username, password, remotePath, dataStr) {
    const headers = this.getHeaders(username, password);
    // ✔ 分段编码路径，不会破坏斜杠
    const url = DAV_BASE_URL + encodeWebdavPath(remotePath);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: dataStr
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('账号或应用密码错误');
      throw new Error(`上传失败: HTTP ${response.status}`);
    }
    return true;
  },

  // 下载文件（获取备份数据）
  async download(username, password, remotePath) {
    const headers = this.getHeaders(username, password);
    const url = DAV_BASE_URL + encodeWebdavPath(remotePath);

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('云端没有找到备份文件');
      if (response.status === 401) throw new Error('账号或应用密码错误');
      throw new Error(`下载失败: HTTP ${response.status}`);
    }
    return await response.text();
  }
};
