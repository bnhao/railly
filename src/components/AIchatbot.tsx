"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

export default function AIchatbot() {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { text: "System initialized. How can I assist your railway operations today?", sender: "bot" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Chat Session
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.8-flash",
        systemInstruction: `You are Railly, the AI Industrial Operations Assistant for the Railly platform. Your role is to help railway operators navigate the system, analyze track capacity, manage schedules, and understand weather impacts.
The platform sections are:
- Dashboard (/dashboard): General overview, current weather widget, and priority active schedules.
- Track Overview (/track-overview): Detailed railway map with GeoJSON track selection and maintenance history charts.
- Weather (/weather): Meteoblue forecasting and specific track location weather analysis.
- Schedule (/schedule): Task management for maintenance crews (available in admin and user views).
- Manage User (/manageusers): Admin portal for staff roles.
- Feedback (/feedback): Community and operator feedback.

Always provide concise, structured answers with bullet points. If users need to go to a section, provide a markdown link to it (e.g., [Go to Dashboard](/dashboard)). Speak professionally like an AI system inside a high-tech control room.`
      });
      chatSessionRef.current = model.startChat({ history: [] });
    }
  }, []);

  const handleGenerate = async () => {
    if (!input.trim() || !chatSessionRef.current) return;
    
    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessage(userMessage);
      const botResponse = result.response.text();
      setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
    } catch (error) {
      console.warn("AI Generation failed:", error.message || error);
      setMessages((prev) => [
        ...prev,
        { text: "Warning: Connection to neural net failed (System Overloaded - 503). Please try again in a moment.", sender: "bot" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="flex flex-col w-[380px] h-[550px] rounded-2xl overflow-hidden bg-[#1e2128] border border-gray-700 shadow-2xl shadow-cyan-900/20 mb-4 transition-all duration-300 ease-out">
          {/* Header */}
          <div className="bg-[#181a20] p-4 flex justify-between items-center border-b border-gray-700 shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-500/30">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-100 tracking-wide">RAILLY OS</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs text-gray-400 font-mono">System Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Assistant"
              className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#121418] space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[85%] gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="flex-shrink-0 mt-1">
                    {msg.sender === "user" ? (
                      <div className="bg-gray-700/50 p-1.5 rounded-full">
                        <User className="w-4 h-4 text-gray-300" />
                      </div>
                    ) : (
                      <div className="bg-cyan-500/20 p-1.5 rounded-full border border-cyan-500/30">
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-900/20"
                        : "bg-[#1e2128] text-gray-200 border border-gray-700 rounded-tl-none shadow-md prose prose-invert prose-sm prose-p:my-1 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-ul:my-1 prose-li:my-0"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      msg.text
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-cyan-400 hover:text-cyan-300 underline font-medium">$1</a>').replace(/\n/g, '<br/>').replace(/\* (.*?)\n/g, '<li class="ml-4 list-disc">$1</li>') }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="flex max-w-[85%] gap-2 flex-row">
                  <div className="flex-shrink-0 mt-1">
                    <div className="bg-cyan-500/20 p-1.5 rounded-full border border-cyan-500/30">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                  <div className="bg-[#1e2128] border border-gray-700 p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#181a20] border-t border-gray-800">
            <div className="relative flex items-center">
              <input
                type="text"
                className="w-full bg-[#121418] border border-gray-700 text-gray-200 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-500"
                placeholder="Ask Railly OS..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={isTyping}
              />
              <button
                onClick={handleGenerate}
                disabled={isTyping || !input.trim()}
                aria-label="Send Message"
                className="absolute right-2 p-2 bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-cyan-600/20 disabled:hover:text-cyan-400"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          aria-label="Open AI Assistant"
          className="flex items-center justify-center w-14 h-14 bg-[#1e2128] border border-gray-700 rounded-full shadow-2xl shadow-cyan-900/30 hover:border-cyan-500/50 hover:scale-105 transition-all duration-200 group"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        </button>
      )}
    </div>
  );
}
