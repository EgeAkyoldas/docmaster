import fs from "fs";
import path from "path";
import yaml from "js-yaml";

/**
 * Loads critical sections from TECH-REF.md (and optionally GAME-TECH-REF.md).
 * Extracts only: AI model names, deprecated warnings, project deps, anti-pattern table.
 * Keeps injection small (~4-6 KB) while enforcing the key correctness rules.
 */
export function loadTechRefs(includeGameRef = false): string {
  const root = process.cwd();

  const readFile = (file: string): string => {
    try { return fs.readFileSync(path.join(root, file), "utf-8"); } catch { return ""; }
  };

  // Extract H2 sections whose headings contain any of the given keywords.
  const extractSections = (md: string, keywords: string[]): string => {
    const sections = md.split(/^(?=## )/m);
    return sections
      .filter((s) => keywords.some((kw) => s.toLowerCase().includes(kw.toLowerCase())))
      .join("\n\n")
      .trim();
  };

  const parts: string[] = [];

  const techRef = readFile("TECH-REF.md");
  if (techRef) {
    const critical = extractSections(techRef, [
      "project's dependencies",  // package version table
      "google genai",            // AI model names + API surface
      "anti-pattern cheatsheet", // universal do-not-do-this table
    ]);
    parts.push(`### From TECH-REF.md\n\n${critical || techRef.slice(0, 6000)}`);
  }

  if (includeGameRef) {
    const gameRef = readFile("GAME-TECH-REF.md");
    if (gameRef) {
      const critical = extractSections(gameRef, ["quick engine selector", "anti-pattern"]);
      parts.push(`### From GAME-TECH-REF.md\n\n${critical || gameRef.slice(0, 3000)}`);
    }
  }

  if (parts.length === 0) return "";

  return [
    "\n\n---",
    "# MANDATORY TECHNICAL REFERENCE — BINDING RULES",
    "These rules are extracted from the project's TECH-REF.md and are non-negotiable.",
    "DO NOT suggest, use, or document any deprecated API, model name, or package listed below.",
    "All tech stack choices, code snippets, and API references MUST comply with these specs.\n",
    parts.join("\n\n---\n\n"),
  ].join("\n");
}

export interface InstructionConfig {
  name: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  systemInstruction: string;
  documentType: string;
  triggerPhrases?: string[];
}

// Re-export client-safe constants
export { INSTRUCTION_FILES, DOCUMENT_LABELS } from "./constants";

const instructionsDir = path.join(process.cwd(), "instructions");

export function loadInstruction(filename: string): InstructionConfig {
  const filePath = path.join(instructionsDir, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return yaml.load(raw) as InstructionConfig;
}

export function listInstructions(): string[] {
  return fs
    .readdirSync(instructionsDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
}

/**
 * Loads all instruction YAMLs and extracts the expected structure/section
 * headings from each. Returns a map of documentType → spec outline.
 * Used by the verifier for instruction cross-checking.
 */
export function loadInstructionSpecs(): Record<string, { name: string; structure: string }> {
  const result: Record<string, { name: string; structure: string }> = {};

  for (const filename of listInstructions()) {
    try {
      const config = loadInstruction(filename);
      // Skip non-document producers (verifier, master-architect)
      if (!config.documentType || config.documentType === "Verifier") continue;

      // Extract the structure section from the system instruction
      const si = config.systemInstruction;
      // Look for structure sections (common patterns in our YAMLs)
      const structureMatch = si.match(
        /# (?:.*STRUCTURE|DOCUMENT GENERATION[\s\S]*?STRUCTURE)([\s\S]*?)(?:\n(?:documentType|$))/i
      );

      // If we can't find a labelled structure block, just extract all bold headings
      let structure: string;
      if (structureMatch) {
        structure = structureMatch[0].trim();
      } else {
        const headings = si.match(/\*\*[^*]+\*\*/g);
        structure = headings ? headings.join("\n") : "";
      }

      result[config.documentType] = { name: config.name, structure };
    } catch {
      // Skip malformed files silently
    }
  }
  return result;
}
