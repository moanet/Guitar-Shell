// ==========================================
// js/components/settings.js
// 全局设置抽屉：数据备份 / 恢复 / 清空 + 当前主题 + 关于
// Shadow DOM 隔离，抽屉固定在视口右侧，不参与页面布局
// ==========================================

import { APP_VERSION } from '../services/version.js';
import { showToast } from '../services/toast.js';
import { dbService } from '../services/db.js';
import {
  buildBackupPayload, getDataStats, parseBackupFile, restoreBackup, saveBackupFile
} from '../services/backup.js';

const settingsCSS = `
  button, label, input, select { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
  :host, * { -webkit-tap-highlight-color: transparent !important; }
  :host {
    position: fixed; inset: 0; z-index: 1000; pointer-events: none;
    font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", -apple-system, sans-serif;
    color: #eae3d9;
  }
  .mask {
    position: absolute; inset: 0; display: flex; justify-content: flex-end;
    background: rgba(0, 0, 0, .54); backdrop-filter: blur(3px);
    opacity: 0; pointer-events: none; transition: opacity .24s ease;
  }
  .mask.show { opacity: 1; pointer-events: auto; }
  .drawer {
    width: min(88vw, 380px); height: 100%; display: flex; flex-direction: column;
    background:
      radial-gradient(560px 260px at 100% -8%, rgba(184,123,76,.13), transparent 66%),
      linear-gradient(180deg, #1e1b18, #151210);
    border-left: 1px solid #342c25;
    box-shadow: -24px 0 60px rgba(0,0,0,.5);
    transform: translateX(100%); transition: transform .28s cubic-bezier(.2,.8,.2,1);
  }
  .mask.show .drawer { transform: translateX(0); }
  .head {
    padding: calc(20px + env(safe-area-inset-top)) 18px 16px;
    border-bottom: 1px solid #2c2622; display: flex; align-items: flex-start; gap: 12px;
  }
  .head-copy { flex: 1; min-width: 0; }
  .eyebrow { font-size: 10px; letter-spacing: 2px; color: #8a8075; text-transform: uppercase; margin-bottom: 5px; }
  h2 { margin: 0; font-size: 22px; line-height: 1.2; color: #f3e8d6; letter-spacing: .5px; }
  .head p { margin: 7px 0 0; font-size: 11px; color: #8a8075; }
  .close {
    flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%; border: 1px solid #3a2f26;
    background: #241f1b; color: #eae3d9; font-size: 20px; line-height: 1; cursor: pointer;
    display: grid; place-items: center;
  }
  .close:active { background: #2f2822; }
  .body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px calc(24px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px; }
  .card { background: rgba(30,27,24,.72); border: 1px solid #2c2622; border-radius: 18px; padding: 14px; }
  .card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 11px; }
  .card-head .ico { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 8px; background: rgba(184,123,76,.14); color: #d99e6a; font-size: 13px; }
  h3 { margin: 0; font-size: 13px; font-weight: 700; color: #f3e8d6; letter-spacing: .4px; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 11px; }
  .stat { background: #171411; border: 1px solid #2c2622; border-radius: 12px; padding: 10px 11px; display: flex; align-items: baseline; gap: 5px; }
  .stat b { font-size: 20px; color: #d99e6a; font-variant-numeric: tabular-nums; }
  .stat span { font-size: 11px; color: #8a8075; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .act {
    width: 100%; min-height: 42px; border-radius: 12px; border: 1px solid #3a2f26; background: #241f1b;
    color: #eae3d9; font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer;
  }
  .act.primary { background: linear-gradient(180deg, #d99e6a, #b87b4c); border-color: rgba(243,232,214,.1); color: #1e1b18; box-shadow: 0 6px 16px rgba(184,123,76,.18); }
  .act:active { filter: brightness(.96); }
  .act:disabled { opacity: .5; cursor: default; }
  .danger {
    width: 100%; min-height: 40px; margin-top: 9px; border-radius: 12px;
    border: 1px solid rgba(181,74,66,.45); background: rgba(181,74,66,.12);
    color: #d98d86; font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer;
  }
  .danger:active { background: rgba(181,74,66,.2); }
  .hint { margin: 9px 2px 0; font-size: 11px; line-height: 1.6; color: #8a8075; }
  .hint b { color: #c9bfb1; font-weight: 600; }
  .status { min-height: 16px; margin-top: 8px; font-size: 11px; color: #d99e6a; line-height: 1.5; word-break: break-all; }
  .cloud-note { margin: 0 2px 10px; font-size: 11px; line-height: 1.65; color: #8a8075; }
  .cloud-note b { color: #c9bfb1; font-weight: 600; }
  .theme-row { display: flex; align-items: center; gap: 11px; }
  .swatch { width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0; display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: 1px solid #3a2f26; }
  .swatch i { display: block; }
  .swatch i:nth-child(1) { background: #121110; }
  .swatch i:nth-child(2) { background: #b87b4c; }
  .swatch i:nth-child(3) { background: #f3e8d6; }
  .swatch i:nth-child(4) { background: #6b8e23; }
  .theme-copy { flex: 1; min-width: 0; }
  .theme-copy b { display: block; font-size: 13px; color: #f3e8d6; }
  .theme-copy small { display: block; margin-top: 3px; font-size: 11px; color: #8a8075; }
  .tag { flex-shrink: 0; padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(107,142,35,.4); background: rgba(107,142,35,.1); color: #9fb86a; font-size: 10px; }
  .about-brand { display: flex; align-items: center; gap: 11px; }
  .about-brand img { width: 42px; height: 42px; border-radius: 11px; object-fit: contain; box-shadow: 0 4px 14px rgba(0,0,0,.28); }
  .about-copy { flex: 1; min-width: 0; }
  .about-copy b { display: block; font-size: 15px; color: #f3e8d6; }
  .about-copy small { display: block; margin-top: 3px; color: #8a8075; font-size: 11px; }
  .ver { padding: 3px 8px; border: 1px solid #3a2f26; border-radius: 999px; color: #d99e6a; font-size: 10px; font-variant-numeric: tabular-nums; }
  .about p { margin: 11px 2px 0; font-size: 11px; line-height: 1.7; color: #8a8075; }
  .about p b { color: #c9bfb1; font-weight: 600; }
`;

