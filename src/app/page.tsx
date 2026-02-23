"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Zap,
  FileText,
  X,
  Monitor,
  Gamepad2,
  TrendingUp,
  Palette,
  Megaphone,
  Server,
  Settings,
  ChevronLeft,
  Check,
  HelpCircle,
} from "lucide-react";
import { ProductGuide, shouldShowGuide } from "@/components/ProductGuide";
import { SessionCard } from "@/components/SessionCard";
import {
  getSessions,
  saveSession,
  deleteSession,
  createSession,
  Session,
} from "@/lib/storage";
import {
  PROJECT_TYPE_PRESETS,
  DEFAULT_DOC_DEFINITIONS,
  type ProjectType,
} from "@/lib/doc-definitions";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor,
  Gamepad2,
  TrendingUp,
  Palette,
  Megaphone,
  Server,
  Settings,
};

const TYPE_COLORS: Record<string, string> = {
  webapp: "cyan",
  game: "violet",
  business: "amber",
  "design-system": "pink",
  marketing: "orange",
  infrastructure: "emerald",
  custom: "sky",
};

const TYPE_COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  cyan:    { border: "border-cyan-500/40",    bg: "bg-cyan-500/10",    text: "text-cyan-400",    glow: "shadow-cyan-500/20" },
  violet:  { border: "border-violet-500/40",  bg: "bg-violet-500/10",  text: "text-violet-400",  glow: "shadow-violet-500/20" },
  amber:   { border: "border-amber-500/40",   bg: "bg-amber-500/10",   text: "text-amber-400",   glow: "shadow-amber-500/20" },
  pink:    { border: "border-pink-500/40",    bg: "bg-pink-500/10",    text: "text-pink-400",    glow: "shadow-pink-500/20" },
  orange:  { border: "border-orange-500/40",  bg: "bg-orange-500/10",  text: "text-orange-400",  glow: "shadow-orange-500/20" },
  emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  sky:     { border: "border-sky-500/40",     bg: "bg-sky-500/10",     text: "text-sky-400",     glow: "shadow-sky-500/20" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [showGuide, setShowGuide] = useState(false);

  // Auto-show guide on first visit
  useEffect(() => {
    if (shouldShowGuide()) setShowGuide(true);
  }, []);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  const resetModal = () => {
    setShowNewModal(false);
    setProjectName("");
    setSelectedType(null);
    setStep(1);
  };

  const handleCreate = async () => {
    if (!projectName.trim() || !selectedType) return;
    const session = createSession(
      projectName.trim(),
      "master",
      selectedType.id,
      selectedType.enabledDocKeys
    );
    await saveSession(session);
    router.push(`/session/${session.id}`);
  };

  const goToStep2 = () => {
    if (!projectName.trim()) return;
    setStep(2);
  };

  const handleDelete = async (id: string) => {
    await deleteSession(id);
    setSessions(await getSessions());
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border glass-dark sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-mono font-bold text-foreground text-sm">PRD Creator</h1>
              <p className="text-xs text-muted-foreground">AI Document Factory</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="How it works"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <motion.button
              onClick={() => setShowNewModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-cyber-dark font-mono font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              New Project
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-mono font-bold text-2xl text-foreground mb-3">No Projects Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Create your first project to start generating professional documentation with AI.
            </p>
            <motion.button
              onClick={() => setShowNewModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-cyber-dark font-mono font-semibold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-5 h-5" />
              Create First Project
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-mono font-semibold text-foreground">
                Projects{" "}
                <span className="text-muted-foreground font-normal">({sessions.length})</span>
              </h2>
            </div>
            <div className="grid gap-3">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <SessionCard
                    session={session}
                    onOpen={(id) => router.push(`/session/${id}`)}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
              onClick={resetModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-30 flex items-center justify-center p-4"
            >
              <div className="glass rounded-2xl border border-border w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Modal header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    {step === 2 && (
                      <button
                        onClick={() => setStep(1)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div>
                      <h2 className="font-mono font-bold text-foreground">
                        {step === 1 ? "New Project" : "Project Type"}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step === 1
                          ? "Name your project and continue"
                          : "Choose a preset to configure your doc toolkit"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetModal}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Step 1: Project Name */}
                {step === 1 && (
                  <div className="p-6">
                    <label className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goToStep2()}
                      placeholder="e.g. TaskFlow — Team Productivity App"
                      autoFocus
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
                    />

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={resetModal}
                        className="flex-1 py-2.5 rounded-lg border border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        onClick={goToStep2}
                        disabled={!projectName.trim()}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex-1 py-2.5 rounded-lg bg-cyan-500 text-cyber-dark font-mono font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                      >
                        Continue →
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Step 2: Project Type Selection */}
                {step === 2 && (
                  <div className="p-6">
                    {/* Type Grid */}
                    <div className="grid grid-cols-2 gap-2.5 mb-5">
                      {PROJECT_TYPE_PRESETS.map((preset) => {
                        const IconComp = ICON_MAP[preset.icon] ?? Settings;
                        const colorKey = TYPE_COLORS[preset.id] ?? "sky";
                        const colors = TYPE_COLOR_CLASSES[colorKey];
                        const isSelected = selectedType?.id === preset.id;

                        return (
                          <motion.button
                            key={preset.id}
                            onClick={() => setSelectedType(preset)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? `${colors.border} ${colors.bg} shadow-lg ${colors.glow}`
                                : "border-border hover:border-border/80 hover:bg-secondary/50"
                            }`}
                          >
                            {isSelected && (
                              <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                                <Check className={`w-3 h-3 ${colors.text}`} />
                              </div>
                            )}
                            <div className={`w-8 h-8 rounded-lg ${isSelected ? colors.bg : "bg-secondary"} ${isSelected ? colors.border : "border-border"} border flex items-center justify-center`}>
                              <IconComp className={`w-4 h-4 ${isSelected ? colors.text : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <p className={`text-sm font-mono font-semibold ${isSelected ? colors.text : "text-foreground"}`}>
                                {preset.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                {preset.description}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Doc Preview */}
                    {selectedType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mb-5"
                      >
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <p className="text-xs font-mono text-muted-foreground mb-2">
                            Documents ({selectedType.enabledDocKeys.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedType.enabledDocKeys.map((docKey) => {
                              const def = DEFAULT_DOC_DEFINITIONS.find((d) => d.docKey === docKey);
                              return (
                                <span
                                  key={docKey}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/80 border border-cyan-500/10"
                                >
                                  {def?.label ?? docKey}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Footer */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-2.5 rounded-lg border border-border text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        ← Back
                      </button>
                      <motion.button
                        onClick={handleCreate}
                        disabled={!selectedType}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex-1 py-2.5 rounded-lg bg-cyan-500 text-cyber-dark font-mono font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                      >
                        Create Project →
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Guide */}
      <ProductGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}

