export type CharacterClass = "swordsman" | "talisman" | "hunter";

export type Facing = "left" | "right";

export type PlayerAnimation = "idle" | "run" | "jump" | "attack" | "skill";

export type SkillId = "sword-cleave" | "spirit-talisman" | "hunter-shot" | "spirit-slash";

export type EquipmentSlot = "weapon" | "armor";

export type MapId =
  | "fog-harbor-test"
  | "mist-breakwater"
  | "old-harbor-warehouse"
  | "coral-tide-cavern"
  | "sunken-archive"
  | "starlit-observatory";

export interface PlayerSnapshot {
  id: string;
  name: string;
  className: CharacterClass;
  mapId: MapId;
  x: number;
  y: number;
  facing: Facing;
  animation: PlayerAnimation;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  updatedAt: number;
}

export type MonsterKind =
  | "field-rat"
  | "mist-slime"
  | "tide-watcher"
  | "warehouse-rat"
  | "mist-puppet"
  | "warehouse-sentry"
  | "cave-crab"
  | "reef-wisp"
  | "coral-warden"
  | "archive-drifter"
  | "ink-sprite"
  | "archive-guardian"
  | "star-moth"
  | "lens-sentinel"
  | "astral-keeper";

export const MONSTER_KIND_NAMES: Record<MonsterKind, string> = {
  "field-rat": "田鼠",
  "mist-slime": "海霧凝膠",
  "tide-watcher": "潮眼守衛",
  "warehouse-rat": "倉鼠",
  "mist-puppet": "霧化木偶",
  "warehouse-sentry": "倉庫巡弋者",
  "cave-crab": "潮洞蟹",
  "reef-wisp": "礁光幽影",
  "coral-warden": "珊瑚守望者",
  "archive-drifter": "沉船漂書",
  "ink-sprite": "墨潮精靈",
  "archive-guardian": "書庫守衛",
  "star-moth": "星砂蛾",
  "lens-sentinel": "星鏡哨兵",
  "astral-keeper": "星穹守望者"
};

export interface MonsterSnapshot {
  id: string;
  kind: MonsterKind;
  mapId: MapId;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  facing: Facing;
  hitAt: number;
  updatedAt: number;
}

export type ItemId =
  | "small-hp-potion"
  | "medium-hp-potion"
  | "harbor-lunchbox"
  | "rat-tail"
  | "mist-gel"
  | "watcher-shell"
  | "warehouse-cloth"
  | "damp-wood"
  | "crab-shell"
  | "reef-spark"
  | "coral-key"
  | "salted-page"
  | "ink-core"
  | "archive-seal"
  | "star-dust"
  | "lens-core"
  | "astral-seal"
  | "training-sword"
  | "cloth-vest"
  | "harbor-dagger"
  | "patched-jacket"
  | "warehouse-talisman"
  | "reef-blade"
  | "coral-coat"
  | "archive-wand"
  | "scholar-robe"
  | "star-sabre"
  | "observer-cloak";

export interface ItemDefinition {
  id: ItemId;
  name: string;
  kind: "consumable" | "material" | "equipment";
  maxStack: number;
  healHp?: number;
  equipmentSlot?: EquipmentSlot;
  attackBonus?: number;
  defenseBonus?: number;
}

export interface InventorySlot {
  itemId: ItemId;
  name: string;
  quantity: number;
}

export type EquipmentSnapshot = Record<EquipmentSlot, ItemId | null>;

export interface ItemDropSnapshot {
  id: string;
  itemId: ItemId;
  mapId: MapId;
  name: string;
  quantity: number;
  x: number;
  y: number;
  createdAt: number;
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  mpCost: number;
  cooldownMs: number;
  damage: number;
  range: number;
  verticalRange: number;
}

export interface ShopItem {
  itemId: ItemId;
  quantity: number;
  priceGold: number;
}

export interface ShopDefinition {
  id: string;
  npcId: string;
  name: string;
  items: ShopItem[];
}

export const ITEM_DEFINITIONS: Record<ItemId, ItemDefinition> = {
  "small-hp-potion": {
    id: "small-hp-potion",
    name: "小型補血藥水",
    kind: "consumable",
    maxStack: 20,
    healHp: 35
  },
  "medium-hp-potion": {
    id: "medium-hp-potion",
    name: "中型補血藥水",
    kind: "consumable",
    maxStack: 20,
    healHp: 70
  },
  "harbor-lunchbox": {
    id: "harbor-lunchbox",
    name: "霧港便當",
    kind: "consumable",
    maxStack: 10,
    healHp: 110
  },
  "rat-tail": {
    id: "rat-tail",
    name: "田鼠尾巴",
    kind: "material",
    maxStack: 50
  },
  "mist-gel": {
    id: "mist-gel",
    name: "海霧凝膠",
    kind: "material",
    maxStack: 50
  },
  "watcher-shell": {
    id: "watcher-shell",
    name: "潮眼甲片",
    kind: "material",
    maxStack: 20
  },
  "warehouse-cloth": {
    id: "warehouse-cloth",
    name: "舊倉破布",
    kind: "material",
    maxStack: 50
  },
  "damp-wood": {
    id: "damp-wood",
    name: "潮濕木片",
    kind: "material",
    maxStack: 50
  },
  "crab-shell": {
    id: "crab-shell",
    name: "潮洞蟹殼",
    kind: "material",
    maxStack: 50
  },
  "reef-spark": {
    id: "reef-spark",
    name: "礁光碎晶",
    kind: "material",
    maxStack: 50
  },
  "coral-key": {
    id: "coral-key",
    name: "珊瑚潮鑰",
    kind: "material",
    maxStack: 10
  },
  "salted-page": {
    id: "salted-page",
    name: "鹽漬書頁",
    kind: "material",
    maxStack: 50
  },
  "ink-core": {
    id: "ink-core",
    name: "墨潮核心",
    kind: "material",
    maxStack: 30
  },
  "archive-seal": {
    id: "archive-seal",
    name: "書庫封印",
    kind: "material",
    maxStack: 10
  },
  "star-dust": {
    id: "star-dust",
    name: "星砂粉塵",
    kind: "material",
    maxStack: 50
  },
  "lens-core": {
    id: "lens-core",
    name: "星鏡核心",
    kind: "material",
    maxStack: 30
  },
  "astral-seal": {
    id: "astral-seal",
    name: "星穹封印",
    kind: "material",
    maxStack: 10
  },
  "training-sword": {
    id: "training-sword",
    name: "練習木劍",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "weapon",
    attackBonus: 6
  },
  "cloth-vest": {
    id: "cloth-vest",
    name: "粗布背心",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "armor",
    defenseBonus: 4
  },
  "harbor-dagger": {
    id: "harbor-dagger",
    name: "舊港短刀",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "weapon",
    attackBonus: 10
  },
  "patched-jacket": {
    id: "patched-jacket",
    name: "補丁布衣",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "armor",
    defenseBonus: 7
  },
  "warehouse-talisman": {
    id: "warehouse-talisman",
    name: "倉庫護符",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "armor",
    defenseBonus: 9
  },
  "reef-blade": {
    id: "reef-blade",
    name: "礁光短刃",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "weapon",
    attackBonus: 15
  },
  "coral-coat": {
    id: "coral-coat",
    name: "珊瑚護衣",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "armor",
    defenseBonus: 12
  },
  "archive-wand": {
    id: "archive-wand",
    name: "潮墨法杖",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "weapon",
    attackBonus: 20
  },
  "scholar-robe": {
    id: "scholar-robe",
    name: "書庫學袍",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "armor",
    defenseBonus: 16
  },
  "star-sabre": {
    id: "star-sabre",
    name: "星砂彎刀",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "weapon",
    attackBonus: 25
  },
  "observer-cloak": {
    id: "observer-cloak",
    name: "觀測者斗篷",
    kind: "equipment",
    maxStack: 1,
    equipmentSlot: "armor",
    defenseBonus: 20
  }
};

