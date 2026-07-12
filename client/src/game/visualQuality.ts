export type VisualQualityMode = "high" | "low";

export interface VisualQualityProfile {
  mode: VisualQualityMode;
  maxCombatEffects: number;
  maxWorldLabels: number;
  remoteEffectCooldownMs: number;
  animateAmbientLayers: boolean;
  showSecondaryGlows: boolean;
}

const storageKey = "penglai-visual-quality";

function detectMode(): VisualQualityMode {
  const query = new URLSearchParams(window.location.search).get("quality");
  if (query === "low" || query === "high") return query;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "low" || stored === "high") return stored;
  } catch {
    // Automatic detection remains available when storage is blocked.
  }
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return reducedMotion || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ? "low" : "high";
}

const mode = detectMode();

export const visualQuality: VisualQualityProfile = mode === "low"
  ? { mode, maxCombatEffects: 6, maxWorldLabels: 14, remoteEffectCooldownMs: 320, animateAmbientLayers: false, showSecondaryGlows: false }
  : { mode, maxCombatEffects: 16, maxWorldLabels: 32, remoteEffectCooldownMs: 150, animateAmbientLayers: true, showSecondaryGlows: true };
