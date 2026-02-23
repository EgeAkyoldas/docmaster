"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, X, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEMINI_MODELS, GeminiModelId } from "@/lib/useApiKey";

interface ApiKeyModalProps {
  open: boolean;
  currentKey: string;
  currentModel: GeminiModelId;
  onSave: (key: string, model: GeminiModelId) => void;
  onClose: () => void;
}

export function ApiKeyModal({ open, currentKey, currentModel, onSave, onClose }: ApiKeyModalProps) {
  const [value, setValue] = useState(currentKey);
  const [model, setModel] = useState<GeminiModelId>(currentModel);
  const [showKey, setShowKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentKey);
      setModel(currentModel);
      setShowKey(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, currentKey, currentModel]);

  const isValid = value.trim().startsWith("AIza") && value.trim().length > 20;
  const isDirty = value.trim() !== currentKey || model !== currentModel;

  const handleSave = () => {
    if (!isDirty) { onClose(); return; }
    onSave(value.trim(), model);
    onClose();
  };

  const handleClear = () => {
    onSave("", model);
    setValue("");
    onClose();
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
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, type: "spring", damping: 28, stiffness: 350 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-border shadow-2xl shadow-black/60"
              style={{ background: "rgba(12, 12, 18, 0.97)", backdropFilter: "blur(24px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-mono font-semibold text-foreground">API Settings</h2>
                    <p className="text-[10px] text-muted-foreground font-mono">Key &amp; model — stored locally only</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5 space-y-5">
                {/* Info banner */}
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                  <AlertCircle className="w-3.5 h-3.5 text-cyan-400/80 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
                    Your key is stored locally in your browser and sent directly to Gemini.{" "}
                    <span className="text-foreground">We never see or store it.</span>
                  </p>
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showKey ? "text" : "password"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") onClose();
                      }}
                      placeholder="AIzaSy..."
                      className={cn(
                        "w-full bg-secondary border rounded-xl px-3 py-2.5 pr-10 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200",
                        value && isValid
                          ? "border-cyan-500/40 focus:border-cyan-500/60"
                          : value && !isValid
                          ? "border-red-500/40 focus:border-red-500/60"
                          : "border-border focus:border-cyan-500/30"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 h-4">
                    {value && (
                      <>
                        {isValid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] font-mono text-cyan-400">Key looks valid</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-red-400/80" />
                            <span className="text-[10px] font-mono text-red-400/80">Should start with AIzaSy...</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Model selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Model
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {GEMINI_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModel(m.id as GeminiModelId)}
                        className={cn(
                          "flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all duration-150",
                          model === m.id
                            ? "border-cyan-500/50 bg-cyan-500/8 shadow-sm shadow-cyan-500/10"
                            : "border-border bg-secondary/40 hover:border-border/80 hover:bg-secondary/60"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-0.5">
                          <span className="text-[11px] font-mono font-semibold text-foreground">{m.label}</span>
                          <span className={cn(
                            "text-[9px] font-mono px-1.5 py-0.5 rounded-full border",
                            m.badge === "Fastest" ? "text-green-400 border-green-500/30 bg-green-500/8" :
                            m.badge === "Smart"   ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/8" :
                                                    "text-amber-400 border-amber-500/30 bg-amber-500/8"
                          )}>
                            {m.badge}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground/50 truncate w-full">{m.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Get key link */}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/70 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Get a free API key from Google AI Studio
                </a>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                <button
                  onClick={handleClear}
                  disabled={!currentKey}
                  className="text-[11px] font-mono text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Clear key
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 border border-border transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSave}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={!!value && !isValid}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
                      isValid || !value
                        ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                        : "bg-secondary text-muted-foreground border border-border"
                    )}
                  >
                    Save
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