export interface PlatformData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZoneData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NpcData {
  id: string;
  name: string;
  x: number;
  y: number;
  interactionRadius: number;
}

export interface PortalData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetMapId: MapId;
  targetX: number;
  targetY: number;
}

export type MapInteractableKind = "lantern" | "tide-gauge" | "seal" | "tablet" | "lens";

export interface MapInteractableData {
  id: string;
  targetId: string;
  kind: MapInteractableKind;
  name: string;
  prompt: string;
  x: number;
  y: number;
  interactionRadius: number;
}

export interface MonsterSpawn {
  id: string;
  kind: MonsterKind;
  mapId: MapId;
  name: string;
  x: number;
  y: number;
  maxHp: number;
  respawnMs: number;
  expReward: number;
  patrolMinX: number;
  patrolMaxX: number;
  patrolSpeed: number;
}

export interface GameMapData {
  id: MapId;
  name: string;
  width: number;
  height: number;
  playerSpawn: {
    x: number;
    y: number;
  };
  safeZones: ZoneData[];
  npcs: NpcData[];
  portals: PortalData[];
  interactables: MapInteractableData[];
  platforms: PlatformData[];
  monsterSpawns: MonsterSpawn[];
}

export type QuestStatus = "available" | "active" | "ready" | "completed";

export interface QuestDefinition {
  id: string;
  title: string;
  npcId: string;
  objective:
    | {
        type: "kill";
        targetKind: MonsterKind;
        targetCount: number;
      }
    | {
        type: "collect";
        itemId: ItemId;
        targetCount: number;
        consumeItems: boolean;
      }
    | {
        type: "interact";
        targetId: string;
        targetCount: number;
      };
  targetCount: number;
  rewardExp: number;
  rewardGold: number;
  chapterId?: "chapter-1" | "warehouse" | "cavern" | "archive" | "observatory";
  prerequisiteQuestIds?: string[];
}

export interface QuestSnapshot extends QuestDefinition {
  status: QuestStatus;
  progress: number;
  interactedTargetIds?: string[];
}

export const FIELD_RAT_QUEST: QuestDefinition = {
  id: "field-rat-cleanup",
  title: "清理田鼠",
  npcId: "fog-harbor-guard",
  objective: {
    type: "kill",
    targetKind: "field-rat",
    targetCount: 3
  },
  targetCount: 3,
  rewardExp: 45,
  rewardGold: 25,
  chapterId: "chapter-1"
};

export const RAT_TAIL_QUEST: QuestDefinition = {
  id: "rat-tail-salve",
  title: "田鼠尾巴藥引",
  npcId: "herbalist-lin",
  objective: {
    type: "collect",
    itemId: "rat-tail",
    targetCount: 2,
    consumeItems: true
  },
  targetCount: 2,
  rewardExp: 35,
  rewardGold: 20,
  chapterId: "chapter-1",
  prerequisiteQuestIds: ["field-rat-cleanup"]
};

export const MIST_GEL_QUEST: QuestDefinition = {
  id: "mist-gel-lantern",
  title: "霧燈凝膠",
  npcId: "lighthouse-apprentice",
  objective: {
    type: "collect",
    itemId: "mist-gel",
    targetCount: 2,
    consumeItems: true
  },
  targetCount: 2,
  rewardExp: 52,
  rewardGold: 30,
  chapterId: "chapter-1",
  prerequisiteQuestIds: ["rat-tail-salve"]
};

export const BREAKWATER_SCOUT_QUEST: QuestDefinition = {
  id: "breakwater-scout",
  title: "巡查海霧堤道",
  npcId: "breakwater-scout",
  objective: {
    type: "kill",
    targetKind: "mist-slime",
    targetCount: 4
  },
  targetCount: 4,
  rewardExp: 70,
  rewardGold: 40,
  chapterId: "chapter-1",
  prerequisiteQuestIds: ["mist-gel-lantern"]
};

export const TIDE_WATCHER_QUEST: QuestDefinition = {
  id: "tide-watcher-core",
  title: "擊退潮眼守衛",
  npcId: "breakwater-scout",
  objective: {
    type: "kill",
    targetKind: "tide-watcher",
    targetCount: 1
  },
  targetCount: 1,
  rewardExp: 120,
  rewardGold: 80,
  chapterId: "chapter-1",
  prerequisiteQuestIds: ["breakwater-scout"]
};

export const BREAKWATER_LANTERN_QUEST: QuestDefinition = {
  id: "breakwater-lantern-repair",
  title: "修補霧堤燈",
  npcId: "tide-researcher-yu",
  objective: {
    type: "interact",
    targetId: "breakwater-lantern",
    targetCount: 3
  },
  targetCount: 3,
  rewardExp: 80,
  rewardGold: 45,
  chapterId: "chapter-1",
  prerequisiteQuestIds: ["tide-watcher-core"]
};

export const WATCHER_SHELL_QUEST: QuestDefinition = {
  id: "watcher-shell-report",
  title: "回收潮眼甲片",
  npcId: "tide-researcher-yu",
  objective: {
    type: "collect",
    itemId: "watcher-shell",
    targetCount: 1,
    consumeItems: true
  },
  targetCount: 1,
  rewardExp: 95,
  rewardGold: 65,
  chapterId: "chapter-1",
  prerequisiteQuestIds: ["breakwater-lantern-repair"]
};

export const TIDE_GAUGE_QUEST: QuestDefinition = {
  id: "tide-gauge-survey",
  title: "調查潮位尺",
  npcId: "tide-researcher-yu",
  objective: {
    type: "interact",
    targetId: "tide-gauge",
    targetCount: 1
  },
  targetCount: 1,
  rewardExp: 70,
  rewardGold: 35,
  chapterId: "chapter-1",
  prerequisiteQuestIds: ["watcher-shell-report"]
};

export const WAREHOUSE_RAT_QUEST: QuestDefinition = {
  id: "warehouse-rat-cleanup",
  title: "舊倉鼠患",
  npcId: "warehouse-keeper",
  objective: {
    type: "kill",
    targetKind: "warehouse-rat",
    targetCount: 4
  },
  targetCount: 4,
  rewardExp: 90,
  rewardGold: 55,
  chapterId: "warehouse",
  prerequisiteQuestIds: ["tide-gauge-survey"]
};

