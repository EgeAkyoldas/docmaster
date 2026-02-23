import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

export interface StreamChatOptions {
  model?: string;
  systemInstruction: string;
  history: ChatMessage[];
  message: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** User-supplied API key (takes priority over server env key) */
  apiKey?: string;
}

export async function streamChat(options: StreamChatOptions) {
  const apiKey = options.apiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });

  const {
    model = process.env.GEMINI_REASONING_MODEL ?? "gemini-3-flash-preview",
    systemInstruction,
    history,
    message,
    temperature = 0.7,
    maxOutputTokens = 8192,
  } = options;

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
      temperature,
      maxOutputTokens,
    },
    history,
  });

  const stream = await chat.sendMessageStream({ message });
  return stream;
}
