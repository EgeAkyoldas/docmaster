"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Bot, Copy, Check, ImageIcon, AlertCircle, Download, Maximize2, CircleCheck, Circle, CheckCircle2 } from "lucide-react";
import { memo, useState, useEffect, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export interface InlineImage {
  imageData: string;
  mimeType: string;
  prompt: string;
}

export interface ParsedOption {
  label: string;   // e.g. "Option A"
  text: string;    // e.g. "Task creation → Task completion → Progress tracking."
  full: string;    // full original line
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  inlineImages?: InlineImage[];
  onImageClick?: (image: InlineImage) => void;
  guidedTopics?: string[];
  guidedAnswered?: number;
  isLastAssistant?: boolean;
  onOptionSelect?: (selected: string[]) => void;
}

// Parse options from AI text — handles multiple formats:
// - **Option A:** description
// - **Option A: description.**
// ▸ **Option A: description.** Extra text
// 1. **Option A:** description
export function parseOptions(text: string): ParsedOption[] {
  const opts: ParsedOption[] = [];
  // Pattern 1: bullet/dash + **Label:** text  (bold ends after label)
  // Pattern 2: bullet/dash + **Label: text**  (bold wraps everything)
  // Pattern 3: ▸ or numbered prefix variations
  const regex = /(?:[-*▸►•]|\d+[).]?)\s*\*\*(?:Option\s+)?([A-Z0-9]+)[):.]?(?:\*\*[:\s]+(.+)|[:\s]+(.+?)\*\*\.?\s*(.*))/gi;
  for (const m of text.matchAll(regex)) {
    const label = m[1];
    // m[2] = text after closing bold (Pattern 1)
    // m[3] = text inside bold (Pattern 2), m[4] = text after bold (Pattern 2)
    const desc = m[2] || [m[3], m[4]].filter(Boolean).join(' ');
    if (label && desc) {
      opts.push({ label, text: desc.replace(/\*\*/g, '').trim(), full: m[0].trim() });
    }
  }
  return opts;
}

