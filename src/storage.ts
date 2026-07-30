import type { AbmDataset } from "./core/schema";

// Lightweight persistence, mirroring the Campaign Intelligence lesson: save the
// current account book to localStorage, degrade to an in-memory store when
// localStorage is unavailable (private mode / quota), and say which happened.

export interface SavedBook {
  id: string;
  label: string;
  savedAt: number;
  dataset: AbmDataset;
}

const KEY = "abm.saves";
const MAX = 20;
const mem: SavedBook[] = [];
let durable: boolean | null = null;

function probe(): boolean {
  if (durable !== null) return durable;
  try {
    localStorage.setItem("abm.probe", "1");
    localStorage.removeItem("abm.probe");
    durable = true;
  } catch {
    durable = false;
  }
  return durable;
}

function readAll(): SavedBook[] {
  if (probe()) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as SavedBook[];
    } catch {
      /* fall through to memory */
    }
    return [];
  }
  return [...mem];
}

function writeAll(list: SavedBook[]): boolean {
  if (probe()) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch {
      durable = false; // quota exceeded mid-session
    }
  }
  mem.length = 0;
  mem.push(...list);
  return false;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function listSaves(): SavedBook[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveBook(dataset: AbmDataset, label: string): { mode: "durable" | "session" } {
  const list = readAll();
  const snapshot: SavedBook = { id: uid(), label: label.trim() || dataset.label, savedAt: Date.now(), dataset };
  const next = [snapshot, ...list].slice(0, MAX);
  const durableWrite = writeAll(next);
  return { mode: durableWrite ? "durable" : "session" };
}

export function removeSave(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
