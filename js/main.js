const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.view-section');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
  });
});

async function loadComponents() {
  // 强制使用相对于根目录的绝对路径，防止因为目录嵌套导致的多层路径
  try { await import('/js/components/metronome.js'); } catch (e) { console.error('节拍器加载失败', e); }
  try { await import('/js/components/sheet-reader.js'); } catch (e) { console.error('读谱器加载失败', e); }
  try { await import('/js/components/practice-log.js'); } catch (e) { console.error('记录组件加载失败', e); }
    // 🌟 新增调音器
  try { await import('/js/components/tuner.js'); } catch (e) { console.error('调音器加载失败', e); }
}

// 🌟 注册 PWA 离线缓存 (Service Worker)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('Guitar Shell 离线引擎已就绪！', reg.scope);
      })
      .catch(err => {
        console.warn('离线引擎注册失败:', err);
      });
  });
}

loadComponents();
