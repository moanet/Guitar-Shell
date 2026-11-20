import { dbService } from '../services/db.js';

// 练习内容名称可能来自备份恢复（他人数据），进 innerHTML 前必须转义
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const logCSS = `
  button, label, input, select { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
  :host { display: flex; flex-direction: column; height: 100%; width: 100%; background: #121110; color: #eae3d9; overflow: hidden; font-family: -apple-system, sans-serif; }
  .stats-line { display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px; margin: 10px 4px 0; padding: 10px 4px 2px; border-top: 1px solid #2c2622; color: #8a8075; font-size: 12px; }
  .stats-line .stat-val { font-size: 13px; font-weight: 700; color: #d99e6a; }
  .stats-line .stats-sep { color: #5c5349; margin: 0 3px; }
  .form-box { padding: 14px 16px 16px; background: #181512; border-bottom: 1px solid #2c2622; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
  .form-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .form-title { font-size: 13px; font-weight: 700; color: #f3e8d6; letter-spacing: .3px; }
  .form-hint { font-size: 11px; color: #8a8075; }
  .input-row { display: flex; gap: 8px; }
  .inp { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 10px; border: 1px solid #3a2f26; background: #241f1b; color: #eae3d9; font-size: 14px; outline: none; transition: 0.2s; }
  .inp:focus { border-color: #b87b4c; box-shadow: 0 0 0 2px rgba(184,123,76,.12); }
  .btn-submit { width: 100%; padding: 12px; background: linear-gradient(180deg, #d99e6a, #b87b4c); color: #1e1b18; border: 1px solid rgba(243,232,214,.10); border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 6px 16px rgba(184,123,76,.18); }
  .list-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 18px 0; font-size: 13px; font-weight: 700; color: #eae3d9; flex-shrink: 0; }
  .list-count { font-size: 11px; font-weight: 400; color: #8a8075; }
  .log-list { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 16px 16px; display: flex; flex-direction: column; gap: 10px; }
  .log-card { background: #241f1b; border: 1px solid #2c2622; border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
  .log-info { flex: 1; min-width: 0; }
  .log-title { font-size: 15px; font-weight: bold; color: #f3e8d6; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .log-detail { font-size: 12px; color: #8a8075; display: flex; gap: 12px; }
  .log-detail span { color: #d99e6a; font-weight: bold; }
  .btn-del { background: rgba(181, 74, 66, 0.12); color: #b54a42; border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer; margin-left: 12px; }
  .empty-tip { text-align: center; color: #8a8075; font-size: 14px; margin-top: 28px; }
  .toast { position: absolute; left: 50%; bottom: 30px; transform: translate(-50%, 10px); background: rgba(217, 158, 106, 0.92); color: #1e1b18; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; opacity: 0; pointer-events: none; transition: 0.3s; z-index: 100; }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }
  .trend-box { background: #171411; border-bottom: 1px solid #2c2622; flex-shrink: 0; }
  .trend-toggle-row { width: 100%; border: none; background: transparent; display: flex; align-items: center; gap: 9px; padding: 11px 16px; cursor: pointer; color: #eae3d9; font-family: inherit; text-align: left; }
  .trend-toggle-row:hover { background: rgba(184,123,76,.06); }
  .trend-title { font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .trend-peek { flex: 1; min-width: 0; font-size: 12px; font-weight: 400; color: #8a8075; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .trend-chevron { font-size: 14px; color: #8a8075; flex-shrink: 0; }
  .trend-box:not(.collapsed) .trend-peek { display: none; }
  .seg { display: flex; background: #241f1b; border: 1px solid #2c2622; border-radius: 10px; padding: 2px; }
  .seg-btn { border: none; background: transparent; color: #8a8075; font-size: 12px; padding: 4px 10px; border-radius: 7px; cursor: pointer; }
  .seg-btn.active { background: #b87b4c; color: #1e1b18; font-weight: bold; }
  .trend-body { max-height: 56vh; overflow-y: auto; padding: 0 12px 12px; }
  .trend-box.collapsed .trend-body { display: none; }
  .trend-controls { display: flex; justify-content: flex-end; padding: 0 4px 8px; }
  .trend-sub { font-size: 12px; color: #8a8075; padding: 0 4px 6px; }
  .chart-wrap svg { display: block; width: 100%; height: auto; }
  .top-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
  .top-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .top-name { width: 96px; color: #eae3d9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
  .top-track { flex: 1; height: 6px; background: #2c2622; border-radius: 3px; overflow: hidden; }
  .top-fill { height: 100%; background: linear-gradient(90deg, #6a4b32, #d99e6a); border-radius: 3px; }
  .top-min { width: 52px; text-align: right; color: #d99e6a; font-weight: bold; flex-shrink: 0; }
`;

