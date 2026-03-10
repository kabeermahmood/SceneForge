import { create } from "zustand";
import type { CharacterBible, ProjectState, Scene } from "@/lib/types";

interface ProjectActions {
  setScript: (script: string) => void;
  setDuration: (seconds: number) => void;
  setArtStyle: (style: string) => void;
  setArtStyleCustom: (text: string) => void;
  setAspectRatio: (ratio: "16:9" | "9:16" | "1:1") => void;
  setSecondsPerScene: (seconds: number) => void;
  setCharacterBible: (bible: CharacterBible) => void;
  setScenes: (scenes: Scene[]) => void;
  updateScene: (index: number, updates: Partial<Scene>) => void;
  setPipelineStage: (stage: ProjectState["pipeline_stage"]) => void;
  setCurrentSceneIndex: (index: number) => void;
  setErrorMessage: (message: string | null) => void;
  resetProject: () => void;
}

const initialState: ProjectState = {
  script: "",
  duration_seconds: 90,
  art_style: "cute_minimal",
  art_style_custom: "",
  aspect_ratio: "16:9",
  seconds_per_scene: 8,
  character_bible: null,
  scenes: [],
  pipeline_stage: "idle",
  current_scene_index: 0,
  error_message: null,
};

export const useProjectStore = create<ProjectState & ProjectActions>(
  (set) => ({
    ...initialState,

    setScript: (script) => set({ script }),
    setDuration: (seconds) => set({ duration_seconds: seconds }),
    setArtStyle: (style) => set({ art_style: style }),
    setArtStyleCustom: (text) => set({ art_style_custom: text }),
    setAspectRatio: (ratio) => set({ aspect_ratio: ratio }),
    setSecondsPerScene: (seconds) => set({ seconds_per_scene: seconds }),
    setCharacterBible: (bible) => set({ character_bible: bible }),
    setScenes: (scenes) => set({ scenes }),
    updateScene: (index, updates) =>
      set((state) => ({
        scenes: state.scenes.map((s, i) =>
          i === index ? { ...s, ...updates } : s
        ),
      })),
    setPipelineStage: (stage) => set({ pipeline_stage: stage }),
    setCurrentSceneIndex: (index) => set({ current_scene_index: index }),
    setErrorMessage: (message) => set({ error_message: message }),
    resetProject: () => set(initialState),
  })
);
