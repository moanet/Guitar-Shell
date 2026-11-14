// 1. 引入组件 (目前只有节拍器、阅读器，以后有了新的再加)
import './components/metronome.js';
import './components/sheet-reader.js';

// 2. 简单的页面切换逻辑
document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.view-section');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 移除所有 active
      tabBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // 激活当前点击的
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });
});
