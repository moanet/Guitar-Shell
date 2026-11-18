const tunerCSS = `
  :host { display: flex; flex-direction: column; height: 100%; width: 100%; background: #0e1014; color: #fff; overflow: hidden; font-family: -apple-system, sans-serif; align-items: center; justify-content: center; }
  
  .container { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 500px; padding: 20px; gap: 30px; }
  
  /* 提示与音符显示 */
  .display-area { text-align: center; height: 120px; display: flex; flex-direction: column; justify-content: flex-end; }
  .note-name { font-size: 72px; font-weight: bold; color: #e2e9f5; line-height: 1; transition: color 0.2s; }
  .note-name.in-tune { color: #4ade80; text-shadow: 0 0 20px rgba(74, 222, 128, 0.5); }
  .freq-val { font-size: 14px; color: #8a93a6; margin-top: 8px; letter-spacing: 2px; }
  .status-text { font-size: 16px; color: #38bdf8; margin-top: 10px; height: 20px; font-weight: bold; }

  /* 仪表盘 */
  .meter-wrap { position: relative; width: 100%; height: 80px; background: #191e27; border-radius: 12px; border: 1px solid #2a3140; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  
  /* 刻度线 */
  .ticks { position: absolute; inset: 0; display: flex; justify-content: space-between; padding: 0 20px; align-items: center; pointer-events: none; }
  .tick { width: 2px; height: 20px; background: #2a3444; border-radius: 2px; }
  .tick.center { height: 40px; background: #4ade80; box-shadow: 0 0 10px #4ade80; width: 3px; }
  .tick.half { height: 30px; background: #5d6678; }

  /* 指针 */
  .needle { position: absolute; width: 4px; height: 60px; background: #f87171; border-radius: 4px; transition: transform 0.1s cubic-bezier(0.1, 0.7, 1, 0.1), background 0.2s; box-shadow: 0 0 10px rgba(248, 113, 113, 0.6); transform-origin: bottom center; left: calc(50% - 2px); bottom: 10px; z-index: 10; }
  .needle.in-tune { background: #4ade80; box-shadow: 0 0 15px rgba(74, 222, 128, 0.8); }

  /* 目标弦选择 */
  .strings-row { display: flex; gap: 10px; width: 100%; justify-content: center; }
  .string-btn { flex: 1; max-width: 60px; padding: 12px 0; border-radius: 8px; background: #1b2230; border: 1px solid #2a3444; color: #8a93a6; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; outline: none; -webkit-tap-highlight-color: transparent; }
  .string-btn:hover { background: #252e3c; }
  .string-btn.active { background: rgba(56, 189, 248, 0.15); border-color: #38bdf8; color: #38bdf8; box-shadow: 0 0 10px rgba(56,189,248,0.2); }
  
  .string-btn.auto { max-width: 80px; font-size: 14px; }

  /* 控制按钮 */
  .btn-toggle { padding: 16px 40px; border-radius: 30px; border: none; font-size: 18px; font-weight: bold; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 10px; margin-top: 20px; outline: none; }
  .btn-toggle.start { background: #38bdf8; color: #000; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4); }
  .btn-toggle.stop { background: #ef4444; color: #fff; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
  .btn-toggle:active { transform: scale(0.95); }
`;

const tunerHTML = `
  <div class="container">
    <div class="display-area">
      <div class="note-name" id="noteName">--</div>
      <div class="freq-val" id="freqVal">0.0 Hz</div>
      <div class="status-text" id="statusText">点击下方按钮开启麦克风</div>
    </div>

    <div class="meter-wrap">
      <div class="ticks">
        <div class="tick"></div><div class="tick half"></div><div class="tick"></div>
        <div class="tick half"></div><div class="tick center"></div>
        <div class="tick half"></div><div class="tick"></div><div class="tick half"></div><div class="tick"></div>
      </div>
      <div class="needle" id="needle"></div>
    </div>

    <div class="strings-row" id="stringsRow">
      <button class="string-btn auto active" data-note="auto">自动</button>
      <button class="string-btn" data-note="E2">E</button>
      <button class="string-btn" data-note="A2">A</button>
      <button class="string-btn" data-note="D3">D</button>
      <button class="string-btn" data-note="G3">G</button>
      <button class="string-btn" data-note="B3">B</button>
      <button class="string-btn" data-note="E4">e</button>
    </div>

    <button class="btn-toggle start" id="btnToggle">🎤 开启麦克风</button>
  </div>
`;

