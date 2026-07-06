import { materias } from '../data/materias.js';
import { getState } from '../core/state.js';
import { getNodeColor, getOutDegree } from '../core/logic.js';

let cy = null;

export function initGraph(container) {
  const elements = buildElements();

  cy = cytoscape({
    container: container,
    elements: elements,
    style: buildStyles(),
    layout: {
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 60,
      rankSep: 110,
      edgeSep: 15,
      spacingFactor: 0.75,
      ranker: 'network-simplex'
    },
    minZoom: 0.2,
    maxZoom: 3,
    wheelSensitivity: 0.1
  });

  setupHoverEffects(cy);

  return cy;
}

function setupHoverEffects(cy) {
  // HOVER: agrandar nodo (solo si NO está seleccionado)
  cy.on('mouseover', 'node', (evt) => {
    const node = evt.target;
    if (node.selected()) return; // Ignorar si está seleccionado

    const size = node.data('size');
    node.data('originalSize', size);

    node.style({
      'width': size * 2,
      'height': size * 2,
      'border-width': 8,
      'font-size': '30px',
      'z-index': 999
    });
  });

  // MOUSEOUT: restaurar tamaño (solo si NO está seleccionado)
  cy.on('mouseout', 'node', (evt) => {
    const node = evt.target;
    if (node.selected()) return; // Ignorar si está seleccionado

    const originalSize = node.data('originalSize') || node.data('size');

    node.style({
      'width': originalSize,
      'height': originalSize,
      'border-width': 3,
      'font-size': '10px',
      'z-index': 1
    });
  });

  // SELECT: cuando se hace click en un nodo
  cy.on('select', 'node', (evt) => {
    const node = evt.target;
    const originalSize = node.data('originalSize') || node.data('size');

    node.style({
      'width': originalSize,
      'height': originalSize,
      'border-width': 5,
      'border-color': '#ffffff',  // Borde blanco = selección
      'font-size': '10px',
      'z-index': 999
    });
  });

  // UNSELECT: cuando se deselecciona (click en otro lado)
  cy.on('unselect', 'node', (evt) => {
    const node = evt.target;
    const size = node.data('size');

    node.style({
      'width': size,
      'height': size,
      'border-width': 3,
      'border-color': getNodeColor(node.id()),  // Restaurar color del estado
      'font-size': '10px',
      'z-index': 1
    });
  });

  cy.on('tap', (evt) => {
  // Si el click fue en el fondo (el cy mismo) y no en un nodo
  if (evt.target === cy) {
    cy.elements().unselect();
  }
});

}


function buildElements() {
  const elements = [];

  // Calcular outDegree para determinar tamaños
  const outDegree = {};
  Object.keys(materias).forEach(id => outDegree[id] = 0);
  Object.entries(materias).forEach(([id, m]) => {
    (m.cursa || []).forEach(p => outDegree[p] = (outDegree[p] || 0) + 1);
    (m.apr || []).forEach(p => outDegree[p] = (outDegree[p] || 0) + 1);
  });

  const maxOut = Math.max(...Object.values(outDegree));

  // Crear nodos con size calculado
  Object.entries(materias).forEach(([id, m]) => {
    const base = 70;
    const extra = (outDegree[id] / maxOut) * 45;
    const size = base + extra;

    elements.push({
      data: {
        id: id,
        label: `${id}. ${m.n}`,
        year: m.y,
        hs: m.hs,
        size: size  // Ahora size está definido
      }
    });
  });

  // Crear aristas
  Object.entries(materias).forEach(([id, m]) => {
    (m.cursa || []).forEach(p => {
      elements.push({ data: { source: String(p), target: id, type: 'cursa' } });
    });
    (m.apr || []).forEach(p => {
      elements.push({ data: { source: String(p), target: id, type: 'apr' } });
    });
  });

  return elements;
}

