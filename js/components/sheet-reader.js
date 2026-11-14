// 🌟 移除顶部强依赖的 import，改为用到时动态加载
let pdfjsLib = null;

const readerCSS = `
  :host {
    display: flex; flex-direction: column; height: 100%; width: 100%;
    background: #0e1014; color: #fff; overflow: hidden; position: relative;
  }
  button, label { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
  .toolbar {
    display: flex; gap: 10px; padding: 10px 16px; background: #191e27;
    border-bottom: 1px solid #2a3140; align-items: center; z-index: 10;
  }
  .btn-upload {
    background: #38bdf8; color: #000; border: none; padding: 8px 16px;
    border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;
  }
  .btn-upload:hover { filter: brightness(1.1); }

  .viewer {
    flex: 1; overflow: auto; position: relative; background: #121212;
    cursor: grab; -webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;
  }
  .viewer:active { cursor: grabbing; }

  .content-container {
    display: flex; flex-direction: column; align-items: center;
    min-width: 100%; width: 100%; padding: 20px 0; box-sizing: border-box;
  }

  .page-box {
    width: 100%; margin-bottom: 15px; background: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    display: flex; justify-content: center; align-items: center;
    overflow: hidden; position: relative;
  }
  .page-box::after { content: '加载中...'; color: #555; font-size: 12px; position: absolute; }
  .page-box.loaded::after { display: none; }

  .content-container img,
  .content-container canvas {
    display: block; width: 100%; height: auto; max-width: none;
    user-select: none; -webkit-user-drag: none;
  }

  .empty-tip {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    color: #6a7890; font-size: 15px; text-align: center; pointer-events: none;
  }

  .zoom-controls {
    position: absolute; bottom: 30px; right: 20px;
    display: flex; flex-direction: column; gap: 8px; z-index: 20;
  }
  .zoom-btn {
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(30, 42, 58, 0.9); border: 1px solid #2f6f9e; color: #7fd4ff;
    font-size: 24px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .zoom-btn:active { background: rgba(56,189,248,0.3); transform: scale(0.95); }

  .loading {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.7); color: #38bdf8; font-size: 16px; z-index: 30; display: none;
  }
  .loading.show { display: flex; }

  .action-sheet-mask {
    position: absolute; inset: 0; background: rgba(0,0,0,0.5);
    display: none; align-items: flex-end; z-index: 100;
  }
  .action-sheet-mask.show { display: flex; }
  .action-sheet {
    width: 100%; background: #1b2230; border-radius: 16px 16px 0 0;
    padding: 20px; display: flex; flex-direction: column; gap: 12px;
    transform: translateY(100%); transition: transform 0.2s; box-sizing: border-box;
  }
  .action-sheet-mask.show .action-sheet { transform: translateY(0); }

  .action-btn {
    display: flex; align-items: center; gap: 12px; justify-content: center;
    background: #252e3c; color: #e2e9f5; border: none;
    padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 500;
    cursor: pointer; text-align: center;
  }
  .action-btn:active { background: #2f3d4f; }
  .action-btn.cancel { background: transparent; color: #8a93a6; margin-top: 8px; }
`;

