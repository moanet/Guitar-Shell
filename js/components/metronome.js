// ==========================================
// 1. 样式区域
// ==========================================
import { audioEngine } from '../services/audio.js';
import { wakeLock } from '../services/wakelock.js';

const metronomeCSS = `
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: linear-gradient(180deg, var(--bg1), #14110f);
    position: relative;
  }

  button {
    outline: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  button:focus, button:focus-visible { outline: none !important; }
  
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

  .info-bar { flex:0 0 auto;margin-top:8px; display:flex;gap:1px; background:#2c2622;border:1px solid var(--line);border-radius:16px; overflow:hidden; }
  .info-cell { flex:1 1 0;min-width:0;padding:9px 6px; background:#181512;text-align:center; }
  .info-k { font-size:10px;color:var(--muted);letter-spacing:1px; margin-bottom:3px; }
  .info-v { font-size:18px;font-weight:700;color:var(--secondary); font-variant-numeric:tabular-nums; white-space:nowrap;overflow:hidden;text-overflow:ellipsis; line-height:1.1; }
  .info-v small{font-size:10px;font-weight:500;opacity:.55;margin-left:2px}
  .info-v.v-sm{font-size:13.5px;padding-top:2px}

  .dots { flex:0 0 auto;display:flex;flex-wrap:wrap;gap:7px; justify-content:center;align-items:center; min-height:26px;margin:14px 0 6px; }
  .dot { width:var(--dot-size,22px);height:var(--dot-size,22px); border-radius:8px;background:#211d19;border:1px solid #2c2622; transition:background .06s, box-shadow .06s, border-color .06s, transform .1s; }
  .dot.m-accent{background:#3a2a1c;border-color:#6a4b32}
  .dot.m-beat{background:#2a221c;border-color:#4a3a2c}
  .dot.m-sub{background:#3a2f22;border-color:#8a6a2a}
  .dot.m-mute{background:#181512;border-color:#241f1b;opacity:.55}
  .dot.on.m-accent{background:#d99e6a;border-color:#d99e6a;box-shadow:0 0 20px rgba(217,158,106,.55)}
  .dot.on.m-beat{background:#b87b4c;border-color:#b87b4c;box-shadow:0 0 20px rgba(184,123,76,.5)}
  .dot.on.m-sub{background:#f3e8d6;border-color:#f3e8d6;box-shadow:0 0 20px rgba(243,232,214,.38)}

  .knob-wrap { flex:1 1 auto;min-height:200px;margin:4px 0 2px; display:flex;align-items:center;justify-content:center; position:relative; touch-action: none; }
  .knob-wrap canvas { display:block;touch-action:none;cursor:grab; }
  .knob-center { position:absolute;inset:0; display:flex;flex-direction:column; align-items:center;justify-content:center; pointer-events:none; gap:2px; }
  .knob-row { display:flex;align-items:center;gap:4px; pointer-events:auto; }
  
  .knob-step { width:28px;height:28px;border-radius:50%; border:1px solid #3a2f26;background:#241f1b;color:var(--muted); font-size:16px;cursor:pointer; display:flex;align-items:center;justify-content:center; padding:0; }
  .knob-step:active{transform:scale(.9);background:rgba(184,123,76,.18)}
  
  .knob-num { width:64px;border:none;outline:none;background:transparent; text-align:center; font-size:34px;font-weight:700;color:var(--secondary); font-variant-numeric:tabular-nums;padding:0; caret-color:var(--primary); pointer-events:auto; touch-action: manipulation; }
  .knob-unit { font-size:9px;letter-spacing:4px;color:var(--muted); margin-top:2px; }
  
  .play-in-knob { margin-top:10px; padding:0 28px; min-width:140px; height:46px; border-radius:16px; border:1px solid rgba(243,232,214,.10); cursor:pointer; font-size:14px; font-weight:800; letter-spacing:5px; color:#1e1b18; background:linear-gradient(180deg,#d99e6a,#b87b4c); box-shadow:0 6px 18px rgba(184,123,76,.26); pointer-events:auto; }
  .play-in-knob.running { color:var(--secondary); background:#b54a42; box-shadow:0 6px 18px rgba(181,74,66,.26); }

  .bottom-area { flex:0 0 auto; display:flex; flex-direction:column; gap:5px; padding-top:4px; }
  .bottom-row { position:relative; height:44px; flex:0 0 auto; }
  .tap-btn { position:absolute; right:0; top:50%; transform:translateY(-50%); width:72px; height:44px; border-radius:14px; border:1px solid #6a4b32; background:linear-gradient(180deg,#2a211a,#1e1813);color:var(--accent); display:flex;flex-direction:column; align-items:center;justify-content:center; cursor:pointer; }
  .tap-btn:active { transform:translateY(-50%) scale(.95); background:rgba(184,123,76,.28); }

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
  .settings-panel h3 { margin: 0; font-size: 16px; color: var(--secondary); text-align: center; letter-spacing: .5px; }
  .settings-group { display: flex; flex-direction: column; gap: 8px; }
  .settings-label { font-size: 12px; color: var(--muted); }
  
  .ts-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .ts-btn { padding: 8px 0; border-radius: 10px; border: 1px solid #3a2f26; background: #241f1b; color: var(--muted); cursor: pointer; font-size: 13px; }
  .ts-btn.on { border-color: var(--primary); color: var(--secondary); background: rgba(184,123,76,.18); }

  .sub-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .sub-btn { padding: 8px 0; border-radius: 10px; border: 1px solid #3a2f26; background: #241f1b; color: var(--muted); cursor: pointer; font-size: 12px; }
  .sub-btn.on { border-color: var(--primary); color: var(--secondary); background: rgba(184,123,76,.18); }

  .timbre-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .timbre-btn { padding: 8px 0; border-radius: 10px; border: 1px solid #3a2f26; background: #241f1b; color: var(--muted); cursor: pointer; font-size: 12px; }
  .timbre-btn.on { border-color: var(--primary); color: var(--secondary); background: rgba(184,123,76,.18); }

  /* C4 练习工具 */
  .practice-hud {
    /* 永远占住同一块高度：开关 Swing / 变速 / 倒计时时，圆形旋钮不缩放、不位移 */
    display: flex; align-items: center; justify-content: center;
    height: 42px; box-sizing: border-box;
    margin-top: 8px; padding: 4px 8px; border-radius: 9px;
    background: rgba(184,123,76,.10); border: 1px solid rgba(217,158,106,.35);
    color: var(--accent); font-size: 10px; line-height: 1.35; text-align: center;
    overflow: hidden; opacity: 0; visibility: hidden; pointer-events: none;
    transition: opacity .15s;
  }
  .practice-hud.show { opacity: 1; visibility: visible; }
  .accent-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .accent-btn {
    padding: 7px 2px; border-radius: 10px; border: 1px solid #3a2f26; background: #241f1b;
    color: var(--muted); font-size: 11px; cursor: pointer; white-space: nowrap;
  }
  .accent-btn.t-accent { border-color: var(--primary); color: var(--secondary); background: rgba(184,123,76,.20); }
  .accent-btn.t-sub { border-color: var(--accent); color: var(--accent); background: rgba(217,158,106,.14); }
  .accent-btn.t-mute { border-color: #3a2f26; color: var(--muted); background: #181512; }
  .check-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); cursor: pointer; }
  .check-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer; }
  .num-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .num-grid label { display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: var(--muted); }
  .num-grid input {
    width: 100%; padding: 6px; border-radius: 8px; border: 1px solid #3a2f26;
    background: #241f1b; color: var(--secondary); font-size: 12px; outline: none;
  }
  .num-grid input:focus { border-color: var(--primary); }
  .range { width: 100%; accent-color: var(--primary); }
  .m-toast {
    position: fixed; left: 50%; bottom: 86px; transform: translateX(-50%);
    background: #241f1b; border: 1px solid #3a2f26; border-radius: 22px;
    color: var(--secondary); font-size: 12px; padding: 8px 14px; z-index: 30;
    opacity: 0; transition: opacity .2s; pointer-events: none; white-space: nowrap;
  }
  .m-toast.show { opacity: 1; }
  
  .close-btn { padding: 10px; border-radius: 10px; border: none; background: #3a2f26; color: var(--secondary); cursor: pointer; margin-top: 8px; font-weight: bold; }
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

  <div class="practice-hud" id="practiceHud"></div>

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
    <div class="settings-group">
      <div class="settings-label">重音模式 · 点按循环：重音 → 次重音 → 普通 → 静音</div>
      <div class="accent-grid" id="accentGrid"></div>
    </div>
    <div class="settings-group">
      <div class="settings-label">Swing 摇摆 <span id="swingVal">0%</span></div>
      <input type="range" id="swingRange" class="range" min="0" max="100" step="5" value="0">
    </div>
    <div class="settings-group">
      <label class="check-row"><input type="checkbox" id="rampOn"> 变速练习（到目标后保持 N 小节再停）</label>
      <div class="num-grid">
        <label>起始 BPM<input type="number" id="rampStart" min="30" max="250" step="1"></label>
        <label>目标 BPM<input type="number" id="rampTarget" min="30" max="250" step="1"></label>
        <label>每次±<input type="number" id="rampStep" min="1" max="20" step="1"></label>
        <label>每几小节<input type="number" id="rampEvery" min="1" max="16" step="1"></label>
      </div>
    </div>
    <div class="settings-group">
      <label class="check-row"><input type="checkbox" id="timerOn"> 倒计时自动停</label>
      <div class="num-grid">
        <label>分钟<input type="number" id="timerMin" min="1" max="180" step="1"></label>
      </div>
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
    this.metronomeHandle = null;
    this.queue = [];
    this.dotEls = [];

    // C4 练习工具状态
    this.swing = 0;
    this.ramp = { enabled: false, start: 120, target: 160, step: 5, every: 2 };
    this.timer = { enabled: false, minutes: 15 };
    this.rampBars = 0;
    this.rampHolding = false;
    this.rampHoldBars = 0;
    this.countdownEndAt = 0;
    this.countdownTimer = null;
    
    this.currentBeatDur = 60 / this.bpm;
    this.currentSlotDurs = [this.currentBeatDur];

    // 🌟 定义全局 BPM 监听的函数
    this.handleGlobalBpmChange = (e) => {
      if (e.detail.bpm !== this.bpm) {
        this.setBpm(e.detail.bpm, true); // 传入 true 表示来自外部同步
      }
    };

    // 🌟 切走「节拍器」页就立刻停，不留背景噪音（以前只有开 mini 才会停）
    this.handleTabChange = (e) => {
      if (!e.detail || e.detail.target !== 'view-metronome') this.stop();
    };
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style>${metronomeCSS}</style>${metronomeHTML}`;
    this.initLogic();
    
    // 🌟 监听来自其他组件的 BPM 广播
    window.addEventListener('bpm-changed', this.handleGlobalBpmChange);
    window.addEventListener('app-tab-changed', this.handleTabChange);
  }

  disconnectedCallback() {
    this.stop();
    // 🌟 移除监听
    window.removeEventListener('bpm-changed', this.handleGlobalBpmChange);
    window.removeEventListener('app-tab-changed', this.handleTabChange);
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
    const accentGrid = $('accentGrid');
    const swingRange = $('swingRange');
    const swingVal = $('swingVal');
    const practiceHud = $('practiceHud');
    const rampOn = $('rampOn'), rampStart = $('rampStart'), rampTarget = $('rampTarget');
    const rampStep = $('rampStep'), rampEvery = $('rampEvery');
    const timerOn = $('timerOn'), timerMin = $('timerMin');

    const showToast = (msg) => {
      const el = document.createElement('div');
      el.className = 'm-toast';
      el.textContent = msg;
      this.shadowRoot.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 250);
      }, 1600);
    };

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
      { id:'sine', label:'正弦' }, { id:'square', label:'方波' }, { id:'woodblock', label:'木鱼' }
    ];

    const saveSettings = () => {
      const data = {
        bpm: this.bpm, tsNum: this.timeSigNum, tsDen: this.timeSigDen,
        subId: this.currentSubId, timbre: this.currentTimbre,
        accents: this.accents.slice(), swing: this.swing,
        ramp: { ...this.ramp }, timer: { ...this.timer }
      };
      localStorage.setItem('guitar_metronome_settings', JSON.stringify(data));
    };

    // 把音色 / 重音 / Swing 广播出去：读谱页的 mini 节拍器据此保持同一套风格
    const broadcastSettings = () => {
      window.dispatchEvent(new CustomEvent('metronome-settings', {
        detail: {
          timbre: this.currentTimbre,
          accents: this.accents.slice(),
          swing: this.swing
        }
      }));
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
          if (d.timbre) {
            this.currentTimbre = d.timbre === 'triangle'
              ? 'woodblock'
              : (['sine', 'square', 'woodblock'].includes(d.timbre) ? d.timbre : 'sine');
          }
          if (Number.isFinite(d.swing)) this.swing = Math.min(100, Math.max(0, d.swing));
          if (Array.isArray(d.accents) && d.accents.length === this.timeSigNum) {
            this.accents = d.accents.map(a => ['accent', 'sub', 'beat', 'mute'].includes(a) ? a : 'beat');
            if (!this.accents.includes('accent')) this.accents[0] = 'accent';
          }
          if (d.ramp && typeof d.ramp === 'object') this.ramp = { ...this.ramp, ...d.ramp };
          if (d.timer && typeof d.timer === 'object') this.timer = { ...this.timer, ...d.timer };
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

    // 音频与调度都交给全局引擎：组件只负责“给参数 + 收节拍回调”
    const resetPlayUI = () => {
      playBtn.textContent = '开 始';
      playBtn.classList.remove('running');
      this.dotEls.forEach(d => d.classList.remove('on'));
    };

    this.drawLoop = () => {
      const now = audioEngine.currentTime;
      while (this.queue.length && this.queue[0].time <= now + 0.005) {
        const ev = this.queue.shift();
        for (let i = 0; i < this.dotEls.length; i++) {
          this.dotEls[i].classList.toggle('on', i === ev.beat);
        }
      }
      this.rafId = requestAnimationFrame(this.drawLoop);
    };

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
      knob.size = size; knob.cx = size / 2; knob.cy = size / 2; knob.r = size / 2 - size * 0.12; 
      drawKnob();
    };

    const drawKnob = () => {
      const ctx = knob.ctx;
      if (!ctx || knob.size < 10) return;
      const { cx, cy, r } = knob;
      ctx.clearRect(0, 0, knob.size, knob.size);

      const lineW = Math.max(10, r * 0.13);
      const t = (this.bpm - MIN_BPM) / (MAX_BPM - MIN_BPM);
      const curA = START_ANG + t * SWEEP_ANG;

      ctx.beginPath(); ctx.arc(cx, cy, r, START_ANG, START_ANG + SWEEP_ANG);
      ctx.strokeStyle = '#2c2622'; ctx.lineWidth = lineW; ctx.lineCap = 'round'; ctx.stroke();

      if (t > 0.002) {
        const grad = ctx.createLinearGradient(0, 0, knob.size, knob.size);
        grad.addColorStop(0, '#f3e8d6'); grad.addColorStop(0.55, '#d99e6a'); grad.addColorStop(1, '#b87b4c');
        ctx.beginPath(); ctx.arc(cx, cy, r, START_ANG, curA);
        ctx.strokeStyle = grad; ctx.lineWidth = lineW; ctx.lineCap = 'round'; ctx.stroke();
      }

      const hx = cx + Math.cos(curA) * r, hy = cy + Math.sin(curA) * r;
      const hr = Math.max(6, lineW * 0.85);
      
      ctx.save();
      ctx.shadowColor = 'rgba(217, 158, 106, 0.4)'; 
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fillStyle = '#f3e8d6'; ctx.fill();
      ctx.restore();

      ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = Math.max(2, hr * 0.35); ctx.stroke();
    };

    const buildDots = () => {
      dotsWrap.innerHTML = '';
      this.dotEls = [];
      const classOf = { accent: 'm-accent', sub: 'm-sub', beat: 'm-beat', mute: 'm-mute' };
      for (let i = 0; i < this.timeSigNum; i++) {
        const d = document.createElement('div');
        const type = this.accents[i] || (i === 0 ? 'accent' : 'beat');
        d.className = 'dot ' + (classOf[type] || 'm-beat');
        dotsWrap.appendChild(d);
        this.dotEls.push(d);
      }
    };

    // ==================== C4 练习工具：HUD / Swing / 变速 / 倒计时 ====================
    const fmtClock = (ms) => {
      const total = Math.max(0, Math.ceil(ms / 1000));
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    };

    const updateHud = () => {
      const parts = [];
      if (this.swing > 0) parts.push(`Swing ${this.swing}%`);
      if (this.ramp.enabled) {
        let txt = `变速 ${this.ramp.start}→${this.ramp.target} · 每${this.ramp.every}小节`;
        if (this.rampHolding && this.bpm === this.ramp.target) {
          txt += ` · 保持 ${this.rampHoldBars}/${Math.max(1, this.ramp.every)}`;
        }
        parts.push(txt);
      }
      if (this.timer.enabled) {
        parts.push(this.countdownEndAt ? `⏳${fmtClock(this.countdownEndAt - Date.now())}` : `⏳${this.timer.minutes}分`);
      }
      if (parts.length) {
        practiceHud.textContent = parts.join('  ·  ');
        practiceHud.classList.add('show');
      } else {
        practiceHud.classList.remove('show');
      }
    };

    const stopCountdown = () => {
      if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
      this.countdownEndAt = 0;
    };

    const startCountdown = () => {
      stopCountdown();
      if (!this.timer.enabled) { updateHud(); return; }
      this.countdownEndAt = Date.now() + Math.max(1, this.timer.minutes) * 60000;
      this.countdownTimer = setInterval(() => {
        if (!this.isRunning) { stopCountdown(); updateHud(); return; }
        if (Date.now() >= this.countdownEndAt) {
          stopCountdown();
          updateHud();
          this.stop();
          showToast('倒计时结束，节拍器已停');
          return;
        }
        updateHud();
      }, 500);
      updateHud();
    };

    // 变速练习：每 N 个小节向目标 BPM 靠近一次；抵达目标后再保持 N 小节才停
    // （N 就是用户填的「每几小节」，让目标速度听满一段再收工）
    const rampAdvance = () => {
      if (!this.ramp.enabled || !this.isRunning) return;
      this.rampBars += 1;
      // 第一拍只是「开跑」，要等一整小节走完才第一次加档
      if (this.rampBars <= 0) return;
      const target = this.ramp.target;
      const every = Math.max(1, this.ramp.every);

      // 已在目标：累计保持的小节，满 N 小节才停
      if (this.bpm === target) {
        this.rampHolding = true;
        this.rampHoldBars += 1;
        updateHud();
        if (this.rampHoldBars >= every) {
          setTimeout(() => {
            if (!this.isRunning) return;
            this.stop();
            showToast(`已在目标 ${target} BPM 保持 ${every} 小节，练习结束`);
          }, 0);
        }
        return;
      }

      this.rampHolding = false;
      this.rampHoldBars = 0;
      if (this.rampBars % every !== 0) return;
      const step = Math.max(1, this.ramp.step);
      const dir = Math.sign(target - this.bpm);
      if (!dir) return;
      let next = this.bpm + dir * step;
      if (dir > 0 ? next >= target : next <= target) next = target;
      this.setBpm(next, true);
      this.rampHolding = next === target;
      this.rampHoldBars = 0;
      updateHud();
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
      updateHud();
      swingRange.value = this.swing;
      swingVal.textContent = this.swing + '%';
      saveSettings();
    };

    this.setBpm = (v, isSync) => {
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

      // 正在响就同步变速（引擎会把还没排进 Web Audio 的下一个拍点提前）
      if (this.metronomeHandle) this.metronomeHandle.setBpm(this.bpm);

      // 🌟 如果不是同步过来的（是用户手动改的），就向全局发广播
      if (!isSync) {
        window.dispatchEvent(new CustomEvent('bpm-changed', { detail: { bpm: this.bpm } }));
      }
    };

    this.start = () => {
      this.isRunning = true;
      this.queue = [];
      // 变速练习从设定的起始 BPM 开跑（不要把上一轮爬到的 BPM 当成起点）
      if (this.ramp.enabled) {
        this.setBpm(this.ramp.start, true);
        this.rampBars = -1;
        this.rampHolding = false;
        this.rampHoldBars = 0;
      }
      this.metronomeHandle = audioEngine.startMetronome({
        bpm: this.bpm,
        // 细分是「每拍切成几个 slot」，拍号是「每小节几拍」，二者在引擎里按 slot 推进
        slots: this.currentSlots,
        accents: this.accents,
        timbre: this.currentTimbre,
        swing: this.swing,
        onBeat: (ev) => {
          this.queue.push(ev);
          if (ev.beat === 0) rampAdvance();
        },
        // 只有被迷你节拍器抢占时才会走到这里；用户自己点停会先把 isRunning 置 false
        onStop: () => {
          if (!this.isRunning) return;
          this.isRunning = false;
          wakeLock.release('metronome');
          stopCountdown();
          cancelAnimationFrame(this.rafId);
          this.queue = [];
          resetPlayUI();
          updateHud();
        }
      });
      this.rafId = requestAnimationFrame(this.drawLoop);
      startCountdown();
      wakeLock.acquire('metronome');
      playBtn.textContent = '停 止';
      playBtn.classList.add('running');
    };

    this.stop = () => {
      this.isRunning = false;
      wakeLock.release('metronome');
      if (this.metronomeHandle) {
        const handle = this.metronomeHandle;
        this.metronomeHandle = null;
        handle.stop('user');
      }
      stopCountdown();
      cancelAnimationFrame(this.rafId);
      this.queue = [];
      resetPlayUI();
      updateHud();
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
          broadcastSettings();
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
          broadcastSettings();
          // 音色在启动时快照给引擎，响着换音色要重启一次调度（不会重复发声，引擎内是同一路）
          if (this.isRunning) { this.stop(); this.start(); }
        };
        timbreGrid.appendChild(b);
      });

      // 逐拍重音：点一下在 重音→次重音→普通→静音 之间循环
      const ACCENT_ORDER = ['accent', 'sub', 'beat', 'mute'];
      const ACCENT_LABEL = { accent: '重', sub: '次', beat: '常', mute: '静' };
      accentGrid.innerHTML = '';
      for (let i = 0; i < this.timeSigNum; i++) {
        const type = this.accents[i] || 'beat';
        const b = document.createElement('button');
        b.className = 'accent-btn t-' + type;
        b.textContent = `${i + 1}·${ACCENT_LABEL[type]}`;
        b.onclick = () => {
          const idx = ACCENT_ORDER.indexOf(this.accents[i] || 'beat');
          this.accents[i] = ACCENT_ORDER[(idx + 1) % ACCENT_ORDER.length];
          buildDots();
          if (this.metronomeHandle) this.metronomeHandle.setAccents(this.accents);
          broadcastSettings();
          saveSettings();
          renderSettings();
        };
        accentGrid.appendChild(b);
      }

      // 把 C4 控件回填成当前状态（打开设置面板时总是显示真实值）
      swingRange.value = this.swing;
      swingVal.textContent = this.swing + '%';
      rampOn.checked = this.ramp.enabled;
      rampStart.value = this.ramp.start;
      rampTarget.value = this.ramp.target;
      rampStep.value = this.ramp.step;
      rampEvery.value = this.ramp.every;
      timerOn.checked = this.timer.enabled;
      timerMin.value = this.timer.minutes;
    };

    // Swing：拖动即生效（二连音后半拍位置 0.5 → 0.75）
    swingRange.oninput = () => {
      this.swing = Math.min(100, Math.max(0, parseInt(swingRange.value, 10) || 0));
      swingVal.textContent = this.swing + '%';
      if (this.metronomeHandle) this.metronomeHandle.setSwing(this.swing);
      updateHud();
      saveSettings();
      broadcastSettings();
    };

    // 变速练习参数
    const readRampFields = () => {
      const clamp = (v, min, max, dflt) => Math.min(max, Math.max(min, parseInt(v, 10) || dflt));
      this.ramp.start = clamp(rampStart.value, MIN_BPM, MAX_BPM, this.ramp.start);
      this.ramp.target = clamp(rampTarget.value, MIN_BPM, MAX_BPM, this.ramp.target);
      this.ramp.step = clamp(rampStep.value, 1, 30, this.ramp.step);
      this.ramp.every = clamp(rampEvery.value, 1, 32, this.ramp.every);
      saveSettings();
      updateHud();
    };
    [rampStart, rampTarget, rampStep, rampEvery].forEach(el => { el.oninput = readRampFields; });
    rampOn.onchange = () => {
      this.ramp.enabled = rampOn.checked;
      saveSettings();
      if (this.isRunning && this.ramp.enabled) {
        this.rampBars = -1;
        this.rampHolding = false;
        this.rampHoldBars = 0;
        this.setBpm(this.ramp.start, true);
      }
      updateHud();
    };

    // 倒计时
    timerMin.oninput = () => {
      this.timer.minutes = Math.min(180, Math.max(1, parseInt(timerMin.value, 10) || 15));
      saveSettings();
      if (this.isRunning && this.timer.enabled) startCountdown();
      else updateHud();
    };
    timerOn.onchange = () => {
      this.timer.enabled = timerOn.checked;
      saveSettings();
      if (this.isRunning) {
        if (this.timer.enabled) startCountdown();
        else { stopCountdown(); updateHud(); }
      } else {
        updateHud();
      }
    };

    btnSettings.onclick = () => { renderSettings(); settingsMask.classList.add('show'); };
    btnCloseSettings.onclick = () => settingsMask.classList.remove('show');

    playBtn.onclick = () => this.isRunning ? this.stop() : this.start();
    
    bpmInput.addEventListener('input', () => {
      const v = parseInt(bpmInput.value.replace(/[^\d]/g, ''), 10);
      if (isFinite(v)) this.setBpm(v, false); // 来自用户输入
    });
    bpmInput.addEventListener('blur', () => bpmInput.value = this.bpm);

    knobMinus.onclick = () => this.setBpm(this.bpm - 1, false);
    knobPlus.onclick = () => this.setBpm(this.bpm + 1, false);

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
      
      this.setBpm(pointerToBpm(e), false); // 来自拖拽
    });

    knobWrap.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      this.setBpm(pointerToBpm(e), false);
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
        this.setBpm(Math.round(60000 / (sum / (tapTimes.length - 1))), false);
      }
    };

    setTimeout(() => { resizeKnob(); updateUI(); }, 50);
    new ResizeObserver(resizeKnob).observe(knobWrap);
  }
}

customElements.define('guitar-metronome', GuitarMetronome);