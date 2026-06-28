export const clientStorageKeys = {
  saveSlot: "penglai-save-slot",
  previousSaveSlot: "penglai-previous-save-slot",
  characterDrafts: "penglai-character-drafts",
  authSession: "penglai-auth-session"
} as const;

export const characterNamePresets = ["霧港旅人", "蓬萊學徒", "海線少年", "山城少女"];

export const fallbackPlayerMp = 40;

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
