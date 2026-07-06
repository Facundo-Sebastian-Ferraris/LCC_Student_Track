import { showToast } from '../ui/toast.js';

// Mapeo de códigos de materia del Guaraní a IDs del programa
const CODIGO_TO_ID = {
  // Ciclo Básico / Común
  '00628': '1',  // ELEMENTOS DE ÁLGEBRA
  '00629': '2',  // RESOLUCIÓN DE PROBLEMAS Y ALGORITMOS
  '00630': '3',  // INTRODUCCIÓN A LA COMPUTACIÓN
  '00631': '4',  // MODELOS Y SISTEMAS DE INFORMACIÓN
  '00632': '5',  // DESARROLLO DE ALGORITMOS
  '00633': '6',  // ELEMENTOS DE ÁLGEBRA LINEAL
  '00634': '7',  // ELEMENTOS DE TEORÍA DE LA COMPUTACIÓN
  '00635': '8',  // MODELADO DE DATOS

  // 2do año
  '00636': '9',  // CÁLCULO DIFERENCIAL E INTEGRAL
  '00637': '10', // PROGRAMACIÓN ORIENTADA A OBJETOS
  '00638': '11', // ESTRUCTURAS DE DATOS
  '00639': '12', // TEORÍA DE LA COMPUTACIÓN I
  '00640': '13', // INGLÉS TÉCNICO I
  '00641': '14', // MÉTODOS COMPUTACIONALES PARA EL CÁLCULO
  '00642': '15', // PROGRAMACIÓN CONCURRENTE
  '00643': '16', // TEORÍA DE LA COMPUTACIÓN II
  '00644': '17', // ARQUITECTURAS Y ORGANIZACIÓN DE COMPUTADORAS I
  '00645': '18', // INGENIERÍA DE REQUERIMIENTOS
  '00646': '19', // INGLÉS TÉCNICO II

  // 3er año
  '00647': '20', // PROBABILIDAD Y ESTADÍSTICA
  '00648': '21', // PRINCIPIOS DE LENGUAJES DE PROGRAMACIÓN
  '00649': '22', // SISTEMAS OPERATIVOS I
  '00650': '23', // DISEÑO DE BASES DE DATOS
  '00651': '24', // ARQUITECTURAS DE SOFTWARE
  '00652': '25', // ANÁLISIS DE ALGORITMOS
  '00653': '26', // LABORATORIO DE PROGRAMACIÓN
  '00654': '27', // LÓGICA PARA CIENCIAS DE LA COMPUTACIÓN
  '00655': '28', // REDES DE COMPUTADORAS I
  '00656': '29', // GESTIÓN DE PROYECTOS DE DESARROLLO DE SOFTWARE
  '00657': '30', // GESTIÓN DE BASES DE DATOS

  // 4to año
  '00658': '31', // LENGUAJES DECLARATIVOS
  '00659': '32', // COMPLEJIDAD COMPUTACIONAL
  '00660': '33', // SISTEMAS PARALELOS
  '00661': '34', // ESPECIFICACIÓN DE SOFTWARE
  '00662': '35', // DISEÑO DE ALGORITMOS
  '00663': '36', // INTELIGENCIA ARTIFICIAL
  '00664': '37', // CONCEPTOS AVANZADOS DE LENGUAJES DE PROGRAMACIÓN
  '00665': '38', // ESPECIFICACIÓN CON MÉTODOS FORMALES
  '00666': '39', // ASPECTOS PROFESIONALES Y SOCIALES

  // 5to año
  '00667': '40', // SISTEMAS INTELIGENTES
  '00668': '41', // AGENTES INTELIGENTES PARA LA WEB
  '00669': '42', // DISEÑO DE COMPILADORES E INTÉRPRETES
  '00670': '43', // LABORATORIO DE PROGRAMACIÓN DISTRIBUÍDA
  '00671': '44', // LABORATORIO DE COMPILADORES E INTÉRPRETES
  '00672': '45', // LABORATORIO DE INTELIGENCIA ARTIFICIAL
  '00673': '46', // TÉCNICAS PARA MINERÍA DE DATOS
  '00676': '47'  // TRABAJO DE TESIS
};

