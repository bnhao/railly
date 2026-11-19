"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import {
  getCachedCorridorWeather,
  getCachedTasks,
  getCachedUsers,
} from "@/utils/apiCache";
import { Task } from "@/types/task";
import { evaluateOperationalRisks } from "@/utils/riskEngine";

const SYSTEM_INSTRUCTION = `You are Railly OS, the AI Dispatch & Safety Copilot for the Railly Alberta Railway Operations platform.
Platform sections:
- Control Center (/dashboard): Automated risk queue, live corridor weather, network map, and active work orders.
- Track Overview (/track-overview): Spatial GIS map of 152 Alberta subdivisions, track specs, and maintenance history.
- Weather Risks (/weather): 48h wind & temperature hazards vs rail thresholds.
- Work Schedule (/schedule): 7-day dispatch board, crew progress tracking, and shift reports.
- Manage Crew (/manageusers): Supervisor roster & workload view.
- Field Reports (/feedback): Operator field observations.

Provide concise bulleted operational guidance grounded strictly in the live context attached to each prompt. Use markdown links like [Open Work Schedule](/schedule) for navigation.`;

interface ChatMessage {
  text: string;
  sender: "user" | "bot";
}

function renderInlineFormatting(line: string, keyPrefix: string) {
  // Parse **bold** and [label](/path) cleanly into React nodes without dangerouslySetInnerHTML
  const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch) {
      const label = linkMatch[1];
      const href = linkMatch[2];
      if (href.startsWith("/")) {
        return (
          <Link
            key={key}
            href={href}
            className="text-cyan-300 underline hover:text-cyan-200 font-medium"
          >
            {label}
          </Link>
        );
      }
      return (
        <span key={key} className="text-cyan-300 font-medium">
          {label}
        </span>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function SafeMessageBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;
        if (line.startsWith("* ") || line.startsWith("- ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>{renderInlineFormatting(line.slice(2), `b-${idx}`)}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInlineFormatting(line, `p-${idx}`)}</p>;
      })}
    </div>
  );
}

function buildLiveTelemetryContext(): string {
  const tasks = getCachedTasks<Task>() ?? [];
  const corridors = getCachedCorridorWeather() ?? [];
  const users = (getCachedUsers<{ name: string; role?: string }>() ?? []);
  const risks = evaluateOperationalRisks(tasks, corridors);

  const openTasks = tasks
    .filter((t) => t.status?.toLowerCase() !== "completed")
    .slice(0, 8)
    .map(
      (t) =>
        `#${t.id} "${t.title}" [${t.priority}/${t.status}] Track=${t.track_id} Crew=${t.assigned_to_name || "Unassigned"} Due=${String(t.end_date).slice(0, 10)}`
    );

  const topRisks = risks
    .slice(0, 5)
    .map((r) => `[${r.severity.toUpperCase()}] ${r.title}: ${r.detail}`);

  const wxSummary = corridors
    .slice(0, 6)
    .map(
      (c) =>
        `${c.name}: ${c.tempC}°C, wind ${c.windKmh}km/h (gust ${c.gustKmh}), risk=${c.riskLevel}`
    );

  return [
    `LIVE SNAPSHOT:`,
    `- Crew count: ${users.length}; Total orders: ${tasks.length}`,
    `- Open orders sample: ${openTasks.length ? openTasks.join(" | ") : "None"}`,
    `- Active risk alerts: ${topRisks.length ? topRisks.join(" | ") : "None"}`,
    `- Corridor weather: ${wxSummary.length ? wxSummary.join(" | ") : "Not fetched yet"}`,
  ].join("\n");
}

