export function calculateChunkCount(
  durationSeconds: number,
  secondsPerScene: number,
  minScenes = 4,
  maxScenes = 100
): number {
  const count = Math.round(durationSeconds / secondsPerScene);
  return Math.max(minScenes, Math.min(count, maxScenes));
}

export function calculateSceneTimestamps(
  totalScenes: number,
  durationSeconds: number
): { start: string; end: string }[] {
  const sceneDuration = durationSeconds / totalScenes;
  return Array.from({ length: totalScenes }, (_, i) => ({
    start: formatTimestamp(i * sceneDuration),
    end: formatTimestamp((i + 1) * sceneDuration),
  }));
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
