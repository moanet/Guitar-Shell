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

// 自定义调准音效（占位）：
// 留空 = 使用下面的内置合成“叮”。做好自己的音效后，把音频放进 assets/，
// 将这里改成 './assets/tuner-ding.mp3'，并把同一路径加入 sw.js 的 ASSETS_TO_CACHE。
const CUSTOM_CHIME_URL = '';

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
    this._chimeBuffer = null;
    this._chimeLoading = null;
    this._woodNoise = null;
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

  // 已 suspended 就 resume（iOS 必须发生在用户手势里）
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

  // 音频上下文可能因切后台 / 长时间静置被挂起：试听参考音前等它真正 running 再排音
  async resume() {
    const ctx = this.ensure();
    if (ctx.state === 'suspended' && ctx.resume) {
      try { await ctx.resume(); } catch (err) {}
    }
    return ctx;
  }

  // 统一发声：短促衰减的“哒”，音色 / 频率 / 音量可控
  // bus：该路节拍专属的总线，停止时静音它，就能掐掉已经排进 Web Audio 队列的尾音
  click(when, { freq = 1046, type = 'sine', level = 0.55, dur = 0.06, bus = null } = {}) {
    if (type === 'woodblock') {
      this.woodblock(when, { freq, level, bus });
      return;
    }
    if (type === 'electronic') {
      this.electronic(when, { freq, level, bus });
      return;
    }
    const ctx = this.ctx;
    if (!ctx) return;
    if (type === 'beep') {
      // 短促音：比普通“哒”更短、更干，适合快速练习时减少拖尾
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, when);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), when + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.032);
      osc.connect(gain);
      gain.connect(bus || this.master || ctx.destination);
      osc.start(when);
      osc.stop(when + 0.045);
      return;
    }
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

  // 电子音色：锯齿波 + 一小撮高通噪声，像老式电子节拍器的“嘀”
  electronic(when, { freq = 1046, level = 0.55, bus = null } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = when || ctx.currentTime;
    const peak = Math.max(0.0002, level != null ? level : 0.55);

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(peak, t0 + 0.0015);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.055);
    out.connect(bus || this.master || ctx.destination);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t0);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(5200, Math.max(900, freq * 1.8)), t0);
    filter.Q.setValueAtTime(1.2, t0);
    osc.connect(filter);
    filter.connect(out);
    osc.start(t0);
    osc.stop(t0 + 0.065);

    const noise = this.getWoodNoise(ctx);
    if (noise) {
      const src = ctx.createBufferSource();
      const nFilter = ctx.createBiquadFilter();
      const nGain = ctx.createGain();
      nFilter.type = 'highpass';
      nFilter.frequency.setValueAtTime(3600, t0);
      nGain.gain.setValueAtTime(0.0001, t0);
      nGain.gain.exponentialRampToValueAtTime(peak * 0.16, t0 + 0.001);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.018);
      src.buffer = noise;
      src.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(out);
      src.start(t0);
      src.stop(t0 + 0.024);
    }
  }


  // 木鱼音色：低频木腔共鸣 + 高频敲击瞬态，短促、干脆，不是正弦/方波那种电子“哒”
  woodblock(when, { freq = 1046, level = 0.55, bus = null } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = when || ctx.currentTime;
    const peak = Math.max(0.0002, (level != null ? level : 0.55) * 0.95);
    const base = Math.max(340, Math.min(1050, freq * 0.62));

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(peak, t0 + 0.0025);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.075);
    out.connect(bus || this.master || ctx.destination);

    // 木腔的两个共振峰：基频稍微下滑，听感更像“叩”而不是“叮”
    [[base, 0.92], [base * 2.15, 0.3]].forEach(([f, amp]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t0);
      osc.frequency.exponentialRampToValueAtTime(f * 0.94, t0 + 0.045);
      gain.gain.value = amp;
      osc.connect(gain);
      gain.connect(out);
      osc.start(t0);
      osc.stop(t0 + 0.09);
    });

    // 敲击瞬间的一小撮带通噪声，补足木头表面的“啪”感
    const noise = this.getWoodNoise(ctx);
    if (noise) {
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const nGain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2100, t0);
      filter.Q.setValueAtTime(0.8, t0);
      nGain.gain.setValueAtTime(0.0001, t0);
      nGain.gain.exponentialRampToValueAtTime(peak * 0.18, t0 + 0.0015);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.022);
      src.buffer = noise;
      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(out);
      src.start(t0);
      src.stop(t0 + 0.03);
    }
  }

  getWoodNoise(ctx) {
    if (this._woodNoise && this._woodNoise.sampleRate === ctx.sampleRate) return this._woodNoise;
    const len = Math.ceil(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    this._woodNoise = buffer;
    return buffer;
  }

  // 预加载自定义调准音效：开麦时调用一次，避免第一次“叮”来不及取文件
  preloadChime() {
    if (!CUSTOM_CHIME_URL || !this.ctx || this._chimeBuffer || this._chimeLoading) return;
    this._chimeLoading = fetch(CUSTOM_CHIME_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(ab => this.ctx.decodeAudioData(ab))
      .then(buf => { this._chimeBuffer = buf; })
      .catch(err => console.warn('自定义调准音效加载失败，先用内置“叮”:', err))
      .finally(() => { this._chimeLoading = null; });
  }

  // 调准提示音：两分音（基音 + 高八度泛音）的清脆“叮”，与节拍器 60ms 的“哒”区分明显
  chime(when, { freq = 2093, level = 0.28, dur = 0.32 } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = when || ctx.currentTime;

    // 有自定义音效就用自定义；未加载完成时先落回内置“叮”
    if (CUSTOM_CHIME_URL) {
      this.preloadChime();
      if (this._chimeBuffer) {
        const src = ctx.createBufferSource();
        src.buffer = this._chimeBuffer;
        src.connect(this.master || ctx.destination);
        src.start(t0);
        return;
      }
    }

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), t0 + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    out.connect(this.master || ctx.destination);

    // 高八度泛音让声音更亮、更“叮”，衰减略快
    [[freq, 1], [freq * 2, 0.32]].forEach(([f, amp]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t0);
      gain.gain.value = amp;
      osc.connect(gain);
      gain.connect(out);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    });
  }

  // 参考音：持续一段时间的标准音，用于调音器试听（淡入淡出，避免爆音）
  // 低频弦（E2 / A2）用纯正弦在手机小喇叭上很容易“听得见电流声、听不见音”，
  // 因此按频率补入 2 / 3 / 4 次谐音：低音弦让手机喇叭能推出可听的中频泛音，
  // 高音弦保持原来的轻量谐波，避免整体过响。
  tone(freq, { dur = 1.2, level = 0.2 } = {}) {
    const ctx = this.ctx;
    if (!ctx || !(freq > 0)) return null;
    const t0 = ctx.currentTime + 0.02;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), t0 + 0.05);
    out.gain.setValueAtTime(Math.max(0.0002, level), t0 + Math.max(0.1, dur - 0.25));
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    // 独立淡出级：中途 stop() 时只把这一级拉到 0，不动已经排好的包络。
    // 直接 osc.stop() 会在波形任意相位硬截断，听起来就是“pia”的爆音。
    const fade = ctx.createGain();
    fade.gain.value = 1;
    out.connect(fade);
    fade.connect(this.master || ctx.destination);

    const harmonics = freq < 140
      ? [[1, 1], [2, 0.65], [3, 0.4], [4, 0.22]]
      : freq < 220
        ? [[1, 1], [2, 0.5], [3, 0.25]]
        : [[1, 1], [2, 0.32], [3, 0.14]];
    const oscillators = [];
    harmonics.forEach(([multiple, amp]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * multiple, t0);
      gain.gain.value = amp;
      osc.connect(gain);
      gain.connect(out);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
      oscillators.push(osc);
    });

    let stopped = false;
    return {
      // fadeSeconds 默认 35ms：足够消掉爆音，又不会让人听出明显的拖尾
      stop(fadeSeconds = 0.035) {
        if (stopped) return;
        stopped = true;

        const now = ctx.currentTime;
        const fadeStart = Math.max(now, t0);
        const fadeDur = Math.max(0.012, Math.min(0.06, fadeSeconds || 0.035));
        try {
          fade.gain.cancelScheduledValues(fadeStart);
          fade.gain.setValueAtTime(1, fadeStart);
          fade.gain.exponentialRampToValueAtTime(0.0001, fadeStart + fadeDur);
        } catch (err) {}

        const stopAt = fadeStart + fadeDur + 0.008;
        oscillators.forEach(osc => {
          try { osc.stop(stopAt); } catch (err) {}
        });

        // 等尾音彻底归零再断开节点，避免快速连续试听时积累已静音的音频图
        const cleanupMs = Math.max(0, (stopAt - now + 0.1) * 1000);
        setTimeout(() => {
          try { out.disconnect(); fade.disconnect(); } catch (err) {}
        }, cleanupMs);
      }
    };
  }

  /**
   * 启动节拍调度（同一时刻只允许一路，新的自动抢占旧的）
   * @returns {{ stop(reason?: string): void, setBpm(v: number): void, get bpm(): number }}
   */
  startMetronome({ bpm = 120, slots = [1], accents = [], timbre = 'sine', level, swing = 0, onBeat = null, onStop = null } = {}) {
    this.ensure();

    // 互斥：先停掉上一路（它自己的 onStop 会把按钮复位）
    if (this.active) this.active.stop('preempted');

    const startTime = this.ctx.currentTime + 0.08;
    const state = {
      bpm: Math.min(250, Math.max(30, Math.round(bpm) || 120)),
      slots: (slots && slots.length ? slots : [1]).slice(),
      accents: (accents || []).slice(),
      timbre,
      level,
      swing: Math.min(100, Math.max(0, Number(swing) || 0)),
      absoluteSlot: 0,
      startTime,
      nextTime: startTime,
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
        if (['sine', 'square', 'triangle', 'woodblock', 'electronic', 'beep'].includes(value)) {
          state.timbre = value;
        }
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
      get startTime() { return state.startTime; },
      get accents() { return state.accents.slice(); }
    };

    this.active = handle;
    tick();
    state.timer = setInterval(tick, TICK_MS);
    return handle;
  }

  /**
   * 播放一段已解码的本地音频（用于节拍器「音频跟练」）
   * 返回的 handle 可在停止节拍器、切 Tab、被 mini 节拍器抢占时统一停掉。
   */
  playBuffer(buffer, { when = null, offset = 0, loop = false, volume = 0.7, onEnded = null } = {}) {
    const ctx = this.ensure();
    if (!buffer || !buffer.duration) return null;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = !!loop;

    const vol = Math.max(0, Math.min(1, Number(volume) || 0));
    gain.gain.value = vol;
    source.connect(gain);
    gain.connect(this.master || ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, Number(when) || (now + 0.02));
    const safeOffset = Math.max(0, Math.min(buffer.duration - 0.001, Number(offset) || 0));

    let ended = false;
    let stopped = false;

    const cleanup = () => {
      try { source.disconnect(); } catch (err) {}
      try { gain.disconnect(); } catch (err) {}
    };

    try {
      source.start(startAt, safeOffset);
    } catch (err) {
      cleanup();
      return null;
    }

    source.onended = () => {
      if (stopped) return;
      ended = true;
      cleanup();
      if (onEnded) {
        try { onEnded(); } catch (err) {}
      }
    };

    return {
      stop(fadeSeconds = 0.05) {
        if (stopped || ended) return;
        stopped = true;
        const t = ctx.currentTime;
        const fadeDur = Math.max(0.01, Math.min(0.12, Number(fadeSeconds) || 0.05));
        try {
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(Math.max(0.0002, gain.gain.value), t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + fadeDur);
        } catch (err) {}
        try { source.stop(t + fadeDur + 0.008); } catch (err) {}
        setTimeout(cleanup, Math.max(0, (fadeDur + 0.12) * 1000));
      },
      setLoop(value) { source.loop = !!value; },
      get source() { return source; },
      get ended() { return ended; }
    };
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
