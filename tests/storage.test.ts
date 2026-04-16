import "fake-indexeddb/auto"; // MUST be first import — installs IDB shim before storage.ts loads
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Stub window and localStorage so storage.ts browser guards pass in Node
vi.stubGlobal("window", globalThis);
vi.stubGlobal("localStorage", {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

import { debouncedSaveDocuments, getSession } from "@/lib/storage";
import type { Session } from "@/lib/storage";

function makeSession(docs: Record<string, string>): Session {
  return {
    id: "test-session",
    name: "Test",
    projectType: "webapp",
    enabledDocs: Object.keys(docs),
    instructionKey: "master-architect",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    documents: docs,
    documentHistory: [],
  };
}

/** Helper: trigger the debounce timeout, then restore real timers so IDB async can complete */
async function flushDebounce(): Promise<void> {
  // Advance fake clock to fire the setTimeout callback inside debouncedSaveDocuments
  vi.advanceTimersByTime(160);
  // Restore real timers so IDB async operations (openDB, put, get) resolve naturally
  vi.useRealTimers();
  // Give IDB operations time to flush
  await new Promise((resolve) => setTimeout(resolve, 50));
}

describe("debouncedSaveDocuments", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("SAVE-01: document from first call is not lost when second call fires before 150ms timer", async () => {
    // Call A: session with PRD only
    const sessionA = makeSession({ PRD: "PRD content" });
    // Call B: session with Tech Spec only — simulates second generation arriving before timer
    // With the overwrite bug, sessionB replaces sessionA entirely, losing PRD
    const sessionB = makeSession({ "Tech Spec": "Tech Spec content" });

    debouncedSaveDocuments(sessionA);
    debouncedSaveDocuments(sessionB); // fires before the 150ms timer — currently overwrites A

    await flushDebounce();

    const saved = await getSession("test-session");
    // Both documents must survive — PRD from first call, Tech Spec from second
    expect(saved?.documents["PRD"]).toBe("PRD content");
    expect(saved?.documents["Tech Spec"]).toBe("Tech Spec content");
  });

  it("SAVE-02: second rapid call merges documents into pending state, does not overwrite", async () => {
    vi.useFakeTimers(); // re-enable after flushDebounce restored real timers in prior test
    // Call A has Doc-A only
    const sessionA = makeSession({ "Doc-A": "content-A" });
    // Call B has Doc-B only — if merge is correct, both survive; if overwrite, Doc-A is lost
    const sessionB = makeSession({ "Doc-B": "content-B" });

    debouncedSaveDocuments(sessionA);
    debouncedSaveDocuments(sessionB);

    await flushDebounce();

    const saved = await getSession("test-session");
    expect(saved?.documents["Doc-A"]).toBe("content-A");
    expect(saved?.documents["Doc-B"]).toBe("content-B");
  });
});