const settingsHTML = `
  <div class="mask" id="mask">
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="全局设置">
      <div class="head">
        <div class="head-copy">
          <div class="eyebrow">Global Settings</div>
          <h2>全局设置</h2>
          <p>本地优先 · 数据只留在这台设备</p>
        </div>
        <button class="close" id="btnClose" type="button" aria-label="关闭设置">×</button>
      </div>
      <div class="body">
        <section class="card">
          <div class="card-head"><span class="ico">▦</span><h3>数据管理</h3></div>
          <div class="stats">
            <div class="stat"><b id="scoreCount">—</b><span>份乐谱</span></div>
            <div class="stat"><b id="logCount">—</b><span>条练习</span></div>
          </div>
          <div class="grid2">
            <button class="act primary" id="btnBackup" type="button">📤 本地备份</button>
            <button class="act" id="btnRestore" type="button">📥 从文件恢复</button>
          </div>
          <button class="danger" id="btnClear" type="button">清空乐谱与练习记录</button>
          <div class="status" id="statusLine"></div>
          <p class="hint">备份包含乐谱、阅读进度、页级书签和练习记录。Android 版会保存到 <b>Download/GuitarShell</b>，网页版进入浏览器下载目录。</p>
        </section>

        <section class="card">
          <div class="card-head"><span class="ico">☁</span><h3>云同步</h3></div>
          <p class="cloud-note">坚果云 WebDAV · 手动上传 / 下载。账号与应用密码由读谱页的云同步弹窗管理，密码只在本机加密保存。</p>
          <button class="act" id="btnCloudEntry" type="button">☁ 打开云同步</button>
        </section>

        <section class="card">
          <div class="card-head"><span class="ico">◐</span><h3>外观</h3></div>
          <div class="theme-row">
            <span class="swatch"><i></i><i></i><i></i><i></i></span>
            <div class="theme-copy"><b>复古木质 · 深夜琴房</b><small>暖木九色 token · 全局统一</small></div>
            <span class="tag">使用中</span>
          </div>
          <p class="hint">当前只保留一套主题，先把视觉与交互冻结；后续新增主题会在这里切换。</p>
        </section>

        <section class="card about">
          <div class="card-head"><span class="ico">◎</span><h3>关于</h3></div>
          <div class="about-brand">
            <img src="./icon-gShell-192.png" alt="">
            <div class="about-copy"><b>Guitar Shell</b><small>吉他手的一站式练琴工作站</small></div>
            <span class="ver" id="appVer">v…</span>
          </div>
          <p>零构建原生 Web Components · PWA / Android 壳。<br><b>无账号、无云端默认上传</b>，乐谱与练习记录默认只存在本机。</p>
        </section>
      </div>
    </aside>
  </div>
  <input type="file" id="backupFile" accept=".json,application/json" hidden>
`;

class GuitarSettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.busy = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${settingsCSS}</style>${settingsHTML}`;
    this.$ = (id) => this.shadowRoot.getElementById(id);
    this.$('appVer').textContent = `v${APP_VERSION}`;
    this.bind();
    this.handleOpen = () => this.open();
    window.addEventListener('open-global-settings', this.handleOpen);
  }

  disconnectedCallback() {
    window.removeEventListener('open-global-settings', this.handleOpen);
    document.removeEventListener('keydown', this.handleKey);
  }

  bind() {
    this.$('btnClose').onclick = () => this.close();
    this.$('mask').addEventListener('click', (e) => {
      if (e.target === this.$('mask')) this.close();
    });
    this.handleKey = (e) => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', this.handleKey);

    this.$('btnBackup').onclick = () => this.backup();
    this.$('btnCloudEntry').onclick = () => this.openCloud();
    this.$('btnRestore').onclick = () => this.$('backupFile').click();
    this.$('backupFile').onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (file) this.restore(file);
    };
    this.$('btnClear').onclick = () => this.clear();
  }

  open() {
    this.$('mask').classList.add('show');
    this.refreshStats();
  }

  close() {
    this.$('mask').classList.remove('show');
  }

  setBusy(on, text = '') {
    this.busy = on;
    ['btnBackup', 'btnRestore', 'btnClear'].forEach((id) => { this.$(id).disabled = on; });
    this.$('statusLine').textContent = text;
  }

  async refreshStats() {
    try {
      const s = await getDataStats();
      this.$('scoreCount').textContent = s.scores;
      this.$('logCount').textContent = s.logs;
    } catch (err) {
      this.$('scoreCount').textContent = '—';
      this.$('logCount').textContent = '—';
    }
  }

  async backup() {
    if (this.busy) return;
    this.setBusy(true, '正在打包备份…');
    try {
      const payload = await buildBackupPayload();
      if (!payload) {
        this.setBusy(false, '');
        showToast('没有可备份的数据');
        return;
      }
      const saved = await saveBackupFile(payload);
      this.setBusy(false, saved.native ? `已保存到 ${saved.path}` : '备份文件已下载到浏览器下载目录');
      showToast(saved.native
        ? `已保存到 ${saved.path}`
        : `已下载 ${payload.scores.length} 份乐谱 / ${payload.logs.length} 条练习记录`);
    } catch (err) {
      this.setBusy(false, '备份失败');
      showToast(`备份失败：${err.message}`);
    }
  }

  openCloud() {
    this.close();
    const readerTab = document.querySelector('.tab-btn[data-target="view-reader"]');
    if (readerTab) readerTab.click();
    // 等读谱视图和抽屉退场动画完成后再打开云同步弹窗，避免弹窗落在隐藏视图里
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-cloud-sync'));
    }, 300);
  }

  async restore(file) {
    if (this.busy) return;
    this.setBusy(true, '正在读取备份…');
    try {
      const payload = await parseBackupFile(file);
      const scoreCount = payload.scores.length;
      const logCount = (payload.logs || []).length;
      if (!scoreCount && !logCount) {
        const local = await getDataStats();
        if (!confirm(`这份备份是空的。\n继续会清空本地 ${local.scores} 份乐谱、${local.logs} 条练习记录，且无法撤销。\n确定继续吗？`)) {
          this.setBusy(false, '已取消');
          return;
        }
      } else if (!confirm(`将用备份覆盖本地数据（${scoreCount} 份乐谱 / ${logCount} 条练习记录），确定吗？`)) {
        this.setBusy(false, '已取消');
        return;
      }

      this.$('statusLine').textContent = '正在恢复…';
      const result = await restoreBackup(payload);
      this.refreshStats();
      window.dispatchEvent(new CustomEvent('gs-data-changed', { detail: { source: 'settings', action: 'restore' } }));
      window.dispatchEvent(new CustomEvent('log-updated'));
      this.setBusy(false, '恢复完成');
      showToast(`恢复完成：${result.scores} 份乐谱 / ${result.logs} 条练习记录`);
    } catch (err) {
      this.setBusy(false, '恢复失败');
      showToast(`恢复失败：${err.message}`);
    }
  }

  async clear() {
    if (this.busy) return;
    const s = await getDataStats().catch(() => ({ scores: 0, logs: 0 }));
    if (!confirm(`将清空本机 ${s.scores} 份乐谱与 ${s.logs} 条练习记录，阅读进度和书签也会一起删除。\n此操作无法撤销，确定吗？`)) return;
    this.setBusy(true, '正在清空…');
    try {
      await dbService.clearAllData();
      this.refreshStats();
      window.dispatchEvent(new CustomEvent('gs-data-changed', { detail: { source: 'settings', action: 'clear' } }));
      window.dispatchEvent(new CustomEvent('log-updated'));
      this.setBusy(false, '已清空');
      showToast('已清空乐谱与练习记录');
    } catch (err) {
      this.setBusy(false, '清空失败');
      showToast(`清空失败：${err.message}`);
    }
  }
}

customElements.define('guitar-settings', GuitarSettings);