class GuitarTuner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isListening = false;
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;
    this.rafId = null;
    
    // 数据平滑
    this.frequencyHistory = [];
    this.targetNote = 'auto'; // 默认自动识别

    // 吉他标准调弦频率
    this.stringFreqs = {
      'E2': 82.41,
      'A2': 110.00,
      'D3': 146.83,
      'G3': 196.00,
      'B3': 246.94,
      'E4': 329.63
    };
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${tunerCSS}</style>${tunerHTML}`;
    this.initLogic();
  }

  disconnectedCallback() {
    this.stopTuner();
  }

  initLogic() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    const btnToggle = $('btnToggle');
    const noteName = $('noteName');
    const freqVal = $('freqVal');
    const statusText = $('statusText');
    const needle = $('needle');
    const stringsRow = $('stringsRow');

    // 目标弦选择逻辑
    stringsRow.querySelectorAll('.string-btn').forEach(btn => {
      btn.onclick = () => {
        stringsRow.querySelectorAll('.string-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.targetNote = btn.dataset.note;
      };
    });

    // 自相关算法 (提取基频)
    const autoCorrelate = (buf, sampleRate) => {
      let SIZE = buf.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.01) return -1; // 声音太小，忽略

      let r1 = 0, r2 = SIZE - 1, thres = 0.2;
      for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buf[i]) < thres) { r1 = i; break; }
      }
      for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
      }
      buf = buf.slice(r1, r2);
      SIZE = buf.length;

      let c = new Array(SIZE).fill(0);
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
          c[i] = c[i] + buf[j] * buf[j + i];
        }
      }

      let d = 0;
      while (c[d] > c[d + 1]) d++;
      let maxval = -1, maxpos = -1;
      for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
      }
      let T0 = maxpos;
      let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
      let a = (x1 + x3 - 2 * x2) / 2;
      let b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
      return sampleRate / T0;
    };

    const updatePitch = () => {
      if (!this.isListening || !this.analyser) return;
      
      const bufferLength = this.analyser.fftSize;
      const buffer = new Float32Array(bufferLength);
      this.analyser.getFloatTimeDomainData(buffer);

      let pitch = autoCorrelate(buffer, this.audioCtx.sampleRate);
      
      if (pitch !== -1 && pitch >= 70 && pitch <= 400) {
        // 滑动平均，让数字稳定
        this.frequencyHistory.push(pitch);
        if (this.frequencyHistory.length > 5) this.frequencyHistory.shift();
        
        let avgPitch = this.frequencyHistory.reduce((a, b) => a + b, 0) / this.frequencyHistory.length;
        
        processPitch(avgPitch);
      } else {
        if (this.frequencyHistory.length === 0) {
          noteName.textContent = '--';
          freqVal.textContent = '0.0 Hz';
          statusText.textContent = '拨动琴弦...';
          needle.style.transform = `rotate(0deg)`;
          needle.classList.remove('in-tune');
          noteName.classList.remove('in-tune');
        }
      }
      
      this.rafId = requestAnimationFrame(updatePitch);
    };

    const processPitch = (freq) => {
      let targetFreq = 0;
      let displayNote = '';

      // 自动识别最近的一根弦
      if (this.targetNote === 'auto') {
        let minDiff = Infinity;
        for (const [note, f] of Object.entries(this.stringFreqs)) {
          // 利用对数距离，因为音乐是呈指数分布的
          const diff = Math.abs(Math.log2(freq / f));
          if (diff < minDiff) {
            minDiff = diff;
            targetFreq = f;
            displayNote = note.replace(/\d/, ''); // 去掉数字只留字母
          }
        }
      } else {
        targetFreq = this.stringFreqs[this.targetNote];
        displayNote = this.targetNote.replace(/\d/, '');
      }

      noteName.textContent = displayNote;
      freqVal.textContent = freq.toFixed(1) + ' Hz';

      // 计算音分差异 (100 cents = 半音)
      const cents = 1200 * Math.log2(freq / targetFreq);
      
      // 限制指针范围 (-50 到 +50 音分)
      let clampedCents = Math.max(-50, Math.min(50, cents));
      
      // 映射到角度 (-45度 到 45度)
      let angle = (clampedCents / 50) * 45;
      
      // 指针过渡逻辑：低音准往左，高音准往右
      needle.style.transform = `rotate(${angle}deg)`;

      if (Math.abs(cents) <= 5) {
        // 绿色，音准了
        needle.classList.add('in-tune');
        noteName.classList.add('in-tune');
        statusText.textContent = '🎯 音准完美！';
        statusText.style.color = '#4ade80';
      } else {
        needle.classList.remove('in-tune');
        noteName.classList.remove('in-tune');
        if (cents < 0) {
          statusText.textContent = '偏低 ↓ 请稍微拧紧';
          statusText.style.color = '#fbbf24';
        } else {
          statusText.textContent = '偏高 ↑ 请稍微拧松';
          statusText.style.color = '#f87171';
        }
      }
    };

    btnToggle.onclick = async () => {
      if (this.isListening) {
        this.stopTuner();
        btnToggle.textContent = '🎤 开启麦克风';
        btnToggle.className = 'btn-toggle start';
        statusText.textContent = '已关闭麦克风';
        statusText.style.color = '#8a93a6';
        noteName.textContent = '--';
        noteName.classList.remove('in-tune');
        needle.style.transform = 'rotate(0deg)';
        needle.classList.remove('in-tune');
      } else {
        try {
          btnToggle.textContent = '正在启动...';
          this.stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } 
          });
          
          this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = this.audioCtx.createMediaStreamSource(this.stream);
          
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 2048;
          source.connect(this.analyser);
          
          this.isListening = true;
          btnToggle.textContent = '⏹ 停止调音';
          btnToggle.className = 'btn-toggle stop';
          statusText.textContent = '拨动琴弦...';
          statusText.style.color = '#38bdf8';
          this.frequencyHistory = [];
          
          updatePitch();
        } catch (err) {
          console.error(err);
          alert('无法获取麦克风权限，请确保在 HTTPS 或 localhost 下运行，并允许麦克风访问。');
          btnToggle.textContent = '🎤 开启麦克风';
        }
      }
    };
  }

  stopTuner() {
    this.isListening = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

customElements.define('guitar-tuner', GuitarTuner);