export const DAMP_WOOD_QUEST: QuestDefinition = {
  id: "damp-wood-sample",
  title: "潮濕木片樣本",
  npcId: "warehouse-keeper",
  objective: {
    type: "collect",
    itemId: "damp-wood",
    targetCount: 3,
    consumeItems: true
  },
  targetCount: 3,
  rewardExp: 105,
  rewardGold: 60,
  chapterId: "warehouse",
  prerequisiteQuestIds: ["warehouse-rat-cleanup"]
};

export const MIST_PUPPET_QUEST: QuestDefinition = {
  id: "mist-puppet-clear",
  title: "霧化木偶",
  npcId: "warehouse-keeper",
  objective: {
    type: "kill",
    targetKind: "mist-puppet",
    targetCount: 3
  },
  targetCount: 3,
  rewardExp: 120,
  rewardGold: 70,
  chapterId: "warehouse",
  prerequisiteQuestIds: ["damp-wood-sample"]
};

export const WAREHOUSE_SENTRY_QUEST: QuestDefinition = {
  id: "warehouse-sentry-core",
  title: "擊退倉庫巡弋者",
  npcId: "warehouse-keeper",
  objective: {
    type: "kill",
    targetKind: "warehouse-sentry",
    targetCount: 1
  },
  targetCount: 1,
  rewardExp: 150,
  rewardGold: 95,
  chapterId: "warehouse",
  prerequisiteQuestIds: ["mist-puppet-clear"]
};

export const CAVERN_CRAB_QUEST: QuestDefinition = {
  id: "cavern-crab-clear",
  title: "清理潮洞蟹群",
  npcId: "cavern-scholar",
  objective: {
    type: "kill",
    targetKind: "cave-crab",
    targetCount: 4
  },
  targetCount: 4,
  rewardExp: 140,
  rewardGold: 80,
  chapterId: "cavern",
  prerequisiteQuestIds: ["warehouse-sentry-core"]
};

export const REEF_SPARK_QUEST: QuestDefinition = {
  id: "reef-spark-sample",
  title: "收集礁光碎晶",
  npcId: "cavern-scholar",
  objective: {
    type: "collect",
    itemId: "reef-spark",
    targetCount: 3,
    consumeItems: true
  },
  targetCount: 3,
  rewardExp: 155,
  rewardGold: 90,
  chapterId: "cavern",
  prerequisiteQuestIds: ["cavern-crab-clear"]
};

export const REEF_SEAL_QUEST: QuestDefinition = {
  id: "reef-seal-activate",
  title: "啟動三處潮封印",
  npcId: "cavern-scholar",
  objective: {
    type: "interact",
    targetId: "reef-seal",
    targetCount: 3
  },
  targetCount: 3,
  rewardExp: 165,
  rewardGold: 95,
  chapterId: "cavern",
  prerequisiteQuestIds: ["reef-spark-sample"]
};

export const CORAL_WARDEN_QUEST: QuestDefinition = {
  id: "coral-warden-core",
  title: "擊退珊瑚守望者",
  npcId: "cavern-scholar",
  objective: {
    type: "kill",
    targetKind: "coral-warden",
    targetCount: 1
  },
  targetCount: 1,
  rewardExp: 220,
  rewardGold: 140,
  chapterId: "cavern",
  prerequisiteQuestIds: ["reef-seal-activate"]
};

export const CORAL_KEY_QUEST: QuestDefinition = {
  id: "coral-key-report",
  title: "回收珊瑚潮鑰",
  npcId: "cavern-scholar",
  objective: {
    type: "collect",
    itemId: "coral-key",
    targetCount: 1,
    consumeItems: true
  },
  targetCount: 1,
  rewardExp: 190,
  rewardGold: 120,
  chapterId: "cavern",
  prerequisiteQuestIds: ["coral-warden-core"]
};

export const ARCHIVE_DRIFTER_QUEST: QuestDefinition = {
  id: "archive-drifter-clear",
  title: "整理沉船漂書",
  npcId: "archive-curator",
  objective: {
    type: "kill",
    targetKind: "archive-drifter",
    targetCount: 4
  },
  targetCount: 4,
  rewardExp: 210,
  rewardGold: 135,
  chapterId: "archive",
  prerequisiteQuestIds: ["coral-key-report"]
};

export const INK_CORE_QUEST: QuestDefinition = {
  id: "ink-core-sample",
  title: "收集墨潮核心",
  npcId: "archive-curator",
  objective: {
    type: "collect",
    itemId: "ink-core",
    targetCount: 3,
    consumeItems: true
  },
  targetCount: 3,
  rewardExp: 230,
  rewardGold: 145,
  chapterId: "archive",
  prerequisiteQuestIds: ["archive-drifter-clear"]
};

export const ARCHIVE_TABLET_QUEST: QuestDefinition = {
  id: "archive-tablet-align",
  title: "校準三座書庫碑",
  npcId: "archive-curator",
  objective: {
    type: "interact",
    targetId: "archive-tablet",
    targetCount: 3
  },
  targetCount: 3,
  rewardExp: 240,
  rewardGold: 150,
  chapterId: "archive",
  prerequisiteQuestIds: ["ink-core-sample"]
};

export const ARCHIVE_GUARDIAN_QUEST: QuestDefinition = {
  id: "archive-guardian-core",
  title: "擊退書庫守衛",
  npcId: "archive-curator",
  objective: {
    type: "kill",
    targetKind: "archive-guardian",
    targetCount: 1
  },
  targetCount: 1,
  rewardExp: 300,
  rewardGold: 180,
  chapterId: "archive",
  prerequisiteQuestIds: ["archive-tablet-align"]
};

export const ARCHIVE_SEAL_QUEST: QuestDefinition = {
  id: "archive-seal-report",
  title: "回收書庫封印",
  npcId: "archive-curator",
  objective: {
    type: "collect",
    itemId: "archive-seal",
    targetCount: 1,
    consumeItems: true
  },
  targetCount: 1,
  rewardExp: 260,
  rewardGold: 165,
  chapterId: "archive",
  prerequisiteQuestIds: ["archive-guardian-core"]
};

export const STAR_MOTH_QUEST: QuestDefinition = {
  id: "star-moth-clear",
  title: "驅散星砂蛾群",
  npcId: "observatory-keeper",
  objective: {
    type: "kill",
    targetKind: "star-moth",
    targetCount: 3
  },
  targetCount: 3,
  rewardExp: 285,
  rewardGold: 185,
  chapterId: "observatory",
  prerequisiteQuestIds: ["archive-seal-report"]
};

export const LENS_CORE_QUEST: QuestDefinition = {
  id: "lens-core-sample",
  title: "收集星鏡核心",
  npcId: "observatory-keeper",
  objective: {
    type: "collect",
    itemId: "lens-core",
    targetCount: 2,
    consumeItems: true
  },
  targetCount: 2,
  rewardExp: 305,
  rewardGold: 200,
  chapterId: "observatory",
  prerequisiteQuestIds: ["star-moth-clear"]
};

