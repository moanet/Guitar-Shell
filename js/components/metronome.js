// ==========================================
// 1. 样式区域
// ==========================================
const metronomeCSS = `
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: linear-gradient(180deg, var(--bg1), var(--bg2));
    position: relative;
  }

  button {
    outline: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  button:focus { outline: none !important; }

  .main-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px 16px calc(14px + env(safe-area-inset-bottom, 0px));
    overflow: hidden;
  }

  .top-bar { display: flex; justify-content: flex-end; height: 30px; margin-bottom: 4px; }
  .btn-settings {
    background: transparent; border: 1px solid var(--line); color: var(--muted);
    border-radius: 8px; padding: 4px 10px; font-size: 14px; cursor: pointer;
  }
  .btn-settings:hover { color: var(--cyan); border-color: var(--cyan); }

  .info-bar { flex:0 0 auto;margin-top:8px; display:flex;gap:1px; background:#232b38;border:1px solid var(--line);border-radius:13px; overflow:hidden; }
  .info-cell { flex:1 1 0;min-width:0;padding:9px 6px; background:#151a22;text-align:center; }
  .info-k { font-size:10px;color:var(--muted);letter-spacing:1px; margin-bottom:3px; }
  .info-v { font-size:18px;font-weight:700;color:#eaf2ff; font-variant-numeric:tabular-nums; white-space:nowrap;overflow:hidden;text-overflow:ellipsis; line-height:1.1; }
  .info-v small{font-size:10px;font-weight:500;opacity:.55;margin-left:2px}
  .info-v.v-sm{font-size:13.5px;padding-top:2px}

  .dots { flex:0 0 auto;display:flex;flex-wrap:wrap;gap:7px; justify-content:center;align-items:center; min-height:26px;margin:14px 0 6px; }
  .dot { width:var(--dot-size,22px);height:var(--dot-size,22px); border-radius:7px;background:#1a202a;border:1px solid #232b38; transition:background .06s, box-shadow .06s, border-color .06s, transform .1s; }
  .dot.m-accent{background:#1f3a28;border-color:#3a8a5a}
  .dot.m-beat{background:#1d3048;border-color:#2f6f9e}
  .dot.on.m-accent{background:#4ade80;border-color:#4ade80;box-shadow:0 0 20px #4ade80}
  .dot.on.m-beat{background:#38bdf8;border-color:#38bdf8;box-shadow:0 0 20px #38bdf8}

  .knob-wrap { flex:1 1 auto;min-height:200px;margin:4px 0 2px; display:flex;align-items:center;justify-content:center; position:relative; touch-action: none; }
  .knob-wrap canvas { display:block;touch-action:none;cursor:grab; }
  .knob-center { position:absolute;inset:0; display:flex;flex-direction:column; align-items:center;justify-content:center; pointer-events:none; gap:2px; }
  .knob-row { display:flex;align-items:center;gap:4px; pointer-events:auto; }

  .knob-step { width:26px;height:26px;border-radius:50%; border:1px solid #2a3444;background:#1b222d;color:#9aa6ba; font-size:16px;cursor:pointer; display:flex;align-items:center;justify-content:center; padding:0; }
  .knob-step:active{transform:scale(.9);background:rgba(56,189,248,.15)}

  .knob-num { width:64px;border:none;outline:none;background:transparent; text-align:center; font-size:34px;font-weight:700;color:#f4f8ff; font-variant-numeric:tabular-nums;padding:0; caret-color:var(--cyan); pointer-events:auto; touch-action: manipulation; }
  .knob-unit { font-size:9px;letter-spacing:4px;color:var(--muted); margin-top:2px; }

  .play-in-knob { margin-top:10px; padding:0 28px; min-width:140px; height:44px; border-radius:12px; border:none; cursor:pointer; font-size:14px; font-weight:800; letter-spacing:5px; color:#06210f; background:linear-gradient(180deg,#5ee894,#22c55e); pointer-events:auto; }
  .play-in-knob.running { color:#2b0505; background:linear-gradient(180deg,#fb8b8b,#ef4444); }

  .bottom-area { flex:0 0 auto; display:flex; flex-direction:column; gap:5px; padding-top:4px; }
  .bottom-row { position:relative; height:44px; flex:0 0 auto; }
  .tap-btn { position:absolute; right:0; top:50%; transform:translateY(-50%); width:72px; height:44px; border-radius:12px; border:1px solid #2f6f9e; background:linear-gradient(180deg,#1a2c3e,#12202e);color:#7fd4ff; display:flex;flex-direction:column; align-items:center;justify-content:center; cursor:pointer; }
  .tap-btn:active { transform:translateY(-50%) scale(.95); background:rgba(56,189,248,.28); }

  .settings-mask {
    position: absolute; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
    display: none; align-items: center; justify-content: center; z-index: 100;
  }
  .settings-mask.show { display: flex; }
  .settings-panel {
    background: var(--bg1); border: 1px solid var(--line); border-radius: 16px;
    width: 90%; max-width: 400px; padding: 20px; display: flex; flex-direction: column; gap: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,.5);
  }
  .settings-panel h3 { margin: 0; font-size: 16px; color: #fff; text-align: center; }
  .settings-group { display: flex; flex-direction: column; gap: 8px; }
  .settings-label { font-size: 12px; color: var(--muted); }

  .ts-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .ts-btn { padding: 8px 0; border-radius: 8px; border: 1px solid #2a3444; background: #1b222d; color: #7b8698; cursor: pointer; font-size: 13px; }
  .ts-btn.on { border-color: var(--cyan); color: var(--cyan); background: rgba(56,189,248,.1); }

  .sub-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .sub-btn { padding: 8px 0; border-radius: 8px; border: 1px solid #2a3444; background: #1b222d; color: #7b8698; cursor: pointer; font-size: 12px; }
  .sub-btn.on { border-color: var(--cyan); color: var(--cyan); background: rgba(56,189,248,.1); }

  .timbre-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .timbre-btn { padding: 8px 0; border-radius: 8px; border: 1px solid #2a3444; background: #1b222d; color: #7b8698; cursor: pointer; font-size: 12px; }
  .timbre-btn.on { border-color: var(--cyan); color: var(--cyan); background: rgba(56,189,248,.1); }

  .close-btn { padding: 10px; border-radius: 8px; border: none; background: #2a3444; color: #fff; cursor: pointer; margin-top: 8px; font-weight: bold; }
`;

