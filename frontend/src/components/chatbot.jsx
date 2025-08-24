import React, { useState, useRef, useEffect } from "react";

const Chatbot = ({ user }) => {
  // Use user?.uid or user?.email as part of the key
  const userKey = user?.uid || user?.email || "guest";
  const storageKey = `chatMessages_${userKey}`;

  const storedMessages = JSON.parse(localStorage.getItem(storageKey) || "null");
  const [messages, setMessages] = useState(
    storedMessages || [{ sender: "bot", text: "Hi! I’m your assistant. How can I help you?" }]
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Save to localStorage with user-specific key
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/ideas/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error("Network response not ok");
      const data = await res.json();

      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
        setIsTyping(false);
      }, 800);
    } catch (err) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "⚠️ Error connecting to server." },
        ]);
        setIsTyping(false);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0f1014] z-50">
      {/* Header */}
      <div className="flex items-center h-12 min-h-12 relative border-b border-[#2a0f07] shadow-sm bg-[#0f1014] z-10 w-full">
        <button
          onClick={() => window.location.href = "/"}
          className="ml-2 flex items-center gap-1 px-3 py-1 rounded-full bg-[#18120b] border border-[#ff9a3c] text-[#ff9a3c] text-xs font-semibold shadow hover:bg-[#ff9a3c] hover:text-[#18120b] transition-all duration-200"
          style={{ height: "28px", minWidth: "36px" }}
          title="Back"
        >
          <span className="text-base">⬅</span>
        </button>
        <span className="flex-1 text-center font-display text-base sm:text-lg text-[#ff9a3c] select-none truncate max-w-[70vw] pl-2">
          MindForge Assistant
        </span>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3 bg-[#1a0a06]"
        style={{ minHeight: 0 }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 sm:p-3 rounded-2xl max-w-[90%] sm:max-w-[80%] break-words relative text-sm sm:text-base ${
              msg.sender === "bot"
                ? "self-start bg-gradient-to-r from-[#2a120b] to-[#3a1a0f] text-[#f5e1c0] shadow-inner"
                : "self-end bg-gradient-to-r from-[#ff6b00] to-[#ff9a3c] text-black shadow-md"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div className="self-start p-2 sm:p-3 rounded-2xl bg-gradient-to-r from-[#2a120b] to-[#3a1a0f] text-[#f5e1c0] max-w-[60%] sm:max-w-[40%] shadow-inner flex items-center space-x-1">
            <span className="w-2 h-2 bg-[#ff9a3c] rounded-full animate-bounce delay-0"></span>
            <span className="w-2 h-2 bg-[#ff9a3c] rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-[#ff9a3c] rounded-full animate-bounce delay-300"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex p-2 sm:p-3 border-t border-[#2a0f07] bg-[#0f1014] z-10">
        <input
          className="flex-1 rounded-l-2xl p-2 sm:p-3 bg-[#1e0f0a] text-[#f5e1c0] border border-[#2a120b] focus:ring-2 focus:ring-[#ff9a3c] focus:outline-none text-sm sm:text-base"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-3 sm:px-5 rounded-r-2xl bg-gradient-to-br from-[#ff6b00] to-[#ff9a3c] text-black font-semibold hover:brightness-110 active:scale-95 transition text-sm sm:text-base"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;