export const OBSERVATORY_LENS_QUEST: QuestDefinition = {
  id: "observatory-lens-align",
  title: "校準三座觀測鏡",
  npcId: "observatory-keeper",
  objective: {
    type: "interact",
    targetId: "observatory-lens",
    targetCount: 3
  },
  targetCount: 3,
  rewardExp: 335,
  rewardGold: 215,
  chapterId: "observatory",
  prerequisiteQuestIds: ["lens-core-sample"]
};

export const ASTRAL_KEEPER_QUEST: QuestDefinition = {
  id: "astral-keeper-core",
  title: "擊退星穹守望者",
  npcId: "observatory-keeper",
  objective: {
    type: "kill",
    targetKind: "astral-keeper",
    targetCount: 1
  },
  targetCount: 1,
  rewardExp: 420,
  rewardGold: 260,
  chapterId: "observatory",
  prerequisiteQuestIds: ["observatory-lens-align"]
};

export const ASTRAL_SEAL_QUEST: QuestDefinition = {
  id: "astral-seal-report",
  title: "回收星穹封印",
  npcId: "observatory-keeper",
  objective: {
    type: "collect",
    itemId: "astral-seal",
    targetCount: 1,
    consumeItems: true
  },
  targetCount: 1,
  rewardExp: 360,
  rewardGold: 230,
  chapterId: "observatory",
  prerequisiteQuestIds: ["astral-keeper-core"]
};

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  FIELD_RAT_QUEST,
  RAT_TAIL_QUEST,
  MIST_GEL_QUEST,
  BREAKWATER_SCOUT_QUEST,
  BREAKWATER_LANTERN_QUEST,
  TIDE_WATCHER_QUEST,
  WATCHER_SHELL_QUEST,
  TIDE_GAUGE_QUEST,
  WAREHOUSE_RAT_QUEST,
  DAMP_WOOD_QUEST,
  MIST_PUPPET_QUEST,
  WAREHOUSE_SENTRY_QUEST,
  CAVERN_CRAB_QUEST,
  REEF_SPARK_QUEST,
  REEF_SEAL_QUEST,
  CORAL_WARDEN_QUEST,
  CORAL_KEY_QUEST,
  ARCHIVE_DRIFTER_QUEST,
  INK_CORE_QUEST,
  ARCHIVE_TABLET_QUEST,
  ARCHIVE_GUARDIAN_QUEST,
  ARCHIVE_SEAL_QUEST,
  STAR_MOTH_QUEST,
  LENS_CORE_QUEST,
  OBSERVATORY_LENS_QUEST,
  ASTRAL_KEEPER_QUEST,
  ASTRAL_SEAL_QUEST
];

export const FOG_HARBOR_SHOP: ShopDefinition = {
  id: "fog-harbor-goods",
  npcId: "merchant-chen",
  name: "陳老闆雜貨",
  items: [
    {
      itemId: "small-hp-potion",
      quantity: 1,
      priceGold: 15
    },
    {
      itemId: "medium-hp-potion",
      quantity: 1,
      priceGold: 38
    },
    {
      itemId: "harbor-lunchbox",
      quantity: 1,
      priceGold: 60
    },
    {
      itemId: "training-sword",
      quantity: 1,
      priceGold: 25
    },
    {
      itemId: "cloth-vest",
      quantity: 1,
      priceGold: 20
    }
  ]
};

export const SHOP_DEFINITIONS: ShopDefinition[] = [FOG_HARBOR_SHOP];

export const SKILL_DEFINITIONS: Record<SkillId, SkillDefinition> = {
  "sword-cleave": {
    id: "sword-cleave",
    name: "斬擊",
    mpCost: 9,
    cooldownMs: 1400,
    damage: 22,
    range: 82,
    verticalRange: 50
  },
  "spirit-talisman": {
    id: "spirit-talisman",
    name: "靈符",
    mpCost: 14,
    cooldownMs: 1700,
    damage: 20,
    range: 118,
    verticalRange: 58
  },
  "hunter-shot": {
    id: "hunter-shot",
    name: "狙擊",
    mpCost: 10,
    cooldownMs: 1300,
    damage: 19,
    range: 130,
    verticalRange: 48
  },
  "spirit-slash": {
    id: "spirit-slash",
    name: "靈斬",
    mpCost: 12,
    cooldownMs: 1800,
    damage: 24,
    range: 112,
    verticalRange: 62
  }
};

export const CLASS_SKILL_IDS: Record<CharacterClass, SkillId> = {
  swordsman: "sword-cleave",
  talisman: "spirit-talisman",
  hunter: "hunter-shot"
};

export const FOG_HARBOR_TEST_MAP: GameMapData = {
  id: "fog-harbor-test",
  name: "霧港試煉場",
  width: 2400,
  height: 540,
  playerSpawn: {
    x: 280,
    y: 430
  },
  safeZones: [
    {
      id: "fog-harbor-gate",
      name: "安全區",
      x: 215,
      y: 410,
      width: 430,
      height: 190
    },
    {
      id: "lighthouse-camp",
      name: "燈塔營地",
      x: 1510,
      y: 410,
      width: 300,
      height: 190
    }
  ],
  npcs: [
    {
      id: "fog-harbor-guard",
      name: "港口守衛",
      x: 350,
      y: 466,
      interactionRadius: 72
    },
    {
      id: "herbalist-lin",
      name: "藥師阿霖",
      x: 185,
      y: 466,
      interactionRadius: 72
    },
    {
      id: "merchant-chen",
      name: "陳老闆",
      x: 265,
      y: 466,
      interactionRadius: 72
    },
    {
      id: "lighthouse-apprentice",
      name: "燈塔學徒阿澄",
      x: 1510,
      y: 466,
      interactionRadius: 76
    }
  ],
  portals: [
    {
      id: "to-breakwater",
      name: "前往海霧堤道",
      x: 2285,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "mist-breakwater",
      targetX: 145,
      targetY: 430
    },
    {
      id: "to-old-warehouse",
      name: "前往舊港倉庫",
      x: 1385,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "old-harbor-warehouse",
      targetX: 145,
      targetY: 430
    }
  ],
  interactables: [],
  platforms: [
    { id: "ground", x: 1200, y: 506, width: 2400, height: 30 },
    { id: "step-1", x: 465, y: 430, width: 220, height: 24 },
    { id: "step-2", x: 690, y: 365, width: 220, height: 24 },
    { id: "step-3", x: 920, y: 300, width: 220, height: 24 },
    { id: "step-4", x: 1180, y: 405, width: 250, height: 24 },
    { id: "tide-step-1", x: 1585, y: 390, width: 240, height: 24 },
    { id: "tide-step-2", x: 1815, y: 330, width: 210, height: 24 },
    { id: "lighthouse-step", x: 2135, y: 420, width: 260, height: 24 }
  ],
  monsterSpawns: [
    {
      id: "rat-1",
      kind: "field-rat",
      mapId: "fog-harbor-test",
      name: "田鼠",
      x: 610,
      y: 475,
      maxHp: 36,
      respawnMs: 3500,
      expReward: 18,
      patrolMinX: 560,
      patrolMaxX: 700,
      patrolSpeed: 26
    },
    {
      id: "rat-2",
      kind: "field-rat",
      mapId: "fog-harbor-test",
      name: "田鼠",
      x: 785,
      y: 475,
      maxHp: 36,
      respawnMs: 3500,
      expReward: 18,
      patrolMinX: 735,
      patrolMaxX: 870,
      patrolSpeed: 24
    },
    {
      id: "rat-3",
      kind: "field-rat",
      mapId: "fog-harbor-test",
      name: "田鼠",
      x: 1160,
      y: 374,
      maxHp: 36,
      respawnMs: 3500,
      expReward: 22,
      patrolMinX: 1065,
      patrolMaxX: 1265,
      patrolSpeed: 22
    },
    {
      id: "slime-1",
      kind: "mist-slime",
      mapId: "fog-harbor-test",
      name: "海霧凝膠",
      x: 1700,
      y: 475,
      maxHp: 52,
      respawnMs: 4500,
      expReward: 26,
      patrolMinX: 1625,
      patrolMaxX: 1785,
      patrolSpeed: 18
    },
    {
      id: "slime-2",
      kind: "mist-slime",
      mapId: "fog-harbor-test",
      name: "海霧凝膠",
      x: 1970,
      y: 475,
      maxHp: 52,
      respawnMs: 4500,
      expReward: 26,
      patrolMinX: 1885,
      patrolMaxX: 2075,
      patrolSpeed: 20
    },
    {
      id: "slime-3",
      kind: "mist-slime",
      mapId: "fog-harbor-test",
      name: "海霧凝膠",
      x: 2185,
      y: 389,
      maxHp: 60,
      respawnMs: 5200,
      expReward: 32,
      patrolMinX: 2075,
      patrolMaxX: 2260,
      patrolSpeed: 16
    }
  ]
};

