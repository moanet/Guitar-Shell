import { dbService } from '../services/db.js';
import { webdavService } from '../services/webdav.js';

let pdfjsLib = null;

const readerCSS = `
  :host { display: flex; flex-direction: column; height: 100%; width: 100%; background: #0e1014; color: #fff; overflow: hidden; position: relative; }
  button, label { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
  
  .toolbar { display: flex; gap: 10px; padding: 10px 16px; background: #191e27; border-bottom: 1px solid #2a3140; align-items: center; z-index: 10; flex-wrap: wrap; min-height: 54px; }
  .btn { background: #38bdf8; color: #000; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
  .btn.outline { background: transparent; color: #38bdf8; border: 1px solid #38bdf8; }
  .btn.outline:hover { background: rgba(56, 189, 248, 0.1); }
  .btn-back { background: #2a3444; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: none; }
  .btn-backup { background: #2a3444; color: #cfd8e6; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
  .btn-log { background: #4ade80; color: #000; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; display: none; }
  .btn-cloud { background: #c9a8f5; color: #000; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; }
  
  .pc-actions { display: flex !important; gap: 10px; flex-wrap: wrap; }
  
  .shelf-view { flex: 1; overflow-y: auto; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; align-content: start; }
  .score-card { background: #1b2230; border: 1px solid #2a3140; border-radius: 12px; padding: 16px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.2s; position: relative; }
  .score-card:hover { background: #252e3c; border-color: #38bdf8; transform: translateY(-2px); }
  .score-icon { font-size: 40px; margin-bottom: 10px; }
  .score-name { font-size: 13px; text-align: center; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .btn-delete { position: absolute; top: 8px; right: 8px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: none; }
  .score-card:hover .btn-delete { display: block; }

  .viewer { flex: 1; overflow: auto; position: relative; background: #121212; cursor: grab; -webkit-overflow-scrolling: touch; touch-action: pan-x pan-y; display: none; }
  .viewer:active { cursor: grabbing; }
  .content-container { display: flex; flex-direction: column; align-items: center; min-width: 100%; width: 100%; padding: 20px 0; box-sizing: border-box; }
  
  .page-box { width: 100%; margin-bottom: 15px; background: #1a1a1a; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; }
  .page-box::after { content: '加载中...'; color: #555; font-size: 12px; position: absolute; }
  .page-box.loaded::after { display: none; }
  .content-container img, .content-container canvas { display: block; width: 100%; height: auto; max-width: none; user-select: none; -webkit-user-drag: none; }

  .empty-tip { text-align: center; color: #6a7890; margin-top: 50px; grid-column: 1 / -1; }
  
  .zoom-controls { position: absolute; bottom: 30px; right: 20px; display: none; flex-direction: column; gap: 8px; z-index: 20; }
  .zoom-btn { width: 44px; height: 44px; border-radius: 50%; background: rgba(30, 42, 58, 0.9); border: 1px solid #2f6f9e; color: #7fd4ff; font-size: 24px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
  .zoom-btn:active { background: rgba(56,189,248,0.3); transform: scale(0.95); }

  .mini-metronome { position: absolute; bottom: 30px; left: 20px; display: none; flex-direction: column; align-items: center; z-index: 20; }
  .mm-panel { background: rgba(30, 42, 58, 0.95); backdrop-filter: blur(8px); border: 1px solid #2f6f9e; border-radius: 16px; padding: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.3s ease; }
  .mm-main-row { display: flex; align-items: center; gap: 12px; }
  .mm-btn { background: #38bdf8; color: #000; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(56,189,248,0.3); }
  .mm-btn.playing { background: #ef4444; color: #fff; box-shadow: 0 2px 8px rgba(239,68,68,0.4); }
  .mm-bpm-display { font-size: 20px; font-weight: bold; color: #fff; cursor: pointer; min-width: 50px; text-align: center; user-select: none; }
  .mm-bpm-display::after { content: ' BPM'; font-size: 10px; color: #8a93a6; font-weight: normal; }
  .mm-advanced-area { display: none; flex-direction: column; align-items: center; gap: 8px; width: 100%; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
  .mini-metronome.advanced .mm-advanced-area { display: flex; }
  .mm-knob-wrap { width: 120px; height: 120px; position: relative; display: flex; align-items: center; justify-content: center; }
  .mm-knob-wrap canvas { position: absolute; top: 0; left: 0; touch-action: none; cursor: grab; }
  .mm-adv-controls { display: flex; align-items: center; gap: 16px; }
  .mm-step { background: rgba(255,255,255,0.1); color: #fff; border: none; width: 32px; height: 32px; border-radius: 8px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .mm-step:active { background: rgba(56,189,248,0.3); }

  .loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); color: #38bdf8; font-size: 16px; z-index: 30; display: none; }
  .loading.show { display: flex; }

  .toast { position: absolute; left: 50%; bottom: 100px; transform: translate(-50%, 10px); background: rgba(56, 189, 248, 0.9); color: #000; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; z-index: 200; opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }

  .action-sheet-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: flex-end; z-index: 100; }
  .action-sheet-mask.show { display: flex; }
  .action-sheet { width: 100%; background: #1b2230; border-radius: 16px 16px 0 0; padding: 20px; display: flex; flex-direction: column; gap: 12px; transform: translateY(100%); transition: transform 0.2s; box-sizing: border-box; }
  .action-sheet-mask.show .action-sheet { transform: translateY(0); }
  .action-btn { display: flex; align-items: center; gap: 12px; justify-content: center; background: #252e3c; color: #e2e9f5; border: none; padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 500; cursor: pointer; text-align: center; }
  .action-btn.cancel { background: transparent; color: #8a93a6; margin-top: 8px; }

  .log-modal-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: none; align-items: center; justify-content: center; z-index: 150; padding: 20px; }
  .log-modal-mask.show { display: flex; }
  .log-modal { background: #1b2230; border: 1px solid #2a3140; border-radius: 16px; padding: 20px; width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.95); transition: 0.2s; }
  .log-modal-mask.show .log-modal { transform: scale(1); }
  .log-modal h3 { margin: 0; text-align: center; color: #4ade80; font-size: 18px; }
  .log-field { display: flex; flex-direction: column; gap: 6px; }
  .log-field label { font-size: 12px; color: #8a93a6; }
  .log-input { padding: 12px; border-radius: 8px; border: 1px solid #2a3444; background: #151a22; color: #fff; font-size: 14px; outline: none; }
  .log-input:focus { border-color: #4ade80; }
  .log-footer { display: flex; gap: 10px; margin-top: 8px; }
  .log-btn { flex: 1; padding: 12px; border-radius: 8px; border: none; font-size: 14px; font-weight: bold; cursor: pointer; }
  .log-btn.cancel { background: #2a3444; color: #fff; }
  .log-btn.confirm { background: #4ade80; color: #000; }

  /* 🌟 云同步弹窗专属样式 */
  .cloud-modal h3 { color: #c9a8f5; }
  .cloud-btn { background: #c9a8f5; color: #000; border: 1px solid #c9a8f5; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; }
  .cloud-btn.outline { background: transparent; color: #c9a8f5; }
`;