function buildStyles() {
  return [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-wrap': 'wrap',
        'text-max-width': '120px',
        'text-valign': 'center',
        'text-halign': 'center',
        // 'text-overflow-wrap': 'break-word',
        'color': '#eaeaea',
        'font-size': '10px',
        'background-color': 'black',
        'border-width': 3,
        'border-color': '#FF851B',
        'shape': 'ellipse',
        'width': 'data(size)',
        'height': 'data(size)',
      }
    },
    {
      selector: 'edge[type="cursa"]',
      style: {
        'width': 1.5, 'line-style': 'dashed',
        'line-color': '#4a4a6a', 'target-arrow-color': '#4a4a6a',
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier',
        'arrow-scale': 1, 'opacity': 0.4
      }
    },
    {
      selector: 'edge[type="apr"]',
      style: {
        'width': 1.5, 'line-style': 'solid',
        'line-color': '#4a4a6a', 'target-arrow-color': '#4a4a6a',
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier',
        'arrow-scale': 1, 'opacity': 0.4
      }
    },
    {
      selector: 'node:selected',
      style: { 'border-width': 5, 'border-color': '#ffffff' }
    }
  ];
}

export function updateGraph() {
  if (!cy) return;

  const state = getState();
  const useSize = document.getElementById('chk-size')?.checked ?? true;
  const showLabels = document.getElementById('chk-labels')?.checked ?? true;
  const outDegree = getOutDegree();
  const maxOut = Math.max(...Object.values(outDegree));

  cy.nodes().forEach(n => {
    const id = n.id();
    n.style('border-color', getNodeColor(id));
    const base = 55;
    const extra = useSize ? (outDegree[id] / maxOut) * 45 : 0;
    const size = base + extra;
    n.style('width', size);
    n.style('height', size);
    n.style('padding', size * 0.35);
    n.style('label', showLabels ? `${id}. ${materias[id].n}` : String(id));
  });

  updateEdges();
}

function updateEdges() {
  const state = getState();
  cy.edges().forEach(e => {
    const srcId = e.source().id();
    const srcState = state[srcId]?.estado;
    const type = e.data('type');

    let isActive = false;
    if (type === 'cursa') {
      isActive = ['cursando', 'en_curso', 'aprobado', 'promocionado'].includes(srcState);
    } else if (type === 'apr') {
      isActive = ['aprobado', 'promocionado'].includes(srcState);
    }

    if (isActive) {
      const color = getNodeColor(srcId);
      e.style('line-color', color);
      e.style('target-arrow-color', color);
      e.style('width', type === 'apr' ? 2.5 : 2);
      e.style('opacity', 1);
    } else {
      e.style('line-color', '#4a4a6a');
      e.style('target-arrow-color', '#4a4a6a');
      e.style('width', 1.5);
      e.style('opacity', 0.4);
    }
  });
}

export function relayout() {
  if (!cy) return;
  cy.layout({
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 60,
    rankSep: 110,
    edgeSep: 15,
    spacingFactor: 0.75,
    ranker: 'network-simplex',
    animate: true
  }).run();
}

export function fitView() {
  if (!cy) return;

  // Animación fluida del fit
  cy.animate({
    fit: {
      eles: cy.elements(),
      padding: 40
    },
    duration: 750,  // Duración en milisegundos
    easing: 'ease-in-out'  // Suavizado
  });
}

export function onNodeTap(callback) {
  if (!cy) return;
  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    const id = node.id();

    // Llamar al callback para actualizar la info del nodo
    callback(id);

    // Animación de centrado y zoom
    cy.animate({
      center: {
        eles: node
      },
      zoom: 1.5,  // Nivel de zoom (1.5 a 2 es cómodo)
      duration: 700,
      easing: 'ease-in-out'
    });
  });
}

export function getCy() { return cy; }

// Y agregá esta función exportada al final del archivo:
export function onBackgroundTap(callback) {
  if (!cy) return;
  cy.on('tap', (evt) => {
    if (evt.target === cy) callback();
  });
}

export function deselectAll() {
  if (!cy) return;
  cy.elements().unselect();
}