import { dbService } from '../services/db.js';

const logCSS = `
  :host { display: flex; flex-direction: column; height: 100%; width: 100%; background: #0e1014; color: #fff; overflow: hidden; font-family: -apple-system, sans-serif; }
  .stats-bar { display: flex; justify-content: space-around; padding: 20px; background: #191e27; border-bottom: 1px solid #2a3140; }
  .stat-item { text-align: center; }
  .stat-val { font-size: 24px; font-weight: bold; color: #38bdf8; margin-bottom: 4px; }
  .stat-label { font-size: 12px; color: #8a93a6; }
  .form-box { padding: 16px; background: #151a22; border-bottom: 1px solid #2a3140; display: flex; flex-direction: column; gap: 10px; }
  .input-row { display: flex; gap: 8px; }
  .inp { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 8px; border: 1px solid #2a3444; background: #1b222d; color: #fff; font-size: 14px; outline: none; transition: 0.2s; }
  .inp:focus { border-color: #38bdf8; }
  .btn-submit { width: 100%; padding: 12px; background: #38bdf8; color: #000; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: 0.2s; }
  .log-list { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .log-card { background: #1b2230; border: 1px solid #2a3140; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
  .log-info { flex: 1; min-width: 0; }
  .log-title { font-size: 15px; font-weight: bold; color: #e2e9f5; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .log-detail { font-size: 12px; color: #8a93a6; display: flex; gap: 12px; }
  .log-detail span { color: #7fd4ff; font-weight: bold; }
  .btn-del { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer; margin-left: 12px; }
  .empty-tip { text-align: center; color: #6a7890; font-size: 14px; margin-top: 40px; }
  .toast { position: absolute; left: 50%; bottom: 30px; transform: translate(-50%, 10px); background: rgba(56, 189, 248, 0.9); color: #000; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; opacity: 0; pointer-events: none; transition: 0.3s; z-index: 100; }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }
`;

const logHTML = `
  <div class="stats-bar">
    <div class="stat-item"><div class="stat-val" id="statCount">0</div><div class="stat-label">累计打卡</div></div>
    <div class="stat-item"><div class="stat-val" id="statTime">0</div><div class="stat-label">累计分钟</div></div>
  </div>
  <div class="form-box">
    <div class="input-row"><input type="text" id="inpName" class="inp" placeholder="练习曲目 / 内容" maxlength="30"></div>
    <div class="input-row">
      <input type="number" id="inpTime" class="inp" placeholder="练习时长 (分钟)" min="1">
      <input type="number" id="inpBpm" class="inp" placeholder="最高 BPM (选填)" min="30" max="250">
    </div>
    <button class="btn-submit" id="btnSubmit">✓ 记录本次练习</button>
  </div>
  <div class="log-list" id="logList"><div class="empty-tip">还没有打卡记录，开始你的第一次练习吧！</div></div>
  <div class="toast" id="toast"></div>
`;

class GuitarPracticeLog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.toastTimer = null;
    // 🌟 定义好刷新函数，方便后面监听
    this.handleLogUpdate = () => {
      if (this.loadLogs) this.loadLogs();
    };
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${logCSS}</style>${logHTML}`;
    this.initLogic();
    
    // 🌟 核心：监听来自其他组件（如看谱器）的更新广播
    window.addEventListener('log-updated', this.handleLogUpdate);
  }

  disconnectedCallback() {
    // 🌟 组件卸载时，移除监听，防止内存泄漏
    window.removeEventListener('log-updated', this.handleLogUpdate);
  }

  initLogic() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    const inpName = $('inpName'), inpTime = $('inpTime'), inpBpm = $('inpBpm');
    const btnSubmit = $('btnSubmit'), logList = $('logList');
    const statCount = $('statCount'), statTime = $('statTime'), toastEl = $('toast');

    const showToast = (msg) => {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
    };

    // 将 loadLogs 挂载到 this 上，方便外部广播触发
    this.loadLogs = async () => {
      const logs = await dbService.getAllLogs();
      logList.innerHTML = '';
      let totalTime = 0;
      statCount.textContent = logs.length;
      if (logs.length === 0) {
        logList.innerHTML = `<div class="empty-tip">还没有打卡记录，开始你的第一次练习吧！</div>`;
        statTime.textContent = '0';
        return;
      }
      logs.forEach(log => {
        totalTime += parseInt(log.minutes, 10) || 0;
        const card = document.createElement('div');
        card.className = 'log-card';
        const d = new Date(log.createdAt);
        const timeStr = `${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        card.innerHTML = `
          <div class="log-info">
            <div class="log-title">${log.name}</div>
            <div class="log-detail"><span>⏱ ${log.minutes} 分钟</span>${log.bpm ? `<span>🚀 ${log.bpm} BPM</span>` : ''}<span style="color:#5d6678">${timeStr}</span></div>
          </div>
          <button class="btn-del" data-id="${log.id}">删除</button>
        `;
        card.querySelector('.btn-del').onclick = async (e) => {
          e.stopPropagation();
          if(confirm('确定删除这条记录吗？')) { await dbService.deleteLog(log.id); this.loadLogs(); }
        };
        logList.appendChild(card);
      });
      statTime.textContent = totalTime;
    };

    btnSubmit.onclick = async () => {
      const name = inpName.value.trim(), minutes = inpTime.value.trim(), bpm = inpBpm.value.trim();
      if (!name) return showToast('请输入练习内容');
      if (!minutes || isNaN(minutes) || minutes <= 0) return showToast('请输入正确的练习时长');
      
      await dbService.addLog({ name, minutes: parseInt(minutes, 10), bpm: bpm ? parseInt(bpm, 10) : null });
      
      showToast('打卡成功！');
      inpName.value = ''; inpTime.value = ''; inpBpm.value = '';
      
      this.loadLogs();
      // 这里也广播一下，万一未来其他页面需要知道数据变了呢
      window.dispatchEvent(new CustomEvent('log-updated'));
    };
    
    this.loadLogs();
  }
}
customElements.define('guitar-practice-log', GuitarPracticeLog);
