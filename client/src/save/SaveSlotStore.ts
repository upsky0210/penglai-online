import { clientStorageKeys } from "../game/clientConfig";

export function getOrCreateSaveSlot() {
  try {
    const existing = window.localStorage.getItem(clientStorageKeys.saveSlot);
    if (existing) {
      return existing;
    }

    const nextSlot = generateSaveSlot();
    window.localStorage.setItem(clientStorageKeys.saveSlot, nextSlot);
    return nextSlot;
  } catch {
    return "browser-fallback-slot";
  }
}

export function readPreviousSaveSlot() {
  try {
    return window.localStorage.getItem(clientStorageKeys.previousSaveSlot) ?? "";
  } catch {
    return "";
  }
}

export function generateSaveSlot() {
  return window.crypto?.randomUUID?.() ?? `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function persistCurrentSaveSlot(saveSlot: string) {
  try {
    window.localStorage.setItem(clientStorageKeys.saveSlot, saveSlot);
  } catch {
    // localStorage can be unavailable in privacy modes; the in-memory slot still works for this session.
  }
}

export function persistSaveSlotPair(currentSaveSlot: string, previousSaveSlot: string) {
  try {
    window.localStorage.setItem(clientStorageKeys.saveSlot, currentSaveSlot);
    if (previousSaveSlot) {
      window.localStorage.setItem(clientStorageKeys.previousSaveSlot, previousSaveSlot);
    }
  } catch {
    // The game can continue with in-memory save slots if browser storage is blocked.
  }
}

export function persistPreviousSaveSlot(previousSaveSlot: string) {
  try {
    window.localStorage.setItem(clientStorageKeys.previousSaveSlot, previousSaveSlot);
  } catch {
    // Keep the swap in memory if browser storage is blocked.
  }
}

export function normalizeSaveSlotCode(raw: string) {
  const normalized = raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return normalized.length >= 8 ? normalized : "";
}

export function formatSaveSlot(saveSlot: string) {
  if (saveSlot.length <= 12) {
    return saveSlot;
  }

  return `${saveSlot.slice(0, 8)}...${saveSlot.slice(-4)}`;
}