export const MIST_BREAKWATER_MAP: GameMapData = {
  id: "mist-breakwater",
  name: "海霧堤道",
  width: 1800,
  height: 540,
  playerSpawn: {
    x: 145,
    y: 430
  },
  safeZones: [
    {
      id: "breakwater-entry",
      name: "堤道入口",
      x: 160,
      y: 420,
      width: 280,
      height: 180
    }
  ],
  npcs: [
    {
      id: "breakwater-scout",
      name: "巡堤守衛阿岳",
      x: 190,
      y: 466,
      interactionRadius: 80
    },
    {
      id: "tide-researcher-yu",
      name: "測潮學徒阿澄",
      x: 1320,
      y: 466,
      interactionRadius: 78
    }
  ],
  portals: [
    {
      id: "to-fog-harbor",
      name: "返回霧港",
      x: 70,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "fog-harbor-test",
      targetX: 2220,
      targetY: 430
    }
  ],
  interactables: [
    {
      id: "lantern-west",
      targetId: "breakwater-lantern",
      kind: "lantern",
      name: "西側霧堤燈",
      prompt: "E 修復霧堤燈",
      x: 515,
      y: 438,
      interactionRadius: 74
    },
    {
      id: "lantern-mid",
      targetId: "breakwater-lantern",
      kind: "lantern",
      name: "中央霧堤燈",
      prompt: "E 修復霧堤燈",
      x: 900,
      y: 438,
      interactionRadius: 74
    },
    {
      id: "lantern-east",
      targetId: "breakwater-lantern",
      kind: "lantern",
      name: "東側霧堤燈",
      prompt: "E 修復霧堤燈",
      x: 1270,
      y: 438,
      interactionRadius: 74
    },
    {
      id: "tide-gauge-main",
      targetId: "tide-gauge",
      kind: "tide-gauge",
      name: "霧堤潮位尺",
      prompt: "E 調查潮位尺",
      x: 1360,
      y: 448,
      interactionRadius: 82
    }
  ],
  platforms: [
    { id: "ground", x: 900, y: 506, width: 1800, height: 30 },
    { id: "breakwater-step-1", x: 430, y: 430, width: 260, height: 24 },
    { id: "breakwater-step-2", x: 720, y: 370, width: 230, height: 24 },
    { id: "breakwater-step-3", x: 1010, y: 420, width: 240, height: 24 },
    { id: "breakwater-step-4", x: 1320, y: 350, width: 260, height: 24 },
    { id: "watcher-platform", x: 1580, y: 430, width: 280, height: 24 }
  ],
  monsterSpawns: [
    {
      id: "breakwater-slime-1",
      kind: "mist-slime",
      mapId: "mist-breakwater",
      name: "海霧凝膠",
      x: 520,
      y: 475,
      maxHp: 58,
      respawnMs: 4300,
      expReward: 30,
      patrolMinX: 430,
      patrolMaxX: 630,
      patrolSpeed: 20
    },
    {
      id: "breakwater-slime-2",
      kind: "mist-slime",
      mapId: "mist-breakwater",
      name: "海霧凝膠",
      x: 870,
      y: 475,
      maxHp: 58,
      respawnMs: 4300,
      expReward: 30,
      patrolMinX: 760,
      patrolMaxX: 980,
      patrolSpeed: 20
    },
    {
      id: "breakwater-slime-3",
      kind: "mist-slime",
      mapId: "mist-breakwater",
      name: "海霧凝膠",
      x: 1240,
      y: 475,
      maxHp: 62,
      respawnMs: 4800,
      expReward: 34,
      patrolMinX: 1125,
      patrolMaxX: 1365,
      patrolSpeed: 18
    },
    {
      id: "tide-watcher-1",
      kind: "tide-watcher",
      mapId: "mist-breakwater",
      name: "潮眼守衛",
      x: 1585,
      y: 399,
      maxHp: 150,
      respawnMs: 12000,
      expReward: 95,
      patrolMinX: 1470,
      patrolMaxX: 1685,
      patrolSpeed: 14
    }
  ]
};