const logHTML = `
  <div class="form-box">
    <div class="form-head">
      <span class="form-title">记录本次练习</span>
      <span class="form-hint">填写后点保存</span>
    </div>
    <div class="input-row"><input type="text" id="inpName" class="inp" placeholder="练习曲目 / 内容" maxlength="30"></div>
    <div class="input-row">
      <input type="number" id="inpTime" class="inp" placeholder="练习时长 (分钟)" min="1">
      <input type="number" id="inpBpm" class="inp" placeholder="最高 BPM (选填)" min="30" max="250">
    </div>
    <button class="btn-submit" id="btnSubmit">✓ 保存本次练习</button>
  </div>
  <div class="trend-box collapsed" id="trendBox">
    <button class="trend-toggle-row" id="trendToggle" type="button" aria-expanded="false">
      <span class="trend-title">📊 练习趋势</span>
      <span class="trend-peek" id="trendPeek">近 7 天 · 0 分钟</span>
      <span class="trend-chevron" id="trendChevron">▸</span>
    </button>
    <div class="trend-body">
      <div class="trend-controls">
        <div class="seg" id="segBtns">
          <button class="seg-btn active" data-range="week">近 7 天</button>
          <button class="seg-btn" data-range="month">近 12 月</button>
        </div>
      </div>
      <div class="trend-sub" id="trendSummary"></div>
      <div class="chart-wrap" id="chartWrap"></div>
      <div class="top-list" id="topList"></div>
      <div class="stats-line">
        <span>累计打卡</span><span class="stat-val" id="statCount">0</span><span>次</span>
        <span class="stats-sep">·</span>
        <span>累计</span><span class="stat-val" id="statTime">0</span><span>分钟</span>
      </div>
    </div>
  </div>
  <div class="list-head"><span>练习记录列表</span><span class="list-count" id="listCount">0 条</span></div>
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
    const listCount = $('listCount'), trendPeek = $('trendPeek');
    const chartWrap = $('chartWrap'), topList = $('topList'), trendSummary = $('trendSummary');
    const segBtns = $('segBtns'), trendBox = $('trendBox'), trendToggle = $('trendToggle'), trendChevron = $('trendChevron');

    // ==================== 练习趋势（手写 SVG，不引库） ====================
    const DAY = 86400000;
    const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const sumMinutes = (logs) => logs.reduce((acc, l) => acc + (parseInt(l.minutes, 10) || 0), 0);

    const svgBars = (items) => {
      const W = 300, TOP = 16, BASE = 104, H = 128;
      const slot = W / items.length;
      const maxVal = Math.max(1, ...items.map(i => i.value));
      const showValue = items.length <= 7;
      let body = '';
      items.forEach((it, i) => {
        const bw = Math.max(6, Math.min(slot * 0.62, 24));
        const x = i * slot + (slot - bw) / 2;
        const h = (it.value / maxVal) * (BASE - TOP);
        const color = it.current ? '#f3e8d6' : '#b87b4c';
        body += `<g><title>${it.full}：${it.value} 分钟</title>`
             + `<rect x="${x.toFixed(1)}" y="${(BASE - Math.max(h, 2)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}" rx="3" fill="${color}"/></g>`;
        if (showValue && it.value > 0) {
          body += `<text x="${(x + bw / 2).toFixed(1)}" y="${(BASE - h - 3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#8a8075">${it.value}</text>`;
        }
        body += `<text x="${(i * slot + slot / 2).toFixed(1)}" y="120" text-anchor="middle" font-size="${showValue ? 9 : 8}" fill="#8a8075">${it.label}</text>`;
      });
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="练习时长柱状图">${body}</svg>`;
    };

    this.rangeMode = localStorage.getItem('gs_trend_range') === 'month' ? 'month' : 'week';
    const setTrendOpen = (open) => {
      trendBox.classList.toggle('collapsed', !open);
      trendToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      trendChevron.textContent = open ? '▾' : '▸';
    };
    // 默认收起：先看记录，需要看曲线时再展开
    setTrendOpen(false);

    segBtns.querySelectorAll('.seg-btn').forEach(btn => {
      btn.onclick = () => {
        this.rangeMode = btn.dataset.range;
        localStorage.setItem('gs_trend_range', this.rangeMode);
        if (this.currentLogs) this.renderTrend(this.currentLogs);
      };
    });
    trendToggle.onclick = () => setTrendOpen(trendBox.classList.contains('collapsed'));

    this.renderTrend = (logs) => {
      segBtns.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.range === this.rangeMode));
      const items = [];

      if (this.rangeMode === 'week') {
        const today0 = startOfDay(Date.now());
        for (let i = 6; i >= 0; i--) {
          const s = today0 - i * DAY;
          const d = new Date(s);
          const value = sumMinutes(logs.filter(l => l.createdAt >= s && l.createdAt < s + DAY));
          items.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, full: `${d.getMonth() + 1}月${d.getDate()}日`, value, current: i === 0 });
        }
        const total = sumMinutes(logs.filter(l => l.createdAt >= today0 - 6 * DAY));
        const count = logs.filter(l => l.createdAt >= today0 - 6 * DAY).length;
        trendSummary.textContent = `近 7 天共 ${total} 分钟 · ${count} 次练习`;
        trendPeek.textContent = `近 7 天 · ${total} 分钟`;
      } else {
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const s = d.getTime();
          const e = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
          const value = sumMinutes(logs.filter(l => l.createdAt >= s && l.createdAt < e));
          items.push({ label: `${d.getMonth() + 1}月`, full: `${d.getFullYear()}年${d.getMonth() + 1}月`, value, current: i === 0 });
        }
        const total = sumMinutes(logs.filter(l => l.createdAt >= new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const monthMin = sumMinutes(logs.filter(l => l.createdAt >= monthStart));
        trendSummary.textContent = `近 12 个月共 ${total} 分钟 · 本月 ${monthMin} 分钟`;
        trendPeek.textContent = `近 12 月 · ${total} 分钟`;
      }

      chartWrap.innerHTML = logs.length
        ? svgBars(items)
        : `<div class="empty-tip" style="margin:14px 0 4px">还没有练习记录，打一次卡就有曲线了</div>`;

      // 按曲目聚合（全部记录，取累计时长前 5）
      const agg = new Map();
      logs.forEach(l => {
        const key = String(l.name || '未命名');
        agg.set(key, (agg.get(key) || 0) + (parseInt(l.minutes, 10) || 0));
      });
      const top = Array.from(agg.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const maxMin = top.length ? top[0][1] : 0;
      topList.innerHTML = top.length
        ? `<div class="trend-sub" style="padding-left:0">累计 TOP${top.length}（全部记录）</div>`
          + top.map(([name, min]) => `
            <div class="top-row">
              <div class="top-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
              <div class="top-track"><div class="top-fill" style="width:${maxMin ? Math.round(min / maxMin * 100) : 0}%"></div></div>
              <div class="top-min">${min} 分</div>
            </div>`).join('')
        : '';
    };

    const showToast = (msg) => {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
    };

    // 将 loadLogs 挂载到 this 上，方便外部广播触发
    this.loadLogs = async () => {
      const logs = await dbService.getAllLogs();
      this.currentLogs = logs;
      logList.innerHTML = '';
      let totalTime = 0;
      statCount.textContent = logs.length;
      listCount.textContent = `${logs.length} 条`;
      if (logs.length === 0) {
        logList.innerHTML = `<div class="empty-tip">还没有打卡记录，开始你的第一次练习吧！</div>`;
        statTime.textContent = '0';
        this.renderTrend(logs);
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
            <div class="log-title">${escapeHtml(log.name)}</div>
            <div class="log-detail"><span>⏱ ${log.minutes} 分钟</span>${log.bpm ? `<span>🚀 ${log.bpm} BPM</span>` : ''}${log.page ? `<span>📖 第 ${log.page} 页</span>` : ''}<span style="color:#8a8075">${timeStr}</span></div>
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
      this.renderTrend(logs);
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