// ==========================================
// 2. HTML 结构区域
// ==========================================
const metronomeHTML = `
<div class="main-inner">
  <div class="top-bar">
    <button class="btn-settings" id="btnSettings">⚙ 设置</button>
  </div>

  <div class="info-bar">
    <div class="info-cell">
      <div class="info-k">拍速</div>
      <div class="info-v"><span id="infoBpm">120</span><small>BPM</small></div>
    </div>
    <div class="info-cell">
      <div class="info-k">拍号</div>
      <div class="info-v"><span id="infoTs">4/4</span></div>
    </div>
    <div class="info-cell">
      <div class="info-k">细分</div>
      <div class="info-v v-sm"><span id="infoSub">四分</span></div>
    </div>
  </div>

  <div class="dots" id="dots"></div>

  <div class="knob-wrap" id="knobWrap">
    <canvas id="knobCanvas"></canvas>
    <div class="knob-center">
      <div class="knob-row">
        <button class="knob-step" id="knobMinus">−</button>
        <input id="bpmInput" class="knob-num" type="text" inputmode="numeric" maxlength="3" value="120">
        <button class="knob-step" id="knobPlus">+</button>
      </div>
      <div class="knob-unit">BPM</div>
      <button class="play-in-knob" id="playBtn">开 始</button>
    </div>
  </div>

  <div class="bottom-area">
    <div class="bottom-row">
      <button class="tap-btn" id="tapBtn">
        <span style="font-size:14px;font-weight:800;letter-spacing:1.5px;">TAP</span>
        <span style="font-size:8.5px;opacity:.65;">测速</span>
      </button>
    </div>
  </div>
</div>

<div class="settings-mask" id="settingsMask">
  <div class="settings-panel">
    <h3>节拍器设置</h3>

    <div class="settings-group">
      <div class="settings-label">拍号</div>
      <div class="ts-grid" id="tsGrid"></div>
    </div>

    <div class="settings-group">
      <div class="settings-label">拍内细分</div>
      <div class="sub-grid" id="subGrid"></div>
    </div>

    <div class="settings-group">
      <div class="settings-label">音色</div>
      <div class="timbre-grid" id="timbreGrid"></div>
    </div>

    <button class="close-btn" id="btnCloseSettings">完成</button>
  </div>
</div>
`;

