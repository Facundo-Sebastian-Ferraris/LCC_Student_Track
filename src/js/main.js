import { createSidebar, renderStats, renderIOButtons, renderLegend, renderOptions } from './ui/sidebar.js';
import { renderNodeInfo } from './ui/node-info.js';
import { showToast } from './ui/toast.js';
import { initGraph, updateGraph, relayout, fitView, onNodeTap, onBackgroundTap, deselectAll } from './graph/cytoscape.js';
import { loadFromStorage, loadDefaultProgress, resetAll, loadFromJSON, loadFromRemoteFile, updateMateria, getState } from './core/state.js';
import { computeAvailable } from './core/logic.js';
import { exportToJSONString, copyToClipboard } from './io/file-io.js';
import { saveAsNative, openNative } from './io/desktop-io.js';
import { parseGuaraniXLS } from './io/guarani-parser.js';


// ====== Inicialización ======
const app = document.getElementById('app');

// 1. Crear estructura DOM
const sidebar = createSidebar();
const graphContainer = document.createElement('div');
graphContainer.className = 'graph-container';
app.appendChild(sidebar);
app.appendChild(graphContainer);

// 2. Renderizar UI estática
renderLegend();

// 3. Inicializar grafo
const cy = initGraph(graphContainer);

// 4. Cargar estado
async function init() {
  const loaded = await loadFromRemoteFile('progreso.json');
  if (!loaded) {
    // Si no hay archivo remoto, intentar cargar de localStorage
    if (!loadFromStorage()) {
      // Si no hay nada guardado, empezar VACÍO (no cargar MI_PROGRESO)
      console.log('Iniciando con estado vacío');
    }
  }
  refreshAll();
  cy.fit(null, 40);

  setTimeout(() => {
    relayout();
    cy.fit(null, 40);
  }, 100);
}

function refreshAll() {
  computeAvailable();
  updateGraph();
  renderStats();

    setTimeout(() => {
    fitView();
  }, 100);
}

// 5. Bind handlers
function setupHandlers() {
  renderIOButtons({
    onNew: () => {
      if (confirm('¿Crear nuevo progreso? Se perderán los cambios no guardados.')) {
        resetAll();
        refreshAll();
        showToast('📄 Nuevo progreso creado');
      }
    },
    onSave: async () => {
      const state = getState();
      const filePath = await saveAsNative(state, 'progreso.json');
      if (filePath) {
        showToast(`💾 Guardado en: ${filePath}`);
      }
    },
    onSaveAs: async () => {
      const name = prompt('Nombre del archivo:', 'progreso.json');
      if (name && name.trim()) {
        const state = getState();
        const filePath = await saveAsNative(state, name.trim());
        if (filePath) {
          showToast(`💾 Guardado como: ${filePath}`);
        }
      }
    },
    onOpen: async () => {
    try {
        const result = await openNative();

        if (!result) return;

        console.log('📦 Resultado de openNative:', result);

        let dataToLoad = null;

        if (result.type === 'json') {
        console.log('✅ Es JSON, cargando directamente');
        dataToLoad = result.data;
        } else if (result.type === 'xls') {
        console.log('📊 Es XLS, intentando parsear...');
        console.log('📊 Datos binarios:', result.data);

        if (window.XLSX) {
            console.log('✅ Librería XLSX disponible');
            const parsedData = parseGuaraniXLS(result.data);
            console.log('📋 Datos parseados:', parsedData);

            if (parsedData && Object.keys(parsedData).length > 0) {
            dataToLoad = parsedData;
            console.log('✅ Datos listos para cargar:', dataToLoad);
            } else {
            console.error('❌ El parser no retornó datos válidos');
            showToast('❌ No se pudieron extraer materias del archivo', true);
            return;
            }
        } else {
            console.error('❌ Librería XLSX no cargada');
            showToast('❌ Librería XLSX no cargada', true);
            return;
        }
        }

        if (dataToLoad) {
        console.log('🔄 Llamando a loadFromJSON con:', dataToLoad);
        loadFromJSON(dataToLoad);
        console.log('✅ loadFromJSON completado, refrescando...');
        refreshAll();
        setTimeout(() => {
            relayout();
            fitView();
        }, 150);
        console.log('✅ Grafo actualizado');
        }
    } catch (err) {
        console.error('❌ Error en onOpen:', err);
        showToast('❌ Error al abrir: ' + err.message, true);
    }
    },
    onExport: () => {
      const json = exportToJSONString();
      const textarea = document.getElementById('json-input');
      if (textarea) textarea.value = json;
      copyToClipboard(json);
    },
    onReset: () => {
      if (confirm('¿Borrar TODO el progreso?')) {
        resetAll();
        refreshAll();
        showToast('🗑 Progreso borrado');
      }
    }
  });

  renderOptions({
    onToggleSize: refreshAll,
    onToggleLabels: refreshAll,
    onRelayout: () => { relayout(); },
    onFit: () => { fitView(); }
  });

  onNodeTap((id) => {
    renderNodeInfo(id, (updatedId) => {
      refreshAll();
      renderNodeInfo(updatedId, arguments.callee);

      setTimeout(() => {
        fitView();
      }, 150);
    });
  });

  onBackgroundTap(() => {
  // Limpiar el panel de información
  const nodeInfo = document.getElementById('node-info');
  if (nodeInfo) {
    nodeInfo.innerHTML = 'Hacé click en un nodo para ver/editar su estado.';
  }
});
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    deselectAll();
    showToast('️ Selección cancelada');
    nodeInfo.innerHTML = 'Hacé click en un nodo para ver/editar su estado.';
  }
});
// ====== Boot ======
setupHandlers();
init();