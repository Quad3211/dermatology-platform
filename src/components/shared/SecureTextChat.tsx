import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Shield, Lock } from "lucide-react";
import { Button } from "../core/Button";

interface Message {
  id: string;
  sender: "doctor" | "patient" | "system";
  text: string;
  timestamp: string;
}

export function SecureTextChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "system",
      text: "Secure end-to-end encrypted connection established.",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: "2",
      sender: "doctor",
      text: "Hello! I am Dr. Jenkins. I have reviewed your AI triage results. Can you tell me if the lesion has changed in size, shape, or color recently?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "patient",
      text: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setInput("");

    // Auto-reply mock
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "r",
          sender: "doctor",
          text: "Thank you for that context. Based on the initial image, I would recommend we set up an in-person biopsy just to be entirely safe. The AI highlighted some asymmetry we should look at under a dermatoscope.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[600px] border border-surface-border rounded-xl bg-white shadow-sm overflow-hidden w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-surface-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            Dr. Sarah Jenkins, MD
          </h3>
          <p className="text-xs text-status-safe flex items-center mt-0.5">
            <Lock className="h-3 w-3 mr-1" /> End-to-end Encrypted Session
          </p>
        </div>
        <div
          className="bg-primary-100 text-primary-700 p-2 rounded-full cursor-default"
          title="Medical Privacy Enforced"
        >
          <Shield className="h-5 w-5" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-muted/30">
        {messages.map((msg) => {
          if (msg.sender === "system") {
            return (
              <div key={msg.id} className="text-center my-4">
                <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isPatient = msg.sender === "patient";
          return (
            <div
              key={msg.id}
              className={`flex ${isPatient ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] md:max-w-[60%] rounded-2xl p-4 shadow-sm ${
                  isPatient
                    ? "bg-primary-600 text-white rounded-tr-sm"
                    : "bg-white border border-surface-border text-slate-800 rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div
                  className={`text-[10px] mt-2 text-right ${isPatient ? "text-primary-200" : "text-slate-400"}`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-surface-border">
        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors cursor-pointer"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your secure message..."
            className="flex-1 border border-surface-border focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-surface-muted rounded-full px-5 py-3 outline-none transition-all"
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-full px-5 h-10"
            disabled={!input.trim()}
          >
            Send <Send className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
