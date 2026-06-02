import "fake-indexeddb/auto"; // MUST be first — installs IDB shim before storage.ts loads
import { describe, it, expect, vi } from "vitest";

vi.stubGlobal("window", globalThis);
vi.stubGlobal("localStorage", {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

import { saveSession, getSession } from "@/lib/storage";
import type { Session } from "@/lib/storage";

function makeSession(id: string): Session {
  return {
    id,
    name: "Test",
    projectType: "webapp",
    enabledDocs: [],
    instructionKey: "master-architect",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    documents: {},
    documentHistory: [],
  };
}

describe("Session.mode persistence", () => {
  it("MODE-01: a saved session round-trips its mode field", async () => {
    const s = makeSession("mode-session");
    s.mode = "auto";
    await saveSession(s);

    const saved = await getSession("mode-session");
    expect(saved?.mode).toBe("auto");
  });

  it("MODE-02: mode is optional — sessions without it load fine", async () => {
    const s = makeSession("no-mode-session");
    await saveSession(s);

    const saved = await getSession("no-mode-session");
    expect(saved?.mode).toBeUndefined();
  });
});
