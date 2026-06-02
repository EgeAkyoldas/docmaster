// Session document-generation mode: "auto" generates immediately, "guided"
// asks the user questions one at a time before generating. The choice is
// persisted per-session (Session.mode) and the last pick is remembered in
// localStorage to seed new sessions and the entry modal.

export type DocMode = "auto" | "guided";

export const MODE_STORAGE = "docmaster_default_mode";

interface ReadableStore {
  getItem(key: string): string | null;
}

/** Last-chosen mode, falling back to "guided" (the app's default workflow). */
export function getDefaultMode(store?: ReadableStore): DocMode {
  try {
    const s = store ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    return s?.getItem(MODE_STORAGE) === "auto" ? "auto" : "guided";
  } catch {
    return "guided";
  }
}

/** Remember the chosen mode as the default for future sessions. */
export function setDefaultMode(mode: DocMode): void {
  try {
    localStorage.setItem(MODE_STORAGE, mode);
  } catch {
    /* ignore */
  }
}
