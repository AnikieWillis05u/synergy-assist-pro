import { createFileRoute } from "@tanstack/react-router";
import { Copy, Loader2, Paperclip, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Markdown } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAssistant } from "@/lib/ai.functions";
import { buildContext, uid, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export const Route = createFileRoute("/app/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Chat with an AI workplace assistant that knows your tasks and meetings — draft emails, agendas and plans.",
      },
      { property: "og:title", content: "AI Workplace Chat Assistant" },
      { property: "og:description", content: "Ask anything about your work, grounded in your own data." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Summarize this document",
  "Create a task plan",
  "Draft a professional email",
  "Prepare a meeting agenda",
  "Help me prioritize my tasks",
];

function ChatPage() {
  const store = useStore();
  const { conversations, activeConversationId } = store;
  const conversation = conversations.find((c) => c.id === activeConversationId) ?? conversations[0];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length, loading]);

  const ask = async (prompt: string, history?: ChatMessage[]) => {
    if (!conversation || !prompt.trim()) return;
    const base = history ?? conversation.messages;
    const userMessage: ChatMessage = {
      id: uid("cm"),
      role: "user",
      content: prompt.trim(),
      createdAt: new Date().toISOString(),
    };
    const outbound = history ? base : [...base, userMessage];
    if (!history) store.appendMessage(conversation.id, userMessage);
    setInput("");
    setLoading(true);
    try {
      const res = await chatWithAssistant({
        data: {
          messages: outbound.map((m) => ({ role: m.role, content: m.content })),
          context: buildContext(store),
        },
      });
      store.appendMessage(conversation.id, {
        id: uid("cm"),
        role: "assistant",
        content: res.text,
        createdAt: new Date().toISOString(),
      });
      store.bumpAi();
    } catch (error) {
      toast.error("The assistant could not reply", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerate = () => {
    if (!conversation) return;
    const lastUser = [...conversation.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const upTo = conversation.messages.slice(0, conversation.messages.lastIndexOf(lastUser) + 1);
    store.popLastAssistantMessage(conversation.id);
    void ask(lastUser.content, upTo);
  };

  const attach = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setInput((v) => `${v}\n\n--- ${file.name} ---\n${text.slice(0, 8000)}`.trim());
    toast.success("File attached to your message");
  };

  const messages = conversation?.messages ?? [];

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[32rem] flex-col gap-4 lg:h-[calc(100vh-8rem)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">AI Chat</h1>
          <p className="text-sm text-muted-foreground">
            Grounded in your tasks and meetings — ask anything about your workday.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => store.newConversation()}>
            <Plus className="size-4" /> New chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              if (conversation) store.clearConversation(conversation.id);
              toast.success("Conversation cleared");
            }}
          >
            <Trash2 className="size-4" /> Clear
          </Button>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border/70 p-0 shadow-soft">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h2 className="font-display text-xl font-semibold">How can I help you work smarter?</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Draft emails, summarize documents, prepare agendas, brainstorm ideas or decide what to do next.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] space-y-1.5", m.role === "user" && "text-right")}>
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-3 text-left",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/70 bg-card",
                    )}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    ) : (
                      <Markdown content={m.content} />
                    )}
                  </div>
                  {m.role === "assistant" ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                        onClick={() => {
                          void navigator.clipboard.writeText(m.content);
                          toast.success("Response copied");
                        }}
                      >
                        <Copy className="size-3.5" /> Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                        onClick={regenerate}
                      >
                        <RefreshCw className="size-3.5" /> Regenerate
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="animate-pulse">Assistant is thinking...</span>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border/70 bg-card/80 p-3 sm:p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-xl"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach file"
            >
              <Paperclip className="size-5" />
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv,.json,text/*"
              className="hidden"
              onChange={(e) => void attach(e.target.files?.[0])}
            />
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(input);
                }
              }}
              placeholder="Ask your assistant anything..."
              className="max-h-40 min-h-11 resize-none rounded-xl"
            />
            <Button
              className="size-11 shrink-0 rounded-xl"
              size="icon"
              disabled={loading || !input.trim()}
              onClick={() => void ask(input)}
              aria-label="Send message"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
