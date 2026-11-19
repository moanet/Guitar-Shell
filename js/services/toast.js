// 全局轻提示：统一挂在 body，不受组件 shadow DOM 影响
let toastEl = null;
let toastTimer = 0;

export function showToast(text, duration = 2800) {
  if (!text) return;
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'app-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}
