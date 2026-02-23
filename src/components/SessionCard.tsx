"use client";

import { useState, useRef, useEffect } from "react";
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
  Pencil,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { Session } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { PROJECT_TYPE_PRESETS } from "@/lib/doc-definitions";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor, Gamepad2, TrendingUp, Palette, Megaphone, Server, Settings,
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
  onRename: (id: string, newName: string) => void;
}

export function SessionCard({ session, onOpen, onDelete, onRename }: SessionCardProps) {
  const docCount = Object.keys(session.documents).length;
  const msgCount = session.messages.length;

  const typeId = session.projectType ?? "webapp";
  const preset = PROJECT_TYPE_PRESETS.find((p) => p.id === typeId);
  const typeLabel = preset?.label ?? "Web/Mobile App";
  const IconComp = ICON_MAP[preset?.icon ?? "Monitor"] ?? Monitor;
  const badgeColor = TYPE_BADGE_COLORS[typeId] ?? TYPE_BADGE_COLORS.webapp;

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(session.id, trimmed);
    } else {
      setRenameValue(session.name);
    }
    setIsRenaming(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(session.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className="group relative glass rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-glow"
      onClick={() => !isRenaming && onOpen(session.id)}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${badgeColor} border flex-shrink-0`}>
          <IconComp className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full border ${badgeColor}`}>
              {typeLabel}
            </span>
          </div>

          {/* Name — inline editable */}
          {isRenaming ? (
            <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") { setIsRenaming(false); setRenameValue(session.name); }
                }}
                className="flex-1 min-w-0 bg-secondary border border-cyan-500/30 rounded px-2 py-0.5 text-sm text-foreground font-semibold outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
              <button onClick={handleRenameSubmit} className="p-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => { setIsRenaming(false); setRenameValue(session.name); }} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-sm text-foreground truncate mt-0.5">{session.name}</h3>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(session.updatedAt)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {msgCount}
            </span>
            {docCount > 0 && (
              <span className="flex items-center gap-1 text-cyan-500">
                <FileText className="w-3 h-3" />
                {docCount}
              </span>
            )}
          </div>
        </div>

        {/* Right side: actions on hover, arrow by default */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Hover actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setRenameValue(session.name); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className={`p-1.5 rounded-md transition-colors ${
                confirmDelete
                  ? "text-red-400 bg-red-500/15"
                  : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              }`}
              title={confirmDelete ? "Click again to confirm" : "Delete"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}
