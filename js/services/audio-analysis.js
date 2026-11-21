// ==========================================
// js/services/audio-analysis.js
// 本地音频分析：BPM + 调性（纯前端，不上传）
//
// 参考 Metronome 的 AudioAnalyzer 思路：
//   - 降采样到约 11kHz，最多取前 60 秒
//   - BPM：跳过前 5 秒，取约 30 秒，做 RMS 包络 + 正向差分 + 自相关，搜索 50–200
//   - 调性：80–2000Hz 做 8192 点 FFT，累计 12 音色度，匹配大调/小调模板
// 结果只作参考，允许用户再用 TAP 或手动修正。
// ==========================================

export function decodeAudioBuffer(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const ok = (buffer) => { if (!settled) { settled = true; resolve(buffer); } };
    const fail = (err) => { if (!settled) { settled = true; reject(err || new Error('音频解码失败')); } };
    try {
      const ret = ctx.decodeAudioData(arrayBuffer, ok, fail);
      if (ret && typeof ret.then === 'function') ret.then(ok, fail);
    } catch (err) {
      fail(err);
    }
  });
}

export function analyzeAudioBuffer(audioBuffer) {
  if (!audioBuffer || !audioBuffer.length) return { bpm: null, key: null };

  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const targetRate = 11025;
  const downsample = Math.max(1, Math.floor(sampleRate / targetRate));
  const dsRate = sampleRate / downsample;
  const maxSamples = Math.min(audioBuffer.length, Math.floor(dsRate * 60));
  const mono = new Float32Array(Math.max(1, Math.floor(maxSamples / downsample)));
  const chanData = [];

  for (let c = 0; c < channels; c++) chanData.push(audioBuffer.getChannelData(c));
  for (let i = 0; i < mono.length; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += chanData[c][i * downsample] || 0;
    mono[i] = sum / channels;
  }

  const bpm = detectBPM(mono, dsRate);

  return {
    bpm,
    key: detectKey(mono, dsRate),
    meter: detectMeter(mono, dsRate, bpm)
  };
}

function detectBPM(samples, rate) {
  const skip = Math.floor(rate * 5);
  const end = Math.min(samples.length, skip + Math.floor(rate * 30));
  const seg = samples.subarray(skip, end);
  if (seg.length < rate * 3) return null;

  const envRate = 100;
  const winSize = Math.max(1, Math.floor(rate / envRate));
  const envLen = Math.floor(seg.length / winSize);
  const env = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    let sum = 0;
    for (let j = 0; j < winSize; j++) {
      const v = seg[i * winSize + j];
      sum += v * v;
    }
    env[i] = Math.sqrt(sum / winSize);
  }

  const diff = new Float32Array(envLen);
  for (let i = 1; i < envLen; i++) diff[i] = Math.max(0, env[i] - env[i - 1]);

  const minLag = Math.floor(envRate * 60 / 200);
  const maxLag = Math.min(diff.length - 1, Math.floor(envRate * 60 / 50));
  if (maxLag <= minLag) return null;

  let bestLag = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i + lag < diff.length; i++) {
      sum += diff[i] * diff[i + lag];
      count++;
    }
    const score = count > 0 ? sum / count : 0;
    if (score > bestScore) { bestScore = score; bestLag = lag; }
  }

  let bpm = 60 * envRate / bestLag;
  while (bpm < 50) bpm *= 2;
  while (bpm > 200) bpm /= 2;
  return Math.round(bpm);
}

