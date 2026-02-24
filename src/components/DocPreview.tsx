"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Components } from "react-markdown";
import { DocTabs, EmptyDocState } from "./DocTabs";
import { ExportBar } from "./ExportBar";
import { VerifierPanel, VerifierState } from "./VerifierPanel";
import dynamic from "next/dynamic";

/**
 * Preprocess AI-generated markdown before ReactMarkdown parses it.
 * Fixes two common issues:
 * 1) 4+ space indent turns into unwanted code blocks — strip to normal text
 * 2) Headings (# to ####) need a preceding blank line to be parsed correctly
 */
function normalizeMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inFence = false;
  let fenceType: string | null = null; // Track which fence type opened the block

  const isListLine = (l: string) => /^\s*[-*+•▸►]\s|^\s*\d+[.)]\s/.test(l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedStart = line.trimStart();

    // Track fenced code blocks — don't touch content inside them
    if (/^```/.test(trimmedStart) || /^~~~(?!doc:)/.test(trimmedStart)) {
      if (!inFence) {
        inFence = true;
        fenceType = trimmedStart.startsWith("```") ? "```" : "~~~";
      } else if (fenceType && trimmedStart.startsWith(fenceType)) {
        inFence = false;
        fenceType = null;
      }
      // else: different fence type inside a fence — treat as content
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // Strip 4+ space indent ONLY if the line is NOT a list item (preserve nested lists)
    const stripped = isListLine(line) ? line : line.replace(/^ {4,}/, "");

    // Ensure blank line before headings
    if (/^#{1,4}\s/.test(stripped) && i > 0 && out.length > 0 && out[out.length - 1].trim() !== "") {
      out.push("");
    }

    // Ensure blank line before list blocks that follow non-list content
    if (isListLine(stripped) && out.length > 0 && out[out.length - 1].trim() !== "" && !isListLine(out[out.length - 1])) {
      out.push("");
    }

    out.push(stripped);
  }

  return out.join("\n");
}

// Lazy-load DiffViewer — it bundles a syntax highlighter and is only shown
// when the user toggles diff mode, so keep it out of the initial bundle.
const DiffViewer = dynamic(() => import("./DiffViewer").then((m) => m.DiffViewer), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-mono">Loading diff...</div>,
});
import { Edit3, Eye, MessageSquare, Save, X, ShieldCheck, Clock, Download, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocVersion } from "@/lib/storage";

interface DocPreviewProps {
  documents: Record<string, string>;
  activeDoc: string | null;
  onSelectDoc: (docType: string) => void;
  sessionName: string;
  onDocumentEdit: (docType: string, newContent: string) => void;
  onAskAboutSection: (sectionTitle: string) => void;
  onDocumentsUpdate: (docs: Record<string, string>) => void;
  enabledDocs?: string[];
  onSnapshotVersions: (
    docs: Record<string, string>,
    source: "generated" | "edited" | "harmonized"
  ) => void;
  onReportReady?: (report: string) => void;
  verifierState: VerifierState;
  onVerifierStateChange: (state: VerifierState) => void;
  documentHistory: DocVersion[];
}

// Interactive checkbox state per doc (persisted in memory, reset on reload)
function useCheckboxState(docKey: string) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`checkboxes:${docKey}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        try {
          localStorage.setItem(`checkboxes:${docKey}`, JSON.stringify(next));
        } catch { /* ignore */ }
        return next;
      });
    },
    [docKey]
  );

  return { checked, toggle };
}

