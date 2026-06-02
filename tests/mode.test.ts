import { describe, it, expect } from "vitest";
import { getDefaultMode, MODE_STORAGE } from "@/lib/mode";

function store(value: string | null) {
  return { getItem: (k: string) => (k === MODE_STORAGE ? value : null) };
}

describe("getDefaultMode", () => {
  it("returns 'auto' when stored value is auto", () => {
    expect(getDefaultMode(store("auto"))).toBe("auto");
  });

  it("returns 'guided' when stored value is guided", () => {
    expect(getDefaultMode(store("guided"))).toBe("guided");
  });

  it("falls back to 'guided' when nothing is stored", () => {
    expect(getDefaultMode(store(null))).toBe("guided");
  });

  it("falls back to 'guided' for any unrecognized value", () => {
    expect(getDefaultMode(store("nonsense"))).toBe("guided");
  });
});
