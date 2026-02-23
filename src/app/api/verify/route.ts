import { NextRequest, NextResponse } from "next/server";
import { streamChat, ChatMessage } from "@/lib/gemini";
import { loadInstruction, loadInstructionSpecs, loadTechRefs } from "@/lib/instructions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documents, mode = "verify", report = "", enabledDocs, surgicalPayload } = body;

    if (!documents || typeof documents !== "object" || Object.keys(documents).length === 0) {
      return NextResponse.json(
        { error: "At least one document is required for verification" },
        { status: 400 }
      );
    }

    const config = loadInstruction("cybernetic-verifier.yaml");

    // All possible document types in the suite
    const ALL_DOC_TYPES = [
      "PRD", "Design Document", "Tech Stack", "Architecture",
      "Tech Spec", "Roadmap", "API Spec", "UI Design", "Task List",
      "Security Spec", "Data Model", "Vibe Prompt"
    ];

    // Only report missing docs within the enabled scope (if provided)
    const scopedDocTypes = Array.isArray(enabledDocs) && enabledDocs.length > 0
      ? ALL_DOC_TYPES.filter((t) => enabledDocs.includes(t))
      : ALL_DOC_TYPES;

    // Build the document context
    const docEntries = Object.entries(documents as Record<string, string>);
    const existingDocTypes = docEntries.map(([type]) => type);
    const missingDocTypes = scopedDocTypes.filter(t => !existingDocTypes.includes(t));
    const docList = docEntries.map(([type]) => `- ${type}`).join("\n");
    const missingList = missingDocTypes.length > 0
      ? missingDocTypes.map(t => `- ${t}`).join("\n")
      : "None — all documents exist";
    const docsContext = docEntries
      .map(([type, content]) => `### ${type}\n\n${content}`)
      .join("\n\n---\n\n");

    // Build the user message based on mode
    let userMessage: string;

    if (mode === "surgical") {
      // AI sees all docs for cross-doc context, but must output ONLY the target section.
      type SurgicalIssue = {
        id: string; title: string; description: string; fix: string;
        evidence?: Array<{ doc: string; quote: string }>;
      };
      const sp = surgicalPayload as {
        section: string; sectionHeader: string; targetDoc: string; issue: SurgicalIssue;
      };
      const evidenceBlock = sp.issue.evidence?.length
        ? `Evidence from documents:\n${sp.issue.evidence.map((e) => `  - ${e.doc}: "${e.quote}"`).join("\n")}`
        : "";

      userMessage = [
        "# SURGICAL PATCH — Precision Section Rewrite",
        "",
        "## Issue",
        `ID: ${sp.issue.id}`,
        `Title: ${sp.issue.title}`,
        `Description: ${sp.issue.description}`,
        `Required fix: ${sp.issue.fix}`,
        evidenceBlock,
        "",
        `## Target: section "${sp.sectionHeader}" inside document "${sp.targetDoc}"`,
        "",
        "## Full document suite (cross-doc context — READ but do NOT modify):",
        "",
        docsContext,
        "",
        "---",
        "",
        `## The section you must rewrite (from ${sp.targetDoc}):`,
        "",
        sp.section,
        "",
        "---",
        "",
        "OUTPUT RULES — NON-NEGOTIABLE:",
        `1. Output ONLY the rewritten version of the section above`,
        `2. First line MUST be the section header: ${sp.sectionHeader}`,
        "3. Make MINIMUM changes — only fix the described issue, nothing else",
        "4. Every word that does not need to change MUST remain identical",
        "5. DO NOT output any explanation, JSON, or ~~~doc markers",
        "6. DO NOT output any other section or document content",
      ].join("\n");

    } else if (mode === "harmonize") {
      userMessage = `# HARMONIZE MODE — Restore Homeostasis

## Telemetry Report to Address:

${report}

## Current Documents (${docEntries.length}):

${docList}

## Full Document Contents:

${docsContext}

Please fix ONLY the documents that have issues identified in the telemetry report. Use ~~~doc:Type~~~ markers for each corrected document. Make minimal changes to restore consistency.`;
    } else {
      // Load instruction specs for cross-checking
      const specs = loadInstructionSpecs();
      const specEntries = Object.entries(specs)
        .filter(([docType]) => existingDocTypes.includes(docType));

      const specContext = specEntries.length > 0
        ? `\n\n## Instruction Specs (expected structure from YAML instructions):\n\n${specEntries.map(([docType, { structure }]) => `### ${docType} — Expected Sections:\n${structure}`).join("\n\n")}`
        : "";

      userMessage = `# VERIFY MODE — Run Cybernetic Telemetry Analysis

## Documents Present (${docEntries.length} of ${scopedDocTypes.length}):

${docList}

## Documents NOT Yet Created:

${missingList}
${specContext}

## Full Document Contents:

${docsContext}

Analyze all documents as a coupled system and produce the full TELEMETRY REPORT in the exact format specified. Check all 7 dimensions: Cross-Reference Matrix, Contradiction Log, Terminology Drift, Complexity Audit, Coverage Gaps, Consistency Checks, and Instruction Compliance.

Since only ${docEntries.length} of ${scopedDocTypes.length} documents exist, also produce the ~~~guidance~~~ block with important notes for each missing document based on what's already established.`;
    }

    // Use empty history — verifier is stateless
    const geminiHistory: ChatMessage[] = [];
    const userApiKey = req.headers.get("x-api-key") || undefined;

    const stream = await streamChat({
      model: config.model,
      systemInstruction: config.systemInstruction + loadTechRefs(),
      history: geminiHistory,
      message: userMessage,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      apiKey: userApiKey,
    });

    // Stream response as SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Verify API error:", error);
    return NextResponse.json(
      { error: "Failed to process verification request" },
      { status: 500 }
    );
  }
}
