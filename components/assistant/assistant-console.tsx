"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import type { AssistantReply } from "@/lib/types";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AssistantConsole({
  initialReply,
  quickPrompts,
}: {
  initialReply: AssistantReply;
  quickPrompts: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: initialReply.reply,
    },
  ]);
  const [restocks, setRestocks] = useState(initialReply.restocks);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPrompt(prompt: string) {
    if (!prompt.trim()) return;

    const cleanPrompt = prompt.trim();
    setMessages((current) => [...current, { role: "user", content: cleanPrompt }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });

      const result = (await response.json()) as AssistantReply & { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "The assistant could not answer.");
      }

      setMessages((current) => [...current, { role: "assistant", content: result.reply }]);
      setRestocks(result.restocks);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The assistant could not answer right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <Surface className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Conversation</p>
            <h3 className="mt-3 text-2xl font-semibold text-stone-950">Ask the floor anything</h3>
          </div>
          <Pill tone="accent">Local heuristics</Pill>
        </div>

        <div className="scrollbar-hidden flex max-h-[540px] flex-col gap-4 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[92%] rounded-[24px] px-5 py-4 text-sm leading-7 whitespace-pre-line",
                message.role === "assistant"
                  ? "bg-white/85 text-stone-800"
                  : "ml-auto bg-stone-950 text-stone-50",
              )}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => submitPrompt(prompt)}
              className="touch-target rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex gap-3 rounded-[24px] border border-[var(--line)] bg-white/82 p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitPrompt(input);
              }
            }}
            rows={3}
            placeholder="Try: Which products should I reorder first?"
            className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-7 text-stone-900 outline-none"
          />
          <button
            type="button"
            onClick={() => submitPrompt(input)}
            disabled={loading}
            className={cn(
              "touch-target self-end rounded-2xl px-4 text-sm font-semibold transition",
              loading
                ? "cursor-not-allowed bg-stone-200 text-stone-400"
                : "bg-stone-950 text-stone-50",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <ArrowUp className="h-4 w-4" strokeWidth={2} />
              Send
            </span>
          </button>
        </div>
      </Surface>

      <Surface className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-950 text-stone-50">
            <Sparkles className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Suggested restocks</p>
            <h3 className="mt-1 text-xl font-semibold text-stone-950">Priority queue</h3>
          </div>
        </div>

        <div className="grid gap-3">
          {restocks.length ? (
            restocks.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-950">{item.name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {item.stock} on hand · floor level {item.reorderLevel}
                    </p>
                  </div>
                  <Pill tone="danger">+{item.recommendedRestock}</Pill>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] bg-white/82 p-4 text-sm leading-7 text-stone-600">
              The fragrance floor is currently stocked above the minimum threshold.
            </div>
          )}
        </div>
      </Surface>
    </section>
  );
}