function detectMeter(samples, rate, bpm) {
  if (!bpm || bpm < 40) return null;

  const skip = Math.floor(rate * 5);
  const end = Math.min(samples.length, skip + Math.floor(rate * 30));
  const seg = samples.subarray(skip, end);
  if (seg.length < rate * 6) return null;

  const envRate = 100;
  const winSize = Math.max(1, Math.floor(rate / envRate));
  const envLen = Math.floor(seg.length / winSize);
  if (envLen < envRate * 4) return null;

  const env = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    let sum = 0;
    for (let j = 0; j < winSize; j++) {
      const v = seg[i * winSize + j];
      sum += v * v;
    }
    env[i] = Math.sqrt(sum / winSize);
  }

  const diff = new Float32Array(envLen);
  for (let i = 1; i < envLen; i++) diff[i] = Math.max(0, env[i] - env[i - 1]);

  const beatLag = envRate * 60 / bpm;
  if (beatLag < 4) return null;

  const corrAt = (lag) => {
    const l = Math.round(lag);
    if (l < 2 || l >= diff.length - 2) return 0;
    let num = 0, e1 = 0, e2 = 0, count = 0;
    for (let i = 0; i + l < diff.length; i++) {
      const a = diff[i], b = diff[i + l];
      num += a * b;
      e1 += a * a;
      e2 += b * b;
      count++;
    }
    const den = Math.sqrt(e1 * e2);
    return count > 1 && den > 0 ? num / den : 0;
  };

  const contrastFor = (num) => {
    const sums = new Float64Array(num);
    const counts = new Uint32Array(num);
    for (let i = 0; i < diff.length; i++) {
      const pos = ((Math.floor(i / beatLag) % num) + num) % num;
      sums[pos] += diff[i];
      counts[pos]++;
    }
    let mean = 0, nonEmpty = 0;
    for (let i = 0; i < num; i++) {
      if (counts[i]) { sums[i] /= counts[i]; mean += sums[i]; nonEmpty++; }
    }
    if (!nonEmpty) return 0;
    mean /= nonEmpty;
    if (mean <= 0) return 0;
    let variance = 0;
    for (let i = 0; i < num; i++) {
      if (!counts[i]) continue;
      const d = sums[i] - mean;
      variance += d * d;
    }
    return Math.sqrt(variance / nonEmpty) / mean;
  };

  const candidates = [
    { num: 2, den: 4, prior: 0.01 },
    { num: 3, den: 4, prior: 0.02 },
    { num: 4, den: 4, prior: 0.03 },
    { num: 6, den: 8, prior: 0 }
  ];

  const scored = candidates.map(c => {
    const corr = c.num === 6
      // 6/8 可能是「以八分音符为拍」或「以四分音符为拍」两种听觉参照，取更强的那个
      ? Math.max(corrAt(beatLag * 6), corrAt(beatLag * 3))
      : corrAt(beatLag * c.num);
    const contrast = contrastFor(c.num);
    return {
      ...c,
      corr,
      contrast,
      score: corr * 0.72 + Math.min(1, contrast * 2.2) * 0.28 + c.prior
    };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  const margin = Math.max(0, best.score - second.score);
  const confidence = Math.max(0, Math.min(1, best.score * 1.15 + margin * 2.2));
  if (best.score < 0.16 || best.contrast < 0.08 || confidence < 0.35) return null;

  return { num: best.num, den: best.den, confidence: Math.round(confidence * 100) / 100 };
}

function detectKey(samples, rate) {
  const skip = Math.floor(rate * 2);
  const end = Math.min(samples.length, skip + Math.floor(rate * 30));
  const seg = samples.subarray(skip, end);
  if (seg.length < 8192) return null;

  const fftSize = 8192;
  const hop = fftSize / 2;
  const chroma = new Float32Array(12);
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const binHz = rate / fftSize;

  for (let start = 0; start + fftSize <= seg.length; start += hop) {
    for (let i = 0; i < fftSize; i++) {
      const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (fftSize - 1));
      re[i] = seg[start + i] * w;
      im[i] = 0;
    }

    fft(re, im);

    for (let k = 1; k < fftSize / 2; k++) {
      const freq = k * binHz;
      if (freq < 80 || freq > 2000) continue;
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      if (mag < 1e-6) continue;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      chroma[pc] += mag;
    }
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += chroma[i];
  if (sum <= 0) return null;
  for (let i = 0; i < 12; i++) chroma[i] /= sum;

  return matchKey(chroma);
}

function matchKey(chroma) {
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  let bestScore = -Infinity;
  let bestKey = 'C';

  for (let root = 0; root < 12; root++) {
    const rot = new Float32Array(12);
    for (let i = 0; i < 12; i++) rot[i] = chroma[(i + root) % 12];

    const majScore = corr(rot, majorProfile);
    const minScore = corr(rot, minorProfile);
    if (majScore > bestScore) { bestScore = majScore; bestKey = names[root]; }
    if (minScore > bestScore) { bestScore = minScore; bestKey = names[root] + 'm'; }
  }

  return bestKey;
}

function corr(a, b) {
  const n = a.length;
  let meanA = 0, meanB = 0;
  for (let i = 0; i < n; i++) { meanA += a[i]; meanB += b[i]; }
  meanA /= n; meanB /= n;

  let num = 0, dA = 0, dB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    dA += da * da;
    dB += db * db;
  }

  const den = Math.sqrt(dA * dB);
  return den > 0 ? num / den : 0;
}

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = -Math.PI / half;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i + j + half] * cr - im[i + j + half] * ci;
        const vIm = re[i + j + half] * ci + im[i + j + half] * cr;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;
        const nRe = cr * wRe - ci * wIm;
        ci = cr * wIm + ci * wRe;
        cr = nRe;
      }
    }
  }
}
