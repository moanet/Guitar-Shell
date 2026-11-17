// ==========================================
// js/services/webdav.js
// 作用：封装 WebDAV 协议，实现与坚果云的数据收发
// ==========================================

const DAV_BASE_URL = 'guitar-webdav-proxy.cuimao513.workers.dev/dav/';

export const webdavService = {
  // 生成请求头（包含坚果云要求的 Basic Auth）
  getHeaders(username, password) {
    // 将 邮箱:密码 转换成 Base64 编码
    const authStr = btoa(`${username}:${password}`);
    return {
      'Authorization': `Basic ${authStr}`
    };
  },

  // 上传文件（备份数据）
  async upload(username, password, remotePath, dataStr) {
    const headers = this.getHeaders(username, password);
    // 坚果云的路径需要 encodeURI 处理
    const url = DAV_BASE_URL + encodeURI(remotePath); 

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
    const url = DAV_BASE_URL + encodeURI(remotePath);

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