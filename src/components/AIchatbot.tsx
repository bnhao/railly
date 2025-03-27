"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageCircle, X } from "lucide-react";
import { sendError } from "next/dist/server/api-utils";

export default function AIchatbot() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you?", sender: "bot" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { text: input, sender: "user" }]);
      setInput("");
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API key is not defined");
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const systemPrompt = `
      You are a chatbot for "Railly" a platform designed for railway operators to view weather and track data, and schedule railway maintenance plan based on these information.
      This website has 8 main sections: Dashboard, Track Overview, Weather, Schedule, Admin, Help, Manage User, Feedback.
      If someone asks about a topic outside of this, kindly redirect them back to relevant topics.

      Making your responses concise and structured with bullet points.
    `;

      const fullPrompt = `${systemPrompt}\nUser: ${input}\nChatbot:`;

      const result = await model.generateContent(fullPrompt);
      const botResponse = result.response.text();

      setMessages((prev) => [...prev, { text: botResponse, sender: "bot" }]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, something went wrong.", sender: "bot" },
      ]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="absolute bottom-6 right-6 flex flex-col items-end">
      <div
        className="flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-gray-700 relative bg-black"
        style={{
          width: isOpen ? 300 : 50,
          height: isOpen ? 400 : 50,
          transition: "width 0.3s, height 0.3s",
        }}
      >
        {isOpen ? (
          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Railly Chatbot</h1>
              <X
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 text-white hover:cursor-pointer"
              />
            </div>
            <div className="flex-1 overflow-auto p-2 border rounded bg-gray-50">
              {messages.map(
                (msg, index) => (
                  console.log(msg),
                  (
                    <div
                      key={index}
                      className={`p-2 my-1 rounded-md text-sm ${
                        msg.sender === "user"
                          ? "bg-blue-500 text-white self-end"
                          : "bg-gray-200 text-gray-800 self-start"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )
                )
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex mt-2">
              <input
                type="text"
                className="p-2 border rounded-md text-black"
                placeholder="Type here..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                className="ml-2 p-2 bg-blue-500 text-white rounded-md"
              >
                Ask
              </button>
            </div>
          </div>
        ) : (
          <button
            className="flex flex-col items-center justify-center w-full"
            onClick={() => setIsOpen(true)}
          >
            <MessageCircle className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}
