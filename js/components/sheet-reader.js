import { dbService } from '../services/db.js';

let pdfjsLib = null;

const readerCSS = `
  :host { display: flex; flex-direction: column; height: 100%; width: 100%; background: #0e1014; color: #fff; overflow: hidden; position: relative; }
  button, label { outline: none !important; -webkit-tap-highlight-color: transparent !important; }

  .toolbar { display: flex; gap: 10px; padding: 10px 16px; background: #191e27; border-bottom: 1px solid #2a3140; align-items: center; z-index: 10; flex-wrap: wrap; }

  .btn { background: #38bdf8; color: #000; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
  .btn.outline { background: transparent; color: #38bdf8; border: 1px solid #38bdf8; }
  .btn.outline:hover { background: rgba(56, 189, 248, 0.1); }
  .btn-back { background: #2a3444; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: none; }

  .pc-actions { display: none; gap: 10px; }

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

  .loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); color: #38bdf8; font-size: 16px; z-index: 30; display: none; }
  .loading.show { display: flex; }

  .action-sheet-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: flex-end; z-index: 100; }
  .action-sheet-mask.show { display: flex; }
  .action-sheet { width: 100%; background: #1b2230; border-radius: 16px 16px 0 0; padding: 20px; display: flex; flex-direction: column; gap: 12px; transform: translateY(100%); transition: transform 0.2s; box-sizing: border-box; }
  .action-sheet-mask.show .action-sheet { transform: translateY(0); }
  .action-btn { display: flex; align-items: center; gap: 12px; justify-content: center; background: #252e3c; color: #e2e9f5; border: none; padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 500; cursor: pointer; text-align: center; }
  .action-btn.cancel { background: transparent; color: #8a93a6; margin-top: 8px; }
`;

