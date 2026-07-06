import { computeStats } from '../core/logic.js';
import { showToast } from './toast.js';

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  sidebar.innerHTML = `
    <h1>🎓 Plan LCC 1112/2013
    </h1>

    <h2>📊 Estadísticas</h2>
    <div id="stats-container"></div>

    <h2> Materia seleccionada</h2>
    <div id="node-info" class="node-info">Hacé click en un nodo para ver/editar su estado.</div>

    <h2>💾 Mi progreso</h2>
    <div id="io-buttons"></div>

    <h2> JSON manual</h2>
    <textarea id="json-input" class="json-textarea" placeholder='Pegar JSON aquí...'></textarea>
    <button class="btn" id="btn-load-json"> Cargar JSON</button>

    <h2>🎨 Leyenda</h2>
    <div id="legend-container"></div>

    <h2>⚙️ Opciones</h2>
    <div id="options-container"></div>
  `;

  return sidebar;
}

export function renderStats() {
  const stats = computeStats();
  const container = document.getElementById('stats-container');
  if (!container) return;

  container.innerHTML = `
    <div class="stat"><span>Materias totales:</span><span>${stats.total}</span></div>
    <div class="stat"><span>Aprobadas:</span><span>${stats.aprob}</span></div>
    <div class="stat"><span>Promocionadas:</span><span>${stats.promo}</span></div>
    <div class="stat"><span>Cursando/Regular:</span><span>${stats.curs}</span></div>
    <div class="stat"><span>En curso:</span><span>${stats.enCurso}</span></div>
    <div class="stat"><span>Perdidas:</span><span>${stats.perd}</span></div>
    <div class="stat"><span>Disponibles:</span><span>${stats.disp}</span></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${stats.pct}%"></div></div>
    <div class="stat"><span>% Carrera:</span><span>${stats.pct}%</span></div>
    <div class="stat"><span>Promedio simple:</span><span>${stats.promS}</span></div>
    <div class="stat"><span>Promedio ponderado:</span><span>${stats.promP}</span></div>
    <div class="stat"><span>Créditos (hs):</span><span>${stats.cred}</span></div>
  `;
}

export function renderIOButtons(handlers) {
  const container = document.getElementById('io-buttons');
  if (!container) return;

  container.innerHTML = `
    <button class="btn" id="btn-new">📄 Nuevo</button>
    <button class="btn success" id="btn-save">💾 Guardar</button>
    <button class="btn" id="btn-save-as">💾 Guardar como...</button>
    <button class="btn" id="btn-open">📂 Abrir archivo</button>
    <button class="btn warn" id="btn-export">📤 Exportar JSON</button>
    <button class="btn danger" id="btn-reset">🗑 Reset</button>
  `;

  document.getElementById('btn-new').addEventListener('click', handlers.onNew);
  document.getElementById('btn-save').addEventListener('click', handlers.onSave);
  document.getElementById('btn-save-as').addEventListener('click', handlers.onSaveAs);
  document.getElementById('btn-open').addEventListener('click', handlers.onOpen);
  document.getElementById('btn-export').addEventListener('click', handlers.onExport);
  document.getElementById('btn-reset').addEventListener('click', handlers.onReset);
}

export function renderLegend() {
  const container = document.getElementById('legend-container');
  if (!container) return;

  const items = [
    { color: '#2ECC40', label: 'Aprobado' },
    { color: '#00FFFF', label: 'Promocionado' },
    { color: '#FFD700', label: 'Cursando / Regular' },
    { color: '#5DADE2', label: 'En curso' },
    { color: '#FF00FF', label: 'Disponible' },
    { color: '#FF4136', label: 'Perdida' },
    { color: '#FF851B', label: 'No disponible' }
  ];

  container.innerHTML = items.map(i => `
    <div class="legend-item">
      <div class="legend-dot" style="border-color:${i.color}"></div>
      ${i.label}
    </div>
  `).join('');
}

export function renderOptions(handlers) {
  const container = document.getElementById('options-container');
  if (!container) return;

  container.innerHTML = `
    <label class="option-label">
      <input type="checkbox" id="chk-size" checked> Tamaño por aristas salientes
    </label>
    <label class="option-label">
      <input type="checkbox" id="chk-labels" checked> Mostrar nombres
    </label>
    <button class="btn" id="btn-relayout">🔄 Reordenar</button>
    <button class="btn" id="btn-fit">🔍 Ajustar vista</button>
  `;

  document.getElementById('chk-size').addEventListener('change', handlers.onToggleSize);
  document.getElementById('chk-labels').addEventListener('change', handlers.onToggleLabels);
  document.getElementById('btn-relayout').addEventListener('click', handlers.onRelayout);
  document.getElementById('btn-fit').addEventListener('click', handlers.onFit);
}