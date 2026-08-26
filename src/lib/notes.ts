import type { Camera, Stroke } from "@/lib/ink";
import { uid } from "@/lib/ink";
import type { ThemeId } from "@/components/ink/palette";

export type Note = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
  theme: ThemeId;
  cam: Camera;
  strokes: Stroke[];
};

const KEY = "inkwell.notes.v1";
const LEGACY_KEY = "inkwell.board.v1";
const BACKUP_KEY = "inkwell.backup.v1";

export type NoteMeta = Omit<Note, "strokes" | "cam"> & { strokeCount: number };

/**
 * Export notes to JSON string for backup/download
 */
export function exportNotes(): string {
  const notes = safeRead();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: Date.now(),
      notes,
    },
    null,
    2,
  );
}

/**
 * Import notes from JSON string (merge with existing)
 * Returns number of imported notes or throws on invalid data
 */
export function importNotes(json: string): number {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== "object" || !Array.isArray(data.notes)) {
      throw new Error("Invalid import format");
    }

    const imported = data.notes as Note[];
    const existing = safeRead();
    const existingIds = new Set(existing.map((n) => n.id));

    // Filter out duplicates and validate structure
    const validImports = imported.filter(
      (n) =>
        n &&
        typeof n.id === "string" &&
        !existingIds.has(n.id) &&
        Array.isArray(n.strokes),
    );

    if (validImports.length === 0) {
      return 0;
    }

    writeAll([...validImports, ...existing]);
    return validImports.length;
  } catch (e) {
    console.error("Failed to import notes:", e);
    throw new Error("Invalid notes backup file");
  }
}

/**
 * Create a backup copy in localStorage as safeguard
 */
function createBackup(notes: Note[]) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(notes));
  } catch {
    // Backup failed, but don't block main operation
    console.warn("Backup creation failed");
  }
}

/**
 * Restore from backup if primary storage is corrupted/empty
 */
function restoreFromBackup(): Note[] | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Note[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    console.warn("Backup restoration failed");
  }
  return null;
}

function safeRead(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Note[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Primary storage corrupted, attempting backup restore:", e);
    const backup = restoreFromBackup();
    if (backup) {
      writeAll(backup);
      return backup;
    }
  }
  // migrate the single-board store from the first version
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const data = JSON.parse(legacy) as { strokes: Stroke[]; cam: Camera; theme: ThemeId };
      const note: Note = {
        id: uid(),
        title: "My first note",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        favorite: false,
        theme: data.theme ?? "graphite",
        cam: data.cam ?? { x: 0, y: 0, k: 1 },
        strokes: Array.isArray(data.strokes) ? data.strokes : [],
      };
      localStorage.removeItem(LEGACY_KEY);
      writeAll([note]);
      return [note];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writeAll(notes: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
    // Create async backup
    setTimeout(() => createBackup(notes), 0);
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.error("Storage quota exceeded. Consider deleting old notes.");
      // Try to free space by removing backup
      try {
        localStorage.removeItem(BACKUP_KEY);
        localStorage.setItem(KEY, JSON.stringify(notes));
      } catch {
        console.error("Unable to save even after clearing backup");
      }
    } else {
      console.error("Failed to save notes:", e);
    }
  }
  listeners.forEach((l) => l());
}

const listeners = new Set<() => void>();
export function subscribeNotes(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function listNotes(): NoteMeta[] {
  return safeRead()
    .map(({ strokes, ...rest }) => ({ ...rest, strokeCount: strokes.length }))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
}

export function getNote(id: string): Note | null {
  return safeRead().find((n) => n.id === id) ?? null;
}

export function createNote(title = "Untitled note", theme: ThemeId = "graphite"): Note {
  const note: Note = {
    id: uid(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    favorite: false,
    theme,
    cam: { x: 0, y: 0, k: 1 },
    strokes: [],
  };
  writeAll([note, ...safeRead()]);
  return note;
}

export function updateNote(id: string, patch: Partial<Omit<Note, "id">>, touch = true) {
  const notes = safeRead();
  const i = notes.findIndex((n) => n.id === id);
  if (i === -1) return;
  notes[i] = { ...notes[i]!, ...patch, ...(touch ? { updatedAt: Date.now() } : {}) };
  writeAll(notes);
}

export function deleteNote(id: string) {
  writeAll(safeRead().filter((n) => n.id !== id));
}

export function duplicateNote(id: string) {
  const src = safeRead().find((n) => n.id === id);
  if (!src) return;
  const copy: Note = {
    ...src,
    id: uid(),
    title: `${src.title} copy`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    favorite: false,
  };
  writeAll([copy, ...safeRead()]);
}

/** Latest strokes for a note, used to render thumbnails. */
export function getStrokes(id: string): Stroke[] {
  return getNote(id)?.strokes ?? [];
}