const readerHTML = `
  <div class="toolbar">
    <button class="btn-back" id="btnBack">← 返回书架</button>
    <button class="btn-log" id="btnLog">📝 打卡</button>
    <div class="pc-actions" id="pcActions">
      <button class="btn" id="btnSingleFile">📂 导入单文件</button>
      <button class="btn outline" id="btnFolder">📁 导入整个文件夹</button>
      <button class="btn-backup" id="btnExport">📤 导出备份</button>
      <button class="btn-backup" id="btnImport">📥 导入备份</button>
      <button class="btn-cloud" id="btnCloudSync">☁️ 云同步</button>
    </div>
    <button class="btn" id="btnMobileUpload" style="display:none;">📂 导入乐谱</button>
    <button class="btn-backup" id="btnMobileExport" style="display:none;">📤 备份</button>
    <button class="btn-cloud" id="btnMobileCloud" style="display:none;">☁️ 云同步</button>
  </div>
  
  <input type="file" id="inputSingleFile" accept="image/*,application/pdf" multiple style="display:none">
  <input type="file" id="inputFolder" webkitdirectory multiple style="display:none">
  <input type="file" id="inputBackup" accept=".json" style="display:none">
  <input type="file" id="inputCamera" accept="image/*" capture="environment" style="display:none">
  <input type="file" id="inputGallery" accept="image/*" multiple style="display:none">
  <input type="file" id="inputMobileFile" accept=".pdf,application/pdf,image/*" multiple style="display:none">

  <div class="shelf-view" id="shelfView">
    <div class="empty-tip" id="emptyTip">书架空空如也，点击上方导入书籍或乐谱</div>
  </div>

  <div class="viewer" id="viewer">
    <div class="content-container" id="contentContainer"></div>
  </div>

  <div class="zoom-controls" id="zoomControls">
    <button class="zoom-btn" id="zoomIn">＋</button>
    <button class="zoom-btn" id="zoomOut">−</button>
  </div>

  <div class="mini-metronome" id="miniMetronome">
    <div class="mm-panel">
      <div class="mm-main-row">
        <button class="mm-btn" id="mmPlay">▶</button>
        <div class="mm-bpm-display" id="mmBpmDisplay">120</div>
      </div>
      <div class="mm-advanced-area" id="mmAdvancedArea">
        <div class="mm-knob-wrap" id="mmKnobWrap"><canvas id="mmKnobCanvas"></canvas></div>
        <div class="mm-adv-controls">
          <button class="mm-step" id="mmMinus">−</button>
          <button class="mm-step" id="mmPlus">+</button>
        </div>
      </div>
    </div>
  </div>

  <div class="loading" id="loading">正在解析文件，请稍候...</div>
  <div class="toast" id="toast"></div>

  <div class="action-sheet-mask" id="actionSheetMask">
    <div class="action-sheet">
      <label class="action-btn" for="inputCamera">📷 拍照</label>
      <label class="action-btn" for="inputGallery">🖼️ 从相册选择</label>
      <label class="action-btn" for="inputMobileFile">📁 选择文件</label>
      <button class="action-btn cancel" id="btnCancel">取消</button>
    </div>
  </div>

  <div class="log-modal-mask" id="logModalMask">
    <div class="log-modal">
      <h3>记录本次练习</h3>
      <div class="log-field"><label>练习内容</label><input type="text" class="log-input" id="logName"></div>
      <div class="log-field"><label>练习时长 (分钟)</label><input type="number" class="log-input" id="logTime" min="1"></div>
      <div class="log-field"><label>练习 BPM</label><input type="number" class="log-input" id="logBpm" min="30" max="250"></div>
      <div class="log-footer">
        <button class="log-btn cancel" id="logCancel">取消</button>
        <button class="log-btn confirm" id="logConfirm">保存记录</button>
      </div>
    </div>
  </div>

  <!-- 🌟 云端同步弹窗 -->
  <div class="log-modal-mask" id="cloudModalMask">
    <div class="log-modal cloud-modal">
      <h3>☁️ 坚果云同步</h3>
      <div class="log-field"><label>坚果云邮箱</label><input type="email" class="log-input" id="cloudUser" placeholder="example@email.com"></div>
      <div class="log-field"><label>应用密码 (非登录密码)</label><input type="password" class="log-input" id="cloudPass" placeholder="在坚果云安全选项申请"></div>
      <div class="log-field"><label>云端文件路径</label><input type="text" class="log-input" id="cloudPath" value="GuitarShell/backup.json"></div>
      <div class="log-footer">
        <button class="log-btn cancel" id="cloudCancel">取消</button>
        <button class="log-btn cloud-btn outline" id="cloudDownload">📥 下载覆盖</button>
        <button class="log-btn cloud-btn" id="cloudUpload">📤 上传备份</button>
      </div>
    </div>
  </div>
`;