export const MessageBubble = memo(function MessageBubble({ role, content, isStreaming, inlineImages, onImageClick, guidedTopics, guidedAnswered = 0, isLastAssistant, onOptionSelect }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const isUser = role === "user";

  // Parse options from AI content
  const options = useMemo(() => {
    if (isUser || isStreaming || !isLastAssistant) return [];
    return parseOptions(content);
  }, [content, isUser, isStreaming, isLastAssistant]);

  // Reset selections when content changes
  useEffect(() => { setSelectedOptions(new Set()); }, [content]);

  const toggleOption = useCallback((label: string) => {
    setSelectedOptions(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      // Notify parent of selected option texts
      const selectedTexts = options.filter(o => next.has(o.label)).map(o => `${o.label}: ${o.text}`);
      onOptionSelect?.(selectedTexts);
      return next;
    });
  }, [options, onOptionSelect]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = (img: InlineImage) => {
    const a = document.createElement("a");
    a.href = `data:${img.mimeType};base64,${img.imageData}`;
    const ext = img.mimeType.split("/")[1] ?? "png";
    const slug = img.prompt.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `apex-visual-${slug}.${ext}`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold",
          isUser
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            : "bg-secondary border border-border text-muted-foreground"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "glass border border-cyan-500/20 text-foreground rounded-tr-sm"
            : "bg-secondary border border-border text-foreground rounded-tl-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="markdown-content text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                input: ({ checked, type, ...rest }) => {
                  if (type === "checkbox") {
                    return checked
                      ? <CircleCheck className="w-3.5 h-3.5 text-green-400 inline-block mr-1 align-text-bottom flex-shrink-0" />
                      : <Circle className="w-3.5 h-3.5 text-muted-foreground/40 inline-block mr-1 align-text-bottom flex-shrink-0" />;
                  }
                  return <input type={type} checked={checked} {...rest} />;
                },
              }}
            >
              {options.length > 0
                ? content.replace(/(?:[-*▸►•]|\d+[).]?)\s*\*\*(?:Option\s+)?[A-Z0-9]+[):.]?(?:\*\*[:\s]+.+|[:\s]+.+?\*\*\.?\s*.*)/gi, '').replace(/\n{3,}/g, '\n\n').trim()
                : content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-0.5 animate-pulse rounded-sm" />
            )}
          </div>
        )}

        {/* Interactive option chips */}
        {options.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">
              Tap to select · multiple allowed
            </p>
            <div className="flex flex-col gap-1.5">
              {options.map((opt) => {
                const isSelected = selectedOptions.has(opt.label);
                return (
                  <motion.button
                    key={opt.label}
                    onClick={() => toggleOption(opt.label)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-start gap-2 px-3 py-2 rounded-lg text-left text-xs font-mono transition-all duration-150 border",
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                        : "bg-white/[0.03] border-white/[0.06] text-foreground/80 hover:bg-white/[0.06] hover:border-white/[0.12]"
                    )}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {isSelected
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        : <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                      }
                    </span>
                    <span>
                      <span className={cn("font-semibold", isSelected ? "text-cyan-300" : "text-foreground/90")}>{opt.label}:</span>{" "}
                      <span className="text-muted-foreground">{opt.text}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}



        {/* Inline generated images — clickable for fullscreen */}
        {inlineImages && inlineImages.length > 0 && (
          <div className="mt-3 space-y-3">
            {inlineImages.map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-cyan-500/20 group/img">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/5 border-b border-cyan-500/10">
                  <ImageIcon className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-mono text-cyan-400/70 truncate flex-1">{img.prompt}</span>
                  <button
                    onClick={() => handleDownloadImage(img)}
                    className="flex-shrink-0 p-1 rounded hover:bg-cyan-500/10 text-cyan-400/50 hover:text-cyan-400 transition-colors"
                    title="Download image"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
                <div className="relative cursor-zoom-in" onClick={() => onImageClick?.(img)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${img.mimeType};base64,${img.imageData}`}
                    alt={img.prompt}
                    className="w-full max-h-80 object-contain bg-[#08080f] transition-opacity group-hover/img:opacity-90"
                  />
                  {/* Expand overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono">
                      <Maximize2 className="w-3.5 h-3.5" />
                      View fullscreen
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Copy button */}
        {!isStreaming && content && (
          <button
            onClick={handleCopy}
            className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary border border-border rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </motion.div>
  );
});

// Image generation loading placeholder
export function ImageGeneratingBubble({ prompt }: { prompt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
        <Bot className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="bg-secondary border border-cyan-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <ImageIcon className="w-3.5 h-3.5 animate-pulse" />
          <span>Generating visual: <span className="text-cyan-400/60 truncate">{prompt.slice(0, 60)}...</span></span>
        </div>
        <div className="mt-2 h-32 rounded-lg bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Image generation error bubble
export function ImageErrorBubble({ prompt, fallbackText }: { prompt: string; fallbackText?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
        <Bot className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Visual generation unavailable for this prompt</span>
        </div>
        {fallbackText && (
          <p className="text-xs text-muted-foreground mt-1">{fallbackText}</p>
        )}
        <p className="text-xs text-muted-foreground/50 mt-1 italic">&ldquo;{prompt.slice(0, 80)}&rdquo;</p>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  const phrases = [
    "Analyzing your input…",
    "Building context…",
    "Crafting a response…",
    "Thinking it through…",
    "Reviewing documents…",
    "Synthesizing ideas…",
    "Almost there…",
  ];
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % phrases.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
        <Bot className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5 min-w-[180px]">
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </div>
        {/* Rotating text */}
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -4 }}
          transition={{ duration: 0.25 }}
          className="text-xs font-mono text-muted-foreground/70"
        >
          {phrases[idx]}
        </motion.span>
      </div>
    </motion.div>
  );
}

