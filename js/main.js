// 绑定顶部导航切换逻辑
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

// 独立加载组件，防止某一个组件报错导致全盘崩溃
async function loadComponents() {
  // 🌟 修复：全部改回相对于当前目录的 ./ 路径
  try { await import('./components/metronome.js'); } catch (e) { console.error('节拍器加载失败', e); }
  try { await import('./components/sheet-reader.js'); } catch (e) { console.error('读谱器加载失败', e); }
  try { await import('./components/practice-log.js'); } catch (e) { console.error('记录组件加载失败', e); }
  try { await import('./components/tuner.js'); } catch (e) { console.error('调音器加载失败', e); }
}

loadComponents();

// 🌟 注册 PWA 离线缓存 (Service Worker)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 动态计算绝对路径（根据当前 main.js 的位置往上一级找 sw.js）
    const swUrl = new URL('../sw.js', import.meta.url).href;
    
    navigator.serviceWorker.register(swUrl)
      .then(reg => {
        console.log('Guitar Shell 离线引擎已就绪！', reg.scope);
      })
      .catch(err => {
        console.warn('离线引擎注册失败:', err);
      });
  });
}