export const OLD_HARBOR_WAREHOUSE_MAP: GameMapData = {
  id: "old-harbor-warehouse",
  name: "舊港倉庫",
  width: 2200,
  height: 540,
  playerSpawn: {
    x: 145,
    y: 430
  },
  safeZones: [
    {
      id: "warehouse-entry",
      name: "倉庫入口",
      x: 155,
      y: 420,
      width: 280,
      height: 180
    }
  ],
  npcs: [
    {
      id: "warehouse-keeper",
      name: "倉庫管理員阿桂",
      x: 220,
      y: 466,
      interactionRadius: 82
    }
  ],
  portals: [
    {
      id: "to-fog-harbor",
      name: "返回霧港",
      x: 70,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "fog-harbor-test",
      targetX: 1325,
      targetY: 430
    },
    {
      id: "to-coral-cavern",
      name: "前往珊瑚潮洞",
      x: 2110,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "coral-tide-cavern",
      targetX: 145,
      targetY: 430
    }
  ],
  interactables: [],
  platforms: [
    { id: "ground", x: 1100, y: 506, width: 2200, height: 30 },
    { id: "crate-step-1", x: 460, y: 432, width: 220, height: 24 },
    { id: "crate-step-2", x: 700, y: 370, width: 220, height: 24 },
    { id: "loft-1", x: 980, y: 315, width: 300, height: 24 },
    { id: "loft-2", x: 1310, y: 382, width: 280, height: 24 },
    { id: "sentry-platform", x: 1740, y: 430, width: 310, height: 24 },
    { id: "rear-loft", x: 1990, y: 330, width: 260, height: 24 }
  ],
  monsterSpawns: [
    {
      id: "warehouse-rat-1",
      kind: "warehouse-rat",
      mapId: "old-harbor-warehouse",
      name: "倉鼠",
      x: 520,
      y: 475,
      maxHp: 48,
      respawnMs: 3800,
      expReward: 24,
      patrolMinX: 430,
      patrolMaxX: 620,
      patrolSpeed: 28
    },
    {
      id: "warehouse-rat-2",
      kind: "warehouse-rat",
      mapId: "old-harbor-warehouse",
      name: "倉鼠",
      x: 760,
      y: 475,
      maxHp: 48,
      respawnMs: 3800,
      expReward: 24,
      patrolMinX: 690,
      patrolMaxX: 850,
      patrolSpeed: 26
    },
    {
      id: "warehouse-rat-3",
      kind: "warehouse-rat",
      mapId: "old-harbor-warehouse",
      name: "倉鼠",
      x: 1040,
      y: 284,
      maxHp: 52,
      respawnMs: 4200,
      expReward: 28,
      patrolMinX: 910,
      patrolMaxX: 1110,
      patrolSpeed: 24
    },
    {
      id: "mist-puppet-1",
      kind: "mist-puppet",
      mapId: "old-harbor-warehouse",
      name: "霧化木偶",
      x: 1220,
      y: 475,
      maxHp: 82,
      respawnMs: 5600,
      expReward: 42,
      patrolMinX: 1120,
      patrolMaxX: 1370,
      patrolSpeed: 17
    },
    {
      id: "mist-puppet-2",
      kind: "mist-puppet",
      mapId: "old-harbor-warehouse",
      name: "霧化木偶",
      x: 1500,
      y: 475,
      maxHp: 82,
      respawnMs: 5600,
      expReward: 42,
      patrolMinX: 1400,
      patrolMaxX: 1600,
      patrolSpeed: 17
    },
    {
      id: "warehouse-sentry-1",
      kind: "warehouse-sentry",
      mapId: "old-harbor-warehouse",
      name: "倉庫巡弋者",
      x: 1760,
      y: 399,
      maxHp: 190,
      respawnMs: 14000,
      expReward: 120,
      patrolMinX: 1640,
      patrolMaxX: 1880,
      patrolSpeed: 13
    }
  ]
};

export const CORAL_TIDE_CAVERN_MAP: GameMapData = {
  id: "coral-tide-cavern",
  name: "珊瑚潮洞",
  width: 2400,
  height: 560,
  playerSpawn: {
    x: 145,
    y: 430
  },
  safeZones: [
    {
      id: "cavern-entry",
      name: "潮洞入口",
      x: 155,
      y: 420,
      width: 300,
      height: 180
    }
  ],
  npcs: [
    {
      id: "cavern-scholar",
      name: "潮洞學者阿璇",
      x: 235,
      y: 466,
      interactionRadius: 84
    }
  ],
  portals: [
    {
      id: "to-old-warehouse",
      name: "返回舊港倉庫",
      x: 70,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "old-harbor-warehouse",
      targetX: 2040,
      targetY: 430
    },
    {
      id: "to-sunken-archive",
      name: "前往沉船書庫",
      x: 2320,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "sunken-archive",
      targetX: 145,
      targetY: 430
    }
  ],
  interactables: [
    {
      id: "reef-seal-west",
      targetId: "reef-seal",
      kind: "seal",
      name: "西側潮封印",
      prompt: "E 啟動潮封印",
      x: 720,
      y: 438,
      interactionRadius: 78
    },
    {
      id: "reef-seal-mid",
      targetId: "reef-seal",
      kind: "seal",
      name: "中央潮封印",
      prompt: "E 啟動潮封印",
      x: 1240,
      y: 382,
      interactionRadius: 78
    },
    {
      id: "reef-seal-east",
      targetId: "reef-seal",
      kind: "seal",
      name: "深處潮封印",
      prompt: "E 啟動潮封印",
      x: 1760,
      y: 438,
      interactionRadius: 78
    }
  ],
  platforms: [
    { id: "ground", x: 1200, y: 506, width: 2400, height: 30 },
    { id: "cavern-step-1", x: 510, y: 430, width: 240, height: 24 },
    { id: "cavern-step-2", x: 790, y: 368, width: 240, height: 24 },
    { id: "cavern-step-3", x: 1110, y: 420, width: 260, height: 24 },
    { id: "seal-platform", x: 1240, y: 374, width: 280, height: 24 },
    { id: "reef-bridge", x: 1535, y: 430, width: 300, height: 24 },
    { id: "warden-platform", x: 2020, y: 430, width: 340, height: 24 }
  ],
  monsterSpawns: [
    {
      id: "cave-crab-1",
      kind: "cave-crab",
      mapId: "coral-tide-cavern",
      name: "潮洞蟹",
      x: 545,
      y: 475,
      maxHp: 68,
      respawnMs: 4300,
      expReward: 34,
      patrolMinX: 450,
      patrolMaxX: 660,
      patrolSpeed: 22
    },
    {
      id: "cave-crab-2",
      kind: "cave-crab",
      mapId: "coral-tide-cavern",
      name: "潮洞蟹",
      x: 845,
      y: 337,
      maxHp: 72,
      respawnMs: 4500,
      expReward: 36,
      patrolMinX: 730,
      patrolMaxX: 930,
      patrolSpeed: 20
    },
    {
      id: "cave-crab-3",
      kind: "cave-crab",
      mapId: "coral-tide-cavern",
      name: "潮洞蟹",
      x: 1125,
      y: 475,
      maxHp: 72,
      respawnMs: 4500,
      expReward: 36,
      patrolMinX: 1010,
      patrolMaxX: 1230,
      patrolSpeed: 20
    },
    {
      id: "reef-wisp-1",
      kind: "reef-wisp",
      mapId: "coral-tide-cavern",
      name: "礁光幽影",
      x: 1390,
      y: 475,
      maxHp: 88,
      respawnMs: 5600,
      expReward: 48,
      patrolMinX: 1280,
      patrolMaxX: 1510,
      patrolSpeed: 18
    },
    {
      id: "reef-wisp-2",
      kind: "reef-wisp",
      mapId: "coral-tide-cavern",
      name: "礁光幽影",
      x: 1660,
      y: 475,
      maxHp: 92,
      respawnMs: 5800,
      expReward: 50,
      patrolMinX: 1540,
      patrolMaxX: 1780,
      patrolSpeed: 18
    },
    {
      id: "coral-warden-1",
      kind: "coral-warden",
      mapId: "coral-tide-cavern",
      name: "珊瑚守望者",
      x: 2030,
      y: 399,
      maxHp: 260,
      respawnMs: 16000,
      expReward: 180,
      patrolMinX: 1890,
      patrolMaxX: 2170,
      patrolSpeed: 12
    }
  ]
};

