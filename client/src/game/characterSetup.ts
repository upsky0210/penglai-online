import {
  CHARACTER_CLASSES,
  CHARACTER_CLASS_CONFIGS,
  CHARACTER_CLASS_LABELS,
  CLASS_SKILL_IDS,
  DEFAULT_CHARACTER_CLASS,
  SKILL_DEFINITIONS,
  isCharacterClass,
  normalizeCharacterName,
  type CharacterClass
} from "@penglai/shared";
import { characterNamePresets, clientStorageKeys } from "./clientConfig";

export { isCharacterClass, normalizeCharacterName } from "@penglai/shared";

export interface CharacterClassOption {
  className: CharacterClass;
  label: string;
  description: string;
}

export interface CharacterDraft {
  name: string;
  className: CharacterClass;
}

export const characterClassOptions: CharacterClassOption[] = CHARACTER_CLASSES.map((className) => {
  const config = CHARACTER_CLASS_CONFIGS[className];
  const skill = SKILL_DEFINITIONS[CLASS_SKILL_IDS[className]];
  return {
    className,
    label: CHARACTER_CLASS_LABELS[className],
    description: `生命 ${config.maxHp} / 法力 ${config.maxMp}，技能：${skill.name}。`
  };
});

export function getDefaultCharacterDraft(): CharacterDraft {
  return {
    name: characterNamePresets[0],
    className: DEFAULT_CHARACTER_CLASS
  };
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
    className: isCharacterClass(draft?.className) ? draft.className : DEFAULT_CHARACTER_CLASS
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
