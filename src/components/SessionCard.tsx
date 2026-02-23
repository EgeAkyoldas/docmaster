"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Trash2,
  ChevronRight,
  Monitor,
  Gamepad2,
  TrendingUp,
  Palette,
  Megaphone,
  Server,
  Settings,
} from "lucide-react";
import { Session } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { PROJECT_TYPE_PRESETS } from "@/lib/doc-definitions";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor,
  Gamepad2,
  TrendingUp,
  Palette,
  Megaphone,
  Server,
  Settings,
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  webapp: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  game: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  business: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "design-system": "text-pink-400 bg-pink-500/10 border-pink-500/20",
  marketing: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  infrastructure: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  custom: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

interface SessionCardProps {
  session: Session;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SessionCard({ session, onOpen, onDelete }: SessionCardProps) {
  const docCount = Object.keys(session.documents).length;
  const msgCount = session.messages.length;

  const typeId = session.projectType ?? "webapp";
  const preset = PROJECT_TYPE_PRESETS.find((p) => p.id === typeId);
  const typeLabel = preset?.label ?? "Web/Mobile App";
  const IconComp = ICON_MAP[preset?.icon ?? "Monitor"] ?? Monitor;
  const badgeColor = TYPE_BADGE_COLORS[typeId] ?? TYPE_BADGE_COLORS.webapp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="group relative glass rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-glow"
      onClick={() => onOpen(session.id)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2.5 rounded-lg ${badgeColor} border flex-shrink-0`}>
          <IconComp className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {typeLabel}
            </span>
          </div>
          <h3 className="font-semibold text-foreground truncate pr-8">
            {session.name}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(session.updatedAt)}
            </span>
            <span>{msgCount} messages</span>
            {docCount > 0 && (
              <span className="text-cyan-500">{docCount} doc{docCount > 1 ? "s" : ""} generated</span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}
