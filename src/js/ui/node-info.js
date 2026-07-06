import { materias } from '../data/materias.js';
import { getOutDegree, getNodeColor } from '../core/logic.js';
import { getState, updateMateria } from '../core/state.js';
import { showToast } from './toast.js';

// Estado temporal del cambio pendiente
let pendingState = null;
let currentId = null;

export function renderNodeInfo(id, onNodeUpdate) {
  const container = document.getElementById('node-info');
  if (!container) return;

  const m = materias[id];
  if (!m) {
    container.innerHTML = 'Materia no encontrada';
    return;
  }

  const state = getState();
  const s = state[id]?.estado || 'no disponible';
  const nota = state[id]?.nota;
  const outDegree = getOutDegree();

  // Resetear estado pendiente al seleccionar un nuevo nodo
  pendingState = null;
  currentId = id;

  container.innerHTML = `
    <div class="title">${id}. ${m.n}</div>
    <div>Año ${m.y} · C${m.c} · ${m.hs}hs · Habilita: ${outDegree[id]} materias</div>
    <div>Estado actual: <b style="color:${getNodeColor(id)}">${s}</b></div>
    ${nota !== undefined ? `<div>Nota: <b>${nota}</b></div>` : ''}
    <div class="status-btns" style="margin-top:6px;">
      <button class="btn status-option" data-status="en_curso">🔵 En curso</button>
      <button class="btn status-option" data-status="cursando">🟡 Regular</button>
      <button class="btn status-option" data-status="aprobado">🟢 Aprobado</button>
      <button class="btn status-option" data-status="promocionado">🔵 Promocionado</button>
      <button class="btn status-option" data-status="perdido">🔴 Perdida</button>
      <button class="btn danger status-option" data-status="null"> Limpiar</button>
    </div>
    <div id="confirm-actions" style="margin-top:8px; display:none;">
      <div style="font-size:11px; color:#4cc9f0; margin-bottom:4px;">
        Cambio pendiente: <b id="pending-label">-</b>
      </div>
      <button class="btn success" id="btn-accept">✅ Aceptar</button>
      <button class="btn danger" id="btn-cancel">❌ Cancelar</button>
    </div>
    <div style="margin-top:6px;">
      Nota: <input type="number" id="nota-input" min="0" max="10" step="0.01" value="${nota !== undefined ? nota : ''}" style="width:60px;">
      <button class="btn success" id="btn-save-nota">💾</button>
    </div>
  `;

  // Bind de botones de estado (solo marcan como pendiente)
  container.querySelectorAll('.status-option').forEach(btn => {
    btn.addEventListener('click', () => {
      // Quitar selección visual de todos
      container.querySelectorAll('.status-option').forEach(b => {
        b.style.outline = 'none';
        b.style.opacity = '0.7';
      });
      // Marcar el seleccionado
      btn.style.outline = '2px solid #ffffff';
      btn.style.opacity = '1';

      const status = btn.dataset.status === 'null' ? null : btn.dataset.status;
      pendingState = status;

      // Mostrar panel de confirmación
      const confirmPanel = document.getElementById('confirm-actions');
      const pendingLabel = document.getElementById('pending-label');
      pendingLabel.textContent = status === null ? 'Limpiar estado' : status;
      confirmPanel.style.display = 'block';
    });
  });

  // Botón Aceptar
  document.getElementById('btn-accept').addEventListener('click', () => {
    if (pendingState !== null) {
      updateMateria(id, { estado: pendingState });
      showToast(`✅ Estado cambiado a: ${pendingState}`);
    } else {
      // Si pendingState es null (limpiar), también aplicamos
      updateMateria(id, { estado: null });
      showToast('🗑 Estado limpiado');
    }
    pendingState = null;
    onNodeUpdate(id);
  });

  // Botón Cancelar
  document.getElementById('btn-cancel').addEventListener('click', () => {
    pendingState = null;
    showToast('❌ Cambio cancelado');
    onNodeUpdate(id);
  });

  // Botón guardar nota (este sí se aplica directo, es independiente)
  document.getElementById('btn-save-nota').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('nota-input').value);
    if (!isNaN(val) && val >= 0 && val <= 10) {
      updateMateria(id, { nota: val });
      showToast(`Nota ${val} guardada para ${id}. ${m.n}`);
      onNodeUpdate(id);
    }
  });
}