function AIchatbot() {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      text: "System initialized. Ask me about **open work orders**, **corridor weather risks**, or navigation across Railly.",
      sender: "bot",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<any> | null>(null);

  const ensureChatSession = useCallback(async () => {
    if (chatSessionRef.current) return chatSessionRef.current;
    if (initPromiseRef.current) return initPromiseRef.current;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;

    initPromiseRef.current = import("@google/generative-ai")
      .then(({ GoogleGenerativeAI }) => {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction: SYSTEM_INSTRUCTION,
        });
        chatSessionRef.current = model.startChat({ history: [] });
        return chatSessionRef.current;
      })
      .catch((error) => {
        initPromiseRef.current = null;
        console.warn("Failed to initialize AI assistant:", error);
        return null;
      });

    return initPromiseRef.current;
  }, []);

  useEffect(() => {
    if (isOpen) {
      void ensureChatSession();
    }
  }, [isOpen, ensureChatSession]);

  const handleGenerate = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { text: trimmed, sender: "user" }]);
    setInput("");
    setIsTyping(true);

    const session = await ensureChatSession();
    if (!session) {
      setMessages((prev) => [
        ...prev,
        {
          text: "AI Assistant API key is unavailable. Use [Operations Control Center](/dashboard) or [Work Schedule](/schedule) directly.",
          sender: "bot",
        },
      ]);
      setIsTyping(false);
      return;
    }

    try {
      const liveContext = buildLiveTelemetryContext();
      const result = await session.sendMessage(
        `${liveContext}\n\nOperator Question: ${trimmed}`
      );
      const botResponse = result.response.text();
      setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn("AI Generation failed:", msg);
      setMessages((prev) => [
        ...prev,
        {
          text: "Connection to Railly OS interrupted or rate-limited. Please retry in a moment.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  return (
    <div className="fixed bottom-20 md:bottom-5 right-4 z-50 flex flex-col items-end no-print">
      {isOpen ? (
        <section
          aria-label="Railly OS AI Assistant"
          className="flex flex-col w-[calc(100vw-2rem)] sm:w-[370px] h-[480px] rounded-2xl overflow-hidden bg-[#151921] border border-[#2d3546] shadow-2xl mb-3 widget-contain"
        >
          <div className="bg-[#10141c] px-4 py-3 flex justify-between items-center border-b border-[#242a36]">
            <div className="flex items-center gap-2.5">
              <div className="bg-cyan-500/15 p-1.5 rounded-lg border border-cyan-500/30">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-100 tracking-wide">
                  RAILLY OS
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-gray-400 font-mono">
                    Live Telemetry Context
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Assistant"
              className="text-gray-400 hover:text-white hover:bg-[#1e2430] p-1.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-custom p-3.5 bg-[#0d1015] space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[88%] gap-2 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {msg.sender === "user" ? (
                      <div className="bg-[#1e2430] p-1.5 rounded-full">
                        <User className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    ) : (
                      <div className="bg-cyan-500/15 p-1.5 rounded-full border border-cyan-500/30">
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-xl ${
                      msg.sender === "user"
                        ? "bg-cyan-600 text-white rounded-tr-none text-xs"
                        : "bg-[#151921] text-gray-200 border border-[#242a36] rounded-tl-none"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      msg.text
                    ) : (
                      <SafeMessageBody text={msg.text} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-xs font-mono text-cyan-400 animate-pulse pl-8">
                Analyzing network telemetry...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-[#10141c] border-t border-[#242a36]">
            <div className="relative flex items-center">
              <input
                type="text"
                aria-label="Ask Railly OS"
                className="w-full bg-[#0d1015] border border-[#242a36] text-gray-200 rounded-lg py-2.5 pl-3 pr-10 text-xs focus:outline-none focus:border-cyan-500 placeholder:text-gray-500"
                placeholder="Ask about risks, tracks, orders..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={isTyping}
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isTyping || !input.trim()}
                aria-label="Send Message"
                className="absolute right-1.5 p-1.5 bg-cyan-600/20 text-cyan-300 rounded-md hover:bg-cyan-600 hover:text-white transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          aria-label="Open AI Assistant"
          className="flex items-center justify-center w-12 h-12 bg-[#151921] border border-[#2d3546] rounded-full shadow-xl hover:border-cyan-500/60 transition-transform duration-150"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-5 h-5 text-cyan-400" />
        </button>
      )}
    </div>
  );
}

export default memo(AIchatbot);