export function parseGuaraniXLS(data) {
  try {
    console.log('🔍 Iniciando parseo de XLS...');

    if (!window.XLSX) {
      console.error('❌ Librería XLSX no disponible');
      showToast('❌ Librería XLSX no cargada', true);
      return null;
    }

    // Leer el workbook
    const workbook = window.XLSX.read(data, { type: 'array' });
    console.log('📊 Workbook leído, hojas:', workbook.SheetNames);

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    console.log('📋 Total de filas:', rows.length);

    const progress = {};
    let materiasProcesadas = 0;
    let materiasNoEncontradas = [];
    let electivasIgnoradas = 0;

    // Recorrer todas las filas
    rows.forEach((row, rowIndex) => {
      if (!row || row.length < 5) return;

      const materiaCell = row[0];
      const notaCell = row[4];

      if (!materiaCell || typeof materiaCell !== 'string') return;

      // Extraer código de materia (número entre paréntesis)
      const codigoMatch = materiaCell.match(/\((\d{5})\)/);
      if (!codigoMatch) return;

      const codigoMateria = codigoMatch[1];
      const nombreMateria = materiaCell.split('(')[0].trim();

      // Ignorar materias sin nota (pendientes)
      if (!notaCell || typeof notaCell !== 'string' || notaCell.trim() === '') {
        return;
      }

      // Ignorar electivas (tienen sufijos (-), (*), (!) al final del código)
      if (materiaCell.match(/\(\d{5}\)\s*[\(\[\{]?\s*[-*!]/)) {
        electivasIgnoradas++;
        return;
      }

      // Extraer nota y estado
      const notaMatch = notaCell.match(/^(\d+)\s*\((Aprobado|Promocionado|Regular|Libre)\)/i);
      if (!notaMatch) {
        console.log(`⏭️ Fila ${rowIndex}: ${nombreMateria} - nota no reconocida: "${notaCell}"`);
        return;
      }

      const nota = parseInt(notaMatch[1]);
      const estadoRaw = notaMatch[2].toLowerCase();

      // Mapear estado
      let estado = null;
      if (estadoRaw === 'promocionado') {
        estado = 'promocionado';
      } else if (estadoRaw === 'aprobado') {
        estado = 'aprobado';
      } else if (estadoRaw === 'regular') {
        estado = 'cursando';
      }

      if (!estado) return;

      // Buscar ID de la materia por código
      const materiaId = CODIGO_TO_ID[codigoMateria];

      if (materiaId) {
        progress[materiaId] = { estado, nota };
        materiasProcesadas++;
        console.log(`✅ ${nombreMateria} (${codigoMateria}) → ID ${materiaId}: ${estado} con nota ${nota}`);
      } else {
        materiasNoEncontradas.push(`${nombreMateria} (${codigoMateria})`);
        console.log(`❌ ${nombreMateria} (${codigoMateria}) no está en el mapeo`);
      }
    });

    console.log('\n📊 Resumen del parseo:');
    console.log('  Materias procesadas:', materiasProcesadas);
    console.log('  Electivas ignoradas:', electivasIgnoradas);
    console.log('  Materias no encontradas:', materiasNoEncontradas);
    console.log('  Progreso final:', progress);

    if (materiasProcesadas > 0) {
      showToast(`✅ ${materiasProcesadas} materias procesadas del Guaraní`);
    } else {
      showToast('⚠️ No se encontraron materias en el archivo', true);
    }

    if (materiasNoEncontradas.length > 0) {
      console.warn('Materias del Guaraní no mapeadas:', materiasNoEncontradas);
    }

    return progress;

  } catch (err) {
    console.error('❌ Error parseando XLS:', err);
    showToast('❌ Error al procesar el archivo XLS: ' + err.message, true);
    return null;
  }
}