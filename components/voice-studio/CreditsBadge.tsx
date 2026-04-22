"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  ELEVENLABS_KEY_STORAGE,
  formatCredits,
  type Subscription,
} from "@/lib/elevenlabs";

interface CreditsBadgeProps {
  refreshSignal?: number;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: Subscription }
  | { status: "error"; message: string };

export default function CreditsBadge({ refreshSignal = 0 }: CreditsBadgeProps) {
  const [state, setState] = useState<State>({ status: "idle" });

  const load = async () => {
    const key = localStorage.getItem(ELEVENLABS_KEY_STORAGE)?.trim();
    if (!key) {
      setState({ status: "error", message: "No API key configured" });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/elevenlabs/subscription", {
        headers: { "x-elevenlabs-key": key },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch credits");
      }
      setState({ status: "ready", data });
    } catch (err: unknown) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to fetch credits",
      });
    }
  };

  useEffect(() => {
    void load();
  }, [refreshSignal]);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary">
        <Loader2 size={12} className="animate-spin text-accent" />
        <span>Loading credits…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <button
        onClick={() => void load()}
        title={state.message}
        className="flex items-center gap-2 rounded-full border border-error/30 bg-error/10 px-3 py-1.5 text-xs text-error transition hover:bg-error/20"
      >
        <AlertCircle size={12} />
        <span>Credits unavailable</span>
      </button>
    );
  }

  const { character_count, character_limit, tier } = state.data;
  const remaining = formatCredits(character_count, character_limit);

  return (
    <button
      onClick={() => void load()}
      title={`${tier} plan — refresh credits`}
      className="group flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition hover:bg-success/20"
    >
      <Sparkles size={12} />
      <span>{remaining} credits</span>
      <RefreshCw
        size={11}
        className="text-success/70 opacity-0 transition group-hover:opacity-100"
      />
    </button>
  );
}