export function DocPreview({
  documents,
  activeDoc,
  onSelectDoc,
  sessionName,
  onDocumentEdit,
  onAskAboutSection,
  onDocumentsUpdate,
  enabledDocs,
  onSnapshotVersions,
  onReportReady,
  verifierState,
  onVerifierStateChange,
  documentHistory,
}: DocPreviewProps) {
  const [verifierActive, setVerifierActive] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const docCount = Object.keys(documents).length;
  const hasDocuments = Object.keys(documents).length > 0;
  const currentContent = activeDoc ? documents[activeDoc] : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { checked, toggle } = useCheckboxState(activeDoc ?? "");

  // When switching docs, exit edit mode
  const handleSelectDoc = (docType: string) => {
    setIsEditing(false);
    setVerifierActive(false);
    // diffMode persists across tab switches — only manual toggle closes it
    onSelectDoc(docType);
  };

  const handleVerifierNavigate = useCallback((docType: string) => {
    setVerifierActive(false);
    setDiffMode(false);
    onSelectDoc(docType);
  }, [onSelectDoc]);

  // Get history entries for current doc
  const currentDocVersions = useMemo(
    () => activeDoc
      ? documentHistory.filter((v) => v.docType === activeDoc)
      : [],
    [activeDoc, documentHistory]
  );
  const hasHistory = currentDocVersions.length > 0;

  const handleStartEdit = () => {
    setEditContent(currentContent ?? "");
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    if (activeDoc) {
      onDocumentEdit(activeDoc, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  // Custom markdown components for interactive rendering
  // Memoized by activeDoc + checked so ReactMarkdown doesn't re-render the
  // entire tree on unrelated state changes (e.g. streaming content updates).
  const isTaskList = activeDoc === "Task List";
  let checkboxCounter = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const markdownComponents: Components = useMemo(() => {
    let cbIdx = 0;
    const comps: Components = {
      // Section headings with "Ask AI" hover button
      h1: ({ children }) => (
        <SectionHeading level={1} onAsk={() => onAskAboutSection(String(children))}>
          {children}
        </SectionHeading>
      ),
      h2: ({ children }) => (
        <SectionHeading level={2} onAsk={() => onAskAboutSection(String(children))}>
          {children}
        </SectionHeading>
      ),
      h3: ({ children }) => (
        <SectionHeading level={3} onAsk={() => onAskAboutSection(String(children))}>
          {children}
        </SectionHeading>
      ),
      // Interactive checkboxes for Task List
      li: ({ children, ...props }) => {
        if (!isTaskList) {
          return <li {...props}>{children}</li>;
        }
        const childArray = Array.isArray(children) ? children : [children];
        const firstChild = childArray[0];
        const isCheckbox =
          typeof firstChild === "string" &&
          (firstChild.startsWith("[ ] ") || firstChild.startsWith("[x] ") || firstChild.startsWith("[X] "));

        if (isCheckbox) {
          const id = `cb-${cbIdx++}`;
          const isChecked = checked[id] ?? (firstChild.startsWith("[x]") || firstChild.startsWith("[X]"));
          const label = firstChild.slice(4);
          return (
            <li className="list-none flex items-start gap-2 my-1" {...props}>
              <button
                onClick={() => toggle(id)}
                className={cn(
                  "flex-shrink-0 mt-0.5 w-4 h-4 rounded border transition-all duration-150",
                  isChecked
                    ? "bg-cyan-500 border-cyan-500 text-black"
                    : "border-border hover:border-cyan-500/50 bg-transparent"
                )}
              >
                {isChecked && (
                  <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={cn("text-sm leading-relaxed", isChecked && "line-through text-muted-foreground")}>
                {label}
                {childArray.slice(1)}
              </span>
            </li>
          );
        }
        return <li {...props}>{children}</li>;
      },
      // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-explicit-any
      img: ({ src, alt, ...props }: any) => (
        <span className="block my-4 group/img relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            className="w-full max-h-96 object-contain rounded-xl border border-border bg-[#08080f] cursor-pointer transition-transform hover:scale-[1.01]"
            onClick={() => setLightboxSrc(src)}
            {...props}
          />
          <span className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
            <button
              onClick={() => setLightboxSrc(src)}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <a
              href={src}
              download={alt || "image"}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-colors"
              title="Download"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </span>
          {alt && <span className="block text-center text-[10px] font-mono text-muted-foreground mt-1.5">{alt}</span>}
        </span>
      ),
    };
    return comps;
  // activeDoc changes which doc is shown (affects isTaskList check)
  // checked changes which checkboxes are ticked (affects rendering)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDoc, checked]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-widest">
            Document Preview
          </h2>
          <div className="flex items-center gap-2">
            {hasDocuments && currentContent && (
              <>
                {isEditing ? (
                  <>
                    <motion.button
                      onClick={handleSaveEdit}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition-colors"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </motion.button>
                    <motion.button
                      onClick={handleCancelEdit}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    onClick={handleStartEdit}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary border border-border text-muted-foreground text-xs font-mono hover:text-foreground hover:border-cyan-500/30 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </motion.button>
                )}
                {hasHistory && !isEditing && (
                  <motion.button
                    onClick={() => setDiffMode(!diffMode)}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors",
                      diffMode
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-violet-500/30"
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    History
                  </motion.button>
                )}
              </>
            )}
            {hasDocuments && <ExportBar documents={documents} sessionName={sessionName} />}
            {docCount >= 2 && (
              <motion.button
                onClick={() => setVerifierActive(!verifierActive)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 border flex-shrink-0",
                  verifierActive
                    ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
                    : "text-muted-foreground bg-secondary border-border hover:text-foreground hover:bg-secondary hover:border-amber-500/30"
                )}
              >
                <ShieldCheck className="w-3 h-3" />
                Verifier
                {verifierActive && (
                  <motion.span
                    layoutId="verifier-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                  />
                )}
              </motion.button>
            )}
          </div>
        </div>
        {hasDocuments && (
          <div className="overflow-x-auto scrollbar-none">
            <DocTabs documents={documents} activeDoc={verifierActive ? null : activeDoc} onSelect={handleSelectDoc} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {verifierActive ? (
          <VerifierPanel
            documents={documents}
            enabledDocs={enabledDocs}
            verifierState={verifierState}
            onVerifierStateChange={onVerifierStateChange}
            onDocumentsUpdate={onDocumentsUpdate}
            onNavigateToDoc={handleVerifierNavigate}
            onSnapshotVersions={onSnapshotVersions}
            onReportReady={onReportReady}
          />
        ) : diffMode && activeDoc && hasHistory ? (
          <DiffViewer
            currentContent={currentContent ?? ""}
            versions={currentDocVersions}
            docType={activeDoc}
          />
        ) : !hasDocuments || !currentContent ? (
          <EmptyDocState />
        ) : isEditing ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full p-4"
          >
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full bg-transparent text-sm text-foreground font-mono leading-relaxed resize-none outline-none border border-border rounded-xl p-4 focus:border-cyan-500/30 transition-colors"
              placeholder="Edit your document..."
              spellCheck={false}
            />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDoc}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {normalizeMarkdown(currentContent)}
                </ReactMarkdown>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setLightboxSrc(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxSrc}
                alt="Fullscreen"
                className="max-w-full max-h-[90vh] object-contain rounded-xl"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <a
                  href={lightboxSrc}
                  download="image"
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-colors"
                  title="Download"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setLightboxSrc(null)}
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Section heading with hover "Ask AI" button
function SectionHeading({
  level,
  children,
  onAsk,
}: {
  level: 1 | 2 | 3;
  children: React.ReactNode;
  onAsk: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  const sizeClass = level === 1 ? "text-2xl" : level === 2 ? "text-xl" : "text-lg";

  return (
    <div
      className="group relative flex items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Tag className={cn("font-bold font-mono", sizeClass)}>{children}</Tag>
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            onClick={onAsk}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
            title="Ask AI about this section"
          >
            <MessageSquare className="w-2.5 h-2.5" />
            Ask AI
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
