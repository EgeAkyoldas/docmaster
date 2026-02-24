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
  let docFenceType: string | null = null; // Which fence opened the doc block: "~~~" or "```"
  let innerFenceDepth = 0; // Track nested code fences inside doc blocks
  const docLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    const openMatch = trimmed.match(/^~~~doc:(.+?)~~~?\s*$/) || trimmed.match(/^~~~doc:(.+)$/) || trimmed.match(/^```doc:(.+?)```?\s*$/) || trimmed.match(/^```doc:(.+)$/);

    if (openMatch && activeDoc === null) {
      // Start a new doc block — remember which fence type opened it
      activeDoc = openMatch[1].trim();
      docFenceType = trimmed.startsWith("```") ? "```" : "~~~";
      docLines.length = 0;
      innerFenceDepth = 0;
    } else if (activeDoc !== null) {
      // We're inside a doc block
      const isTilde = trimmed === "~~~" || /^~~~\s*\w+/.test(trimmed);
      const isBacktick = trimmed === "```" || /^```\s*\w+/.test(trimmed);
      const isStandaloneTilde = trimmed === "~~~";
      const isStandaloneBacktick = trimmed === "```";

      if (docFenceType === "~~~") {
        // Doc opened with ~~~ — only ~~~ can close it, ``` is always inner content
        if (innerFenceDepth > 0) {
          // Inside a nested code fence — track close
          docLines.push(line);
          if (isStandaloneTilde || isStandaloneBacktick) {
            innerFenceDepth--;
          } else if (isTilde || isBacktick) {
            // Opening a deeper nested fence (rare but possible)
            innerFenceDepth++;
          }
        } else if (isStandaloneTilde) {
          // Standalone ~~~ closes the doc block
          documents[activeDoc] = docLines.join("\n").trim();
          activeDoc = null;
          docFenceType = null;
        } else if (isTilde || isBacktick) {
          // Opens an inner code fence
          innerFenceDepth++;
          docLines.push(line);
        } else {
          docLines.push(line);
        }
      } else {
        // Doc opened with ``` — only ``` can close it, ~~~ is always inner content
        if (innerFenceDepth > 0) {
          docLines.push(line);
          if (isStandaloneTilde || isStandaloneBacktick) {
            innerFenceDepth--;
          } else if (isTilde || isBacktick) {
            innerFenceDepth++;
          }
        } else if (isStandaloneBacktick) {
          documents[activeDoc] = docLines.join("\n").trim();
          activeDoc = null;
          docFenceType = null;
        } else if (isTilde || isBacktick) {
          innerFenceDepth++;
          docLines.push(line);
        } else {
          docLines.push(line);
        }
      }
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
