"use client";

import { useState, useRef, useCallback, memo, useEffect } from "react";
import { useApiKey } from "@/lib/useApiKey";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  FileText,
  Zap,
  X,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { parseDocumentBlocks } from "@/lib/utils";
import { extractSection, applyPatch, buildHints } from "@/lib/patchUtils";

// ── Types ──
export interface VerifierIssue {
  id: string;
  severity: "critical" | "warning" | "info";
  type: string;
  title: string;
  description: string;
  affectedDocs: string[];
  evidence: { doc: string; quote: string }[];
  fix: string;
  targetDoc: string;
  /** Populated after a fix attempt + post-validate re-verify */
  patchStatus?: "patching" | "fallback" | "resolved" | "unresolved" | "error";
}

export type VerifierPhase = "idle" | "verifying" | "ready" | "harmonizing" | "done";

export interface VerifierState {
  phase: VerifierPhase;
  issues: VerifierIssue[];
  summary: string;
  dismissed: string[];
  applied: string[];
  rawReport: string;
}

export const INITIAL_VERIFIER_STATE: VerifierState = {
  phase: "idle",
  issues: [],
  summary: "",
  dismissed: [],
  applied: [],
  rawReport: "",
};

interface VerifierPanelProps {
  documents: Record<string, string>;
  enabledDocs?: string[];
  verifierState: VerifierState;
  onVerifierStateChange: (state: VerifierState) => void;
  onDocumentsUpdate: (docs: Record<string, string>) => void;
  onNavigateToDoc: (docType: string) => void;
  onSnapshotVersions: (
    docs: Record<string, string>,
    source: "generated" | "edited" | "harmonized"
  ) => void;
  onReportReady?: (report: string) => void;
}

// ── Helpers ──
function parseSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    case "warning":
      return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
    default:
      return <Info className="w-3.5 h-3.5 text-blue-400" />;
  }
}

function severityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "border-red-500/30 bg-red-500/5";
    case "warning":
      return "border-yellow-500/30 bg-yellow-500/5";
    default:
      return "border-blue-500/30 bg-blue-500/5";
  }
}

function severityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "warning":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  }
}

