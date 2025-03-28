"use client";

import React, { useState } from "react";
import Nav from "@/components/navbar";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Page() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
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
    `;

      const fullPrompt = `${systemPrompt}\nUser: ${input}\nChatbot:`;

      const result = await model.generateContent(fullPrompt);
      setResponse(result.response.text());
    } catch (error) {
      console.error("Error generating response:", error);
      setResponse("Sorry, something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="flex">
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl font-bold mb-4">Help</h1>
        <div className="w-full max-w-lg">
          <input
            type="text"
            className="w-full p-2 border rounded-md text-black"
            placeholder="Type your question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            className="mt-2 w-full p-2 bg-blue-500 text-white rounded-md"
            disabled={loading}
          >
            {loading ? "Generating..." : "Ask"}
          </button>
        </div>
        {response && (
          <div className="mt-4 p-3 border rounded-md bg-gray-100 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-black">Response:</h2>
            <p className="text-black">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
