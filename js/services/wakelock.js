// ==========================================
// js/services/wakelock.js
// 作用：练琴时的「屏幕常亮」统一控制器
//
// 为什么需要两层：
//   - 网页 / PWA：Screen Wake Lock API 是标准做法，但必须在用户手势和页面可见时申请；
//   - Android WebView：原生 FLAG_KEEP_SCREEN_ON 更可靠，通过 Capacitor KeepAwake 插件调用；
//   - 多个页面可能同时需要常亮（读谱 + 迷你节拍器、调音），用引用计数避免一方释放把另一方也关掉。
//
// 约定：acquire('reader') / release('reader')，同一 reason 重复调用是幂等的。
// ==========================================

const reasons = new Set();
let webLock = null;
let nativeOn = false;
let nativeFailed = false;
let listenersBound = false;
let syncPromise = Promise.resolve();

const isNativePlatform = () => {
  try {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  } catch (err) {
    return false;
  }
};

const getNativePlugin = () => {
  if (!isNativePlatform()) return null;
  try {
    const cap = window.Capacitor;
    if (!cap) return null;

    // 若未来引入了 @capacitor/core 的 registerPlugin，这里可直接拿到代理
    if (cap.Plugins && cap.Plugins.KeepAwake) return cap.Plugins.KeepAwake;

    // 当前零构建壳只注入了 native-bridge.js：Plugins 命名空间不存在，
    // 必须走 nativePromise(pluginId, methodName) 才到得了原生层。
    if (typeof cap.nativePromise === 'function') {
      return {
        enable: () => cap.nativePromise('KeepAwake', 'enable', {}),
        disable: () => cap.nativePromise('KeepAwake', 'disable', {}),
        isEnabled: () => cap.nativePromise('KeepAwake', 'isEnabled', {})
      };
    }
    return null;
  } catch (err) {
    return null;
  }
};

const isVisible = () => document.visibilityState !== 'hidden';
const shouldHold = () => reasons.size > 0 && isVisible();

async function enable() {
  if (webLock || nativeOn) return;

  // 壳内优先原生窗口 flag：不依赖 WebView 对 Wake Lock API 的支持
  const plugin = getNativePlugin();
  if (plugin && !nativeFailed && typeof plugin.enable === 'function') {
    try {
      await plugin.enable();
      nativeOn = true;
      return;
    } catch (err) {
      nativeFailed = true;
      console.warn('原生常亮不可用，回退 Web Wake Lock:', err);
    }
  }

  if (!navigator.wakeLock) return;
  try {
    webLock = await navigator.wakeLock.request('screen');
    // 系统可能在切后台 / 电量策略下主动收回，回到前台时自动补申请
    webLock.addEventListener('release', () => {
      webLock = null;
      if (shouldHold()) schedule();
    });
  } catch (err) {
    webLock = null;
    console.warn('屏幕常亮申请失败:', err);
  }
}

async function disable() {
  if (nativeOn) {
    nativeOn = false;
    try {
      const plugin = getNativePlugin();
      if (plugin && typeof plugin.disable === 'function') await plugin.disable();
    } catch (err) {}
  }
  if (webLock) {
    const lock = webLock;
    webLock = null;
    try { await lock.release(); } catch (err) {}
  }
}

async function sync() {
  if (shouldHold()) await enable();
  else await disable();
}

function schedule() {
  syncPromise = syncPromise.then(sync).catch((err) => {
    console.warn('屏幕常亮状态同步失败:', err);
  });
  return syncPromise;
}

function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;
  document.addEventListener('visibilitychange', () => schedule());
  // 页面真正卸载时清空需求，避免下次冷启动残留
  window.addEventListener('pagehide', () => {
    reasons.clear();
    schedule();
  });
}

export const wakeLock = {
  acquire(reason = 'default') {
    bindListeners();
    reasons.add(reason);
    return schedule();
  },
  release(reason = 'default') {
    reasons.delete(reason);
    return schedule();
  },
  releaseAll() {
    reasons.clear();
    return schedule();
  },
  get active() {
    return !!(webLock || nativeOn);
  },
  get reasons() {
    return Array.from(reasons);
  },
  get mode() {
    if (nativeOn) return 'native';
    if (webLock) return 'web';
    return 'none';
  }
};

// 调试 / 浏览器验收用：只读快照
export const wakeLockState = () => ({
  active: wakeLock.active,
  mode: wakeLock.mode,
  reasons: wakeLock.reasons,
  visible: isVisible(),
  supported: !!(navigator.wakeLock || getNativePlugin())
});
