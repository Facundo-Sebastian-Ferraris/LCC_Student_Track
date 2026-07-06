import { getState } from '../core/state.js';
import { showToast } from '../ui/toast.js';

export function exportToJSONString() {
  const state = getState();
  const clean = {};
  Object.entries(state).forEach(([k, v]) => {
    if (v.estado && v.estado !== 'disponible') {
      clean[k] = { estado: v.estado };
      if (typeof v.nota === 'number') clean[k].nota = v.nota;
    }
  });
  return JSON.stringify(clean, null, 2);
}

export function downloadJSON(filename = 'progreso.json') {
  const json = exportToJSONString();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(' Archivo descargado');
}

export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Copiado al portapapeles');
    }).catch(() => {
      showToast('📋 JSON en el textarea');
    });
  } else {
    showToast('📋 JSON en el textarea');
  }
}

export function readFileAsJSON(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      callback(null, data);
    } catch(err) {
      callback(err);
    }
  };
  reader.onerror = () => callback(new Error('Error leyendo archivo'));
  reader.readAsText(file);
}

// Futuro: parser XLS
// export async function parseXLS(file) { ... }