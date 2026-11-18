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
}
loadComponents();

// 🌟 注册 PWA 离线缓存 (Service Worker)
if ('serviceWorker' in navigator) {
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


loadComponents();
