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
  Play,
  RefreshCw,
  Palette,
  CheckCircle2,
  Loader2,
  Pencil,
} from "lucide-react";
import { IMAGE_MODELS } from "@/lib/types";
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
  const [heroEditMode, setHeroEditMode] = useState(false);
  const [heroEditDescription, setHeroEditDescription] = useState("");
  const cancelledRef = useRef(false);
  const switchToStandardRef = useRef(false);
  const sceneTimesRef = useRef<number[]>([]);
  const heroContextRef = useRef<{
    scenePrompts: { key: string; prompt: string }[];
    heroImage: { data: string; mimeType: string } | null;
    currentModel: string;
    apiKey: string;
  } | null>(null);

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
          animation_prompt: null,
          camera_movement: null,
          suggested_transition: null,
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
            { ...scene, image_base64: null, image_mime_type: null, status: "pending", generation_prompt: "", error_message: null, animation_prompt: null, camera_movement: null, suggested_transition: null },
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

      // ── HERO FRAME: Generate Scene 1 first as visual reference ──
      let heroImage: { data: string; mimeType: string } | null = null;
      console.log("[SceneForge] Generating hero frame (Scene 1) for reference anchoring...");
      setCurrentSceneIndex(0);

      try {
        const heroRes = await fetch("/api/generate-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: scenePrompts[0].prompt,
            apiKey,
            model: currentModel,
          }),
        });

        if (heroRes.ok) {
          const heroData = await heroRes.json();
          if (heroData.image_base64) {
            heroImage = { data: heroData.image_base64, mimeType: heroData.mime_type || "image/png" };
            updateScene(0, {
              image_base64: heroData.image_base64,
              image_mime_type: heroData.mime_type,
              status: "completed",
            });
            console.log("[SceneForge] Hero frame generated — will anchor remaining scenes");
          }
        } else {
          const err = await heroRes.json();
          console.warn("[SceneForge] Hero frame failed, continuing without reference:", err.message);
          updateScene(0, { status: "failed", error_message: err.message || "Hero frame failed" });
        }
      } catch (err: unknown) {
        console.warn("[SceneForge] Hero frame error, continuing without reference:", err);
        updateScene(0, {
          status: "failed",
          error_message: err instanceof Error ? err.message : "Hero frame failed",
        });
      }

      if (cancelledRef.current) { setPipelineStage("complete"); return; }

      // ── PAUSE: Save context and let user review the hero frame ──
      heroContextRef.current = { scenePrompts, heroImage, currentModel, apiKey };
      setPipelineStage("hero_review");

    } catch (err: unknown) {
      const hasAnyScenes = useProjectStore.getState().scenes.length > 0;
      const hasAnyCompleted = useProjectStore.getState().scenes.some(
        (s) => s.status === "completed" || s.status === "approved"
      );

      if (hasAnyCompleted) {
        console.warn("[SceneForge] Pipeline error, but preserving completed scenes:", err);
        setEta(null);
        setBatchMode(false);
        setPipelineStage("complete");
      } else if (hasAnyScenes) {
        console.warn("[SceneForge] Pipeline error during image gen, showing partial results:", err);
        setEta(null);
        setBatchMode(false);
        setPipelineStage("complete");
      } else {
        setPipelineStage("error");
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
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

  // ====== Continue pipeline after hero review ======
  const continueAfterHero = useCallback(async () => {
    const ctx = heroContextRef.current;
    if (!ctx) return;

    const { scenePrompts, heroImage, apiKey } = ctx;
    const currentModel = useProjectStore.getState().image_model;
    const currentProcessingMode = useProjectStore.getState().processing_mode;

    cancelledRef.current = false;
    sceneTimesRef.current = [];
    setEta(null);
    setPipelineStage("generating_images");

    try {
      const remainingPrompts = scenePrompts.slice(1);

      if (currentProcessingMode === "batch" && remainingPrompts.length > 0) {
        // ── BATCH MODE (parallel sub-batches, no timeout, user-controlled exit) ──
        setBatchMode(true);
        setBatchState("");
        setPollCount(0);
        switchToStandardRef.current = false;

        const SUB_BATCH_SIZE = 6;
        const subBatches: { prompts: typeof remainingPrompts; startOffset: number }[] = [];
        for (let i = 0; i < remainingPrompts.length; i += SUB_BATCH_SIZE) {
          subBatches.push({
            prompts: remainingPrompts.slice(i, i + SUB_BATCH_SIZE),
            startOffset: i + 1,
          });
        }

        console.log(
          `[SceneForge] Batch mode — model: ${currentModel}, total: ${remainingPrompts.length}, sub-batches: ${subBatches.length} (×${SUB_BATCH_SIZE}), ref: ${heroImage ? "yes" : "no"}`
        );

        // ── SUBMIT ALL SUB-BATCHES IN PARALLEL ──
        type ActiveJob = { jobName: string; batchIdx: number; sub: typeof subBatches[0] };
        const activeJobs: ActiveJob[] = [];

        const submissions = await Promise.all(
          subBatches.map(async (sub, batchIdx) => {
            const batchBody: Record<string, unknown> = {
              scenePrompts: sub.prompts,
              apiKey,
              model: currentModel,
            };
            if (heroImage) batchBody.referenceImage = heroImage;

            try {
              const batchRes = await fetch("/api/generate-batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(batchBody),
              });

              if (batchRes.ok) {
                const batchData = await batchRes.json();
                console.log(`[SceneForge] Sub-batch ${batchIdx + 1} submitted — job: ${batchData.jobName}`);
                return { jobName: batchData.jobName as string, batchIdx, sub };
              } else {
                const err = await batchRes.json();
                console.error(`[SceneForge] Sub-batch ${batchIdx + 1} submission failed:`, err.message);
                return null;
              }
            } catch (submitErr: unknown) {
              console.error(`[SceneForge] Sub-batch ${batchIdx + 1} submit error:`, submitErr);
              return null;
            }
          })
        );

        for (const s of submissions) {
          if (s) activeJobs.push(s);
        }

        setBatchState(`0/${subBatches.length} complete`);
        console.log(`[SceneForge] ${activeJobs.length}/${subBatches.length} sub-batches submitted successfully`);

        // ── POLL ALL ACTIVE JOBS IN UNIFIED LOOP ──
        let totalPolls = 0;
        const completedJobIndices = new Set<number>();

        while (activeJobs.length > 0 && !cancelledRef.current && !switchToStandardRef.current) {
          const elapsed = totalPolls * 15;
          const pollInterval = elapsed < 120 ? 15_000 : elapsed < 600 ? 20_000 : 30_000;
          await new Promise((r) => setTimeout(r, pollInterval));
          totalPolls++;
          setPollCount(totalPolls);

          for (let ji = activeJobs.length - 1; ji >= 0; ji--) {
            if (cancelledRef.current || switchToStandardRef.current) break;

            const job = activeJobs[ji];
            try {
              const statusRes = await fetch("/api/batch-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobName: job.jobName, apiKey }),
              });

              const statusData = await statusRes.json();
              const stateLabel = statusData.state || "polling";

              if (statusData.status === "complete") {
                const images = statusData.images as { key: string; image_base64: string; mime_type: string }[];
                let successCount = 0;
                for (let i = 0; i < images.length; i++) {
                  const sceneIdx = job.sub.startOffset + i;
                  if (images[i].image_base64) {
                    updateScene(sceneIdx, {
                      image_base64: images[i].image_base64,
                      image_mime_type: images[i].mime_type,
                      status: "completed",
                    });
                    successCount++;
                  }
                }
                console.log(`[SceneForge] Sub-batch ${job.batchIdx + 1} complete — ${successCount}/${images.length} succeeded`);
                completedJobIndices.add(job.batchIdx);
                activeJobs.splice(ji, 1);
              } else if (statusData.status === "failed" || statusData.status === "cancelled") {
                console.warn(`[SceneForge] Sub-batch ${job.batchIdx + 1} ${statusData.status}`);
                activeJobs.splice(ji, 1);
              } else {
                setBatchState(`${completedJobIndices.size}/${subBatches.length} complete | batch ${job.batchIdx + 1}: ${stateLabel}`);
              }
            } catch (pollErr: unknown) {
              console.warn(`[SceneForge] Poll error for sub-batch ${job.batchIdx + 1} (continuing):`, pollErr);
            }
          }

          setBatchState(`${completedJobIndices.size}/${subBatches.length} complete${activeJobs.length > 0 ? ` | ${activeJobs.length} in progress` : ""}`);
        }

        if (switchToStandardRef.current) {
          console.log(`[SceneForge] User requested switch to standard processing — ${activeJobs.length} batch jobs abandoned`);
        }

        // ── STANDARD FALLBACK for ALL scenes not yet completed ──
        if (!cancelledRef.current) {
          const scenesState = useProjectStore.getState().scenes;
          const pendingScenes: { sceneIdx: number; prompt: string }[] = [];

          for (let i = 0; i < remainingPrompts.length; i++) {
            const sceneIdx = i + 1;
            const s = scenesState[sceneIdx];
            if (s && s.status !== "completed" && s.status !== "approved") {
              pendingScenes.push({ sceneIdx, prompt: remainingPrompts[i].prompt });
            }
          }

          if (pendingScenes.length > 0) {
            const reason = switchToStandardRef.current ? "user switched to standard" : "batch failures";
            console.log(`[SceneForge] Standard fallback — ${pendingScenes.length} scenes (${reason})`);
            setBatchMode(false);
            setEta(`Generating ${pendingScenes.length} remaining scene${pendingScenes.length > 1 ? "s" : ""} via standard API (3 parallel)...`);

            const FALLBACK_CONCURRENCY = 3;

            const generateFallback = async (item: { sceneIdx: number; prompt: string }) => {
              setCurrentSceneIndex(item.sceneIdx);
              updateScene(item.sceneIdx, { status: "generating", error_message: null });

              try {
                const reqBody: Record<string, unknown> = {
                  prompt: item.prompt,
                  apiKey,
                  model: currentModel,
                };
                if (heroImage) reqBody.referenceImage = heroImage;

                const imgRes = await fetch("/api/generate-scene", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(reqBody),
                });

                if (imgRes.ok) {
                  const imgData = await imgRes.json();
                  updateScene(item.sceneIdx, {
                    image_base64: imgData.image_base64,
                    image_mime_type: imgData.mime_type,
                    status: "completed",
                  });
                } else {
                  const err = await imgRes.json();
                  updateScene(item.sceneIdx, { status: "failed", error_message: err.message || "Generation failed" });
                }
              } catch (fbErr: unknown) {
                updateScene(item.sceneIdx, {
                  status: "failed",
                  error_message: fbErr instanceof Error ? fbErr.message : "Generation failed",
                });
              }
            };

            for (let i = 0; i < pendingScenes.length; i += FALLBACK_CONCURRENCY) {
              if (cancelledRef.current) break;
              const chunk = pendingScenes.slice(i, i + FALLBACK_CONCURRENCY);
              await Promise.all(chunk.map((item) => generateFallback(item)));
            }
          }
        }

        setBatchMode(false);
      } else {
        // ── STANDARD (PARALLEL) MODE — 3 concurrent requests ──
        setBatchMode(false);
        const CONCURRENCY = 3;
        console.log(`[SceneForge] Standard mode — model: ${currentModel}, remaining: ${remainingPrompts.length}, concurrency: ${CONCURRENCY}, ref: ${heroImage ? "yes" : "no"}`);

        const generateOne = async (localIdx: number) => {
          const sceneIdx = localIdx + 1;
          setCurrentSceneIndex(sceneIdx);
          const startTime = Date.now();

          try {
            const reqBody: Record<string, unknown> = {
              prompt: remainingPrompts[localIdx].prompt,
              apiKey,
              model: currentModel,
            };
            if (heroImage) reqBody.referenceImage = heroImage;

            const imgRes = await fetch("/api/generate-scene", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(reqBody),
            });

            if (!imgRes.ok) {
              const err = await imgRes.json();
              updateScene(sceneIdx, {
                status: "failed",
                error_message: err.message || "Image generation failed",
              });
            } else {
              const imgData = await imgRes.json();
              updateScene(sceneIdx, {
                image_base64: imgData.image_base64,
                image_mime_type: imgData.mime_type,
                status: "completed",
              });
            }
          } catch (err: unknown) {
            updateScene(sceneIdx, {
              status: "failed",
              error_message: err instanceof Error ? err.message : "Image generation failed",
            });
          }

          const elapsed = (Date.now() - startTime) / 1000;
          sceneTimesRef.current.push(elapsed);
        };

        // Process in chunks of CONCURRENCY
        for (let i = 0; i < remainingPrompts.length; i += CONCURRENCY) {
          if (cancelledRef.current) break;

          const chunk = remainingPrompts.slice(i, i + CONCURRENCY);
          const indices = chunk.map((_: unknown, j: number) => i + j);

          await Promise.all(indices.map((idx: number) => generateOne(idx)));

          // Update ETA after each parallel chunk completes
          if (sceneTimesRef.current.length > 0) {
            const avg = sceneTimesRef.current.reduce((a, b) => a + b, 0) / sceneTimesRef.current.length;
            const completedSoFar = i + chunk.length;
            const remaining = ((remainingPrompts.length - completedSoFar) / CONCURRENCY) * avg;
            setEta(remaining > 60
              ? `~${Math.ceil(remaining / 60)} min remaining`
              : `~${Math.ceil(remaining)}s remaining`
            );
          }
        }
      }

      setEta(null);
      setBatchMode(false);
      setPipelineStage("complete");
    } catch (err: unknown) {
      const hasAnyScenes = useProjectStore.getState().scenes.length > 0;
      const hasAnyCompleted = useProjectStore.getState().scenes.some(
        (s) => s.status === "completed" || s.status === "approved"
      );

      if (hasAnyCompleted) {
        console.warn("[SceneForge] Pipeline error, but preserving completed scenes:", err);
        setEta(null);
        setBatchMode(false);
        setPipelineStage("complete");
      } else if (hasAnyScenes) {
        console.warn("[SceneForge] Pipeline error during image gen, showing partial results:", err);
        setEta(null);
        setBatchMode(false);
        setPipelineStage("complete");
      } else {
        setPipelineStage("error");
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    }
  }, [setPipelineStage, setErrorMessage, updateScene, setCurrentSceneIndex]);

  // ====== Regenerate hero frame with new art style ======
  const regenerateHero = useCallback(async (editedDescription?: string) => {
    const ctx = heroContextRef.current;
    if (!ctx) return;

    const apiKey = getApiKey();
    if (!apiKey) return;

    const state = useProjectStore.getState();
    const newArtStylePrompt = state.art_style === "custom"
      ? state.art_style_custom
      : ART_STYLES.find((s) => s.id === state.art_style)?.prompt_text || "";

    const scene = state.scenes[0];
    if (!scene) return;

    const sceneForPrompt = editedDescription
      ? { ...scene, scene_description: editedDescription }
      : scene;

    if (editedDescription) {
      updateScene(0, { scene_description: editedDescription });
    }

    const newPrompt = buildSceneImagePrompt(
      sceneForPrompt,
      state.scenes.length,
      state.character_bible!,
      newArtStylePrompt,
      state.aspect_ratio
    );

    updateScene(0, { status: "generating", error_message: null, generation_prompt: newPrompt });
    setPipelineStage("generating_images");

    try {
      const heroRes = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newPrompt,
          apiKey,
          model: state.image_model,
        }),
      });

      if (heroRes.ok) {
        const heroData = await heroRes.json();
        if (heroData.image_base64) {
          const newHeroImage = { data: heroData.image_base64, mimeType: heroData.mime_type || "image/png" };
          heroContextRef.current = { ...ctx, heroImage: newHeroImage, currentModel: state.image_model };

          ctx.scenePrompts[0] = { key: ctx.scenePrompts[0].key, prompt: newPrompt };

          updateScene(0, {
            image_base64: heroData.image_base64,
            image_mime_type: heroData.mime_type,
            status: "completed",
          });
        }
      } else {
        const err = await heroRes.json();
        updateScene(0, { status: "failed", error_message: err.message || "Hero regeneration failed" });
      }
    } catch (err: unknown) {
      updateScene(0, {
        status: "failed",
        error_message: err instanceof Error ? err.message : "Hero regeneration failed",
      });
    }

    setPipelineStage("hero_review");
  }, [updateScene, setPipelineStage]);

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
        animation_prompt: null,
        camera_movement: null,
        suggested_transition: null,
      });
      useProjectStore.getState().setAnimationPromptsGenerated(false);

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

  // ====== HERO REVIEW STATE ======
  if (pipelineStage === "hero_review") {
    const heroScene = scenes[0];
    const heroOk = heroScene && (heroScene.status === "completed" || heroScene.status === "approved") && heroScene.image_base64;
    const heroFailed = heroScene && heroScene.status === "failed";
    const heroGenerating = heroScene && heroScene.status === "generating";
    const totalRemaining = Math.max(0, scenes.length - 1);
    const selectedModel = IMAGE_MODELS.find((m) => m.id === imageModel);

    return (
      <div className="flex min-h-screen flex-col pb-12">
        <header className="flex items-center justify-between py-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-accent">
              SceneForge
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              Review your hero frame before generating all scenes
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-border bg-surface p-3 text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <Settings size={20} />
          </button>
        </header>

        <div className="mx-auto w-full max-w-3xl space-y-6">
          {/* Status banner */}
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-5 py-3">
            <CheckCircle2 size={20} className="shrink-0 text-accent" />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Character Bible & Script Chunking Complete
              </p>
              <p className="text-xs text-text-secondary">
                {scenes.length} scenes ready — review Scene 1 (hero frame) below before generating the rest
              </p>
            </div>
          </div>

          {/* Hero Frame Preview */}
          <div className="overflow-hidden rounded-xl border-2 border-accent/40 bg-surface">
            <div className="border-b border-border bg-accent/5 px-5 py-3">
              <h2 className="font-heading text-base font-bold text-text-primary">
                Scene 1 — Hero Reference Frame
              </h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                All remaining scenes will match this art style and visual consistency
              </p>
            </div>

            <div className="p-5">
              {heroOk ? (
                <img
                  src={`data:${heroScene.image_mime_type};base64,${heroScene.image_base64}`}
                  alt="Hero Frame — Scene 1"
                  className="w-full rounded-lg"
                />
              ) : heroGenerating ? (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-background">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="animate-spin text-accent" />
                    <p className="text-xs text-text-secondary">Generating hero frame...</p>
                  </div>
                </div>
              ) : heroFailed ? (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-error/5">
                  <div className="text-center">
                    <AlertTriangle size={32} className="mx-auto text-error/60" />
                    <p className="mt-2 text-xs text-error">{heroScene.error_message || "Hero frame generation failed"}</p>
                    <p className="mt-1 text-[11px] text-text-secondary">Try a different art style or model, then regenerate</p>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-background/50">
                  <span className="text-sm text-text-secondary/40">No hero frame</span>
                </div>
              )}

              {heroScene && (
                <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                  {heroScene.script_text}
                </p>
              )}
            </div>
          </div>

          {/* Scene Description Editor */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <button
              onClick={() => {
                if (!heroEditMode && heroScene) {
                  setHeroEditDescription(heroScene.scene_description);
                }
                setHeroEditMode(!heroEditMode);
              }}
              className="flex w-full items-center justify-between border-b border-border px-5 py-3 text-left transition-colors hover:bg-accent/5"
            >
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-text-primary">
                <Pencil size={14} className="text-accent" />
                Edit Scene Description
              </h3>
              <span className="text-xs text-text-secondary">
                {heroEditMode ? "Collapse" : "Expand to edit"}
              </span>
            </button>

            {heroEditMode && (
              <div className="space-y-3 p-5">
                <p className="text-xs text-text-secondary">
                  Modify the visual description that guides image generation. Changes apply on next regeneration.
                </p>
                <textarea
                  value={heroEditDescription}
                  onChange={(e) => setHeroEditDescription(e.target.value)}
                  rows={5}
                  className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                  placeholder="Describe the visual scene..."
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-text-secondary/60">
                    {heroEditDescription.length} characters
                  </p>
                  <button
                    onClick={() => {
                      if (heroScene) setHeroEditDescription(heroScene.scene_description);
                    }}
                    className="text-xs text-accent hover:underline"
                  >
                    Reset to original
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Art Style & Model selector */}
          <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-text-primary">
              <Palette size={16} className="text-accent" />
              Adjust Before Continuing
            </h3>

            <StyleSelector />

            <ProcessingConfig />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                const edited = heroEditMode && heroEditDescription.trim().length > 0
                  && heroEditDescription !== heroScene?.scene_description
                  ? heroEditDescription.trim()
                  : undefined;
                regenerateHero(edited);
                setHeroEditMode(false);
              }}
              disabled={heroGenerating}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-accent/30 bg-surface py-4 text-sm font-bold text-accent transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-40"
            >
              <RefreshCw size={18} className={heroGenerating ? "animate-spin" : ""} />
              {heroGenerating ? "Regenerating..." : heroEditMode && heroEditDescription !== heroScene?.scene_description ? "Regenerate with Edits" : "Regenerate Hero Frame"}
            </button>

            <button
              onClick={continueAfterHero}
              disabled={!heroOk}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-4 text-sm font-bold text-background transition-all hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play size={18} />
              Continue — Generate {totalRemaining} Remaining Scene{totalRemaining !== 1 ? "s" : ""}
            </button>
          </div>

          {selectedModel && (
            <p className="text-center text-xs text-text-secondary/60">
              Using {selectedModel.label}
              {selectedModel.costPerImage > 0
                ? ` · Estimated cost: $${(totalRemaining * selectedModel.costPerImage * (processingMode === "batch" ? 0.5 : 1)).toFixed(2)}`
                : " · Free tier"}
              {processingMode === "batch" ? " · Batch mode (50% off)" : " · Standard mode"}
            </p>
          )}
        </div>

        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
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
        onSwitchToStandard={batchMode ? () => { switchToStandardRef.current = true; } : undefined}
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
