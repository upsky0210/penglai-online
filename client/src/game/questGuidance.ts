import {
  GAME_MAPS,
  type GameMapData,
  type ItemId,
  type MapId,
  type MapInteractableData,
  type MonsterKind,
  type QuestSnapshot
} from "@penglai/shared";

export const chapterQuestIds = [
  "field-rat-cleanup",
  "rat-tail-salve",
  "mist-gel-lantern",
  "breakwater-scout",
  "breakwater-lantern-repair",
  "tide-watcher-core",
  "watcher-shell-report",
  "tide-gauge-survey",
  "warehouse-rat-cleanup",
  "damp-wood-sample",
  "mist-puppet-clear",
  "warehouse-sentry-core",
  "cavern-crab-clear",
  "reef-spark-sample",
  "reef-seal-activate",
  "coral-warden-core",
  "coral-key-report",
  "archive-drifter-clear",
  "ink-core-sample",
  "archive-tablet-align",
  "archive-guardian-core",
  "archive-seal-report",
  "star-moth-clear",
  "lens-core-sample",
  "observatory-lens-align",
  "astral-keeper-core",
  "astral-seal-report"
] as const;

const itemSourceMonsterKinds: Partial<Record<ItemId, MonsterKind>> = {
  "rat-tail": "field-rat",
  "mist-gel": "mist-slime",
  "watcher-shell": "tide-watcher",
  "warehouse-cloth": "warehouse-rat",
  "damp-wood": "mist-puppet",
  "crab-shell": "cave-crab",
  "reef-spark": "reef-wisp",
  "coral-key": "coral-warden",
  "salted-page": "archive-drifter",
  "ink-core": "ink-sprite",
  "archive-seal": "archive-guardian",
  "star-dust": "star-moth",
  "lens-core": "lens-sentinel",
  "astral-seal": "astral-keeper"
};

export function getInteractableDoneLabel(interactable: MapInteractableData) {
  if (interactable.kind === "lantern") {
    return "已修復";
  }

  if (interactable.kind === "seal") {
    return "已啟動";
  }

  if (interactable.kind === "tablet" || interactable.kind === "lens") {
    return "已校準";
  }

  return "已調查";
}

export function getInteractablePendingLabel(interactable: MapInteractableData) {
  if (interactable.kind === "lantern") {
    return "待修復";
  }

  if (interactable.kind === "seal") {
    return "待啟動";
  }

  if (interactable.kind === "tablet" || interactable.kind === "lens") {
    return "待校準";
  }

  return "待調查";
}

export function isQuestUnlocked(quest: QuestSnapshot, quests: Map<string, QuestSnapshot>) {
  return (quest.prerequisiteQuestIds ?? []).every((questId) => quests.get(questId)?.status === "completed");
}

export function getQuestTargetMapId(quest: QuestSnapshot): MapId | undefined {
  if (quest.status === "available" || quest.status === "ready") {
    return Object.values(GAME_MAPS).find((map) => map.npcs.some((npc) => npc.id === quest.npcId))?.id;
  }

  if (quest.status !== "active") {
    return undefined;
  }

  if (quest.objective.type === "kill") {
    const targetKind = quest.objective.targetKind;
    return Object.values(GAME_MAPS).find((map) =>
      map.monsterSpawns.some((spawn) => spawn.kind === targetKind)
    )?.id;
  }

  if (quest.objective.type === "interact") {
    const targetId = quest.objective.targetId;
    return Object.values(GAME_MAPS).find((map) =>
      map.interactables.some((interactable) => interactable.targetId === targetId)
    )?.id;
  }

  const targetKind = getItemSourceMonsterKind(quest.objective.itemId);
  if (!targetKind) {
    return undefined;
  }

  return Object.values(GAME_MAPS).find((map) => map.monsterSpawns.some((spawn) => spawn.kind === targetKind))?.id;
}

export function getQuestTargetX(quest: QuestSnapshot, currentMap: GameMapData) {
  if (quest.status === "available" || quest.status === "ready") {
    return currentMap.npcs.find((npc) => npc.id === quest.npcId)?.x;
  }

  if (quest.status !== "active") {
    return undefined;
  }

  if (quest.objective.type === "kill") {
    return getMonsterTargetX(quest.objective.targetKind, currentMap);
  }

  if (quest.objective.type === "interact") {
    const targetId = quest.objective.targetId;
    return currentMap.interactables.find((interactable) => interactable.targetId === targetId)?.x;
  }

  const targetKind = getItemSourceMonsterKind(quest.objective.itemId);
  return targetKind ? getMonsterTargetX(targetKind, currentMap) : undefined;
}

/** 找出通往目標地圖的下一個傳送點；只讀地圖拓樸，不改任務或傳送權限。 */
export function getNextPortalTowardMap(currentMapId: MapId, targetMapId: MapId) {
  if (currentMapId === targetMapId) return undefined;
  const queue: Array<{ mapId: MapId; firstPortalId?: string }> = [{ mapId: currentMapId }];
  const visited = new Set<MapId>([currentMapId]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const portal of GAME_MAPS[current.mapId].portals) {
      if (visited.has(portal.targetMapId)) continue;
      const firstPortalId = current.firstPortalId ?? portal.id;
      if (portal.targetMapId === targetMapId) {
        return GAME_MAPS[currentMapId].portals.find((candidate) => candidate.id === firstPortalId);
      }
      visited.add(portal.targetMapId);
      queue.push({ mapId: portal.targetMapId, firstPortalId });
    }
  }
  return undefined;
}

export function getPortalRequirementText(targetMapId: MapId, quests: Map<string, QuestSnapshot>) {
  const targetNpcIds = new Set(GAME_MAPS[targetMapId].npcs.map((npc) => npc.id));
  const firstQuest = [...quests.values()].find((quest) => targetNpcIds.has(quest.npcId));
  const missingId = firstQuest?.prerequisiteQuestIds?.find((questId) => quests.get(questId)?.status !== "completed");
  return missingId ? `當地委託需先完成「${quests.get(missingId)?.title ?? "前置任務"}」` : "可進入";
}

export function getItemSourceMonsterKind(itemId: ItemId): MonsterKind | undefined {
  return itemSourceMonsterKinds[itemId];
}

function getMonsterTargetX(kind: MonsterKind, currentMap: GameMapData) {
  return currentMap.monsterSpawns.find((spawn) => spawn.kind === kind)?.x;
}