class SheetReader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentObjectUrl = null;
    this.scale = 1; 
    this.isDragging = false;
    this.startX = 0; this.startY = 0;
    this.scrollLeftStart = 0; this.scrollTopStart = 0;
    this.observer = null;
    this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    
    this.mmBpm = 120;
    this.mmPlaying = false;
    this.mmAudioCtx = null;
    this.mmTimer = null;
    this.mmNextTick = 0;
    this.toastTimer = null;
    this.mmAutoCollapseTimer = null;
    this.currentFileName = "";
    this.mmKnob = { ctx: null, size: 0, cx: 0, cy: 0, r: 0, dragging: false };
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${readerCSS}</style>${readerHTML}`;
    this.initLogic();
    this.loadShelf();
  }

  disconnectedCallback() {
    if (this.currentObjectUrl) URL.revokeObjectURL(this.currentObjectUrl);
    if (this.observer) this.observer.disconnect();
    if (this.stopMiniMetronome) this.stopMiniMetronome();
    clearTimeout(this.mmAutoCollapseTimer);
  }

  initLogic() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    
    const btnBack = $('btnBack');
    const btnLog = $('btnLog');
    const pcActions = $('pcActions');
    const btnMobileUpload = $('btnMobileUpload');
    const shelfView = $('shelfView');
    const viewer = $('viewer');
    const container = $('contentContainer');
    const zoomControls = $('zoomControls');
    const miniMetronome = $('miniMetronome');
    const loading = $('loading');
    const actionSheetMask = $('actionSheetMask');
    const toastEl = $('toast');
    
    const logModalMask = $('logModalMask');
    const logName = $('logName'), logTime = $('logTime'), logBpm = $('logBpm');
    
    const cloudModalMask = $('cloudModalMask');
    const cloudUser = $('cloudUser'), cloudPass = $('cloudPass'), cloudPath = $('cloudPath');
    
    const showToast = (msg) => {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
    };

    const collapseMmKnob = () => { if (miniMetronome.classList.contains('advanced')) miniMetronome.classList.remove('advanced'); clearTimeout(this.mmAutoCollapseTimer); };
    const resetAutoCollapse = () => { clearTimeout(this.mmAutoCollapseTimer); if (miniMetronome.classList.contains('advanced')) this.mmAutoCollapseTimer = setTimeout(collapseMmKnob, 3000); };
    
    if (this.isMobile) {
      btnMobileUpload.style.display = 'block'; $('btnMobileExport').style.display = 'block'; $('btnMobileCloud').style.display = 'block'; pcActions.style.display = 'none';
    } else {
      pcActions.style.display = 'flex';
    }

    const applyScale = () => { container.style.width = `${this.scale * 100}%`; };

    const loadPdfLib = async () => {
      if (window.pdfjsLib) { pdfjsLib = window.pdfjsLib; return pdfjsLib; }
      loading.textContent = '正在加载解析引擎...'; loading.classList.add('show');
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './js/lib/pdf.js'; 
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = './js/lib/pdf.worker.js';
            pdfjsLib = window.pdfjsLib; loading.classList.remove('show'); resolve(pdfjsLib);
          } else { loading.classList.remove('show'); reject(new Error('pdf.js 加载未挂载')); }
        };
        script.onerror = () => { loading.classList.remove('show'); reject(new Error('找不到本地文件')); };
        document.head.appendChild(script);
      });
    };

    const renderPDFLazy = async (fileBlob) => {
      const lib = await loadPdfLib();
      const arrayBuffer = await fileBlob.arrayBuffer();
      const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.0 }); 
      const ratio = viewport.height / viewport.width;
      if (this.observer) this.observer.disconnect();
      this.observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const pageBox = entry.target;
            const pageNum = parseInt(pageBox.dataset.page, 10);
            obs.unobserve(pageBox);
            const page = await pdf.getPage(pageNum);
            const renderViewport = page.getViewport({ scale: 2.0 }); 
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = renderViewport.height; canvas.width = renderViewport.width;
            await page.render({ canvasContext: context, viewport: renderViewport }).promise;
            pageBox.innerHTML = ''; pageBox.appendChild(canvas); pageBox.classList.add('loaded');
          }
        });
      }, { root: viewer, rootMargin: '100% 0px' });
      for (let i = 1; i <= pdf.numPages; i++) {
        const pageBox = document.createElement('div');
        pageBox.className = 'page-box'; pageBox.dataset.page = i; pageBox.style.aspectRatio = `1 / ${ratio}`; 
        container.appendChild(pageBox); this.observer.observe(pageBox);
      }
    };

    this.openScore = async (fileBlob, fileName) => {
      this.currentFileName = fileName.replace(/\.[^/.]+$/, ""); 
      shelfView.style.display = 'none';
      if (this.isMobile) { btnMobileUpload.style.display = 'none'; $('btnMobileExport').style.display = 'none'; $('btnMobileCloud').style.display = 'none'; } 
      else pcActions.style.display = 'none';
      btnBack.style.display = 'block'; btnLog.style.display = 'block'; viewer.style.display = 'block'; miniMetronome.style.display = 'flex'; 
      collapseMmKnob();
      if (this.currentObjectUrl) URL.revokeObjectURL(this.currentObjectUrl);
      if (this.observer) { this.observer.disconnect(); this.observer = null; }
      container.innerHTML = ''; this.scale = 1; applyScale();

      try {
        const lastLog = await dbService.getLatestLogByName(this.currentFileName);
        if (lastLog && lastLog.bpm) { updateMmBpm(lastLog.bpm, true); showToast(`已恢复上次练习速度：${this.mmBpm} BPM`); }
      } catch(e) { console.error(e); }

      if (fileName.toLowerCase().endsWith('.pdf')) {
        if (this.isMobile) {
          zoomControls.style.display = 'flex'; container.style.padding = '20px 0'; container.style.height = ''; container.style.position = 'static';
          try { await renderPDFLazy(fileBlob); } catch (err) { alert(err.message); }
        } else {
          zoomControls.style.display = 'none'; container.style.padding = '0'; container.style.height = '100%'; container.style.position = 'relative';
          this.currentObjectUrl = URL.createObjectURL(fileBlob);
          const iframe = document.createElement('iframe'); iframe.src = this.currentObjectUrl;
          iframe.style.position = 'absolute'; iframe.style.inset = '0'; iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = 'none';
          container.appendChild(iframe);
        }
      } else {
        zoomControls.style.display = 'flex'; container.style.padding = '20px 0'; container.style.height = ''; container.style.position = 'static';
        this.currentObjectUrl = URL.createObjectURL(fileBlob);
        const img = document.createElement('img'); img.src = this.currentObjectUrl; img.draggable = false;
        container.appendChild(img);
      }
    };

    btnLog.onclick = () => { logName.value = this.currentFileName; logBpm.value = this.mmBpm; logTime.value = ''; logModalMask.classList.add('show'); };
    $('logCancel').onclick = () => logModalMask.classList.remove('show');
    logModalMask.onclick = (e) => { if(e.target === logModalMask) logModalMask.classList.remove('show'); };
    $('logConfirm').onclick = async () => {
      const name = logName.value.trim(), time = logTime.value.trim(), bpm = logBpm.value.trim();
      if (!name) return showToast('请输入练习内容');
      if (!time || isNaN(time) || time <= 0) return showToast('请输入正确的时长');
      await dbService.addLog({ name, minutes: parseInt(time, 10), bpm: bpm ? parseInt(bpm, 10) : null });
      logModalMask.classList.remove('show'); showToast('打卡成功！'); window.dispatchEvent(new CustomEvent('log-updated'));
    };

    btnBack.onclick = () => {
      viewer.style.display = 'none'; zoomControls.style.display = 'none'; btnLog.style.display = 'none'; miniMetronome.style.display = 'none'; 
      if (this.stopMiniMetronome) this.stopMiniMetronome();
      collapseMmKnob(); btnBack.style.display = 'none'; shelfView.style.display = 'grid';
      if (this.isMobile) { btnMobileUpload.style.display = 'block'; $('btnMobileExport').style.display = 'block'; $('btnMobileCloud').style.display = 'block'; } 
      else pcActions.style.display = 'flex';
      if (this.observer) this.observer.disconnect();
    };

    this.loadShelf = async () => {
      const scores = await dbService.getAllScores();
      shelfView.innerHTML = '';
      if (scores.length === 0) { shelfView.innerHTML = `<div class="empty-tip">书架空空如也，点击上方导入书籍或乐谱</div>`; return; }
      scores.forEach(score => {
        const card = document.createElement('div'); card.className = 'score-card';
        const isPdf = score.name.toLowerCase().endsWith('.pdf');
        card.innerHTML = `<div class="score-icon">${isPdf ? '📄' : '🖼️'}</div><div class="score-name">${score.name}</div><button class="btn-delete" data-id="${score.id}">×</button>`;
        card.onclick = () => this.openScore(score.fileBlob, score.name);
        card.querySelector('.btn-delete').onclick = async (e) => {
          e.stopPropagation();
          if (confirm(`确定要从书架删除《${score.name}》吗？`)) { await dbService.deleteScore(score.id); this.loadShelf(); }
        };
        shelfView.appendChild(card);
      });
    };

    const handleFiles = async (files) => {
      if (!files || files.length === 0) return;
      loading.textContent = `正在导入 ${files.length} 个文件...`; loading.classList.add('show');
      let count = 0;
      for (const file of files) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          await dbService.addScore(file.name, file); count++;
        }
      }
      loading.classList.remove('show'); if(count > 0) showToast(`成功导入 ${count} 本乐谱！`); this.loadShelf();
    };

    // ================= 本地导出导入 =================
    const exportBackup = async () => {
      const scores = await dbService.getAllScores(); const logs = await dbService.getAllLogs();
      if(scores.length === 0 && logs.length === 0) return showToast('没有可备份的数据');
      loading.textContent = '正在打包全量数据...'; loading.classList.add('show');
      const exportScores = [];
      for (const item of scores) {
        const reader = new FileReader();
        const base64Promise = new Promise(resolve => { reader.onload = () => resolve(reader.result); reader.readAsDataURL(item.fileBlob); });
        const base64Data = await base64Promise;
        exportScores.push({ name: item.name, createdAt: item.createdAt, data: base64Data, tags: item.tags || [], lastReadPage: item.lastReadPage || 0, lastReadScrollY: item.lastReadScrollY || 0, fileHash: item.fileHash || '' });
      }
      const backupData = { version: '0.0.2', exportedAt: Date.now(), scores: exportScores, logs: logs };
      const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `GuitarShell_Backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
      URL.revokeObjectURL(url); loading.classList.remove('show'); showToast('全量备份文件已下载');
    };

    const importBackup = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          let scoresToImport = [], logsToImport = [];
          if (Array.isArray(parsed)) { scoresToImport = parsed; } 
          else if (parsed && typeof parsed === 'object') { scoresToImport = parsed.scores || []; logsToImport = parsed.logs || []; } 
          else throw new Error('未知的文件格式');
          
          loading.textContent = `正在恢复数据...`; loading.classList.add('show');
          await dbService.clearAllData(); 
          const formattedScores = [];
          for (const item of scoresToImport) {
            const res = await fetch(item.data); const blob = await res.blob();
            formattedScores.push({ name: item.name, fileBlob: blob, createdAt: item.createdAt, tags: item.tags || [], lastReadPage: item.lastReadPage || 0, lastReadScrollY: item.lastReadScrollY || 0, fileHash: item.fileHash || '' });
          }
          await dbService.bulkImport(formattedScores, logsToImport);
          loading.classList.remove('show'); showToast(`恢复成功！${formattedScores.length} 本谱，${logsToImport.length} 条记录`);
          this.loadShelf(); window.dispatchEvent(new CustomEvent('log-updated'));
        } catch (err) { loading.classList.remove('show'); showToast('导入失败：' + err.message); }
      };
      reader.readAsText(file);
    };

    $('btnExport').onclick = exportBackup;
    $('btnMobileExport').onclick = exportBackup;
    $('btnImport').onclick = () => $('inputBackup').click();
    $('inputBackup').onchange = (e) => { importBackup(e.target.files[0]); e.target.value = ''; };

    // ================= 云同步逻辑 =================
    const openCloudModal = () => {
      // 读取本地保存的账号信息
      cloudUser.value = localStorage.getItem('gs_cloud_user') || '';
      cloudPass.value = localStorage.getItem('gs_cloud_pass') || '';
      cloudPath.value = localStorage.getItem('gs_cloud_path') || 'GuitarShell/backup.json';
      cloudModalMask.classList.add('show');
    };
    $('btnCloudSync').onclick = openCloudModal;
    $('btnMobileCloud').onclick = openCloudModal;
    $('cloudCancel').onclick = () => cloudModalMask.classList.remove('show');
    cloudModalMask.onclick = (e) => { if (e.target === cloudModalMask) cloudModalMask.classList.remove('show'); };

    const saveCloudConfig = () => {
      localStorage.setItem('gs_cloud_user', cloudUser.value.trim());
      localStorage.setItem('gs_cloud_pass', cloudPass.value.trim());
      localStorage.setItem('gs_cloud_path', cloudPath.value.trim() || 'GuitarShell/backup.json');
    };

    $('cloudUpload').onclick = async () => {
      saveCloudConfig();
      const user = cloudUser.value.trim(), pass = cloudPass.value.trim(), path = cloudPath.value.trim();
      if (!user || !pass) return showToast('请填写账号和应用密码');
      
      cloudModalMask.classList.remove('show');
      
      // 生成全量 JSON (复用上面的导出逻辑)
      const scores = await dbService.getAllScores(); const logs = await dbService.getAllLogs();
      if(scores.length === 0 && logs.length === 0) return showToast('本地没有可备份的数据');
      loading.textContent = '正在打包并上传...'; loading.classList.add('show');
      
      const exportScores = [];
      for (const item of scores) {
        const reader = new FileReader();
        const base64Promise = new Promise(resolve => { reader.onload = () => resolve(reader.result); reader.readAsDataURL(item.fileBlob); });
        const base64Data = await base64Promise;
        exportScores.push({ name: item.name, createdAt: item.createdAt, data: base64Data, tags: item.tags || [], lastReadPage: item.lastReadPage || 0, lastReadScrollY: item.lastReadScrollY || 0, fileHash: item.fileHash || '' });
      }
      const backupData = { version: '0.0.2', exportedAt: Date.now(), scores: exportScores, logs: logs };
      
      try {
        await webdavService.upload(user, pass, path, JSON.stringify(backupData));
        loading.classList.remove('show'); showToast('☁️ 云端备份成功！');
      } catch (err) {
        loading.classList.remove('show'); alert('上传失败：' + err.message);
      }
    };

    $('cloudDownload').onclick = async () => {
      saveCloudConfig();
      const user = cloudUser.value.trim(), pass = cloudPass.value.trim(), path = cloudPath.value.trim();
      if (!user || !pass) return showToast('请填写账号和应用密码');
      
      if (!confirm('警告：下载云端备份将覆盖本地所有数据！确定继续吗？')) return;
      cloudModalMask.classList.remove('show');
      
      loading.textContent = '正在从云端下载...'; loading.classList.add('show');
      try {
        const dataStr = await webdavService.download(user, pass, path);
        const parsed = JSON.parse(dataStr);
        
        await dbService.clearAllData(); 
        const formattedScores = [];
        for (const item of (parsed.scores || [])) {
          const res = await fetch(item.data); const blob = await res.blob();
          formattedScores.push({ name: item.name, fileBlob: blob, createdAt: item.createdAt, tags: item.tags || [], lastReadPage: item.lastReadPage || 0, lastReadScrollY: item.lastReadScrollY || 0, fileHash: item.fileHash || '' });
        }
        await dbService.bulkImport(formattedScores, parsed.logs || []);
        
        loading.classList.remove('show'); showToast('☁️ 云端数据恢复成功！');
        this.loadShelf(); window.dispatchEvent(new CustomEvent('log-updated'));
      } catch (err) {
        loading.classList.remove('show'); alert('下载失败：' + err.message);
      }
    };

    // ================= 迷你节拍器 =================
    const mmPlay = $('mmPlay'), mmBpmDisplay = $('mmBpmDisplay'), mmKnobCanvas = $('mmKnobCanvas'), mmKnobWrap = $('mmKnobWrap');
    this.mmKnob.ctx = mmKnobCanvas.getContext('2d');
    const initMmKnob = () => {
      const size = 120, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      mmKnobCanvas.width = size * dpr; mmKnobCanvas.height = size * dpr;
      mmKnobCanvas.style.width = size + 'px'; mmKnobCanvas.style.height = size + 'px';
      this.mmKnob.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.mmKnob.size = size; this.mmKnob.cx = size / 2; this.mmKnob.cy = size / 2; this.mmKnob.r = size / 2 - 16;
      drawMmKnob();
    };
    this.drawMmKnob = () => {
      const ctx = this.mmKnob.ctx; if (!ctx || this.mmKnob.size < 10) return;
      const { cx, cy, r } = this.mmKnob; ctx.clearRect(0, 0, this.mmKnob.size, this.mmKnob.size);
      const MIN_BPM = 30, MAX_BPM = 250, START_ANG = 0.75 * Math.PI, SWEEP_ANG = 1.5 * Math.PI;
      const lineW = Math.max(8, r * 0.15), t = (this.mmBpm - MIN_BPM) / (MAX_BPM - MIN_BPM), curA = START_ANG + t * SWEEP_ANG;
      ctx.beginPath(); ctx.arc(cx, cy, r, START_ANG, START_ANG + SWEEP_ANG); ctx.strokeStyle = '#232b38'; ctx.lineWidth = lineW; ctx.lineCap = 'round'; ctx.stroke();
      if (t > 0.002) {
        const grad = ctx.createLinearGradient(0, 0, this.mmKnob.size, this.mmKnob.size); grad.addColorStop(0, '#38bdf8'); grad.addColorStop(1, '#4ade80');
        ctx.beginPath(); ctx.arc(cx, cy, r, START_ANG, curA); ctx.strokeStyle = grad; ctx.lineWidth = lineW; ctx.lineCap = 'round'; ctx.stroke();
      }
      const hx = cx + Math.cos(curA) * r, hy = cy + Math.sin(curA) * r;
      ctx.beginPath(); ctx.arc(hx, hy, Math.max(5, lineW * 0.8), 0, Math.PI * 2); ctx.fillStyle = '#eaf2ff'; ctx.fill(); ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2; ctx.stroke();
    };
    const drawMmKnob = this.drawMmKnob; 
    const updateMmBpm = (v, isSync) => {
      this.mmBpm = Math.round(v); if (this.mmBpm < 30) this.mmBpm = 30; if (this.mmBpm > 250) this.mmBpm = 250;
      mmBpmDisplay.textContent = this.mmBpm; drawMmKnob(); resetAutoCollapse();
      if (!isSync) window.dispatchEvent(new CustomEvent('bpm-changed', { detail: { bpm: this.mmBpm } }));
    };
    const pointerToMmBpm = (e) => {
      const rect = mmKnobCanvas.getBoundingClientRect(), x = e.clientX - rect.left - this.mmKnob.cx, y = e.clientY - rect.top - this.mmKnob.cy;
      let deg = Math.atan2(y, x) * 180 / Math.PI; if (deg < 0) deg += 360; if (deg < 45) deg += 360; if (deg < 135) deg = (deg < 90) ? 405 : 135;
      const t = (deg - 135) / 270; return 30 + t * (250 - 30);
    };
    mmKnobWrap.addEventListener('pointerdown', (e) => { e.preventDefault(); this.mmKnob.dragging = true; mmKnobWrap.setPointerCapture(e.pointerId); updateMmBpm(pointerToMmBpm(e), false); });
    mmKnobWrap.addEventListener('pointermove', (e) => { if (!this.mmKnob.dragging) return; e.preventDefault(); updateMmBpm(pointerToMmBpm(e), false); });
    const onMmKnobUp = (e) => { if (!this.mmKnob.dragging) return; this.mmKnob.dragging = false; try { mmKnobWrap.releasePointerCapture(e.pointerId); } catch(err){} };
    mmKnobWrap.addEventListener('pointerup', onMmKnobUp); mmKnobWrap.addEventListener('pointercancel', onMmKnobUp);
    mmBpmDisplay.onclick = () => { miniMetronome.classList.toggle('advanced'); if (miniMetronome.classList.contains('advanced')) { initMmKnob(); resetAutoCollapse(); } else clearTimeout(this.mmAutoCollapseTimer); };

    const playMmClick = (time) => {
      if (!this.mmAudioCtx) return;
      const osc = this.mmAudioCtx.createOscillator(), gain = this.mmAudioCtx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(1046, time);
      gain.gain.setValueAtTime(0.0001, time); gain.gain.exponentialRampToValueAtTime(0.6, time + 0.002); gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
      osc.connect(gain); gain.connect(this.mmAudioCtx.destination); osc.start(time); osc.stop(time + 0.07);
    };
    this.stopMiniMetronome = () => { this.mmPlaying = false; if (this.mmTimer) { clearInterval(this.mmTimer); this.mmTimer = null; } if(mmPlay) { mmPlay.textContent = '▶'; mmPlay.classList.remove('playing'); } };
    const startMiniMetronome = () => {
      this.stopMiniMetronome();
      if (!this.mmAudioCtx) this.mmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.mmAudioCtx.state === 'suspended') this.mmAudioCtx.resume();
      this.mmPlaying = true; mmPlay.textContent = '■'; mmPlay.classList.add('playing');
      this.mmNextTick = this.mmAudioCtx.currentTime + 0.05;
      this.mmTimer = setInterval(() => { if (!this.mmPlaying) return; while (this.mmNextTick < this.mmAudioCtx.currentTime + 0.1) { playMmClick(this.mmNextTick); this.mmNextTick += 60 / this.mmBpm; } }, 25);
    };
    mmPlay.onclick = () => { if (this.mmPlaying) this.stopMiniMetronome(); else { startMiniMetronome(); collapseMmKnob(); } };
    $('mmMinus').onclick = () => updateMmBpm(this.mmBpm - 1, false); $('mmPlus').onclick = () => updateMmBpm(this.mmBpm + 1, false);

    // ================= 基础绑定 =================
    $('inputSingleFile').onchange = (e) => { handleFiles(e.target.files); e.target.value = ''; };
    $('inputFolder').onchange = (e) => { handleFiles(e.target.files); e.target.value = ''; };
    $('inputCamera').onchange = (e) => { handleFiles(e.target.files); e.target.value = ''; };
    $('inputGallery').onchange = (e) => { handleFiles(e.target.files); e.target.value = ''; };
    $('inputMobileFile').onchange = (e) => { handleFiles(e.target.files); e.target.value = ''; };
    $('btnSingleFile').onclick = () => $('inputSingleFile').click();
    $('btnFolder').onclick = () => $('inputFolder').click();
    btnMobileUpload.onclick = () => actionSheetMask.classList.add('show');
    $('btnCancel').onclick = () => actionSheetMask.classList.remove('show');
    actionSheetMask.onclick = (e) => { if (e.target === actionSheetMask) actionSheetMask.classList.remove('show'); };
    $('zoomIn').onclick = () => { this.scale = Math.min(6, this.scale * 1.25); applyScale(); };
    $('zoomOut').onclick = () => { this.scale = Math.max(1, this.scale / 1.25); applyScale(); };
    
    viewer.addEventListener('wheel', (e) => { collapseMmKnob(); if (e.ctrlKey || e.metaKey) { e.preventDefault(); const delta = e.deltaY > 0 ? -0.15 : 0.15; this.scale = Math.max(1, Math.min(6, this.scale + delta)); applyScale(); } }, { passive: false });
    viewer.addEventListener('pointerdown', (e) => {
      collapseMmKnob(); if (e.target.closest('.zoom-controls') || e.target.closest('.toolbar') || e.target.closest('.mini-metronome')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.isDragging = true; this.startX = e.clientX; this.startY = e.clientY; this.scrollLeftStart = viewer.scrollLeft; this.scrollTopStart = viewer.scrollTop; viewer.style.cursor = 'grabbing';
    });
    viewer.addEventListener('pointermove', (e) => { if (!this.isDragging) return; e.preventDefault(); viewer.scrollLeft = this.scrollLeftStart - (e.clientX - this.startX); viewer.scrollTop = this.scrollTopStart - (e.clientY - this.startY); });
    const onPointerUp = () => { this.isDragging = false; viewer.style.cursor = 'grab'; };
    viewer.addEventListener('pointerup', onPointerUp); viewer.addEventListener('pointercancel', onPointerUp);
    let initialDistance = 0; let initialScale = 1;
    viewer.addEventListener('touchstart', (e) => { collapseMmKnob(); if (e.touches.length === 2) { this.isDragging = false; const t1 = e.touches[0], t2 = e.touches[1]; initialDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); initialScale = this.scale; } }, { passive: false });
    viewer.addEventListener('touchmove', (e) => { if (e.touches.length === 2) { e.preventDefault(); const t1 = e.touches[0], t2 = e.touches[1]; const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); if (initialDistance > 0) { this.scale = Math.max(1, Math.min(6, initialScale * (dist / initialDistance))); applyScale(); } } }, { passive: false });
  }
}

customElements.define('guitar-sheet-reader', SheetReader);