function parseIssuesFromResponse(text: string): VerifierIssue[] {
  // Try the well-formed block first (with closing ~~~)
  const full = text.match(/~~~issues\s*\n([\s\S]*?)~~~/);
  if (full) {
    try { return JSON.parse(full[1]); } catch { /* fallthrough */ }
  }

  // Fallback: response may be truncated — grab everything after ~~~issues
  const partial = text.match(/~~~issues\s*\n([\s\S]*)/);
  if (partial) {
    const fragment = partial[1].replace(/~~~.*$/, "").trim();
    // Try parsing as-is (might be complete but missing closing marker)
    try { return JSON.parse(fragment); } catch { /* fallthrough */ }
    // Try closing the truncated array and parsing
    try { return JSON.parse(fragment + "]"); } catch { /* fallthrough */ }
    // Last resort: extract individual complete objects
    const objects: VerifierIssue[] = [];
    const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    for (const m of fragment.matchAll(objRegex)) {
      try {
        const obj = JSON.parse(m[0]);
        if (obj.id && obj.severity) objects.push(obj as VerifierIssue);
      } catch { /* skip malformed */ }
    }
    if (objects.length > 0) return objects;
  }

  // Deepest fallback: try to find JSON array anywhere in the text (e.g. inside ```json blocks)
  const jsonArrayMatch = text.match(/```json\s*\n(\[\s*\{[\s\S]*?\]\s*)\n```/);
  if (jsonArrayMatch) {
    try { return JSON.parse(jsonArrayMatch[1]); } catch { /* fallthrough */ }
  }

  // Ultra fallback: find any JSON array that looks like issues
  const anyArray = text.match(/(\[\s*\{\s*"id"\s*:\s*"[A-Z]+-\d+"[\s\S]*?\])/)
  if (anyArray) {
    try { return JSON.parse(anyArray[1]); } catch { /* fallthrough */ }
  }

  return [];
}

function parseSummaryFromResponse(text: string): string {
  // Try the well-formed ~~~summary~~~ block first
  const match = text.match(/~~~summary\s*\n([\s\S]*?)~~~/);
  if (match) return match[1].trim();

  // Fallback: look for a TELEMETRY REPORT header or similar
  const reportMatch = text.match(/#{1,3}\s*(?:TELEMETRY|ENTROPY|VERIFICATION)\s*(?:REPORT|ANALYSIS|SUMMARY)[^\n]*\n([\s\S]*?)(?=\n~~~|$)/i);
  if (reportMatch) return reportMatch[0].trim().slice(0, 2000);

  // Fallback: if we have issues, use everything before the issues block as summary
  const beforeIssues = text.split(/~~~issues/)[0]?.trim();
  if (beforeIssues && beforeIssues.length > 50) return beforeIssues.slice(0, 2000);

  // Last resort: strip JSON/code blocks and use first portion
  const stripped = text.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '').trim();
  if (stripped.length > 30) return stripped.slice(0, 1500);

  return text.slice(0, 500) || "Verification completed but no summary was generated.";
}

// ── Issue Card — memoized so only re-renders when its own props change ──
const IssueCard = memo(function IssueCard({
  issue,
  onNavigateToDoc,
  onApply,
  onDismiss,
  isApplying,
  isDismissed,
  isApplied,
}: {
  issue: VerifierIssue;
  onNavigateToDoc: (doc: string) => void;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
  isDismissed: boolean;
  isApplied: boolean;
}) {
  const [expanded, setExpanded] = useState(issue.severity === "critical");

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isApplied ? 0.5 : 1, y: 0 }}
      className={cn(
        "rounded-lg border transition-colors",
        severityColor(issue.severity),
        isApplied && "opacity-50"
      )}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
        {parseSeverityIcon(issue.severity)}
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0",
            severityBadge(issue.severity)
          )}
        >
          {issue.id}
        </span>
        <span className="text-xs font-medium text-foreground truncate flex-1">
          {issue.title}
        </span>
        {isApplied && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
      </button>

      {/* Card Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2.5">
              {/* Type badge */}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground border border-border">
                {issue.type.replace("_", " ")}
              </span>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {issue.description}
              </p>

              {/* Evidence */}
              {issue.evidence.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Evidence
                  </span>
                  {issue.evidence.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 pl-2 border-l-2 border-border"
                    >
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onNavigateToDoc(e.doc);
                        }}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex-shrink-0 mt-0.5"
                      >
                        {e.doc}
                      </button>
                      <span className="text-[11px] text-muted-foreground italic">
                        &ldquo;{e.quote}&rdquo;
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Affected Documents */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <FileText className="w-3 h-3 text-muted-foreground" />
                {issue.affectedDocs.map((doc) => (
                  <button
                    key={doc}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onNavigateToDoc(doc);
                    }}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                  >
                    {doc}
                  </button>
                ))}
              </div>

              {/* Proposed Fix */}
              <div className="p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                  Proposed Fix → {issue.targetDoc}
                </span>
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  {issue.fix}
                </p>
              </div>

              {/* Patch status badge — shown after fix applied */}
              {isApplied && issue.patchStatus && (
                <div className="flex items-center gap-1.5 pt-1">
                  {issue.patchStatus === "patching" && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> Validating...
                    </span>
                  )}
                  {issue.patchStatus === "resolved" && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  )}
                  {issue.patchStatus === "unresolved" && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                      <AlertTriangle className="w-3 h-3" /> Unresolved — retry
                    </span>
                  )}
                  {issue.patchStatus === "fallback" && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <RotateCcw className="w-3 h-3" /> Fallback mode
                    </span>
                  )}
                  {issue.patchStatus === "error" && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      <X className="w-3 h-3" /> Fix failed
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              {!isApplied && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onApply();
                    }}
                    disabled={isApplying}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    {isApplying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wrench className="w-3 h-3" />
                    )}
                    Apply Fix
                  </button>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onDismiss();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/50 border border-border text-muted-foreground text-[11px] font-mono hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ── Main Panel ──