export const SUNKEN_ARCHIVE_MAP: GameMapData = {
  id: "sunken-archive",
  name: "沉船書庫",
  width: 2600,
  height: 560,
  playerSpawn: {
    x: 145,
    y: 430
  },
  safeZones: [
    {
      id: "archive-entry",
      name: "書庫入口",
      x: 160,
      y: 420,
      width: 320,
      height: 180
    }
  ],
  npcs: [
    {
      id: "archive-curator",
      name: "書庫管理員阿澈",
      x: 250,
      y: 466,
      interactionRadius: 84
    }
  ],
  portals: [
    {
      id: "to-coral-cavern",
      name: "返回珊瑚潮洞",
      x: 70,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "coral-tide-cavern",
      targetX: 2260,
      targetY: 430
    },
    {
      id: "to-starlit-observatory",
      name: "前往星砂觀測台",
      x: 2520,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "starlit-observatory",
      targetX: 145,
      targetY: 430
    }
  ],
  interactables: [
    {
      id: "archive-tablet-west",
      targetId: "archive-tablet",
      kind: "tablet",
      name: "西側書庫碑",
      prompt: "E 校準書庫碑",
      x: 780,
      y: 438,
      interactionRadius: 78
    },
    {
      id: "archive-tablet-mid",
      targetId: "archive-tablet",
      kind: "tablet",
      name: "中央書庫碑",
      prompt: "E 校準書庫碑",
      x: 1360,
      y: 382,
      interactionRadius: 78
    },
    {
      id: "archive-tablet-east",
      targetId: "archive-tablet",
      kind: "tablet",
      name: "深處書庫碑",
      prompt: "E 校準書庫碑",
      x: 1900,
      y: 438,
      interactionRadius: 78
    }
  ],
  platforms: [
    { id: "ground", x: 1300, y: 506, width: 2600, height: 30 },
    { id: "archive-step-1", x: 560, y: 430, width: 250, height: 24 },
    { id: "archive-step-2", x: 850, y: 365, width: 250, height: 24 },
    { id: "archive-step-3", x: 1160, y: 420, width: 280, height: 24 },
    { id: "tablet-platform", x: 1360, y: 374, width: 300, height: 24 },
    { id: "ink-bridge", x: 1660, y: 430, width: 320, height: 24 },
    { id: "guardian-platform", x: 2220, y: 430, width: 360, height: 24 }
  ],
  monsterSpawns: [
    {
      id: "archive-drifter-1",
      kind: "archive-drifter",
      mapId: "sunken-archive",
      name: "沉船漂書",
      x: 560,
      y: 475,
      maxHp: 88,
      respawnMs: 4600,
      expReward: 46,
      patrolMinX: 460,
      patrolMaxX: 680,
      patrolSpeed: 19
    },
    {
      id: "archive-drifter-2",
      kind: "archive-drifter",
      mapId: "sunken-archive",
      name: "沉船漂書",
      x: 870,
      y: 334,
      maxHp: 92,
      respawnMs: 4800,
      expReward: 48,
      patrolMinX: 760,
      patrolMaxX: 980,
      patrolSpeed: 18
    },
    {
      id: "archive-drifter-3",
      kind: "archive-drifter",
      mapId: "sunken-archive",
      name: "沉船漂書",
      x: 1180,
      y: 475,
      maxHp: 92,
      respawnMs: 4800,
      expReward: 48,
      patrolMinX: 1060,
      patrolMaxX: 1300,
      patrolSpeed: 18
    },
    {
      id: "ink-sprite-1",
      kind: "ink-sprite",
      mapId: "sunken-archive",
      name: "墨潮精靈",
      x: 1500,
      y: 475,
      maxHp: 108,
      respawnMs: 6200,
      expReward: 58,
      patrolMinX: 1380,
      patrolMaxX: 1620,
      patrolSpeed: 17
    },
    {
      id: "ink-sprite-2",
      kind: "ink-sprite",
      mapId: "sunken-archive",
      name: "墨潮精靈",
      x: 1810,
      y: 475,
      maxHp: 112,
      respawnMs: 6400,
      expReward: 60,
      patrolMinX: 1680,
      patrolMaxX: 1940,
      patrolSpeed: 16
    },
    {
      id: "archive-guardian-1",
      kind: "archive-guardian",
      mapId: "sunken-archive",
      name: "書庫守衛",
      x: 2240,
      y: 399,
      maxHp: 340,
      respawnMs: 18000,
      expReward: 230,
      patrolMinX: 2080,
      patrolMaxX: 2380,
      patrolSpeed: 11
    }
  ]
};

