"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  Zap,
  RotateCcw,
  AlertTriangle,
  LayoutList,
  Grid3X3,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { ART_STYLES } from "@/lib/types";
import { buildSceneImagePrompt } from "@/lib/prompts";
import { SAMPLE_SCRIPT } from "@/lib/utils";
import ScriptInput from "@/components/ScriptInput";
import DurationInput from "@/components/DurationInput";
import StyleSelector from "@/components/StyleSelector";
import AspectRatioSelector from "@/components/AspectRatioSelector";
import SettingsPanel from "@/components/SettingsPanel";
import ProgressTracker from "@/components/ProgressTracker";
import CharacterBibleDisplay from "@/components/CharacterBible";
import SceneTimeline from "@/components/SceneTimeline";
import StoryboardGrid from "@/components/StoryboardGrid";
import DownloadPanel from "@/components/DownloadPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProcessingConfig from "@/components/ProcessingConfig";

function HomeContent() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [resultsView, setResultsView] = useState<"timeline" | "storyboard">(
    "timeline"
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchState, setBatchState] = useState<string>("");
  const [pollCount, setPollCount] = useState(0);
  const cancelledRef = useRef(false);
  const sceneTimesRef = useRef<number[]>([]);

  const script = useProjectStore((s) => s.script);
  const setScript = useProjectStore((s) => s.setScript);
  const setDuration = useProjectStore((s) => s.setDuration);
  const pipelineStage = useProjectStore((s) => s.pipeline_stage);
  const errorMessage = useProjectStore((s) => s.error_message);
  const setPipelineStage = useProjectStore((s) => s.setPipelineStage);
  const setCharacterBible = useProjectStore((s) => s.setCharacterBible);
  const setErrorMessage = useProjectStore((s) => s.setErrorMessage);
  const resetProject = useProjectStore((s) => s.resetProject);
  const scenes = useProjectStore((s) => s.scenes);
  const characterBible = useProjectStore((s) => s.character_bible);
  const durationSeconds = useProjectStore((s) => s.duration_seconds);
  const artStyle = useProjectStore((s) => s.art_style);
  const artStyleCustom = useProjectStore((s) => s.art_style_custom);
  const aspectRatio = useProjectStore((s) => s.aspect_ratio);
  const secondsPerScene = useProjectStore((s) => s.seconds_per_scene);
  const processingMode = useProjectStore((s) => s.processing_mode);
  const imageModel = useProjectStore((s) => s.image_model);
  const setScenes = useProjectStore((s) => s.setScenes);
  const updateScene = useProjectStore((s) => s.updateScene);
  const setCurrentSceneIndex = useProjectStore((s) => s.setCurrentSceneIndex);

  useEffect(() => {
    const check = () => {
      const key = localStorage.getItem("gemini_api_key");
      setHasApiKey(!!key && key.length > 0 && key !== "your_key_here");
    };
    check();
    window.addEventListener("focus", check);
    const interval = setInterval(check, 1000);
    return () => {
      window.removeEventListener("focus", check);
      clearInterval(interval);
    };
  }, []);

  const canGenerate = script.length >= 100 && hasApiKey;
  const getApiKey = () => localStorage.getItem("gemini_api_key") || "";

  const getArtStylePrompt = useCallback(() => {
    if (artStyle === "custom") return artStyleCustom;
    return ART_STYLES.find((s) => s.id === artStyle)?.prompt_text || "";
  }, [artStyle, artStyleCustom]);

  const loadSampleScript = () => {
    setScript(SAMPLE_SCRIPT);
    setDuration(90);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        pipelineStage === "idle" &&
        canGenerate
      ) {
        e.preventDefault();
        runPipeline();
      }
      if (
        e.key === "Escape" &&
        (pipelineStage === "generating_images" ||
          pipelineStage === "generating_bible" ||
          pipelineStage === "chunking")
      ) {
        cancelledRef.current = true;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ====== Pipeline ======
  const runPipeline = useCallback(async () => {
    const apiKey = getApiKey();
    if (!apiKey) return;
    cancelledRef.current = false;
    sceneTimesRef.current = [];
    setEta(null);

    try {
      setPipelineStage("generating_bible");
      setErrorMessage(null);

      const bibleRes = await fetch("/api/generate-bible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, apiKey }),
      });
      if (!bibleRes.ok) {
        const err = await bibleRes.json();
        throw new Error(err.message || "Failed to generate Character Bible");
      }
      const bible = await bibleRes.json();
      setCharacterBible(bible);

      if (cancelledRef.current) {
        setPipelineStage("complete");
        return;
      }

      setPipelineStage("chunking");
      const chunksCount = Math.max(
        4,
        Math.min(Math.round(durationSeconds / secondsPerScene), 100)
      );

      const chunkRes = await fetch("/api/chunk-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, chunksCount, apiKey }),
      });
      if (!chunkRes.ok) {
        const err = await chunkRes.json();
        throw new Error(err.message || "Failed to chunk script");
      }
      const chunkData = await chunkRes.json();
      const newScenes = chunkData.scenes.map(
        (s: {
          chunk_index: number;
          script_text: string;
          scene_description: string;
          scene_emotion: string;
          characters_present: string[];
        }) => ({
          chunk_index: s.chunk_index,
          script_text: s.script_text,
          scene_description: s.scene_description,
          scene_emotion: s.scene_emotion,
          characters_present: s.characters_present,
          image_base64: null,
          image_mime_type: null,
          status: "pending" as const,
          generation_prompt: "",
          error_message: null,
        })
      );
      setScenes(newScenes);

      if (cancelledRef.current) {
        setPipelineStage("complete");
        return;
      }

      // Step 3: Image Generation
      setPipelineStage("generating_images");
      const artStylePrompt = getArtStylePrompt();
      const currentModel = imageModel;

      // Build all prompts upfront regardless of mode
      type SceneInput = { chunk_index: number; scene_description: string; scene_emotion: string; characters_present: string[]; script_text: string };
      const scenePrompts = newScenes.map(
        (scene: SceneInput, i: number) => {
          const prompt = buildSceneImagePrompt(
            { ...scene, image_base64: null, image_mime_type: null, status: "pending", generation_prompt: "", error_message: null },
            newScenes.length,
            bible,
            artStylePrompt,
            aspectRatio
          );
          updateScene(i, { generation_prompt: prompt, status: "generating" });
          return {
            key: `scene-${String(scene.chunk_index).padStart(2, "0")}`,
            prompt,
          };
        }
      );

      if (processingMode === "batch") {
        // ── BATCH MODE ──
        setBatchMode(true);
        setBatchState("");
        setPollCount(0);
        console.log(`[SceneForge] Batch mode — model: ${currentModel}, scenes: ${scenePrompts.length}`);

        const batchRes = await fetch("/api/generate-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenePrompts, apiKey, model: currentModel }),
        });

        if (!batchRes.ok) {
          const err = await batchRes.json();
          throw new Error(err.message || "Failed to submit batch job");
        }

        const { jobName } = await batchRes.json();

        const MAX_POLLS = 180;
        let polls = 0;

        while (polls < MAX_POLLS && !cancelledRef.current) {
          await new Promise((r) => setTimeout(r, 10000));
          polls++;
          setPollCount(polls);

          try {
            const statusRes = await fetch("/api/batch-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobName, apiKey }),
            });

            const statusData = await statusRes.json();
            setBatchState(statusData.state || "");

            if (statusData.status === "complete") {
              const images = statusData.images as {
                key: string;
                image_base64: string;
                mime_type: string;
              }[];
              for (let i = 0; i < images.length; i++) {
                if (images[i].image_base64) {
                  updateScene(i, {
                    image_base64: images[i].image_base64,
                    image_mime_type: images[i].mime_type,
                    status: "completed",
                  });
                } else {
                  updateScene(i, {
                    status: "failed",
                    error_message: "No image returned in batch response",
                  });
                }
              }
              break;
            }

            if (statusData.status === "failed") {
              throw new Error(statusData.error || "Batch job failed");
            }

            if (statusData.status === "cancelled") {
              throw new Error("Batch job was cancelled");
            }
          } catch (pollErr: unknown) {
            if (pollErr instanceof Error && (pollErr.message.includes("Batch job failed") || pollErr.message.includes("cancelled"))) {
              throw pollErr;
            }
            console.warn("[SceneForge] Poll error, retrying:", pollErr);
          }
        }

        if (polls >= MAX_POLLS && !cancelledRef.current) {
          throw new Error("Batch job timed out after 30 minutes");
        }
      } else {
        // ── STANDARD (SEQUENTIAL) MODE ──
        setBatchMode(false);
        console.log(`[SceneForge] Standard mode — model: ${currentModel}, scenes: ${scenePrompts.length}`);

        for (let i = 0; i < scenePrompts.length; i++) {
          if (cancelledRef.current) break;
          setCurrentSceneIndex(i);

          const startTime = Date.now();

          try {
            const imgRes = await fetch("/api/generate-scene", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: scenePrompts[i].prompt,
                apiKey,
                model: currentModel,
              }),
            });

            if (!imgRes.ok) {
              const err = await imgRes.json();
              updateScene(i, {
                status: "failed",
                error_message: err.message || "Image generation failed",
              });
            } else {
              const imgData = await imgRes.json();
              updateScene(i, {
                image_base64: imgData.image_base64,
                image_mime_type: imgData.mime_type,
                status: "completed",
              });
            }
          } catch (err: unknown) {
            updateScene(i, {
              status: "failed",
              error_message: err instanceof Error ? err.message : "Image generation failed",
            });
          }

          const elapsed = (Date.now() - startTime) / 1000;
          sceneTimesRef.current.push(elapsed);
          const avg = sceneTimesRef.current.reduce((a, b) => a + b, 0) / sceneTimesRef.current.length;
          const remaining = (scenePrompts.length - i - 1) * avg;
          setEta(remaining > 60
            ? `~${Math.ceil(remaining / 60)} min remaining`
            : `~${Math.ceil(remaining)}s remaining`
          );
        }
      }

      setEta(null);
      setBatchMode(false);
      setPipelineStage("complete");
    } catch (err: unknown) {
      setPipelineStage("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  }, [
    script,
    durationSeconds,
    secondsPerScene,
    aspectRatio,
    processingMode,
    imageModel,
    getArtStylePrompt,
    setPipelineStage,
    setErrorMessage,
    setCharacterBible,
    setScenes,
    updateScene,
    setCurrentSceneIndex,
  ]);

  // ====== Scene action handlers ======
  const handleRegenerate = useCallback(
    async (index: number) => {
      const apiKey = getApiKey();
      const state = useProjectStore.getState();
      const scene = state.scenes[index];
      if (!scene || !apiKey) return;

      updateScene(index, { status: "generating", error_message: null });

      try {
        const imgRes = await fetch("/api/generate-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: scene.generation_prompt, apiKey, model: state.image_model }),
        });
        if (!imgRes.ok) {
          const err = await imgRes.json();
          updateScene(index, {
            status: "failed",
            error_message: err.message || "Regeneration failed",
          });
        } else {
          const imgData = await imgRes.json();
          updateScene(index, {
            image_base64: imgData.image_base64,
            image_mime_type: imgData.mime_type,
            status: "completed",
          });
        }
      } catch (err: unknown) {
        updateScene(index, {
          status: "failed",
          error_message:
            err instanceof Error ? err.message : "Regeneration failed",
        });
      }
    },
    [updateScene]
  );

  const handleEditRegenerate = useCallback(
    async (index: number, newDescription: string) => {
      const apiKey = getApiKey();
      const state = useProjectStore.getState();
      const scene = state.scenes[index];
      const bible = state.character_bible;
      if (!scene || !apiKey || !bible) return;

      updateScene(index, {
        scene_description: newDescription,
        status: "generating",
        error_message: null,
      });

      const updatedScene = { ...scene, scene_description: newDescription };
      const artStylePrompt = getArtStylePrompt();
      const prompt = buildSceneImagePrompt(
        updatedScene,
        state.scenes.length,
        bible,
        artStylePrompt,
        aspectRatio
      );
      updateScene(index, { generation_prompt: prompt });

      try {
        const imgRes = await fetch("/api/generate-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, apiKey, model: state.image_model }),
        });
        if (!imgRes.ok) {
          const err = await imgRes.json();
          updateScene(index, {
            status: "failed",
            error_message: err.message || "Regeneration failed",
          });
        } else {
          const imgData = await imgRes.json();
          updateScene(index, {
            image_base64: imgData.image_base64,
            image_mime_type: imgData.mime_type,
            status: "completed",
          });
        }
      } catch (err: unknown) {
        updateScene(index, {
          status: "failed",
          error_message:
            err instanceof Error ? err.message : "Regeneration failed",
        });
      }
    },
    [updateScene, aspectRatio, getArtStylePrompt]
  );

  const handleApproveToggle = useCallback(
    (index: number) => {
      const scene = useProjectStore.getState().scenes[index];
      if (!scene) return;
      updateScene(index, {
        status: scene.status === "approved" ? "completed" : "approved",
      });
    },
    [updateScene]
  );

  const handleRetry = useCallback(
    (index: number) => handleRegenerate(index),
    [handleRegenerate]
  );

  const handleNewProject = () => {
    setShowNewProjectConfirm(true);
  };

  const confirmNewProject = () => {
    setShowNewProjectConfirm(false);
    resetProject();
  };

  // ====== IDLE STATE: Input form ======
  if (pipelineStage === "idle") {
    return (
      <div className="flex min-h-screen flex-col pb-12">
        <header className="flex items-center justify-between py-8">
          <div>
            <h1 className="font-heading text-4xl font-bold text-accent">
              SceneForge
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Paste your script. Get consistent scene illustrations.
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-border bg-surface p-3 text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <Settings size={20} />
          </button>
        </header>

        <main className="mx-auto w-full max-w-3xl space-y-8">
          <div>
            <ScriptInput />
            <button
              onClick={loadSampleScript}
              className="mt-2 flex items-center gap-1.5 text-xs text-accent/70 transition-colors hover:text-accent"
            >
              <FileText size={12} />
              Try Sample Script
            </button>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row">
            <DurationInput />
            <AspectRatioSelector />
          </div>

          <StyleSelector />

          <ProcessingConfig />

          {!hasApiKey && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
              Please set your Gemini API key in Settings before generating.
            </div>
          )}

          <button
            disabled={!canGenerate}
            onClick={runPipeline}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-lg font-bold text-background transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Zap size={22} />
            Generate Scenes
          </button>

          <p className="text-center text-xs text-text-secondary">
            Powered by Google Gemini API
            {canGenerate && (
              <span className="ml-2 text-text-secondary/40">
                (Ctrl+Enter)
              </span>
            )}
          </p>
        </main>

        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    );
  }

  // ====== ERROR STATE ======
  if (pipelineStage === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20">
          <AlertTriangle size={32} className="text-error" />
        </div>
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-text-primary">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            {errorMessage}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setPipelineStage("idle");
              setErrorMessage(null);
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-text-primary transition-colors hover:border-accent"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
          <button
            onClick={resetProject}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // ====== COMPLETE STATE: Full results view ======
  if (pipelineStage === "complete") {
    const completedCount = scenes.filter(
      (s) => s.status === "completed" || s.status === "approved"
    ).length;
    const failedCount = scenes.filter((s) => s.status === "failed").length;

    return (
      <div className="flex min-h-screen flex-col pb-24">
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-border py-4">
          <h1 className="font-heading text-xl font-bold text-accent">
            SceneForge
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => setResultsView("timeline")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  resultsView === "timeline"
                    ? "bg-accent text-background"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <LayoutList size={14} />
                Timeline
              </button>
              <button
                onClick={() => setResultsView("storyboard")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  resultsView === "storyboard"
                    ? "bg-accent text-background"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Grid3X3 size={14} />
                Storyboard
              </button>
            </div>

            <button
              onClick={handleNewProject}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:border-accent"
            >
              New Project
            </button>
          </div>
        </header>

        {/* Main layout with sidebar */}
        <div className="mt-6 flex gap-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-lg border border-border bg-surface p-2 text-text-secondary transition-colors hover:text-accent lg:block"
          >
            {sidebarOpen ? (
              <PanelLeftClose size={16} />
            ) : (
              <PanelLeftOpen size={16} />
            )}
          </button>

          {sidebarOpen && (
            <aside className="hidden w-80 shrink-0 lg:block">
              <div className="sticky top-6 space-y-4 rounded-xl border border-border bg-surface p-5">
                <CharacterBibleDisplay />
              </div>
            </aside>
          )}

          <main className="min-w-0 flex-1">
            {resultsView === "timeline" ? (
              <SceneTimeline
                onRegenerate={handleRegenerate}
                onEditRegenerate={handleEditRegenerate}
                onApproveToggle={handleApproveToggle}
                onRetry={handleRetry}
              />
            ) : (
              <StoryboardGrid />
            )}
          </main>
        </div>

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <span className="text-xs text-text-secondary">
              {scenes.length} scenes &bull;{" "}
              <span className="text-success">{completedCount} completed</span>
              {failedCount > 0 && (
                <>
                  {" "}
                  &bull;{" "}
                  <span className="text-error">{failedCount} failed</span>
                </>
              )}
            </span>
            <DownloadPanel />
          </div>
        </div>

        {/* New Project Confirmation Modal */}
        {showNewProjectConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowNewProjectConfirm(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading text-lg font-bold text-text-primary">
                Start a new project?
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Your current scenes will be lost.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowNewProjectConfirm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-text-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmNewProject}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
                >
                  Start New
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====== PROCESSING STATE ======
  return (
    <div className="flex min-h-screen flex-col pb-12">
      <header className="flex items-center justify-between py-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-accent">
            SceneForge
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            Processing your script...
            <span className="ml-2 text-text-secondary/40">
              (Press Esc to cancel)
            </span>
          </p>
        </div>
      </header>

      <ProgressTracker
        batchMode={batchMode}
        batchState={batchState}
        pollCount={pollCount}
      />

      {eta && pipelineStage === "generating_images" && (
        <p className="mt-2 text-center text-xs text-text-secondary/60">
          {eta}
        </p>
      )}

      {characterBible && (
        <div className="mx-auto mt-6 w-full max-w-3xl">
          <CharacterBibleDisplay />
        </div>
      )}

      {scenes.length > 0 && (
        <div className="mx-auto mt-8 w-full max-w-3xl">
          <h3 className="mb-4 font-heading text-lg font-bold text-text-primary">
            Scenes (
            {
              scenes.filter(
                (s) => s.status === "completed" || s.status === "approved"
              ).length
            }
            /{scenes.length})
          </h3>
          <div className="space-y-4">
            {scenes.map((scene, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 transition-all ${
                  scene.status === "completed" || scene.status === "approved"
                    ? "border-success/30 bg-surface"
                    : scene.status === "generating"
                      ? "border-accent/30 bg-surface"
                      : scene.status === "failed"
                        ? "border-error/30 bg-surface"
                        : "border-border bg-surface/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-40 shrink-0">
                    {scene.status === "completed" ||
                    scene.status === "approved" ? (
                      scene.image_base64 && (
                        <img
                          src={`data:${scene.image_mime_type};base64,${scene.image_base64}`}
                          alt={`Scene ${scene.chunk_index}`}
                          className="animate-fade-in w-full rounded-lg"
                        />
                      )
                    ) : scene.status === "generating" ? (
                      <div className="animate-shimmer aspect-video w-full rounded-lg" />
                    ) : scene.status === "failed" ? (
                      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-error/30 bg-error/5">
                        <span className="text-xs text-error">Failed</span>
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-border">
                        <span className="text-xs text-text-secondary">
                          Pending
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-text-primary">
                        Scene {scene.chunk_index}
                      </span>
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {scene.scene_emotion}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                      {scene.script_text}
                    </p>
                    {scene.error_message && (
                      <p className="mt-1 text-xs text-error">
                        {scene.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}
