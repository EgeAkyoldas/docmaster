"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  KeyRound,
  FolderPlus,
  MessageSquareText,
  FileStack,
  ShieldCheck,
  Download,
  Sparkles,
  CircleCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "prdbot_guide_seen";

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
  color: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    icon: <KeyRound className="w-7 h-7" />,
    title: "Set Your API Key",
    description:
      "Click the key icon in the top-right corner and enter your Gemini API key. Choose your preferred AI model — from fast Flash Lite to powerful Pro 3.",
    tip: "Your key stays in your browser. It's never stored on any server.",
    color: "amber",
  },
  {
    icon: <FolderPlus className="w-7 h-7" />,
    title: "Create a Project",
    description:
      "Hit 'New Project', name it, and pick a project type — Web App, Game, Business, Design System, Marketing Site, Infrastructure, or Custom.",
    tip: "Each type activates the right documents and AI instructions for your domain.",
    color: "cyan",
  },
  {
    icon: <MessageSquareText className="w-7 h-7" />,
    title: "Chat with AI",
    description:
      "Describe your project idea in the chat. The AI will ask smart questions to deeply understand your vision, goals, and constraints before generating anything.",
    tip: "Use the Guided Mode buttons to walk through topics step by step.",
    color: "violet",
  },
  {
    icon: <FileStack className="w-7 h-7" />,
    title: "Generate Documents",
    description:
      "Click any document button in the toolbar — PRD, Architecture, Tech Spec, and more. The AI generates comprehensive, cross-referenced documents from your conversation.",
    tip: "Documents reference each other. Generate PRD first, then Architecture, for best results.",
    color: "emerald",
  },
  {
    icon: <ShieldCheck className="w-7 h-7" />,
    title: "Verify & Fix",
    description:
      "Run the Cybernetic Verifier to automatically check all documents for gaps, inconsistencies, and missing sections. AI can fix issues with one click.",
    tip: "Verifier catches things humans miss — like a tech spec referencing a feature not in the PRD.",
    color: "rose",
  },
  {
    icon: <Download className="w-7 h-7" />,
    title: "Export & Ship",
    description:
      "Export individual documents as Markdown, or download everything as a ZIP. Your docs are ready for dev teams, investors, or AI coding assistants.",
    tip: "The Vibe Prompt document is designed to be pasted directly into an AI coding tool.",
    color: "sky",
  },
];

const COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; glow: string; ring: string }> = {
  amber:   { border: "border-amber-500/40",   bg: "bg-amber-500/10",   text: "text-amber-400",   glow: "shadow-amber-500/25",   ring: "ring-amber-500/30" },
  cyan:    { border: "border-cyan-500/40",    bg: "bg-cyan-500/10",    text: "text-cyan-400",    glow: "shadow-cyan-500/25",    ring: "ring-cyan-500/30" },
  violet:  { border: "border-violet-500/40",  bg: "bg-violet-500/10",  text: "text-violet-400",  glow: "shadow-violet-500/25",  ring: "ring-violet-500/30" },
  emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-emerald-500/25", ring: "ring-emerald-500/30" },
  rose:    { border: "border-rose-500/40",    bg: "bg-rose-500/10",    text: "text-rose-400",    glow: "shadow-rose-500/25",    ring: "ring-rose-500/30" },
  sky:     { border: "border-sky-500/40",     bg: "bg-sky-500/10",     text: "text-sky-400",     glow: "shadow-sky-500/25",     ring: "ring-sky-500/30" },
};

interface ProductGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductGuide({ isOpen, onClose }: ProductGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  const step = GUIDE_STEPS[currentStep];
  const colors = COLOR_CLASSES[step.color];
  const isLast = currentStep === GUIDE_STEPS.length - 1;
  const isFirst = currentStep === 0;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-widest">
                    How It Works
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator dots */}
              <div className="flex items-center justify-center gap-1.5 px-5 pb-4">
                {GUIDE_STEPS.map((_, i) => {
                  const dotColor = COLOR_CLASSES[GUIDE_STEPS[i].color];
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === currentStep
                          ? `w-6 ${dotColor.text.replace("text-", "bg-")}`
                          : i < currentStep
                            ? "w-1.5 bg-green-400/60"
                            : "w-1.5 bg-border"
                      )}
                    />
                  );
                })}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 pb-2"
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 shadow-lg",
                    colors.bg, colors.border, colors.text, colors.glow
                  )}>
                    {step.icon}
                  </div>

                  {/* Step number & title */}
                  <div className="text-center mb-3">
                    <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", colors.text)}>
                      Step {currentStep + 1} of {GUIDE_STEPS.length}
                    </span>
                    <h3 className="text-lg font-mono font-bold text-foreground mt-1">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground text-center leading-relaxed mb-3">
                    {step.description}
                  </p>

                  {/* Tip */}
                  {step.tip && (
                    <div className={cn(
                      "flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-mono",
                      colors.bg, colors.border
                    )}>
                      <CircleCheck className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", colors.text)} />
                      <span className="text-muted-foreground leading-relaxed">{step.tip}</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-border mt-3">
                <button
                  onClick={handlePrev}
                  disabled={isFirst}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-mono transition-colors",
                    isFirst
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <button
                  onClick={handleClose}
                  className="text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Skip guide
                </button>

                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shadow-lg",
                    isLast
                      ? "bg-green-500 text-black hover:bg-green-400 shadow-green-500/20"
                      : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20"
                  )}
                >
                  {isLast ? "Get Started" : "Next"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Returns true if the user has NOT seen the guide before */
export function shouldShowGuide(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}