const readerHTML = `
  <div class="toolbar">
    <button class="btn-upload" id="btnUpload">📂 导入本地乐谱</button>
    <span style="font-size: 12px; color: #8a93a6; margin-left: auto;">滚轮翻页 · Ctrl+滚轮/按钮/双指缩放</span>
  </div>

  <div class="viewer" id="viewer">
    <div class="empty-tip" id="emptyTip">点击上方按钮，导入你的第一张乐谱</div>
    <div class="content-container" id="contentContainer"></div>
    <div class="loading" id="loading">正在解析文件，请稍候...</div>
  </div>

  <div class="zoom-controls" id="zoomControls">
    <button class="zoom-btn" id="zoomIn">＋</button>
    <button class="zoom-btn" id="zoomOut">−</button>
  </div>

  <div class="action-sheet-mask" id="actionSheetMask">
    <div class="action-sheet">
      <label class="action-btn" for="inputCamera">📷 拍照</label>
      <input type="file" id="inputCamera" accept="image/*" capture="environment" style="display:none">

      <label class="action-btn" for="inputGallery">🖼️ 从相册选择</label>
      <input type="file" id="inputGallery" accept="image/*" style="display:none">

      <label class="action-btn" for="inputFile">📁 选择 PDF 或文件</label>
      <input type="file" id="inputFile" accept=".pdf,application/pdf" style="display:none">

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
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${readerCSS}</style>${readerHTML}`;
    this.initLogic();
  }

  disconnectedCallback() {
    if (this.currentObjectUrl) URL.revokeObjectURL(this.currentObjectUrl);
    if (this.observer) this.observer.disconnect();
  }

  initLogic() {
    // 🌟 极其精准的移动端判断
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                     (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

    const btnUpload = this.shadowRoot.getElementById('btnUpload');
    const viewer = this.shadowRoot.getElementById('viewer');
    const container = this.shadowRoot.getElementById('contentContainer');
    const emptyTip = this.shadowRoot.getElementById('emptyTip');
    const loading = this.shadowRoot.getElementById('loading');
    const actionSheetMask = this.shadowRoot.getElementById('actionSheetMask');
    const btnCancel = this.shadowRoot.getElementById('btnCancel');
    const zoomControls = this.shadowRoot.getElementById('zoomControls');

    const applyScale = () => { container.style.width = `${this.scale * 100}%`; };

    // 动态加载解析库
    const loadPdfLib = async () => {
      if (pdfjsLib) return pdfjsLib;
      loading.textContent = '正在加载本地解析引擎...';
      loading.classList.add('show');
      try {
        const module = await import('../lib/pdf.min.mjs');
        pdfjsLib = module;
        pdfjsLib.GlobalWorkerOptions.workerSrc = '../lib/pdf.worker.min.mjs';
        return pdfjsLib;
      } catch (err) {
        alert('PDF解析引擎加载失败：' + err.message);
        throw err;
      } finally {
        loading.classList.remove('show');
      }
    };

    // PDF 懒加载渲染 (仅移动端)
    const renderPDFLazy = async (file) => {
      const lib = await loadPdfLib();
      const arrayBuffer = await file.arrayBuffer();
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

    // 核心文件处理
    const handleFile = async (file) => {
      if (!file) return;
      actionSheetMask.classList.remove('show');

      if (this.currentObjectUrl) URL.revokeObjectURL(this.currentObjectUrl);
      if (this.observer) { this.observer.disconnect(); this.observer = null; }

      container.innerHTML = '';
      emptyTip.style.display = 'none';
      this.scale = 1;
      applyScale();

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {

        if (isMobile) {
          // 📱 移动端：pdf.js 渲染
          zoomControls.style.display = 'flex';
          container.style.padding = '20px 0';
          // 👇 加上这两行重置
          container.style.height = '';
          container.style.position = 'static';

          try {
            await renderPDFLazy(file);
          } catch (err) {
            console.error(err);
          }
        } else {
          // 💻 电脑端 PDF：直接交给浏览器自带的 iframe！
          zoomControls.style.display = 'none';

          // 🌟 关键修复：让容器撑满高度，并使用相对定位
          container.style.padding = '0';
          container.style.height = '100%';
          container.style.position = 'relative';

          this.currentObjectUrl = URL.createObjectURL(file);
          const iframe = document.createElement('iframe');
          iframe.src = this.currentObjectUrl;

          // 🌟 关键修复：使用绝对定位铺满整个阅读区
          iframe.style.position = 'absolute';
          iframe.style.inset = '0';
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          container.appendChild(iframe);
        }
      } else {
        // 🖼️ 处理图片
        zoomControls.style.display = 'flex';
        container.style.padding = '20px 0';
        // 👇 加上这两行重置
        container.style.height = '';
        container.style.position = 'static';
        
        this.currentObjectUrl = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = this.currentObjectUrl;
        img.draggable = false;
        container.appendChild(img);
      }
    };

    // 智能呼出菜单
    btnUpload.onclick = () => {
      if (isMobile) {
        // 📱 移动端：呼出底部菜单
        actionSheetMask.classList.add('show');
      } else {
        // 💻 电脑端：直接呼出文件管理器，不弹菜单
        const pcInput = document.createElement('input');
        pcInput.type = 'file';
        pcInput.accept = '.pdf,application/pdf,image/*';
        pcInput.onchange = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
        pcInput.click();
      }
    };

    btnCancel.onclick = () => actionSheetMask.classList.remove('show');
    actionSheetMask.onclick = (e) => { if (e.target === actionSheetMask) actionSheetMask.classList.remove('show'); };

    // 绑定移动端三个 input
    const inputCamera = this.shadowRoot.getElementById('inputCamera');
    const inputGallery = this.shadowRoot.getElementById('inputGallery');
    const inputFile = this.shadowRoot.getElementById('inputFile');

    inputCamera.onchange = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
    inputGallery.onchange = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
    inputFile.onchange = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };

    // 缩放控制
    this.shadowRoot.getElementById('zoomIn').onclick = () => { this.scale = Math.min(6, this.scale * 1.25); applyScale(); };
    this.shadowRoot.getElementById('zoomOut').onclick = () => { this.scale = Math.max(1, this.scale / 1.25); applyScale(); };

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