export const STARLIT_OBSERVATORY_MAP: GameMapData = {
  id: "starlit-observatory",
  name: "星砂觀測台",
  width: 2800,
  height: 560,
  playerSpawn: {
    x: 145,
    y: 430
  },
  safeZones: [
    {
      id: "observatory-entry",
      name: "觀測台入口",
      x: 160,
      y: 420,
      width: 320,
      height: 180
    }
  ],
  npcs: [
    {
      id: "observatory-keeper",
      name: "觀測員阿曜",
      x: 250,
      y: 466,
      interactionRadius: 84
    }
  ],
  portals: [
    {
      id: "to-sunken-archive",
      name: "返回沉船書庫",
      x: 70,
      y: 455,
      width: 96,
      height: 100,
      targetMapId: "sunken-archive",
      targetX: 2460,
      targetY: 430
    }
  ],
  interactables: [
    {
      id: "observatory-lens-west",
      targetId: "observatory-lens",
      kind: "lens",
      name: "西側觀測鏡",
      prompt: "E 校準觀測鏡",
      x: 820,
      y: 438,
      interactionRadius: 78
    },
    {
      id: "observatory-lens-mid",
      targetId: "observatory-lens",
      kind: "lens",
      name: "中央觀測鏡",
      prompt: "E 校準觀測鏡",
      x: 1480,
      y: 382,
      interactionRadius: 78
    },
    {
      id: "observatory-lens-east",
      targetId: "observatory-lens",
      kind: "lens",
      name: "深處觀測鏡",
      prompt: "E 校準觀測鏡",
      x: 2100,
      y: 438,
      interactionRadius: 78
    }
  ],
  platforms: [
    { id: "ground", x: 1400, y: 506, width: 2800, height: 30 },
    { id: "observatory-step-1", x: 600, y: 430, width: 260, height: 24 },
    { id: "observatory-step-2", x: 920, y: 365, width: 260, height: 24 },
    { id: "observatory-step-3", x: 1240, y: 420, width: 280, height: 24 },
    { id: "lens-platform", x: 1480, y: 374, width: 320, height: 24 },
    { id: "star-bridge", x: 1840, y: 430, width: 340, height: 24 },
    { id: "keeper-platform", x: 2380, y: 430, width: 380, height: 24 }
  ],
  monsterSpawns: [
    {
      id: "star-moth-1",
      kind: "star-moth",
      mapId: "starlit-observatory",
      name: "星砂蛾",
      x: 600,
      y: 475,
      maxHp: 96,
      respawnMs: 5000,
      expReward: 58,
      patrolMinX: 500,
      patrolMaxX: 720,
      patrolSpeed: 18
    },
    {
      id: "star-moth-2",
      kind: "star-moth",
      mapId: "starlit-observatory",
      name: "星砂蛾",
      x: 940,
      y: 334,
      maxHp: 100,
      respawnMs: 5200,
      expReward: 60,
      patrolMinX: 820,
      patrolMaxX: 1060,
      patrolSpeed: 17
    },
    {
      id: "star-moth-3",
      kind: "star-moth",
      mapId: "starlit-observatory",
      name: "星砂蛾",
      x: 1260,
      y: 475,
      maxHp: 100,
      respawnMs: 5200,
      expReward: 60,
      patrolMinX: 1120,
      patrolMaxX: 1390,
      patrolSpeed: 17
    },
    {
      id: "lens-sentinel-1",
      kind: "lens-sentinel",
      mapId: "starlit-observatory",
      name: "星鏡哨兵",
      x: 1640,
      y: 475,
      maxHp: 124,
      respawnMs: 6800,
      expReward: 72,
      patrolMinX: 1500,
      patrolMaxX: 1770,
      patrolSpeed: 15
    },
    {
      id: "lens-sentinel-2",
      kind: "lens-sentinel",
      mapId: "starlit-observatory",
      name: "星鏡哨兵",
      x: 1980,
      y: 475,
      maxHp: 128,
      respawnMs: 7000,
      expReward: 75,
      patrolMinX: 1840,
      patrolMaxX: 2120,
      patrolSpeed: 15
    },
    {
      id: "astral-keeper-1",
      kind: "astral-keeper",
      mapId: "starlit-observatory",
      name: "星穹守望者",
      x: 2400,
      y: 399,
      maxHp: 400,
      respawnMs: 20000,
      expReward: 300,
      patrolMinX: 2240,
      patrolMaxX: 2580,
      patrolSpeed: 10
    }
  ]
};

export const GAME_MAPS: Record<MapId, GameMapData> = {
  "fog-harbor-test": FOG_HARBOR_TEST_MAP,
  "mist-breakwater": MIST_BREAKWATER_MAP,
  "old-harbor-warehouse": OLD_HARBOR_WAREHOUSE_MAP,
  "coral-tide-cavern": CORAL_TIDE_CAVERN_MAP,
  "sunken-archive": SUNKEN_ARCHIVE_MAP,
  "starlit-observatory": STARLIT_OBSERVATORY_MAP
};

export const DEFAULT_GAME_MAP = FOG_HARBOR_TEST_MAP;

export function getGameMap(mapId: MapId | string | undefined) {
  return GAME_MAPS[(mapId as MapId) ?? DEFAULT_GAME_MAP.id] ?? DEFAULT_GAME_MAP;
}

export type PlayerUpdatePayload = Pick<
  PlayerSnapshot,
  "id" | "name" | "className" | "mapId" | "x" | "y" | "facing" | "animation"
>;

export type ClientMessage =
  | {
      type: "player:update";
      player: PlayerUpdatePayload;
    }
  | {
      type: "combat:attack";
      attackId: string;
      isSkill: boolean;
      skillId?: SkillId;
    }
  | {
      type: "item:pickup";
      dropId: string;
    }
  | {
      type: "inventory:use";
      itemId: ItemId;
    }
  | {
      type: "inventory:equip";
      itemId: ItemId;
    }
  | {
      type: "shop:buy";
      npcId: string;
      itemId: ItemId;
      quantity: number;
    }
  | {
      type: "npc:interact";
      npcId: string;
    }
  | {
      type: "map:interact";
      interactableId: string;
    }
  | {
      type: "portal:enter";
      portalId: string;
    }
  | {
      type: "player:return-safe";
    }
  | {
      type: "chat:send";
      text: string;
    };

export type ServerMessage =
  | {
      type: "session:welcome";
      playerId: string;
      saveSlot?: string;
      authenticated?: boolean;
      mapId?: MapId;
    }
  | {
      type: "world:snapshot";
      mapId: MapId;
      players: PlayerSnapshot[];
      monsters: MonsterSnapshot[];
      itemDrops: ItemDropSnapshot[];
    }
  | {
      type: "map:change";
      playerId: string;
      mapId: MapId;
      x: number;
      y: number;
      map: GameMapData;
    }
  | {
      type: "inventory:update";
      playerId: string;
      slots: InventorySlot[];
    }
  | {
      type: "equipment:update";
      playerId: string;
      equipment: EquipmentSnapshot;
      attack: number;
      defense: number;
    }
  | {
      type: "item:notice";
      playerId: string;
      text: string;
      itemId?: ItemId;
      quantity?: number;
      healed?: number;
    }
  | {
      type: "quest:update";
      playerId: string;
      quest: QuestSnapshot;
    }
  | {
      type: "quest:notice";
      playerId: string;
      text: string;
      rewardExp?: number;
      rewardGold?: number;
    }
  | {
      type: "shop:open";
      playerId: string;
      npcId: string;
      shop: ShopDefinition;
    }
  | {
      type: "shop:notice";
      playerId: string;
      text: string;
      itemId?: ItemId;
      quantity?: number;
      priceGold?: number;
    }
  | {
      type: "combat:hit";
      playerId: string;
      monsterId: string;
      damage: number;
      remainingHp: number;
      defeated: boolean;
      expGained: number;
      isSkill: boolean;
      skillId?: SkillId;
    }
  | {
      type: "combat:miss";
      playerId: string;
      isSkill: boolean;
      skillId?: SkillId;
    }
  | {
      type: "skill:notice";
      playerId: string;
      skillId: SkillId;
      text: string;
      mp: number;
      cooldownRemainingMs?: number;
    }
  | {
      type: "player:damaged";
      playerId: string;
      damage: number;
      hp: number;
      defeated: boolean;
    }
  | {
      type: "player:respawn";
      playerId: string;
      mapId?: MapId;
      x: number;
      y: number;
    }
  | {
      type: "player:level-up";
      playerId: string;
      level: number;
    }
  | {
      type: "player:left";
      playerId: string;
    }
  | {
      type: "chat:message";
      playerId: string;
      text: string;
      sentAt: number;
    }
  | {
      type: "chat:notice";
      playerId: string;
      text: string;
    }
  | {
      type: "admin:notice";
      text: string;
      sentAt: number;
      category?: string;
      expiresAt?: number;
    };
