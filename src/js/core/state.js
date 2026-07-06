import { MI_PROGRESO } from '../data/progreso.js';

const STORAGE_KEY = 'lcc_plan_facundo';

let userState = {};

export function getState() { return userState; }

export function setState(newState) {
  userState = newState;
  saveToStorage();
}

export function updateMateria(id, updates) {
  if (updates === null) {
    delete userState[id];
  } else {
    userState[id] = { ...userState[id], ...updates };
  }
  saveToStorage();
}

export function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
  } catch(e) {}
}

export function loadFromStorage() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      userState = JSON.parse(s);
      return true;
    }
  } catch(e) {}
  return false;
}

export function loadDefaultProgress() {
  userState = JSON.parse(JSON.stringify(MI_PROGRESO));
  saveToStorage();
}

export function resetAll() {
  userState = {};
  localStorage.removeItem(STORAGE_KEY);
}

export function loadFromJSON(data) {
  userState = {};
  Object.entries(data).forEach(([k, v]) => {
    const key = String(k).trim();  // Quitar espacios
    if (v && v.estado) {
      const estado = String(v.estado).trim();  // Quitar espacios
      userState[key] = { estado };
      if (typeof v.nota === 'number') userState[key].nota = v.nota;
    }
  });
  saveToStorage();
}

export async function loadFromRemoteFile(url) {
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      loadFromJSON(data);
      return true;
    }
  } catch(e) {}
  return false;
}