const readerHTML = `
  <div class="toolbar">
    <button class="btn-back" id="btnBack">← 返回书架</button>
    <div class="pc-actions" id="pcActions">
      <button class="btn" id="btnSingleFile">📂 导入单文件</button>
      <button class="btn outline" id="btnFolder">📁 导入整个文件夹</button>
    </div>
    <button class="btn" id="btnMobileUpload" style="display:none;">📂 导入乐谱</button>
  </div>

  <input type="file" id="inputSingleFile" accept="image/*,application/pdf" multiple style="display:none">
  <input type="file" id="inputFolder" webkitdirectory multiple style="display:none">

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

  <div class="loading" id="loading">正在解析文件，请稍候...</div>

  <div class="action-sheet-mask" id="actionSheetMask">
    <div class="action-sheet">
      <label class="action-btn" for="inputCamera">📷 拍照</label>
      <label class="action-btn" for="inputGallery">🖼️ 从相册选择</label>
      <label class="action-btn" for="inputMobileFile">📁 选择文件</label>
      <button class="action-btn cancel" id="btnCancel">取消</button>
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
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${readerCSS}</style>${readerHTML}`;
    this.initLogic();
    this.loadShelf();
  }

  disconnectedCallback() {
    if (this.currentObjectUrl) URL.revokeObjectURL(this.currentObjectUrl);
    if (this.observer) this.observer.disconnect();
  }

  initLogic() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    const btnBack = $('btnBack');
    const pcActions = $('pcActions');
    const btnMobileUpload = $('btnMobileUpload');
    const shelfView = $('shelfView');
    const viewer = $('viewer');
    const container = $('contentContainer');
    const zoomControls = $('zoomControls');
    const loading = $('loading');
    const actionSheetMask = $('actionSheetMask');

    if (this.isMobile) {
      btnMobileUpload.style.display = 'block';
    } else {
      pcActions.style.display = 'flex';
    }

    const applyScale = () => { container.style.width = `${this.scale * 100}%`; };

    const loadPdfLib = async () => {
      if (window.pdfjsLib) {
        pdfjsLib = window.pdfjsLib;
        return pdfjsLib;
      }

      loading.textContent = '正在加载解析引擎...';
      loading.classList.add('show');

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');

        // 🌟 智能解析绝对路径：确保无论是 root 还是子目录，都能找到 js/lib/pdf.js
        // 假设 sheet-reader.js 在 js/components/ 下
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const pdfJsUrl = basePath + 'js/lib/pdf.js';
        const workerUrl = basePath + 'js/lib/pdf.worker.js';

        script.src = pdfJsUrl;

        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            pdfjsLib = window.pdfjsLib;
            loading.classList.remove('show');
            resolve(pdfjsLib);
          } else {
            loading.classList.remove('show');
            reject(new Error('pdf.js 加载成功但未挂载到 window'));
          }
        };
        script.onerror = () => {
          loading.classList.remove('show');
          reject(new Error('找不到本地文件，请检查 js/lib 目录下是否有 pdf.js'));
        };
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
            canvas.height = renderViewport.height;
            canvas.width = renderViewport.width;

            await page.render({ canvasContext: context, viewport: renderViewport }).promise;

            pageBox.innerHTML = '';
            pageBox.appendChild(canvas);
            pageBox.classList.add('loaded');
          }
        });
      }, { root: viewer, rootMargin: '100% 0px' });

      for (let i = 1; i <= pdf.numPages; i++) {
        const pageBox = document.createElement('div');
        pageBox.className = 'page-box';
        pageBox.dataset.page = i;
        pageBox.style.aspectRatio = `1 / ${ratio}`;
        container.appendChild(pageBox);
        this.observer.observe(pageBox);
      }
    };

    this.openScore = async (fileBlob, fileName) => {
      shelfView.style.display = 'none';
      if (this.isMobile) btnMobileUpload.style.display = 'none'; else pcActions.style.display = 'none';
      btnBack.style.display = 'block';
      viewer.style.display = 'block';

      if (this.currentObjectUrl) URL.revokeObjectURL(this.currentObjectUrl);
      if (this.observer) { this.observer.disconnect(); this.observer = null; }
      container.innerHTML = '';
      this.scale = 1; applyScale();

      if (fileName.toLowerCase().endsWith('.pdf')) {
        if (this.isMobile) {
          zoomControls.style.display = 'flex';
          container.style.padding = '20px 0'; container.style.height = ''; container.style.position = 'static';
          try { await renderPDFLazy(fileBlob); } catch (err) { console.error(err); alert(err.message); }
        } else {
          zoomControls.style.display = 'none';
          container.style.padding = '0'; container.style.height = '100%'; container.style.position = 'relative';
          this.currentObjectUrl = URL.createObjectURL(fileBlob);
          const iframe = document.createElement('iframe');
          iframe.src = this.currentObjectUrl;
          iframe.style.position = 'absolute'; iframe.style.inset = '0';
          iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = 'none';
          container.appendChild(iframe);
        }
      } else {
        zoomControls.style.display = 'flex';
        container.style.padding = '20px 0'; container.style.height = ''; container.style.position = 'static';
        this.currentObjectUrl = URL.createObjectURL(fileBlob);
        const img = document.createElement('img');
        img.src = this.currentObjectUrl; img.draggable = false;
        container.appendChild(img);
      }
    };

    btnBack.onclick = () => {
      viewer.style.display = 'none';
      zoomControls.style.display = 'none';
      btnBack.style.display = 'none';
      shelfView.style.display = 'grid';
      if (this.isMobile) btnMobileUpload.style.display = 'block'; else pcActions.style.display = 'flex';
      if (this.observer) this.observer.disconnect();
    };

    this.loadShelf = async () => {
      const scores = await dbService.getAllScores();
      shelfView.innerHTML = '';

      if (scores.length === 0) {
        shelfView.innerHTML = `<div class="empty-tip">书架空空如也，点击上方导入书籍或乐谱</div>`;
        return;
      }

      scores.forEach(score => {
        const card = document.createElement('div');
        card.className = 'score-card';
        const isPdf = score.name.toLowerCase().endsWith('.pdf');
        card.innerHTML = `
          <div class="score-icon">${isPdf ? '📄' : '🖼️'}</div>
          <div class="score-name">${score.name}</div>
          <button class="btn-delete" data-id="${score.id}">×</button>
        `;
        card.onclick = () => this.openScore(score.fileBlob, score.name);
        card.querySelector('.btn-delete').onclick = async (e) => {
          e.stopPropagation();
          if (confirm(`确定要从书架删除《${score.name}》吗？`)) {
            await dbService.deleteScore(score.id);
            this.loadShelf();
          }
        };
        shelfView.appendChild(card);
      });
    };

    const handleFiles = async (files) => {
      if (!files || files.length === 0) return;
      loading.textContent = `正在导入 ${files.length} 个文件...`;
      loading.classList.add('show');

      let count = 0;
      for (const file of files) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          await dbService.addScore(file.name, file);
          count++;
        }
      }
      loading.classList.remove('show');
      if(count > 0) alert(`成功导入 ${count} 本乐谱！`);
      this.loadShelf();
    };

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

    viewer.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        this.scale = Math.max(1, Math.min(6, this.scale + delta));
        applyScale();
      }
    }, { passive: false });

    viewer.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.zoom-controls') || e.target.closest('.toolbar')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.isDragging = true;
      this.startX = e.clientX; this.startY = e.clientY;
      this.scrollLeftStart = viewer.scrollLeft; this.scrollTopStart = viewer.scrollTop;
      viewer.style.cursor = 'grabbing';
    });

    viewer.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      viewer.scrollLeft = this.scrollLeftStart - (e.clientX - this.startX);
      viewer.scrollTop = this.scrollTopStart - (e.clientY - this.startY);
    });

    const onPointerUp = () => { this.isDragging = false; viewer.style.cursor = 'grab'; };
    viewer.addEventListener('pointerup', onPointerUp);
    viewer.addEventListener('pointercancel', onPointerUp);

    let initialDistance = 0; let initialScale = 1;
    viewer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        this.isDragging = false;
        const t1 = e.touches[0], t2 = e.touches[1];
        initialDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialScale = this.scale;
      }
    }, { passive: false });

    viewer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (initialDistance > 0) {
          this.scale = Math.max(1, Math.min(6, initialScale * (dist / initialDistance)));
          applyScale();
        }
      }
    }, { passive: false });
  }
}

customElements.define('guitar-sheet-reader', SheetReader);
