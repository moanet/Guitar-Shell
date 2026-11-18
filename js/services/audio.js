// ==========================================
// js/services/audio.js
// 作用：全局音频引擎（单例）
//
// 为什么要有它：
//   - 以前主节拍器 / 读谱迷你节拍器 / 调音器各自 new AudioContext，互斥靠 window 事件，
//     单向且只覆盖一处；调音器停下还会 ctx.close()，上下文时有时无。
//   - 现在统一成一个 AudioContext + 一个 masterGain，节拍调度只有一份实现（lookahead），
//     同一时刻只允许一路节拍在响，抢占由引擎负责，组件只管按钮状态。
//
// 约定：
//   - 浏览器要求音频必须在用户手势里启动，所以 ensure() 只在 click / pointer 回调里调；
//   - stop() 只清定时器、不停上下文（上下文常驻，避免反复创建 / close）；
//   - onStop(reason)：reason = 'user' | 'preempted'，被抢占的一方据此复位自己的 UI。
// ==========================================

const LOOKAHEAD = 0.1;   // 提前排 100ms 的音，抵消 setInterval 抖动
const TICK_MS = 25;
const MASTER_LEVEL = 0.9;

// 拍点类型 → 发声参数。mute 表示这一拍不出声（仍占拍位，用来做「空拍」练习）
const ACCENT_STYLES = {
  accent: { freq: 1568, level: 0.8 },
  sub:    { freq: 1318, level: 0.66 },
  beat:   { freq: 1046, level: 0.55 },
  mute:   null
};

const getAcCtor = () => {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  if (typeof webkitAudioContext !== 'undefined') return webkitAudioContext;
  return null;
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.active = null;   // 当前活跃的节拍句柄，用于互斥
  }

  isReady() {
    return !!this.ctx;
  }

  get sampleRate() {
    return this.ctx ? this.ctx.sampleRate : 48000;
  }

  get currentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // 懒创建上下文；已 suspended 就 resume（iOS 必须发生在用户手势里）
  ensure() {
    if (!this.ctx) {
      const Ctor = getAcCtor();
      if (!Ctor) throw new Error('当前浏览器不支持 Web Audio');
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_LEVEL;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended' && this.ctx.resume) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 统一发声：短促衰减的“哒”，音色 / 频率 / 音量可控
  // bus：该路节拍专属的总线，停止时静音它，就能掐掉已经排进 Web Audio 队列的尾音
  click(when, { freq = 1046, type = 'sine', level = 0.55, dur = 0.06, bus = null } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(bus || this.master || ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  /**
   * 启动节拍调度（同一时刻只允许一路，新的自动抢占旧的）
   * @returns {{ stop(reason?: string): void, setBpm(v: number): void, get bpm(): number }}
   */
  startMetronome({ bpm = 120, slots = [1], accents = [], timbre = 'sine', level, swing = 0, onBeat = null, onStop = null } = {}) {
    this.ensure();

    // 互斥：先停掉上一路（它自己的 onStop 会把按钮复位）
    if (this.active) this.active.stop('preempted');

    const state = {
      bpm: Math.min(250, Math.max(30, Math.round(bpm) || 120)),
      slots: (slots && slots.length ? slots : [1]).slice(),
      accents: (accents || []).slice(),
      timbre,
      level,
      swing: Math.min(100, Math.max(0, Number(swing) || 0)),
      absoluteSlot: 0,
      nextTime: this.ctx.currentTime + 0.08,
      timer: null,
      running: true
    };

    const beatDur = () => 60 / state.bpm;

    // 一拍内各 slot 的「拍内位置」（0~1）。Swing 只改二连音的后半拍：
    // 0% 是平均的 0.5，100% 推到 0.75，即经典的「前长后短」摇摆
    const slotOffsets = () => {
      const n = state.slots.length;
      if (n === 1) return [0];
      if (n === 2) return [0, 0.5 + 0.25 * (state.swing / 100)];
      return Array.from({ length: n }, (_, i) => i / n);
    };

    // 每路节拍一条独立总线：停止时把它的增益拉到 0，
    // 已经排进 Web Audio 的 100ms 尾音会立刻静音，不会“停了还响一下”
    const bus = this.ctx.createGain();
    bus.gain.value = 1;
    bus.connect(this.master);

    const tick = () => {
      if (!state.running) return;
      const horizon = this.ctx.currentTime + LOOKAHEAD;
      while (state.nextTime < horizon) {
        const slotCount = state.slots.length;
        const beatIdx = Math.floor(state.absoluteSlot / slotCount) % (state.accents.length || 1);
        const slotIdx = state.absoluteSlot % slotCount;
        const offsets = slotOffsets();

        if (state.slots[slotIdx]) {
          // 首拍按用户设定的「重音 / 次重音 / 普通 / 静音」，其余 slot 用普通拍
          const styleName = slotIdx === 0 ? (state.accents[beatIdx] || 'beat') : 'beat';
          const style = ACCENT_STYLES[styleName];
          if (style) {
            this.click(state.nextTime, {
              freq: style.freq,
              type: state.timbre,
              level: state.level != null ? state.level : style.level,
              bus
            });
          }
        }

        if (slotIdx === 0 && onBeat) onBeat({ time: state.nextTime, beat: beatIdx });

        // 按「当前 slot → 下一个 slot」的拍内距离推进，Swing 的时值差自然生效
        const nextOffset = slotIdx + 1 < slotCount ? offsets[slotIdx + 1] : 1;
        state.nextTime += (nextOffset - offsets[slotIdx]) * beatDur();
        state.absoluteSlot += 1;
      }
    };

    const engine = this;
    const handle = {
      stop(reason = 'user') {
        if (!state.running) return;
        state.running = false;
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        // 掐掉尾音：总线静音（不 disconnect，等最后一颗 osc 自然结束）
        try { bus.gain.setValueAtTime(0, engine.ctx ? engine.ctx.currentTime : 0); } catch (err) {}
        if (engine.active === handle) engine.active = null;
        if (onStop) onStop(reason);
      },
      setBpm(value) {
        const v = Math.round(value);
        if (!isFinite(v)) return;
        state.bpm = Math.min(250, Math.max(30, v));
        // 变速要立刻生效：把还没排进 Web Audio 的下一个拍点往回收，
        // 否则从 60 拉到 240 会先空等一整拍（排进队列的音不可撤销，故只提前不延后）
        const next = engine.ctx.currentTime + beatDur() / state.slots.length + 0.01;
        if (state.nextTime > next) state.nextTime = next;
      },
      // 运行中改音色 / 重音 / Swing：对下一次调度就生效（已排进队列的 100ms 不受影响）
      setTimbre(value) {
        if (value === 'sine' || value === 'square' || value === 'triangle') state.timbre = value;
      },
      setAccents(list) {
        if (Array.isArray(list) && list.length) state.accents = list.slice();
      },
      setSwing(value) {
        const v = Number(value);
        if (isFinite(v)) state.swing = Math.min(100, Math.max(0, v));
      },
      get bpm() { return state.bpm; },
      get swing() { return state.swing; },
      get accents() { return state.accents.slice(); }
    };

    this.active = handle;
    tick();
    state.timer = setInterval(tick, TICK_MS);
    return handle;
  }

  // 麦克风分析：复用同一个上下文，别再为调音器新建 / close
  openAnalyser(stream) {
    const ctx = this.ensure();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    return {
      analyser,
      dispose() {
        try { source.disconnect(); } catch (err) {}
        try { analyser.disconnect(); } catch (err) {}
      }
    };
  }
}

export const audioEngine = new AudioEngine();
