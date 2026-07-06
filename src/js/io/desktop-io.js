import { showToast } from '../ui/toast.js';

// Detectar si estamos en Tauri
const isTauri = window.__TAURI__ !== undefined;

let fsPlugin = null;
let dialogPlugin = null;

// Cargar plugins de Tauri solo si estamos en Tauri
if (isTauri) {
  try {
    fsPlugin = await import('@tauri-apps/plugin-fs');
    dialogPlugin = await import('@tauri-apps/plugin-dialog');
    console.log('✅ Plugins de Tauri cargados');
  } catch (err) {
    console.warn('⚠️ No se pudieron cargar los plugins de Tauri:', err);
  }
} else {
  console.log('ℹ️ Modo navegador detectado (GitHub Pages)');
}

const PROGRESS_DIR = 'LCC_Student_Track';

async function ensureDir() {
  if (!fsPlugin) return null;
  
  try {
    const dirExists = await fsPlugin.exists(PROGRESS_DIR, { baseDir: fsPlugin.BaseDirectory.Document });
    if (!dirExists) {
      await fsPlugin.mkdir(PROGRESS_DIR, { baseDir: fsPlugin.BaseDirectory.Document, recursive: true });
    }
    return PROGRESS_DIR;
  } catch (err) {
    console.error('Error asegurando directorio:', err);
    return null;
  }
}

// Guardar como (abre diálogo nativo en Tauri, descarga en navegador)
export async function saveAsNative(data, defaultName = 'progreso.json') {
  try {
    if (isTauri && dialogPlugin && fsPlugin) {
      // Modo Tauri: diálogo nativo
      const filePath = await dialogPlugin.save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: defaultName
      });

      if (filePath) {
        const finalPath = filePath.endsWith('.json') ? filePath : filePath + '.json';
        await fsPlugin.writeTextFile(finalPath, JSON.stringify(data, null, 2));
        showToast(`💾 Guardado en: ${finalPath}`);
        return finalPath;
      }
    } else {
      // Modo navegador: descarga directa
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`💾 Descargado: ${defaultName}`);
      return defaultName;
    }
  } catch (err) {
    showToast('❌ Error al guardar: ' + err.message, true);
    console.error(err);
  }
  return null;
}

// Abrir archivo (abre diálogo nativo en Tauri, input file en navegador)
export async function openNative() {
  try {
    if (isTauri && dialogPlugin && fsPlugin) {
      // Modo Tauri: diálogo nativo
      const filePath = await dialogPlugin.open({
        filters: [
          { name: 'JSON o XLS', extensions: ['json', 'xls', 'xlsx'] }
        ],
        multiple: false
      });

      if (filePath) {
        if (filePath.toLowerCase().endsWith('.xls') || filePath.toLowerCase().endsWith('.xlsx')) {
          const data = await fsPlugin.readFile(filePath);
          showToast(`📂 Abierto: ${filePath}`);
          return { type: 'xls', data: data, path: filePath };
        }
        
        const content = await fsPlugin.readTextFile(filePath);
        const data = JSON.parse(content);
        showToast(`📂 Abierto: ${filePath}`);
        return { type: 'json', data: data, path: filePath };
      }
    } else {
      // Modo navegador: input file
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.xls,.xlsx';
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) {
            resolve(null);
            return;
          }
          
          try {
            if (file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')) {
              const buffer = await file.arrayBuffer();
              showToast(`📂 Abierto: ${file.name}`);
              resolve({ type: 'xls', data: new Uint8Array(buffer), path: file.name });
            } else {
              const text = await file.text();
              const data = JSON.parse(text);
              showToast(`📂 Abierto: ${file.name}`);
              resolve({ type: 'json', data: data, path: file.name });
            }
          } catch (err) {
            showToast('❌ Error al abrir: ' + err.message, true);
            resolve(null);
          }
        };
        
        input.click();
      });
    }
  } catch (err) {
    showToast('❌ Error al abrir: ' + err.message, true);
    console.error(err);
  }
  return null;
}

export async function listSavedProgress() {
  if (!fsPlugin) return [];
  
  try {
    const dir = await ensureDir();
    if (!dir) return [];
    const entries = await fsPlugin.readDir(dir, { baseDir: fsPlugin.BaseDirectory.Document });
    return entries
      .filter(e => e.isFile && e.name.endsWith('.json'))
      .map(e => e.name);
  } catch (err) {
    console.error('Error leyendo directorio:', err);
    return [];
  }
}

export async function loadFromFolder(filename) {
  if (!fsPlugin) return null;
  
  try {
    const dir = await ensureDir();
    if (!dir) return null;
    const content = await fsPlugin.readTextFile(`${dir}/${filename}`, { baseDir: fsPlugin.BaseDirectory.Document });
    return JSON.parse(content);
  } catch (err) {
    showToast('❌ Error al cargar: ' + err.message, true);
    return null;
  }
}