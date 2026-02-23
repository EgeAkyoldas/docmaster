"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn } from "lucide-react";

export interface ImageModalData {
  imageData: string;
  mimeType: string;
  prompt: string;
}

interface ImageModalProps {
  image: ImageModalData | null;
  onClose: () => void;
}

export function ImageModal({ image, onClose }: ImageModalProps) {
  const handleDownload = useCallback(() => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = `data:${image.mimeType};base64,${image.imageData}`;
    const ext = image.mimeType.split("/")[1] ?? "png";
    const slug = image.prompt.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `apex-visual-${slug}.${ext}`;
    a.click();
  }, [image]);

  // ESC to close
  useEffect(() => {
    if (!image) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [image, onClose]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(4, 4, 12, 0.92)", backdropFilter: "blur(14px)" }}
          onClick={onClose}
        >
          {/* Controls */}
          <div
            className="absolute top-4 right-4 flex items-center gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt label */}
          <div
            className="absolute top-4 left-4 max-w-[60%]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-cyan-400/70 truncate">
              <ZoomIn className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{image.prompt}</span>
            </div>
          </div>

          {/* Image */}
          <motion.img
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            src={`data:${image.mimeType};base64,${image.imageData}`}
            alt={image.prompt}
            // eslint-disable-next-line @next/next/no-img-element
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl shadow-black/60 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
