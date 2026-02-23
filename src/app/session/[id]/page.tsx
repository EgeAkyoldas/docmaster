"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, ChevronRight, Settings } from "lucide-react";
import { ChatPanel, ChatPanelHandle } from "@/components/ChatPanel";
import { DocPreview } from "@/components/DocPreview";
import { SessionSettings } from "@/components/SessionSettings";
import { INITIAL_VERIFIER_STATE, VerifierState } from "@/components/VerifierPanel";
import {
  getSession,
  saveSession,
  debouncedSaveSession,
  debouncedSaveDocuments,
  flushPendingSave,
  Session,
  ChatMessage,
  DocVersion,
} from "@/lib/storage";
import { DOCUMENT_LABELS } from "@/lib/constants";
import { DEFAULT_DOC_DEFINITIONS, PROJECT_TYPE_PRESETS } from "@/lib/doc-definitions";

const DEFAULT_ALL_DOCS = DEFAULT_DOC_DEFINITIONS.map((d) => d.docKey);

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [panelWidth, setPanelWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const [verifierState, setVerifierState] = useState<VerifierState>(INITIAL_VERIFIER_STATE);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chatPanelRef = useRef<ChatPanelHandle>(null);

  useEffect(() => {
    getSession(sessionId).then((s) => {
      if (!s) {
        router.push("/");
        return;
      }
      if (!s.documentHistory) {
        s.documentHistory = [];
      }
      setSession(s);
      const docKeys = Object.keys(s.documents);
      if (docKeys.length > 0) setActiveDoc(docKeys[0]);
    });
  }, [sessionId, router]);

  // Flush debounced save on unmount or page leave
  useEffect(() => {
    const handleBeforeUnload = () => flushPendingSave();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      flushPendingSave();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleMessagesUpdate = useCallback(
    (messages: ChatMessage[]) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, messages, updatedAt: Date.now() };
        debouncedSaveSession(updated);
        return updated;
      });
    },
    []
  );

  const handleDocumentsUpdate = useCallback(
    (newDocs: Record<string, string>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const mergedDocs = { ...prev.documents };
        for (const [type, content] of Object.entries(newDocs)) {
          mergedDocs[type] = content;
        }
        const updated = { ...prev, documents: mergedDocs, updatedAt: Date.now() };
        // Use the fast doc channel — 150ms debounce keeps IndexedDB writes
        // separate from chat streaming saves
        debouncedSaveDocuments(updated);
        return updated;
      });
      const newDocType = Object.keys(newDocs)[0];
      if (newDocType) setActiveDoc(newDocType);
    },
    []
  );

  const handleDocumentEdit = useCallback(
    (docType: string, newContent: string) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          documents: { ...prev.documents, [docType]: newContent },
          updatedAt: Date.now(),
        };
        void saveSession(updated);
        return updated;
      });
    },
    []
  );

  // Snapshot current doc versions before AI changes
  const MAX_VERSIONS_PER_DOC = 3;
  const handleSnapshotVersions = useCallback(
    (docs: Record<string, string>, source: DocVersion["source"]) => {
      setSession((prev) => {
        if (!prev) return prev;
        const now = Date.now();
        const newVersions: DocVersion[] = Object.entries(docs).map(
          ([docType, content]) => ({ docType, content, timestamp: now, source })
        );
        // Trim in-memory immediately (don't wait for save-time trim)
        const allHistory = [...(prev.documentHistory || []), ...newVersions];
        const byDocType: Record<string, DocVersion[]> = {};
        for (const v of allHistory) {
          (byDocType[v.docType] ??= []).push(v);
        }
        const kept: DocVersion[] = [];
        for (const versions of Object.values(byDocType)) {
          versions.sort((a, b) => b.timestamp - a.timestamp);
          kept.push(...versions.slice(0, MAX_VERSIONS_PER_DOC));
        }
        const documentHistory = kept.sort((a, b) => a.timestamp - b.timestamp);
        const updated = { ...prev, documentHistory, updatedAt: now };
        void saveSession(updated);
        return updated;
      });
    },
    []
  );

  const handleReportReady = useCallback((report: string) => {
    setVerifierState(prev => ({ ...prev, rawReport: report }));
  }, []);

  const handleAskAboutSection = useCallback((sectionTitle: string) => {
    chatPanelRef.current?.prefillInput(`Regarding the "${sectionTitle}" section: `);
  }, []);

  const handleCustomInstructionsUpdate = useCallback(
    (customInstructions: Record<string, string>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, customInstructions, updatedAt: Date.now() };
        void saveSession(updated);
        return updated;
      });
    },
    []
  );

  const handleEnabledDocsUpdate = useCallback(
    (enabledDocs: string[]) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, enabledDocs, updatedAt: Date.now() };
        void saveSession(updated);
        return updated;
      });
    },
    []
  );

  // Drag-to-resize — throttled to 60fps via requestAnimationFrame
  const rafDragRef = useRef<number | null>(null);
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafDragRef.current !== null) return; // already scheduled
      rafDragRef.current = requestAnimationFrame(() => {
        const pct = (e.clientX / window.innerWidth) * 100;
        setPanelWidth(Math.max(25, Math.min(70, pct)));
        rafDragRef.current = null;
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafDragRef.current !== null) {
        cancelAnimationFrame(rafDragRef.current);
        rafDragRef.current = null;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
          <Zap className="w-4 h-4 animate-pulse text-cyan-400" />
          Loading session...
        </div>
      </div>
    );
  }

  const label = DOCUMENT_LABELS[session.instructionKey] ?? session.instructionKey;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border glass-dark z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>Projects</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-semibold">{session.name}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {label}
            </span>
            {isStreaming && (
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400"
              >
                <Zap className="w-3 h-3" />
                Generating...
              </motion.div>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Session Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Split pane workspace */}
      <div
        className="flex-1 flex overflow-hidden"
        style={{ cursor: isDragging ? "col-resize" : "default" }}
      >
        {/* Chat panel */}
        <div
          className="flex-shrink-0 border-r border-border overflow-hidden"
          style={{ width: `${panelWidth}%` }}
        >
          <ChatPanel
            ref={chatPanelRef}
            messages={session.messages}
            isStreaming={isStreaming}
            existingDocs={session.documents}
            enabledDocs={session.enabledDocs}
            customInstructions={session.customInstructions}
            guidedTopicOverrides={PROJECT_TYPE_PRESETS.find((p) => p.id === session.projectType)?.guidedTopicOverrides}
            verifyReport={verifierState.rawReport || null}
            onMessagesUpdate={handleMessagesUpdate}
            onDocumentsUpdate={handleDocumentsUpdate}
            onStreamingChange={setIsStreaming}
          />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          className="flex-shrink-0 w-1 bg-border hover:bg-cyan-500/30 cursor-col-resize transition-colors relative group"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-border group-hover:bg-cyan-500/50 transition-colors" />
        </div>

        {/* Doc preview panel */}
        <div className="flex-1 overflow-hidden">
          <DocPreview
            documents={session.documents}
            activeDoc={activeDoc}
            onSelectDoc={setActiveDoc}
            sessionName={session.name}
            onDocumentEdit={handleDocumentEdit}
            onAskAboutSection={handleAskAboutSection}
            onDocumentsUpdate={handleDocumentsUpdate}
            enabledDocs={session.enabledDocs}
            onSnapshotVersions={handleSnapshotVersions}
            onReportReady={handleReportReady}
            verifierState={verifierState}
            onVerifierStateChange={setVerifierState}
            documentHistory={session.documentHistory || []}
          />
        </div>
      </div>

      {/* Session Settings */}
      <SessionSettings
        open={settingsOpen}
        enabledDocs={session.enabledDocs ?? DEFAULT_ALL_DOCS}
        customInstructions={session.customInstructions ?? {}}
        typeDefaultInstructions={PROJECT_TYPE_PRESETS.find((p) => p.id === session.projectType)?.instructionOverrides ?? {}}
        onClose={() => setSettingsOpen(false)}
        onUpdate={handleCustomInstructionsUpdate}
        onEnabledDocsUpdate={handleEnabledDocsUpdate}
      />
    </div>
  );
}
