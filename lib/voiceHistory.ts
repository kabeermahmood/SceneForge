const DB_NAME = "voicestudio-history";
const STORE_NAME = "generations";
const DB_VERSION = 1;
const MAX_ENTRIES = 20;

export interface HistoryEntryMeta {
  id: string;
  voiceId: string;
  voiceName: string;
  modelId: string;
  scriptPreview: string;
  createdAt: number;
  sizeBytes: number;
  mimeType: string;
}

export interface HistoryEntry extends HistoryEntryMeta {
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addHistoryEntry(
  entry: Omit<HistoryEntry, "id" | "createdAt" | "sizeBytes"> & {
    id?: string;
    createdAt?: number;
  }
): Promise<HistoryEntry> {
  const db = await openDB();
  try {
    const full: HistoryEntry = {
      id: entry.id ?? crypto.randomUUID(),
      voiceId: entry.voiceId,
      voiceName: entry.voiceName,
      modelId: entry.modelId,
      scriptPreview: entry.scriptPreview,
      createdAt: entry.createdAt ?? Date.now(),
      sizeBytes: entry.blob.size,
      mimeType: entry.mimeType,
      blob: entry.blob,
    };
    await promisify(tx(db, "readwrite").put(full));
    await pruneOld(db);
    return full;
  } finally {
    db.close();
  }
}

async function pruneOld(db: IDBDatabase): Promise<void> {
  const all = await promisify(tx(db, "readonly").getAll()) as HistoryEntry[];
  if (all.length <= MAX_ENTRIES) return;
  const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
  const toDelete = sorted.slice(MAX_ENTRIES);
  const store = tx(db, "readwrite");
  for (const entry of toDelete) {
    store.delete(entry.id);
  }
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const db = await openDB();
  try {
    const all = (await promisify(tx(db, "readonly").getAll())) as HistoryEntry[];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } finally {
    db.close();
  }
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const db = await openDB();
  try {
    await promisify(tx(db, "readwrite").delete(id));
  } finally {
    db.close();
  }
}

export async function clearHistory(): Promise<void> {
  const db = await openDB();
  try {
    await promisify(tx(db, "readwrite").clear());
  } finally {
    db.close();
  }
}