// ==========================================
// 3. 逻辑区域
// ==========================================
class GuitarMetronome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.bpm = 120;
    this.timeSigNum = 4;
    this.timeSigDen = 4;
    this.currentSubId = 'q';
    this.currentSlots = [1];
    this.accents = ['accent', 'beat', 'beat', 'beat'];
    this.currentTimbre = 'sine';

    this.isRunning = false;
    this.audioCtx = null;
    this.queue = [];
    this.dotEls = [];

    this.currentBeatDur = 60 / this.bpm;
    this.currentSlotDurs = [this.currentBeatDur];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${metronomeCSS}</style>${metronomeHTML}`;
    this.initLogic();
  }

  disconnectedCallback() {
    this.stop();
    if (this.scheduleId) clearInterval(this.scheduleId);
  }

  initLogic() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    const bpmInput   = $('bpmInput');
    const knobMinus  = $('knobMinus');
    const knobPlus   = $('knobPlus');
    const knobWrap   = $('knobWrap');
    const knobCanvas = $('knobCanvas');
    const infoBpm    = $('infoBpm');
    const infoTs     = $('infoTs');
    const infoSub    = $('infoSub');
    const dotsWrap   = $('dots');
    const playBtn    = $('playBtn');
    const tapBtn     = $('tapBtn');

    const settingsMask = $('settingsMask');
    const btnSettings = $('btnSettings');
    const btnCloseSettings = $('btnCloseSettings');
    const tsGrid = $('tsGrid');
    const subGrid = $('subGrid');
    const timbreGrid = $('timbreGrid');

    const MIN_BPM = 30, MAX_BPM = 250;
    const START_ANG = 0.75 * Math.PI, SWEEP_ANG = 1.5 * Math.PI;
    const knob = { ctx: knobCanvas.getContext('2d'), size: 0, cx: 0, cy: 0, r: 0 };

    const TIME_SIGS = [
      { num:2, den:4 }, { num:3, den:4 }, { num:4, den:4 }, { num:5, den:4 },
      { num:6, den:8 }, { num:7, den:8 }, { num:8, den:8 }, { num:12, den:8 }
    ];
    const SUBDIVISIONS = [
      { id:'q', short:'四分', slots:[1] },
      { id:'e', short:'八分', slots:[1,1] },
      { id:'t', short:'三连', slots:[1,1,1] },
      { id:'s', short:'十六', slots:[1,1,1,1] }
    ];
    const TIMBRES = [
      { id:'sine', label:'正弦' }, { id:'square', label:'方波' }, { id:'triangle', label:'三角' }
    ];

    const saveSettings = () => {
      const data = {
        bpm: this.bpm, tsNum: this.timeSigNum, tsDen: this.timeSigDen,
        subId: this.currentSubId, timbre: this.currentTimbre
      };
      localStorage.setItem('guitar_metronome_settings', JSON.stringify(data));
    };

    const loadSettings = () => {
      try {
        const raw = localStorage.getItem('guitar_metronome_settings');
        if (raw) {
          const d = JSON.parse(raw);
          if (d.bpm) this.bpm = d.bpm;
          if (d.tsNum) this.timeSigNum = d.tsNum;
          if (d.tsDen) this.timeSigDen = d.tsDen;
          if (d.subId) this.currentSubId = d.subId;
          if (d.timbre) this.currentTimbre = d.timbre;
        }
      } catch (e) {}
    };
    loadSettings();

    const updateDurations = () => {
      this.currentBeatDur = 60 / this.bpm;
      const slotCount = this.currentSlots.length;
      this.currentSlotDurs = new Array(slotCount).fill(this.currentBeatDur / slotCount);
    };
    updateDurations();

    const ensureAudio = () => {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.9;
        this.masterGain.connect(this.audioCtx.destination);
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    };

    const playClick = (time, type) => {
      if (type === 'mute') return;
      let baseFreq = (type === 'accent') ? 1568 : 1046;

      let oscType = 'sine';
      if (this.currentTimbre === 'square') oscType = 'square';
      if (this.currentTimbre === 'triangle') oscType = 'triangle';

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(baseFreq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(type === 'accent' ? 0.8 : 0.5, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.07);
    };

    this.scheduler = () => {
      if (!this.isRunning) return;
      while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
        const slotCount = this.currentSlots.length;
        const beatIdx = Math.floor(this.absoluteSlot / slotCount) % this.timeSigNum;
        const slotIdx = this.absoluteSlot % slotCount;

        if (this.currentSlots[slotIdx]) {
          if (slotIdx === 0) {
            playClick(this.nextNoteTime, this.accents[beatIdx] || 'beat');
          } else {
            playClick(this.nextNoteTime, 'beat');
          }
        }

        if (slotIdx === 0) {
          this.queue.push({ time: this.nextNoteTime, beat: beatIdx });
        }

        const step = this.currentSlotDurs[slotIdx] || (this.currentBeatDur / slotCount);
        this.nextNoteTime += step;
        this.absoluteSlot++;
      }
    };

    this.drawLoop = () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      while (this.queue.length && this.queue[0].time <= now + 0.005) {
        const ev = this.queue.shift();
        for (let i = 0; i < this.dotEls.length; i++) {
          this.dotEls[i].classList.toggle('on', i === ev.beat);
        }
      }
      this.rafId = requestAnimationFrame(this.drawLoop);
    };

    // 🌟 修复：重新计算画布大小和半径，留足四周边缘空间，防止切边
    const resizeKnob = () => {
      const rect = knobWrap.getBoundingClientRect();
      if (rect.width < 10) return;
      const size = Math.floor(Math.min(rect.width, rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      knobCanvas.width = size * dpr;
      knobCanvas.height = size * dpr;
      knobCanvas.style.width = size + 'px';
      knobCanvas.style.height = size + 'px';

      knob.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      knob.size = size;
      knob.cx = size / 2;
      knob.cy = size / 2;

      // 🌟 以前是 size/2 - 16，导致靠边的手柄被切。现在给它四周留 20% 的边距。
      knob.r = size / 2 - size * 0.12;

      drawKnob();
    };

    const drawKnob = () => {
      const ctx = knob.ctx;
      if (!ctx || knob.size < 10) return;
      const { cx, cy, r } = knob;
      ctx.clearRect(0, 0, knob.size, knob.size);

      // 线条宽度
      const lineW = Math.max(10, r * 0.13);
      const t = (this.bpm - MIN_BPM) / (MAX_BPM - MIN_BPM);
      const curA = START_ANG + t * SWEEP_ANG;

      // 背景轨道
      ctx.beginPath();
      ctx.arc(cx, cy, r, START_ANG, START_ANG + SWEEP_ANG);
      ctx.strokeStyle = '#232b38'; ctx.lineWidth = lineW; ctx.lineCap = 'round'; ctx.stroke();

      // 进度轨道
      if (t > 0.002) {
        const grad = ctx.createLinearGradient(0, 0, knob.size, knob.size);
        grad.addColorStop(0, '#38bdf8'); grad.addColorStop(1, '#4ade80');
        ctx.beginPath(); ctx.arc(cx, cy, r, START_ANG, curA);
        ctx.strokeStyle = grad; ctx.lineWidth = lineW; ctx.lineCap = 'round'; ctx.stroke();
      }

      // 指示器手柄（带防切边判定）
      const hx = cx + Math.cos(curA) * r, hy = cy + Math.sin(curA) * r;
      const hr = Math.max(6, lineW * 0.85); // 手柄半径

      // 添加微弱的发光效果（让旋钮更有质感）
      ctx.save();
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; // 纯白填充
      ctx.fill();
      ctx.restore(); // 恢复绘图状态，防止阴影影响后续的其他元素

      // 重新绘制边界线（使用柔和的蓝灰色，不再用纯黑）
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = Math.max(2, hr * 0.35);
      ctx.stroke();
    };

    const buildDots = () => {
      dotsWrap.innerHTML = '';
      this.dotEls = [];
      for (let i = 0; i < this.timeSigNum; i++) {
        const d = document.createElement('div');
        d.className = 'dot ' + (i === 0 ? 'm-accent' : 'm-beat');
        dotsWrap.appendChild(d);
        this.dotEls.push(d);
      }
    };

    const updateUI = () => {
      bpmInput.value = this.bpm;
      infoBpm.textContent = this.bpm;
      infoTs.textContent = this.timeSigNum + '/' + this.timeSigDen;
      const sub = SUBDIVISIONS.find(s => s.id === this.currentSubId);
      infoSub.textContent = sub ? sub.short : '四分';
      this.currentSlots = sub ? sub.slots.slice() : [1];

      updateDurations();
      drawKnob();
      buildDots();
      saveSettings();
    };

    const setBpm = (v) => {
      v = Math.round(v);
      if (!isFinite(v)) return;
      v = Math.min(MAX_BPM, Math.max(MIN_BPM, v));
      if (v === this.bpm) return;

      this.bpm = v;
      bpmInput.value = this.bpm;
      infoBpm.textContent = this.bpm;
      updateDurations();
      drawKnob();
      saveSettings();
    };

    this.start = () => {
      ensureAudio();
      this.isRunning = true;
      this.absoluteSlot = 0;
      this.queue = [];
      this.nextNoteTime = this.audioCtx.currentTime + 0.08;
      this.scheduler();
      this.scheduleId = setInterval(this.scheduler, 25);
      this.rafId = requestAnimationFrame(this.drawLoop);
      playBtn.textContent = '停 止';
      playBtn.classList.add('running');
    };

    this.stop = () => {
      this.isRunning = false;
      clearInterval(this.scheduleId);
      cancelAnimationFrame(this.rafId);
      this.queue = [];
      this.dotEls.forEach(d => d.classList.remove('on'));
      playBtn.textContent = '开 始';
      playBtn.classList.remove('running');
    };

    const renderSettings = () => {
      tsGrid.innerHTML = '';
      TIME_SIGS.forEach(ts => {
        const b = document.createElement('button');
        b.className = 'ts-btn' + (ts.num === this.timeSigNum && ts.den === this.timeSigDen ? ' on' : '');
        b.textContent = `${ts.num}/${ts.den}`;
        b.onclick = () => {
          this.timeSigNum = ts.num; this.timeSigDen = ts.den;
          this.accents = new Array(ts.num).fill('beat');
          this.accents[0] = 'accent';
          updateUI(); renderSettings();
          if (this.isRunning) { this.stop(); this.start(); }
        };
        tsGrid.appendChild(b);
      });

      subGrid.innerHTML = '';
      SUBDIVISIONS.forEach(s => {
        const b = document.createElement('button');
        b.className = 'sub-btn' + (s.id === this.currentSubId ? ' on' : '');
        b.textContent = s.short;
        b.onclick = () => {
          this.currentSubId = s.id;
          updateUI(); renderSettings();
          if (this.isRunning) { this.stop(); this.start(); }
        };
        subGrid.appendChild(b);
      });

      timbreGrid.innerHTML = '';
      TIMBRES.forEach(t => {
        const b = document.createElement('button');
        b.className = 'timbre-btn' + (t.id === this.currentTimbre ? ' on' : '');
        b.textContent = t.label;
        b.onclick = () => {
          this.currentTimbre = t.id;
          updateUI(); renderSettings();
        };
        timbreGrid.appendChild(b);
      });
    };

    btnSettings.onclick = () => { renderSettings(); settingsMask.classList.add('show'); };
    btnCloseSettings.onclick = () => settingsMask.classList.remove('show');

    playBtn.onclick = () => this.isRunning ? this.stop() : this.start();

    bpmInput.addEventListener('input', () => {
      const v = parseInt(bpmInput.value.replace(/[^\d]/g, ''), 10);
      if (isFinite(v)) setBpm(v);
    });
    bpmInput.addEventListener('blur', () => bpmInput.value = this.bpm);

    knobMinus.onclick = () => setBpm(this.bpm - 1);
    knobPlus.onclick = () => setBpm(this.bpm + 1);

    let isDragging = false;
    const pointerToBpm = (e) => {
      const rect = knobCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left - knob.cx;
      const y = e.clientY - rect.top - knob.cy;
      let deg = Math.atan2(y, x) * 180 / Math.PI;
      if (deg < 0) deg += 360;
      if (deg < 45) deg += 360;
      if (deg < 135) deg = (deg < 90) ? 405 : 135;
      const t = (deg - 135) / 270;
      return MIN_BPM + t * (MAX_BPM - MIN_BPM);
    };

    knobWrap.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.knob-center')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const rect = knobCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left - knob.cx;
      const y = e.clientY - rect.top - knob.cy;
      const dist = Math.sqrt(x * x + y * y);
      const lineW = Math.max(10, knob.r * 0.13);

      if (dist < knob.r - lineW * 2.2 || dist > knob.r + lineW * 1.6) return;

      e.preventDefault();
      isDragging = true;
      try { knobWrap.setPointerCapture(e.pointerId); } catch (err) {}
      knobCanvas.style.cursor = 'grabbing';

      setBpm(pointerToBpm(e));
    });

    knobWrap.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setBpm(pointerToBpm(e));
    });

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      knobCanvas.style.cursor = '';
      try { knobWrap.releasePointerCapture(e.pointerId); } catch (err) {}
    };

    knobWrap.addEventListener('pointerup', onPointerUp);
    knobWrap.addEventListener('pointercancel', onPointerUp);

    let tapTimes = [];
    tapBtn.onclick = () => {
      const now = performance.now();
      if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2000) tapTimes = [];
      tapTimes.push(now);
      if (tapTimes.length > 5) tapTimes.shift();
      if (tapTimes.length >= 2) {
        let sum = 0;
        for (let i = 1; i < tapTimes.length; i++) sum += (tapTimes[i] - tapTimes[i-1]);
        setBpm(Math.round(60000 / (sum / (tapTimes.length - 1))));
      }
    };

    setTimeout(() => { resizeKnob(); updateUI(); }, 50);
    new ResizeObserver(resizeKnob).observe(knobWrap);
  }
}

customElements.define('guitar-metronome', GuitarMetronome);
