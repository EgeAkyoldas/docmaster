import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse document blocks from AI response text.
 * Blocks are wrapped in ~~~doc:DocumentType ... ~~~
 *
 * Uses a line-by-line state machine instead of a regex so that ~~~
 * sequences inside a document's own code blocks don't break parsing.
 */
export function parseDocumentBlocks(text: string): {
  cleanText: string;
  documents: Record<string, string>;
} {
  const documents: Record<string, string> = {};
  const lines = text.split("\n");
  const cleanLines: string[] = [];

  let activeDoc: string | null = null;
  const docLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    const openMatch = trimmed.match(/^~~~doc:(.+?)~~~?\s*$/) || trimmed.match(/^~~~doc:(.+)$/) || trimmed.match(/^```doc:(.+?)```?\s*$/) || trimmed.match(/^```doc:(.+)$/);
    const closeMatch = trimmed === "~~~" || trimmed === "```";

    if (openMatch && activeDoc === null) {
      // Start a new doc block
      activeDoc = openMatch[1].trim();
      docLines.length = 0;
    } else if (closeMatch && activeDoc !== null) {
      // Close the current doc block
      documents[activeDoc] = docLines.join("\n").trim();
      activeDoc = null;
    } else if (activeDoc !== null) {
      // Inside a doc block — collect content
      docLines.push(line);
    } else {
      // Outside any doc block — keep for cleanText
      cleanLines.push(line);
    }
  }

  return { cleanText: cleanLines.join("\n").trim(), documents };
}


/**
 * Parse image generation markers from AI response text.
 * Markers look like: ~~~image:description~~~
 */
export function parseImageMarkers(text: string): string[] {
  const prompts: string[] = [];
  const imageRegex = /~~~image:([^~]+)~~~/g;
  let match;
  while ((match = imageRegex.exec(text)) !== null) {
    prompts.push(match[1].trim());
  }
  return prompts;
}


export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}
