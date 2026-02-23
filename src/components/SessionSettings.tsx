"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Check, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import {
  DEFAULT_DOC_DEFINITIONS,
  COLOR_MAP,
  type DocDefinition,
} from "@/lib/doc-definitions";
import { cn } from "@/lib/utils";

interface SessionSettingsProps {
  open: boolean;
  enabledDocs: string[];
  customInstructions: Record<string, string>;
  typeDefaultInstructions: Record<string, string>;
  onClose: () => void;
  onUpdate: (customInstructions: Record<string, string>) => void;
  onEnabledDocsUpdate: (enabledDocs: string[]) => void;
}

export function SessionSettings({
  open,
  enabledDocs,
  customInstructions,
  typeDefaultInstructions,
  onClose,
  onUpdate,
  onEnabledDocsUpdate,
}: SessionSettingsProps) {
  // Resolve the effective baseline: type override > generic default
  const getBaseline = (docKey: string): string => {
    const def = DEFAULT_DOC_DEFINITIONS.find((d) => d.docKey === docKey);
    return typeDefaultInstructions[docKey] ?? def?.defaultInstruction ?? "";
  };
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (def: DocDefinition) => {
    setEditingKey(def.docKey);
    setEditValue(customInstructions[def.docKey] ?? def.defaultInstruction);
  };

  const saveEdit = () => {
    if (!editingKey) return;
    const baseline = getBaseline(editingKey);

    const next = { ...customInstructions };
    if (editValue.trim() === baseline.trim()) {
      // Value matches the type baseline — store it so it survives type-awareness
      next[editingKey] = baseline;
    } else {
      next[editingKey] = editValue.trim();
    }
    onUpdate(next);
    setEditingKey(null);
  };

  const resetOne = (docKey: string) => {
    const next = { ...customInstructions };
    const baseline = getBaseline(docKey);
    // Reset to type baseline (not delete — would fall back to generic)
    next[docKey] = baseline;
    onUpdate(next);
    if (editingKey === docKey) setEditingKey(null);
  };

  const resetAll = () => {
    // Restore all to type baselines
    onUpdate({ ...typeDefaultInstructions });
    setEditingKey(null);
  };

  const toggleDoc = (docKey: string) => {
    if (enabledDocs.includes(docKey)) {
      onEnabledDocsUpdate(enabledDocs.filter((k) => k !== docKey));
    } else {
      onEnabledDocsUpdate([...enabledDocs, docKey]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0d1117] border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-mono font-bold text-foreground">
                  Session Settings
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toggle documents and customize instructions
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {DEFAULT_DOC_DEFINITIONS.map((def) => {
                const isEnabled = enabledDocs.includes(def.docKey);
                const baseline = getBaseline(def.docKey);
                const isCustom = def.docKey in customInstructions && customInstructions[def.docKey] !== baseline;
                const isEditing = editingKey === def.docKey;
                const currentInstruction =
                  customInstructions[def.docKey] ?? def.defaultInstruction;

                return (
                  <div
                    key={def.docKey}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      !isEnabled
                        ? "border-border/50 bg-secondary/10 opacity-50"
                        : isCustom
                          ? "border-cyan-500/30 bg-cyan-500/5"
                          : "border-border bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* Toggle */}
                        <button
                          onClick={() => toggleDoc(def.docKey)}
                          className="flex-shrink-0"
                          title={isEnabled ? "Disable document" : "Enable document"}
                        >
                          {isEnabled ? (
                            <ToggleRight className={`w-5 h-5 text-${def.color}-400`} />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <span
                          className={cn(
                            "inline-block w-2 h-2 rounded-full",
                            `bg-${def.color}-500`
                          )}
                        />
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {def.label}
                        </span>
                        {isCustom && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                            EDITED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isCustom && !isEditing && (
                          <button
                            onClick={() => resetOne(def.docKey)}
                            title="Reset to default"
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isEditing ? (
                          <button
                            onClick={saveEdit}
                            className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEdit(def)}
                            disabled={!isEnabled}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        rows={4}
                        className="w-full bg-[#161b22] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono resize-y outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-2 ml-7">
                        {currentInstruction}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border">
              <button
                onClick={resetAll}
                disabled={!DEFAULT_DOC_DEFINITIONS.some((d) => {
                  const baseline = getBaseline(d.docKey);
                  return d.docKey in customInstructions && customInstructions[d.docKey] !== baseline;
                })}
                className="w-full py-2 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-2" />
                Reset All to Defaults
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
