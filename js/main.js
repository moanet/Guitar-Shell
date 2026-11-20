import { APP_VERSION } from './services/version.js';
import { showToast } from './services/toast.js';
import { initTheme } from './services/theme.js';

// 主题只认 html[data-theme]；冷启动时再同步一次浏览器与原生系统栏
initTheme();

const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.view-section');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
    // 🌟 广播切换事件：组件据此停掉不该继续发声的东西（如读谱页的 mini 节拍器）
    window.dispatchEvent(new CustomEvent('app-tab-changed', { detail: { target: targetId } }));
  });
});

// 自动获取基础路径：本地 / ，GitHub Pages /GuitarShell/
function getBasePath() {
  const path = location.pathname;
  // GitHub Pages 仓库子目录模式
  if (path.startsWith('/GuitarShell/')) {
    return '/GuitarShell/';
  }
  return '/';
}
const base = getBasePath();

async function loadComponents() {
  try { await import(`${base}js/components/metronome.js`); } catch (e) { console.error('节拍器加载失败', e); }
  try { await import(`${base}js/components/sheet-reader.js`); } catch (e) { console.error('读谱器加载失败', e); }
  try { await import(`${base}js/components/practice-log.js`); } catch (e) { console.error('记录组件加载失败', e); }
  // 🌟 新增调音器
  try { await import(`${base}js/components/tuner.js`); } catch (e) { console.error('调音器加载失败', e); }
  // 🌟 全局设置抽屉
  try { await import(`${base}js/components/settings.js`); } catch (e) { console.error('全局设置加载失败', e); }
}
loadComponents();

// ==================== ⚙ 全局设置入口 ====================
const settingsBtn = document.getElementById('btnGlobalSettings');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    const panel = document.querySelector('guitar-settings');
    if (panel) panel.open();
    else showToast('全局设置正在加载…');
  });
}

// ==================== 🏷️ 版本徽标 ====================
// 目的：一眼看出「现在跑的是哪版」，并区分「线上已有新版」与「本机缓存没换」
const CACHE_PREFIX = 'guitar-shell-v';
const badge = document.getElementById('appVersion');

// 线上 sw.js 里写的版本号（带时间戳绕开 CDN 缓存，只看内容不看响应头）
const readLiveVersion = async () => {
  const res = await fetch(`${base}sw.js?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const hit = text.match(/APP_VERSION\s*=\s*'([^']+)'/);
  return hit ? hit[1] : '';
};

// 当前浏览器里实际存着的离线缓存版本（可能落后于运行版本）
const readCacheVersion = async () => {
  if (!('caches' in window)) return '';
  const names = await caches.keys();
  const versions = names.filter(n => n.startsWith(CACHE_PREFIX)).map(n => n.slice(CACHE_PREFIX.length));
  return versions.sort().pop() || '';
};

const paintBadge = (liveVersion) => {
  if (liveVersion && liveVersion !== APP_VERSION) {
    badge.textContent = `v${APP_VERSION} → v${liveVersion}`;
    badge.classList.add('has-update');
    badge.title = `线上已是 v${liveVersion}，点我重新加载`;
  } else {
    badge.textContent = `v${APP_VERSION}`;
    badge.classList.remove('has-update');
    badge.title = '点按检查线上版本';
  }
};

if (badge) {
  paintBadge();
  badge.addEventListener('click', async () => {
    if (badge.disabled) return;
    badge.disabled = true;
    const restore = badge.textContent;
    badge.textContent = '检查中…';
    try {
      const live = await readLiveVersion();
      const cached = await readCacheVersion();
      paintBadge(live);

      if (live && live !== APP_VERSION) {
        const go = confirm(`本机运行 v${APP_VERSION}，线上已是 v${live}。\n现在重新加载拉取新版本？（离线缓存会一起换掉）`);
        if (go) {
          const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
          if (reg) await reg.update().catch(() => {});
          location.reload();
          return;
        }
        showToast(`发现新版 v${live}，需重载后生效`);
      } else {
        showToast(cached && cached !== APP_VERSION
          ? `运行 v${APP_VERSION}，离线缓存是 v${cached}，重载一次即可对齐`
          : `v${APP_VERSION} 已是最新`);
      }
    } catch (err) {
      badge.textContent = restore;
      showToast('读不到线上版本（离线或网络不通），先按当前版本用');
    } finally {
      badge.disabled = false;
    }
  });

  // 进页面后静默查一次：线上有新版就把徽标染色，但不打断操作
  window.addEventListener('load', () => {
    setTimeout(() => { readLiveVersion().then(paintBadge).catch(() => {}); }, 1500);
  });
}

// 🌟 注册 PWA 离线缓存 (Service Worker)
// APK / Capacitor 内资源已本地打包，SW 只会多一层缓存风险；壳内跳过，网页端保留
const isNativeShell = () => Boolean(
  window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()
);
if ('serviceWorker' in navigator && !isNativeShell()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`)
      .then(reg => {
        console.log('Guitar Shell 离线引擎已就绪！', reg.scope);
      })
      .catch(err => {
        console.warn('离线引擎注册失败:', err);
      });
  });
}
