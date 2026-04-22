"use client";

import { useEffect, useState } from "react";
import { X, BookOpen, Plus, Trash2, Save, Check, Info } from "lucide-react";
import {
  MAX_RULES,
  MAX_FROM_LENGTH,
  MAX_TO_LENGTH,
  hashRules,
  sanitizeRules,
  formatRelative,
  type PronunciationRule,
  type SyncedDictState,
} from "@/lib/pronunciationDict";

interface PronunciationDictPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rules: PronunciationRule[];
  onSave: (next: PronunciationRule[]) => void;
  synced: SyncedDictState | null;
}

interface DraftRow {
  id: string;
  from: string;
  to: string;
}

function toDraft(rules: PronunciationRule[]): DraftRow[] {
  if (rules.length === 0) {
    return [{ id: crypto.randomUUID(), from: "", to: "" }];
  }
  return rules.map((r) => ({
    id: crypto.randomUUID(),
    from: r.from,
    to: r.to,
  }));
}

export default function PronunciationDictPanel({
  isOpen,
  onClose,
  rules,
  onSave,
  synced,
}: PronunciationDictPanelProps) {
  const [draft, setDraft] = useState<DraftRow[]>(() => toDraft(rules));
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(toDraft(rules));
      setSavedFlash(false);
    }
  }, [isOpen, rules]);

  if (!isOpen) return null;

  const cleaned = sanitizeRules(
    draft.map((d) => ({ from: d.from, to: d.to }))
  );
  const draftHash = hashRules(cleaned);
  const inSync = synced?.hash === draftHash && cleaned.length > 0;
  const canSave = cleaned.length >= 0;

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setDraft((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    if (draft.length >= MAX_RULES) return;
    setDraft((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: "", to: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setDraft((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length > 0
        ? next
        : [{ id: crypto.randomUUID(), from: "", to: "" }];
    });
  };

  const handleSave = () => {
    onSave(cleaned);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-text-primary">
            <BookOpen size={18} className="text-accent" />
            Pronunciation Dictionary
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition hover:bg-border hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-text-secondary">
            <Info size={14} className="mt-0.5 shrink-0 text-accent" />
            <div className="space-y-1">
              <p>
                Replace tricky words with phonetic spellings the model will read
                more naturally. Example: the front of a ship,{" "}
                <span className="font-mono text-text-primary">bow</span>{" "}
                <span className="text-text-secondary">→</span>{" "}
                <span className="font-mono text-text-primary">bau</span>{" "}
                (rhymes with &quot;wow&quot;, not &quot;low&quot;).
              </p>
              <p className="text-[11px]">
                Dictionaries don&apos;t apply to the Eleven v3 (alpha) model.
              </p>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-[10px] uppercase tracking-wider text-text-secondary">
            <span>Word in script</span>
            <span>Pronounce as</span>
            <span className="w-7" />
          </div>

          <div className="space-y-2">
            {draft.map((row) => {
              const fromTooLong = row.from.length > MAX_FROM_LENGTH;
              const toTooLong = row.to.length > MAX_TO_LENGTH;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_auto] items-start gap-2"
                >
                  <input
                    type="text"
                    value={row.from}
                    onChange={(e) =>
                      updateRow(row.id, { from: e.target.value })
                    }
                    placeholder="bow"
                    maxLength={MAX_FROM_LENGTH + 10}
                    className={`rounded-lg border bg-background px-3 py-2 text-sm font-mono ${
                      fromTooLong
                        ? "border-error/60"
                        : "border-border focus:border-accent/40"
                    }`}
                  />
                  <input
                    type="text"
                    value={row.to}
                    onChange={(e) =>
                      updateRow(row.id, { to: e.target.value })
                    }
                    placeholder="bau"
                    maxLength={MAX_TO_LENGTH + 10}
                    className={`rounded-lg border bg-background px-3 py-2 text-sm font-mono ${
                      toTooLong
                        ? "border-error/60"
                        : "border-border focus:border-accent/40"
                    }`}
                  />
                  <button
                    onClick={() => removeRow(row.id)}
                    title="Remove rule"
                    className="rounded-lg border border-border p-2 text-text-secondary transition hover:border-error/40 hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={addRow}
            disabled={draft.length >= MAX_RULES}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/40 px-3 py-2 text-xs text-text-secondary transition hover:border-accent/40 hover:text-accent disabled:opacity-40"
          >
            <Plus size={14} />
            Add rule
          </button>

          <p className="mt-3 text-[11px] text-text-secondary">
            {cleaned.length} valid {cleaned.length === 1 ? "rule" : "rules"} •
            up to {MAX_RULES} allowed
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <p className="text-[11px] text-text-secondary">
            {synced
              ? inSync
                ? `Synced ${formatRelative(synced.syncedAt)}`
                : "Changes will sync on next generation"
              : cleaned.length === 0
                ? "Empty dictionary"
                : "Will sync on next generation"}
          </p>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              savedFlash
                ? "border border-success/30 bg-success/20 text-success"
                : "bg-accent text-background hover:bg-accent-hover"
            } disabled:opacity-40`}
          >
            {savedFlash ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              <>
                <Save size={16} />
                Save rules
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
