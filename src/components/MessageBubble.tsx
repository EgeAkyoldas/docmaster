"use client";

import { motion } from "framer-motion";
import { User, Bot, Copy, Check, ImageIcon, AlertCircle, Download, Maximize2 } from "lucide-react";
import { memo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export interface InlineImage {
  imageData: string;
  mimeType: string;
  prompt: string;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  inlineImages?: InlineImage[];
  onImageClick?: (image: InlineImage) => void;
  guidedTopics?: string[];
  guidedAnswered?: number;
}

export const MessageBubble = memo(function MessageBubble({ role, content, isStreaming, inlineImages, onImageClick, guidedTopics, guidedAnswered = 0 }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-0.5 animate-pulse rounded-sm" />
            )}
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