export function VerifierPanel({
  documents,
  enabledDocs,
  verifierState,
  onVerifierStateChange,
  onDocumentsUpdate,
  onNavigateToDoc,
  onSnapshotVersions,
  onReportReady,
}: VerifierPanelProps) {
  // Controlled state from parent — survives tab switches
  const { phase, issues, summary } = verifierState;
  const dismissed = new Set(verifierState.dismissed);
  const applied = new Set(verifierState.applied);

  // Ephemeral local state (only needed during active operations)
  const [streamingText, setStreamingText] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const docCount = Object.keys(documents).length;
  const { apiKey, model } = useApiKey();
  // Refs so stale useCallback closures always send the current key + model
  const apiKeyRef = useRef<string | null>(null);
  const modelRef = useRef<string>(model);
  useEffect(() => { apiKeyRef.current = apiKey ?? null; }, [apiKey]);
  useEffect(() => { modelRef.current = model; }, [model]);
  const apiHeaders = () => ({
    "Content-Type": "application/json",
    ...(apiKeyRef.current ? { "x-api-key": apiKeyRef.current } : {}),
    "x-model": modelRef.current,
  });

  // Keep a ref to always-current state to avoid stale closures in callbacks
  const verifierStateRef = useRef(verifierState);
  verifierStateRef.current = verifierState;

  // Helper to update parent state — reads from ref to avoid stale closure
  const updateState = useCallback((patch: Partial<VerifierState>) => {
    onVerifierStateChange({ ...verifierStateRef.current, ...patch });
  }, [onVerifierStateChange]);

  // ── VERIFY ──
  const runVerify = useCallback(async () => {
    if (docCount < 2) return;
    updateState({ phase: "verifying", issues: [], summary: "", dismissed: [], applied: [], rawReport: "" });
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ documents, mode: "verify", enabledDocs }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  full += parsed.text;
                  setStreamingText(full);
                }
              } catch {
                /* ignore */
              }
            }
          }
        }
      }

      const parsedIssues = parseIssuesFromResponse(full);
      const parsedSummary = parseSummaryFromResponse(full);
      updateState({ phase: "ready", issues: parsedIssues, summary: parsedSummary, rawReport: full });
      onReportReady?.(full);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        updateState({ phase: "idle" });
      } else {
        updateState({ phase: "ready", summary: "⚠️ Verification failed. Please try again." });
      }
    } finally {
      abortRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, docCount]);

  // ── STREAM HELPER ──
  const streamFull = async (res: Response): Promise<string> => {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";
    if (!reader) return full;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value, { stream: true }).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try { const p = JSON.parse(data); if (p.text) full += p.text; } catch { /* ignore */ }
      }
    }
    return full;
  };

  // ── POST-VALIDATE: re-verify and check if an issue was resolved ──
  const postValidate = useCallback(
    async (issueId: string, updatedDocs: Record<string, string>) => {
      await new Promise((r) => setTimeout(r, 300)); // brief pause for state to settle
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({ documents: updatedDocs, mode: "verify", enabledDocs }),
        });
        if (!res.ok) return;
        const raw = await streamFull(res);
        const newIssues = parseIssuesFromResponse(raw);
        const stillPresent = newIssues.some((i) => i.id === issueId);
        // Update patchStatus in issues list
        updateState({
          issues: verifierStateRef.current.issues.map((i) =>
            i.id === issueId
              ? { ...i, patchStatus: stillPresent ? "unresolved" : "resolved" }
              : i
          ),
        });
      } catch { /* post-validate is best-effort */ }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabledDocs]
  );

  // ── APPLY SINGLE FIX (surgical → fallback) ──
  const applySingleFix = useCallback(
    async (issue: VerifierIssue) => {
      setApplyingId(issue.id);
      onSnapshotVersions(documents, "harmonized");

      let finalDocs: Record<string, string> = { ...documents };
      let applied = false;
      let usedFallback = false;

      try {
        const targetContent = (documents as Record<string, string>)[issue.targetDoc];

        // ── PATH A: SURGICAL ──
        if (targetContent) {
          const hints = buildHints(issue);
          const section = extractSection(targetContent, hints);

          if (section) {
            const res = await fetch("/api/verify", {
              method: "POST",
              headers: apiHeaders(),
              body: JSON.stringify({
                documents,
                mode: "surgical",
                surgicalPayload: {
                  section: section.fullMatch,
                  sectionHeader: section.header,
                  targetDoc: issue.targetDoc,
                  issue: {
                    id: issue.id,
                    title: issue.title,
                    description: issue.description,
                    fix: issue.fix,
                    evidence: issue.evidence,
                  },
                },
              }),
            });

            if (res.ok) {
              const patchedSection = await streamFull(res);
              try {
                const patchedDoc = applyPatch(targetContent, section, patchedSection);
                finalDocs = { ...documents, [issue.targetDoc]: patchedDoc };
                onDocumentsUpdate({ [issue.targetDoc]: patchedDoc });
                applied = true;
              } catch (guardErr) {
                // Hallucination guard triggered — fall through to fallback
                console.warn("[surgical] guard rejected patch:", guardErr);
                usedFallback = true;
              }
            } else {
              usedFallback = true;
            }
          } else {
            usedFallback = true; // section not confidently found
          }
        }

        // ── PATH B: FALLBACK (harmonize, full doc) ──
        if (!applied) {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({
              documents,
              mode: "harmonize",
              report: `Fix only this issue:\n\nID: ${issue.id}\nTitle: ${issue.title}\nTarget Document: ${issue.targetDoc}\nFix: ${issue.fix}\nDescription: ${issue.description}`,
            }),
          });

          if (res.ok) {
            const raw = await streamFull(res);
            const { documents: correctedDocs } = parseDocumentBlocks(raw);
            if (Object.keys(correctedDocs).length > 0) {
              finalDocs = { ...documents, ...correctedDocs };
              onDocumentsUpdate(correctedDocs);
              applied = true;
            } else {
              // Fallback also returned nothing — surface the error
              updateState({
                issues: verifierStateRef.current.issues.map((i) =>
                  i.id === issue.id ? { ...i, patchStatus: "error" } : i
                ),
              });
            }
          }
        }

        if (applied) {
          updateState({
            applied: [...verifierStateRef.current.applied, issue.id],
            issues: verifierStateRef.current.issues.map((i) =>
              i.id === issue.id
                ? { ...i, patchStatus: usedFallback ? "fallback" : "patching" }
                : i
            ),
          });
          // Post-validate: re-verify and check if issue resolved
          postValidate(issue.id, finalDocs);
        }
      } catch {
        updateState({
          issues: verifierStateRef.current.issues.map((i) =>
            i.id === issue.id ? { ...i, patchStatus: "error" } : i
          ),
        });
      } finally {
        setApplyingId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documents, onDocumentsUpdate, onSnapshotVersions, postValidate]
  );

  // ── APPLY ALL FIXES ── (surgical per issue, fresh docs between each)
  const applyAllFixes = useCallback(async () => {
    const remaining = issues.filter(
      (i) => !dismissed.has(i.id) && !applied.has(i.id) && i.severity !== "info"
    );
    if (remaining.length === 0) return;

    updateState({ phase: "harmonizing" });
    onSnapshotVersions(documents, "harmonized");

    // Keep a mutable copy so each fix sees the result of the previous one
    let liveDocs: Record<string, string> = { ...documents as Record<string, string> };
    const resolvedIds: string[] = [];

    try {
      for (const issue of remaining) {
        const targetContent = liveDocs[issue.targetDoc];
        let fixApplied = false;

        // Try surgical first
        if (targetContent) {
          const hints = buildHints(issue);
          const section = extractSection(targetContent, hints);
          if (section) {
            const res = await fetch("/api/verify", {
              method: "POST",
              headers: apiHeaders(),
              body: JSON.stringify({
                documents: liveDocs,
                mode: "surgical",
                surgicalPayload: {
                  section: section.fullMatch,
                  sectionHeader: section.header,
                  targetDoc: issue.targetDoc,
                  issue: { id: issue.id, title: issue.title, description: issue.description, fix: issue.fix, evidence: issue.evidence },
                },
              }),
            });
            if (res.ok) {
              const patchedSection = await streamFull(res);
              try {
                liveDocs[issue.targetDoc] = applyPatch(targetContent, section, patchedSection);
                fixApplied = true;
              } catch { /* guard rejected — fall through */ }
            }
          }
        }

        // Fallback harmonize if surgical failed
        if (!fixApplied) {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({
              documents: liveDocs,
              mode: "harmonize",
              report: `Fix: ${issue.id} — ${issue.title}\nTarget: ${issue.targetDoc}\n${issue.fix}`,
            }),
          });
          if (res.ok) {
            const raw = await streamFull(res);
            const { documents: correctedDocs } = parseDocumentBlocks(raw);
            if (Object.keys(correctedDocs).length > 0) {
              Object.assign(liveDocs, correctedDocs);
              fixApplied = true;
            }
          }
        }

        if (fixApplied) resolvedIds.push(issue.id);
      }

      // Push all accumulated changes at once
      onDocumentsUpdate(liveDocs);
      updateState({
        phase: "done",
        applied: [...verifierStateRef.current.applied, ...resolvedIds],
      });

      // Post-validate: single re-verify pass after all fixes
      if (resolvedIds.length > 0) {
        await new Promise((r) => setTimeout(r, 400));
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({ documents: liveDocs, mode: "verify", enabledDocs }),
        });
        if (res.ok) {
          const raw = await streamFull(res);
          const newIssues = parseIssuesFromResponse(raw);
          const newIssueIds = new Set(newIssues.map((i) => i.id));
          updateState({
            issues: verifierStateRef.current.issues.map((i) =>
              resolvedIds.includes(i.id)
                ? { ...i, patchStatus: newIssueIds.has(i.id) ? "unresolved" : "resolved" }
                : i
            ),
          });
        }
      }
    } catch {
      updateState({ phase: "ready" });
    }
  }, [issues, dismissed, applied, documents, enabledDocs, onDocumentsUpdate, onSnapshotVersions]);


  // ── Counts ──
  const counts = {
    critical: issues.filter((i) => i.severity === "critical").length,
    warning: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
  };

  // ── Matrix scanner messages ──
  const SCAN_PHASES = [
    "INIT › Bootstrapping telemetry matrix...",
    "SCAN › Parsing document topology...",
    "XREF › Cross-referencing semantic layers...",
    "DIFF › Running divergence detection...",
    "ANLS › Identifying consistency drift...",
    "EVID › Extracting evidence fragments...",
    "RANK › Prioritizing issue vectors...",
    "COMP › Compiling telemetry report...",
  ];

  const [scanPhaseIdx, setScanPhaseIdx] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const [glitchChar, setGlitchChar] = useState("");

  useEffect(() => {
    if (phase !== "verifying") return;
    setScanPhaseIdx(0);
    const phaseTimer = setInterval(() => {
      setScanPhaseIdx((i) => (i + 1) % SCAN_PHASES.length);
    }, 1900);
    const cursorTimer = setInterval(() => setCursorOn((v) => !v), 530);
    const GLITCH_CHARS = "!@#$%^&*░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼";
    const glitchTimer = setInterval(() => {
      setGlitchChar(GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]);
      setTimeout(() => setGlitchChar(""), 80);
    }, 600);
    return () => { clearInterval(phaseTimer); clearInterval(cursorTimer); clearInterval(glitchTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const scannedBytes = streamingText.length;
  const scannedSections = (streamingText.match(/Block \d+|"id":/g) || []).length;

  const entropyScore =
    counts.critical > 0
      ? "CRITICAL"
      : counts.warning > 2
        ? "HIGH"
        : counts.warning > 0 || counts.info > 10
          ? "MEDIUM"
          : counts.info > 0
            ? "LOW"
            : "LOW";

  const entropyColor = {
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  }[entropyScore];

  return (
    <div className="h-full flex flex-col">
      {/* IDLE */}
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-cyan-400/60" />
          </div>
          <h3 className="font-mono font-semibold text-foreground text-sm mb-1">
            Cybernetic Verifier
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mb-5">
            Analyze {docCount} document{docCount !== 1 ? "s" : ""} for
            inconsistencies, contradictions, and complexity drift.
          </p>
          {docCount < 2 ? (
            <p className="text-[11px] text-yellow-400 font-mono">
              ⚠ At least 2 documents needed
            </p>
          ) : (
            <motion.button
              onClick={runVerify}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 text-black font-mono font-semibold text-xs hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Zap className="w-3.5 h-3.5" />
              Run Verification
            </motion.button>
          )}
        </div>
      )}

      {/* VERIFYING — Matrix Scanner */}
      {phase === "verifying" && (
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-5 h-5 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-cyan-400/30 border-b-transparent border-l-transparent"
                />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <span className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">
                SYS:VERIFY — ACTIVE
              </span>
              {glitchChar && (
                <span className="text-[10px] font-mono text-red-400 opacity-80">{glitchChar}</span>
              )}
            </div>
            <button
              onClick={() => { abortRef.current?.abort(); updateState({ phase: "idle" }); }}
              className="text-[10px] font-mono text-muted-foreground hover:text-red-400 transition-colors"
            >
              ■ ABORT
            </button>
          </div>

          {/* Scan bar */}
          <div className="relative h-1 rounded-full bg-cyan-950 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: "linear-gradient(90deg, #06b6d4, #22d3ee, #06b6d4)" }}
              animate={{ width: ["15%", "85%", "30%", "95%", "50%"], opacity: [1, 0.7, 1, 0.8, 1] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-y-0 w-8 rounded-full blur-sm bg-cyan-400/60"
              animate={{ left: ["-10%", "110%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Rotating phase messages */}
          <div
            className="relative h-10 overflow-hidden border border-cyan-500/10 rounded-md bg-cyan-950/20 px-3 flex items-center"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.02) 2px, rgba(6,182,212,0.02) 4px)" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={scanPhaseIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300"
              >
                <span className="text-cyan-600 text-[10px]">
                  [{String(scanPhaseIdx + 1).padStart(2, "0")}/{SCAN_PHASES.length}]
                </span>
                <span>{SCAN_PHASES[scanPhaseIdx]}</span>
                <span className={cn("text-cyan-400 transition-opacity duration-100", cursorOn ? "opacity-100" : "opacity-0")}>
                  ▌
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Live counters */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: "BYTES", value: scannedBytes.toLocaleString() },
              { label: "BLOCKS", value: String(scannedSections) },
              { label: "DOCS", value: String(docCount) },
            ] as const).map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-1.5 rounded border border-cyan-500/10 bg-cyan-950/20">
                <span className="text-[8px] font-mono text-cyan-700 tracking-widest">{label}</span>
                <motion.span
                  key={value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm font-mono font-bold text-cyan-300"
                >
                  {value}
                </motion.span>
              </div>
            ))}
          </div>

          {/* Raw stream preview */}
          <div className="flex-1 overflow-hidden rounded border border-cyan-500/5 bg-black/30 p-2 relative min-h-0">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)" }}
            />
            <p className="text-[9px] font-mono text-cyan-900 break-all leading-relaxed line-clamp-6 relative z-10">
              {streamingText || "Awaiting stream..."}
            </p>
          </div>
        </div>
      )}

      {/* READY / DONE */}
      {(phase === "ready" || phase === "done" || phase === "harmonizing") && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Summary Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-border space-y-2 relative overflow-hidden">

            {/* Harmonizing overlay — appears when a fix is being applied */}
            <AnimatePresence>
              {(applyingId || phase === "harmonizing") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-10 flex flex-col justify-center px-4 py-2 bg-background/80 backdrop-blur-sm"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(251,191,36,0.02) 3px, rgba(251,191,36,0.02) 4px)" }}
                >
                  {/* Sweep bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                      animate={{ left: ["-20%", "120%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.0, ease: "linear" }}
                      className="w-3.5 h-3.5 rounded-full border-2 border-t-amber-400 border-r-amber-400/30 border-b-transparent border-l-transparent"
                    />
                    <span className="text-[10px] font-mono text-amber-500 tracking-widest uppercase">
                      PATCH:HARMONIZE — ACTIVE
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={applyingId ?? "all"}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 6 }}
                      transition={{ duration: 0.2 }}
                      className="text-[10px] font-mono text-amber-300/70"
                    >
                      {applyingId
                        ? `⟶ Rewriting ${applyingId} › Injecting corrected content...`
                        : "⟶ Batch patch in progress › Cross-document sync..."}
                    </motion.div>
                  </AnimatePresence>

                  {/* Bottom sweep */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                      animate={{ left: ["120%", "-20%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-foreground">
                  Telemetry Report
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                  entropyColor
                )}
              >
                {entropyScore}
              </span>
            </div>

            {/* Severity pills */}
            <div className="flex items-center gap-2">
              {counts.critical > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  {counts.critical} critical
                </span>
              )}
              {counts.warning > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {counts.warning} warning
                </span>
              )}
              {counts.info > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {counts.info} info
                </span>
              )}
              {issues.length === 0 && !summary.match(/HIGH|CRITICAL/i) && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Homeostasis
                </span>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {docCount} docs analyzed
              </span>
            </div>
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Cross-Reference Summary */}
            {summary && (
              <details className="group mb-2">
                <summary className="cursor-pointer text-[10px] font-mono text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                  Cross-Reference Matrix
                </summary>
                <div className="mt-2 prose prose-invert prose-xs max-w-none text-xs overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summary}
                  </ReactMarkdown>
                </div>
              </details>
            )}

            {/* Issue Cards */}
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onNavigateToDoc={onNavigateToDoc}
                onApply={() => applySingleFix(issue)}
                onDismiss={() =>
                  updateState({ dismissed: [...verifierState.dismissed, issue.id] })
                }
                isApplying={applyingId === issue.id}
                isDismissed={dismissed.has(issue.id)}
                isApplied={applied.has(issue.id)}
              />
            ))}

            {/* Harmonizing indicator */}
            {phase === "harmonizing" && (
              <div className="flex items-center gap-2 py-3 justify-center">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-xs font-mono text-amber-400">
                  Harmonizing documents...
                </span>
              </div>
            )}

            {/* Done message */}
            {phase === "done" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400">
                  All fixes applied — documents updated
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 border-t border-border px-3 py-2.5 flex items-center gap-2">
            {(phase === "ready" || phase === "done") && (
              <>
                {phase === "ready" &&
                  issues.some(
                    (i) =>
                      !dismissed.has(i.id) &&
                      !applied.has(i.id) &&
                      i.severity !== "info"
                  ) && (
                    <motion.button
                      onClick={applyAllFixes}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-semibold hover:bg-amber-500/20 transition-colors"
                    >
                      <Wrench className="w-3 h-3" />
                      Apply All Fixes
                    </motion.button>
                  )}
                <motion.button
                  onClick={() => {
                    setStreamingText("");
                    runVerify();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/50 border border-border text-muted-foreground font-mono text-[11px] hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Re-Verify
                </motion.button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
