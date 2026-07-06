import { materias } from '../data/materias.js';
import { getState } from './state.js';

export function canTake(id) {
  const m = materias[id];
  if (!m) return false;
  if (!m.cursa && !m.apr) return true;

  const state = getState();

  for (const p of (m.cursa || [])) {
    const s = state[p]?.estado;
    if (!['cursando','en_curso','aprobado','promocionado'].includes(s)) return false;
  }
  for (const p of (m.apr || [])) {
    const s = state[p]?.estado;
    if (!['aprobado','promocionado'].includes(s)) return false;
  }
  return true;
}

export function computeAvailable() {
  const state = getState();
  Object.keys(materias).forEach(id => {
    const s = state[id]?.estado;
    if (!s && canTake(id)) {
      state[id] = { estado: 'disponible' };
    } else if (s === 'disponible' && !canTake(id)) {
      delete state[id];
    }
  });
}

export function getNodeColor(id) {
  const s = getState()[id]?.estado;
  return {
    'aprobado':      '#2ECC40',
    'promocionado':  '#00FFFF',
    'cursando':      '#FFD700',
    'en_curso':      '#5DADE2',
    'disponible':    '#FF00FF',
    'perdido':       '#FF4136'
  }[s] || '#FF851B';
}

export function computeStats() {
  const state = getState();
  const total = Object.keys(materias).length;
  let aprob = 0, promo = 0, curs = 0, perd = 0, disp = 0, enCurso = 0;
  let sumNotas = 0, cntNotas = 0, sumPond = 0, sumHs = 0, cred = 0;

  Object.entries(materias).forEach(([id, m]) => {
    const s = state[id]?.estado;
    const nota = state[id]?.nota;
    if (s === 'cursando') curs++;
    if (s === 'en_curso') enCurso++;
    if (s === 'aprobado') { aprob++; cred += m.hs; }
    if (s === 'promocionado') { promo++; cred += m.hs; }
    if (s === 'perdido') perd++;
    if (s === 'disponible') disp++;
    if ((s === 'aprobado' || s === 'promocionado') && typeof nota === 'number') {
      sumNotas += nota; cntNotas++;
      sumPond += nota * m.hs; sumHs += m.hs;
    }
  });

  const pct = Math.round(((aprob + promo) / total) * 100);

  return {
    total, aprob, promo, curs, enCurso, perd, disp,
    pct, cred,
    promS: cntNotas ? (sumNotas / cntNotas).toFixed(2) : '-',
    promP: sumHs ? (sumPond / sumHs).toFixed(2) : '-'
  };
}

export function getOutDegree() {
  const outDegree = {};
  Object.keys(materias).forEach(id => outDegree[id] = 0);
  Object.entries(materias).forEach(([id, m]) => {
    (m.cursa || []).forEach(p => outDegree[p] = (outDegree[p] || 0) + 1);
    (m.apr || []).forEach(p => outDegree[p] = (outDegree[p] || 0) + 1);
  });
  return outDegree;
}