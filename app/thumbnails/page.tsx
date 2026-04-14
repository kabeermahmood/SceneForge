"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, AlertCircle, KeyRound, Paintbrush } from "lucide-react";
import Link from "next/link";
import PromptInput from "@/components/thumbnails/PromptInput";
import ProviderToggle, { type Provider } from "@/components/thumbnails/ProviderToggle";
import AspectRatioSelector, {
  type AspectRatio,
} from "@/components/thumbnails/AspectRatioSelector";
import ReferenceImageUpload, {
  type RefImage,
} from "@/components/thumbnails/ReferenceImageUpload";
import AdvancedSettings from "@/components/thumbnails/AdvancedSettings";
import GenerationGallery, {
  type Generation,
} from "@/components/thumbnails/GenerationGallery";

const GEMINI_KEY = "gemini_api_key";
const REPLICATE_KEY = "replicate_api_key";

export default function ThumbnailsPage() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [provider, setProvider] = useState<Provider>("replicate");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [referenceImages, setReferenceImages] = useState<RefImage[]>([]);
  const [resolution, setResolution] = useState("2K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [model, setModel] = useState("gemini-2.5-flash-image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [geminiKey, setGeminiKey] = useState("");
  const [replicateKey, setReplicateKey] = useState("");

  useEffect(() => {
    setGeminiKey(localStorage.getItem(GEMINI_KEY) || "");
    setReplicateKey(localStorage.getItem(REPLICATE_KEY) || "");
  }, []);

  const activeKey = provider === "replicate" ? replicateKey : geminiKey;
  const canSubmit = prompt.trim().length > 0 && activeKey.trim().length > 0 && !loading;

  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        provider,
        aspectRatio,
        apiKey: activeKey.trim(),
      };

      if (referenceImages.length > 0) {
        body.referenceImages = referenceImages.map((img) => ({
          data: img.data,
          mimeType: img.mimeType,
        }));
      }

      if (negativePrompt.trim()) {
        body.negativePrompt = negativePrompt.trim();
      }

      if (provider === "replicate") {
        body.resolution = resolution;
        body.outputFormat = outputFormat;
      } else {
        body.model = model;
      }

      const res = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Generation failed (${res.status})`);
      }

      const newGen: Generation = {
        id: crypto.randomUUID(),
        prompt: prompt.trim(),
        provider,
        imageUrl: data.imageUrl,
        imageBase64: data.imageBase64,
        mimeType: data.mimeType,
        timestamp: Date.now(),
      };

      setGenerations((prev) => [newGen, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [
    canSubmit,
    prompt,
    negativePrompt,
    provider,
    aspectRatio,
    activeKey,
    referenceImages,
    resolution,
    outputFormat,
    model,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-3">
          <Paintbrush className="text-accent" size={28} />
          Create AI Thumbnails
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Generate stunning thumbnails using Nano Banana Pro (Replicate) or
          Google Gemini image models.
        </p>
      </div>

      {/* API Key warning */}
      {!activeKey.trim() && (
        <Link
          href="/api-keys"
          className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm transition hover:bg-amber-500/10"
        >
          <KeyRound size={16} className="text-amber-400 shrink-0" />
          <p className="text-amber-400">
            {provider === "replicate" ? "Replicate" : "Gemini"} API key not
            configured.{" "}
            <span className="underline">Go to API Keys</span> to add it.
          </p>
        </Link>
      )}

      {/* Provider toggle */}
      <ProviderToggle
        value={provider}
        onChange={setProvider}
        disabled={loading}
      />

      {/* Prompt */}
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        negativePrompt={negativePrompt}
        onNegativeChange={setNegativePrompt}
        disabled={loading}
      />

      {/* Aspect ratio */}
      <AspectRatioSelector
        value={aspectRatio}
        onChange={setAspectRatio}
        disabled={loading}
      />

      {/* Reference images */}
      <ReferenceImageUpload
        images={referenceImages}
        onChange={setReferenceImages}
        disabled={loading}
      />

      {/* Advanced settings */}
      <AdvancedSettings
        provider={provider}
        resolution={resolution}
        onResolutionChange={setResolution}
        outputFormat={outputFormat}
        onOutputFormatChange={setOutputFormat}
        model={model}
        onModelChange={setModel}
        disabled={loading}
      />

      {/* Generate button */}
      <button
        disabled={!canSubmit}
        onClick={handleGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-sm font-bold text-background transition-all hover:bg-accent-hover hover:scale-[1.01] hover:shadow-lg hover:shadow-accent/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Image
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="aspect-video animate-shimmer" />
        </div>
      )}

      {/* Gallery */}
      <GenerationGallery generations={generations} />
    </div>
  );
}
