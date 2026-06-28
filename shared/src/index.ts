export type CharacterClass = "swordsman" | "talisman" | "hunter";

export type Facing = "left" | "right";

export type PlayerAnimation = "idle" | "run" | "jump" | "attack" | "skill";

export type SkillId = "sword-cleave" | "spirit-talisman" | "hunter-shot" | "spirit-slash";

export type EquipmentSlot = "weapon" | "armor";

export type MapId = "fog-harbor-test" | "mist-breakwater" | "old-harbor-warehouse";

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

export type MonsterKind = "field-rat" | "mist-slime" | "tide-watcher" | "warehouse-rat" | "mist-puppet" | "warehouse-sentry";

export const MONSTER_KIND_NAMES: Record<MonsterKind, string> = {
  "field-rat": "田鼠",
  "mist-slime": "海霧凝膠",
  "tide-watcher": "潮眼守衛",
  "warehouse-rat": "倉鼠",
  "mist-puppet": "霧化木偶",
  "warehouse-sentry": "倉庫巡弋者"
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
  | "rat-tail"
  | "mist-gel"
  | "watcher-shell"
  | "warehouse-cloth"
  | "damp-wood"
  | "training-sword"
  | "cloth-vest"
  | "harbor-dagger"
  | "patched-jacket"
  | "warehouse-talisman";

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

export type MapInteractableKind = "lantern" | "tide-gauge";

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
  rewardGold: 25
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
  rewardGold: 20
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
  rewardGold: 30
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
  rewardGold: 40
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
  rewardGold: 80
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
  rewardGold: 45
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
  rewardGold: 65
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
  rewardGold: 35
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
  rewardGold: 55
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
  rewardGold: 60
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
  rewardGold: 70
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
  rewardGold: 95
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
  WAREHOUSE_SENTRY_QUEST
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

export const GAME_MAPS: Record<MapId, GameMapData> = {
  "fog-harbor-test": FOG_HARBOR_TEST_MAP,
  "mist-breakwater": MIST_BREAKWATER_MAP,
  "old-harbor-warehouse": OLD_HARBOR_WAREHOUSE_MAP
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
