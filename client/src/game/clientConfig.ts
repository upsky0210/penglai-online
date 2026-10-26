export const clientStorageKeys = {
  saveSlot: "penglai-save-slot",
  previousSaveSlot: "penglai-previous-save-slot",
  characterDrafts: "penglai-character-drafts",
  authSession: "penglai-auth-session",
  saveReminderSeen: "penglai-save-reminder-seen"
} as const;

export const characterNamePresets = ["霧港旅人", "蓬萊學徒", "海線少年", "山城少女"];

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

// Only set when the client is hosted apart from the server (e.g. GitHub Pages),
// e.g. https://penglai.example.org. Empty = same origin (nginx) or Vite dev.
// Must be https:// when the page itself is served over https://.
export const serverUrl = import.meta.env.VITE_SERVER_URL ?? "";

// Test-only: shows a mock login button on the title screen so the account/save
// flow can be exercised without a real Google Client ID. Keep OFF for real builds.
export const authAllowMock = import.meta.env.VITE_AUTH_ALLOW_MOCK === "1";
