import { BaseDirectory, readTextFile, readFile, writeTextFile, mkdir, exists, readDir } from '@tauri-apps/plugin-fs';
import { save, open } from '@tauri-apps/plugin-dialog';
import { showToast } from '../ui/toast.js';

const PROGRESS_DIR = 'LCC_Student_Track';

async function ensureDir() {
  try {
    const dirExists = await exists(PROGRESS_DIR, { baseDir: BaseDirectory.Document });
    if (!dirExists) {
      await mkdir(PROGRESS_DIR, { baseDir: BaseDirectory.Document, recursive: true });
    }
    return PROGRESS_DIR;
  } catch (err) {
    console.error('Error asegurando directorio:', err);
    return null;
  }
}

// Guardar como (abre diálogo nativo)
export async function saveAsNative(data, defaultName = 'progreso.json') {
  try {
    const filePath = await save({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: defaultName
    });

    if (filePath) {
      const finalPath = filePath.endsWith('.json') ? filePath : filePath + '.json';
      await writeTextFile(finalPath, JSON.stringify(data, null, 2));
      showToast(`💾 Guardado en: ${finalPath}`);
      return finalPath;
    }
  } catch (err) {
    showToast('❌ Error al guardar: ' + err.message, true);
    console.error(err);
  }
  return null;
}

// Abrir archivo (abre diálogo nativo)
export async function openNative() {
  try {
    const filePath = await open({
      filters: [
        { name: 'JSON o XLS', extensions: ['json', 'xls', 'xlsx'] }
      ],
      multiple: false
    });

    if (filePath) {
      // Si es XLS, leer como binario
      if (filePath.toLowerCase().endsWith('.xls') || filePath.toLowerCase().endsWith('.xlsx')) {
        const data = await readFile(filePath);
        showToast(`📂 Abierto: ${filePath}`);
        return { type: 'xls', data: data, path: filePath };
      }
      
      // Si es JSON, leer como texto
      const content = await readTextFile(filePath);
      const data = JSON.parse(content);
      showToast(`📂 Abierto: ${filePath}`);
      return { type: 'json', data: data, path: filePath };
    }
  } catch (err) {
    showToast('❌ Error al abrir: ' + err.message, true);
    console.error(err);
  }
  return null;
}

// Listar progresos guardados
export async function listSavedProgress() {
  try {
    const dir = await ensureDir();
    if (!dir) return [];
    const entries = await readDir(dir, { baseDir: BaseDirectory.Document });
    return entries
      .filter(e => e.isFile && e.name.endsWith('.json'))
      .map(e => e.name);
  } catch (err) {
    console.error('Error leyendo directorio:', err);
    return [];
  }
}

// Cargar desde carpeta
export async function loadFromFolder(filename) {
  try {
    const dir = await ensureDir();
    if (!dir) return null;
    const content = await readTextFile(`${dir}/${filename}`, { baseDir: BaseDirectory.Document });
    return JSON.parse(content);
  } catch (err) {
    showToast('❌ Error al cargar: ' + err.message, true);
    return null;
  }
}