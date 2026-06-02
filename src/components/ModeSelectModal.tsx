"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocMode } from "@/lib/mode";

interface ModeSelectModalProps {
  open: boolean;
  onSelect: (mode: DocMode) => void;
}

const OPTIONS: {
  mode: DocMode;
  title: string;
  desc: string;
  icon: typeof Zap;
  accent: string;
}[] = [
  {
    mode: "guided",
    title: "Guided",
    desc: "I ask you one question at a time, then write the document from your answers.",
    icon: MessageSquare,
    accent: "cyan",
  },
  {
    mode: "auto",
    title: "Auto",
    desc: "I generate full documents immediately from the conversation — no questions.",
    icon: Zap,
    accent: "amber",
  },
];

export function ModeSelectModal({ open, onSelect }: ModeSelectModalProps) {
  // Escape defaults to Guided so the modal never blocks the user permanently.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect("guided");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onSelect]);

  if (!open) return null;

  return (
    <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, type: "spring", damping: 28, stiffness: 350 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border shadow-2xl shadow-black/60"
              style={{ background: "rgba(12, 12, 18, 0.97)", backdropFilter: "blur(24px)" }}
            >
              <div className="px-6 pt-6 pb-2 text-center">
                <h2 className="text-base font-mono font-semibold text-foreground">How do you want to work?</h2>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">
                  You can switch anytime from the toggle in the chat header.
                </p>
              </div>

              <div className="px-6 py-5 grid grid-cols-2 gap-3">
                {OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => onSelect(opt.mode)}
                      className={cn(
                        "group flex flex-col items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150",
                        "border-border bg-secondary/40 hover:bg-secondary/70",
                        opt.accent === "cyan"
                          ? "hover:border-cyan-500/50 hover:shadow-sm hover:shadow-cyan-500/10"
                          : "hover:border-amber-500/50 hover:shadow-sm hover:shadow-amber-500/10"
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg border flex items-center justify-center",
                          opt.accent === "cyan"
                            ? "bg-cyan-400/10 border-cyan-400/25"
                            : "bg-amber-400/10 border-amber-400/25"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", opt.accent === "cyan" ? "text-cyan-400" : "text-amber-400")} />
                      </div>
                      <div>
                        <div className="text-sm font-mono font-semibold text-foreground">{opt.title}</div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
    </>
  );
}
