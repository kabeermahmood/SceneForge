import { create } from "zustand";
import type {
  AdvancedParams,
  ArtStyleOption,
  CharacterBible,
  ProcessingMode,
  ProjectState,
  PromptTemplates,
  Scene,
  VideoTool,
} from "@/lib/types";
import { DEFAULT_ADVANCED_PARAMS } from "@/lib/types";

interface ProjectActions {
  setScript: (script: string) => void;
  setDuration: (seconds: number) => void;
  setArtStyle: (style: string) => void;
  setArtStyleCustom: (text: string) => void;
  setAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;
  setSecondsPerScene: (seconds: number) => void;
  setProcessingMode: (mode: ProcessingMode) => void;
  setStandardConcurrency: (val: 1 | 3) => void;
  setImageModel: (model: string) => void;
  setTextModel: (model: string) => void;
  setVideoTool: (tool: VideoTool) => void;
  setCharacterBible: (bible: CharacterBible) => void;
  setBibleSource: (source: "ai" | "custom") => void;
  setScenesSource: (source: "ai" | "custom") => void;
  setScenes: (scenes: Scene[]) => void;
  appendScenes: (newScenes: Scene[]) => void;
  updateScene: (index: number, updates: Partial<Scene>) => void;
  setPipelineStage: (stage: ProjectState["pipeline_stage"]) => void;
  setCurrentSceneIndex: (index: number) => void;
  setErrorMessage: (message: string | null) => void;
  setAnimationPromptsGenerated: (val: boolean) => void;
  setAnimationPromptModel: (model: string) => void;
  setAutoSplit: (val: boolean) => void;
  setScriptParts: (parts: string[]) => void;
  setCurrentPartIndex: (index: number) => void;
  setPromptTemplates: (templates: PromptTemplates) => void;
  setAdvancedParams: (params: Partial<AdvancedParams>) => void;
  setSavedCustomStyles: (styles: ArtStyleOption[]) => void;
  resetProject: () => void;
}

function loadSavedStyles(): ArtStyleOption[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("sceneforge_custom_styles");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const initialState: ProjectState = {
  script: "",
  duration_seconds: 90,
  art_style: "cute_minimal",
  art_style_custom: "",
  aspect_ratio: "16:9",
  seconds_per_scene: 8,
  processing_mode: "batch",
  standard_concurrency: 1,
  image_model: "gemini-2.5-flash-image",
  text_model: "gemini-2.5-flash",
  video_tool: "grok",
  character_bible: null,
  bible_source: "ai",
  scenes_source: "ai",
  scenes: [],
  pipeline_stage: "idle",
  current_scene_index: 0,
  error_message: null,
  animation_prompts_generated: false,
  animation_prompt_model: "gemini-2.5-flash",
  auto_split: false,
  script_parts: [],
  current_part_index: 0,
  prompt_templates: {},
  advanced_params: { ...DEFAULT_ADVANCED_PARAMS },
  saved_custom_styles: [],
};

export const useProjectStore = create<ProjectState & ProjectActions>(
  (set) => ({
    ...initialState,
    saved_custom_styles: loadSavedStyles(),

    setScript: (script) => set({ script }),
    setDuration: (seconds) => set({ duration_seconds: seconds }),
    setArtStyle: (style) => set({ art_style: style }),
    setArtStyleCustom: (text) => set({ art_style_custom: text }),
    setAspectRatio: (ratio) => set({ aspect_ratio: ratio }),
    setSecondsPerScene: (seconds) => set({ seconds_per_scene: seconds }),
    setProcessingMode: (mode) => set({ processing_mode: mode }),
    setStandardConcurrency: (val) => set({ standard_concurrency: val }),
    setImageModel: (model) => set({ image_model: model }),
    setTextModel: (model) => set({ text_model: model }),
    setVideoTool: (tool) => set({ video_tool: tool }),
    setCharacterBible: (bible) => set({ character_bible: bible }),
    setBibleSource: (source) => set({ bible_source: source }),
    setScenesSource: (source) => set({ scenes_source: source }),
    setScenes: (scenes) => set({ scenes }),
    appendScenes: (newScenes) =>
      set((state) => {
        const offset = state.scenes.length;
        const offsetScenes = newScenes.map((s, i) => ({
          ...s,
          chunk_index: offset + i + 1,
        }));
        return { scenes: [...state.scenes, ...offsetScenes] };
      }),
    updateScene: (index, updates) =>
      set((state) => ({
        scenes: state.scenes.map((s, i) =>
          i === index ? { ...s, ...updates } : s
        ),
      })),
    setPipelineStage: (stage) => set({ pipeline_stage: stage }),
    setCurrentSceneIndex: (index) => set({ current_scene_index: index }),
    setErrorMessage: (message) => set({ error_message: message }),
    setAnimationPromptsGenerated: (val) => set({ animation_prompts_generated: val }),
    setAnimationPromptModel: (model) => set({ animation_prompt_model: model }),
    setAutoSplit: (val) => set({ auto_split: val }),
    setScriptParts: (parts) => set({ script_parts: parts }),
    setCurrentPartIndex: (index) => set({ current_part_index: index }),
    setPromptTemplates: (templates) =>
      set((state) => ({ prompt_templates: { ...state.prompt_templates, ...templates } })),
    setAdvancedParams: (params) =>
      set((state) => ({ advanced_params: { ...state.advanced_params, ...params } })),
    setSavedCustomStyles: (styles) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("sceneforge_custom_styles", JSON.stringify(styles));
      }
      set({ saved_custom_styles: styles });
    },
    resetProject: () => set(initialState),
  })
);
