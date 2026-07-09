import type { CharacterClass } from "@penglai/shared";
import { characterNamePresets, clientStorageKeys } from "./clientConfig";

export interface CharacterClassOption {
  className: CharacterClass;
  label: string;
  description: string;
}

export interface CharacterDraft {
  name: string;
  className: CharacterClass;
}

export const characterClassOptions: CharacterClassOption[] = [
  {
    className: "swordsman",
    label: "劍士",
    description: "生命 115 / 法力 36，技能：斬擊。"
  },
  {
    className: "talisman",
    label: "符咒師",
    description: "生命 90 / 法力 60，技能：靈符彈。"
  },
  {
    className: "hunter",
    label: "獵人",
    description: "生命 100 / 法力 42，技能：遠射。"
  }
];

export function getDefaultCharacterDraft(): CharacterDraft {
  return {
    name: characterNamePresets[0],
    className: "swordsman"
  };
}

export function normalizeCharacterName(name: string) {
  const normalized = Array.from(name.trim().replace(/\s+/g, "")).slice(0, 12).join("");
  return normalized || "旅人";
}

export function isCharacterClass(value: unknown): value is CharacterClass {
  return characterClassOptions.some((option) => option.className === value);
}

export function getCharacterClassOption(className: CharacterClass) {
  return characterClassOptions.find((option) => option.className === className) ?? characterClassOptions[0];
}

export function getClassLabel(className: CharacterClass) {
  return getCharacterClassOption(className).label;
}

export function readCharacterDraft(saveSlot: string): CharacterDraft {
  const draft = readCharacterDrafts()[saveSlot];
  return {
    name: normalizeCharacterName(draft?.name ?? characterNamePresets[0]),
    className: isCharacterClass(draft?.className) ? draft.className : "swordsman"
  };
}

export function writeCharacterDraft(saveSlot: string, draft: CharacterDraft) {
  try {
    const drafts = readCharacterDrafts();
    drafts[saveSlot] = {
      name: normalizeCharacterName(draft.name),
      className: draft.className
    };
    window.localStorage.setItem(clientStorageKeys.characterDrafts, JSON.stringify(drafts));
  } catch {
    // localStorage can be unavailable; the active session still keeps the selected character data in memory.
  }
}

function readCharacterDrafts() {
  try {
    return JSON.parse(window.localStorage.getItem(clientStorageKeys.characterDrafts) ?? "{}") as Partial<
      Record<string, Partial<CharacterDraft>>
    >;
  } catch {
    return {};
  }
}
