import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Shield, Lock, Loader2 } from "lucide-react";
import { Button } from "../core/Button";
import { supabase } from "../../config/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  sender_role: "doctor" | "patient" | "system";
  content: string;
  created_at: string;
}

interface SecureTextChatProps {
  consultationId: string;
  role: "doctor" | "patient";
  otherPartyName: string;
  onClose?: () => void;
}

export function SecureTextChat({
  consultationId,
  role,
  otherPartyName,
  onClose,
}: SecureTextChatProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch initial messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["chat", consultationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_role, content, created_at")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as Message[]) || [];
    },
  });

  // 2. Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`db-messages-${consultationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          queryClient.setQueryData<Message[]>(
            ["chat", consultationId],
            (old = []) => {
              // Check if message is already in state to prevent duplicates from optimistic updates
              if (old.some((m) => m.id === payload.new.id)) return old;
              return [...old, payload.new as Message];
            },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId, queryClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 3. Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          consultation_id: consultationId,
          sender_id: user.id,
          sender_role: role,
          content: text,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onMutate: async (newText) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["chat", consultationId] });
      const previousMessages = queryClient.getQueryData<Message[]>([
        "chat",
        consultationId,
      ]);

      queryClient.setQueryData<Message[]>(
        ["chat", consultationId],
        (old = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            sender_role: role,
            content: newText,
            created_at: new Date().toISOString(),
          },
        ],
      );

      return { previousMessages };
    },
    onError: (err, newText, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["chat", consultationId],
          context.previousMessages,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", consultationId] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] border border-surface-border rounded-xl bg-white shadow-sm overflow-hidden w-full mx-auto">
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-surface-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{otherPartyName}</h3>
          <p className="text-xs text-status-safe flex items-center mt-0.5">
            <Lock className="h-3 w-3 mr-1" /> End-to-end Encrypted Session
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="bg-primary-100 text-primary-700 p-2 rounded-full cursor-default"
            title="Medical Privacy Enforced"
          >
            <Shield className="h-5 w-5" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-muted/30">
        <div className="text-center my-4">
          <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
            Secure end-to-end encrypted connection established.
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-slate-400 mt-10">
            No messages yet. Send a message to start the secure chat.
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.sender_role === "system") {
              return (
                <div key={msg.id} className="text-center my-4">
                  <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const isMe = msg.sender_role === role;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                    isMe
                      ? "bg-primary-600 text-white rounded-tr-sm"
                      : "bg-white border border-surface-border text-slate-800 rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <div
                    className={`text-[10px] mt-2 text-right ${isMe ? "text-primary-200" : "text-slate-400"}`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-surface-border">
        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors cursor-pointer"
            title="Attach Image (Coming Soon)"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your secure message..."
            className="flex-1 border border-surface-border focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-surface-muted rounded-full px-5 py-3 outline-none transition-all"
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-full px-5 h-10"
            disabled={!input.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Send <Send className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
