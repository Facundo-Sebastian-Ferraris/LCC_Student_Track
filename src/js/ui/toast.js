export function createToast() {
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);
  return toast;
}

let toastEl = null;

export function showToast(msg, isError = false) {
  if (!toastEl) toastEl = createToast();
  toastEl.textContent = msg;
  toastEl.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toastEl.className = 'toast', 2500);
}