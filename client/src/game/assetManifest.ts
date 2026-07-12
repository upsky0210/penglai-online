import type { MapId, MapInteractableKind, MonsterKind, PlayerAnimation } from "@penglai/shared";

export interface SpriteSheetAsset {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
  repeat: number;
  animationKey: string;
  enabled: boolean;
}

export interface ImageAsset {
  key: string;
  path: string;
  enabled: boolean;
}

export interface MapBackgroundLayer {
  key: string;
  y: number;
  height: number;
  scrollFactor: number;
  alpha?: number;
  depth: number;
  fitTextureHeight?: boolean;
}

const externalSpritesEnabled = true;
const externalMapArtEnabled = true;

export const playerAnimationTextureKeys: Record<PlayerAnimation, string> = {
  idle: "player_idle",
  run: "player_run",
  jump: "player_jump",
  attack: "player_attack",
  skill: "player_skill_slash"
};

export const playerAnimationKeys: Record<PlayerAnimation, string> = {
  idle: "anim_player_idle",
  run: "anim_player_run",
  jump: "anim_player_jump",
  attack: "anim_player_attack",
  skill: "anim_player_skill_slash"
};

export const monsterTextureKeys: Record<MonsterKind, string> = {
  "field-rat": "monster_field_rat",
  "mist-slime": "monster_mist_slime",
  "tide-watcher": "monster_tide_watcher",
  "warehouse-rat": "monster_warehouse_rat",
  "mist-puppet": "monster_mist_puppet",
  "warehouse-sentry": "monster_warehouse_sentry",
  "cave-crab": "monster_cave_crab",
  "reef-wisp": "monster_reef_wisp",
  "coral-warden": "monster_coral_warden",
  "archive-drifter": "monster_archive_drifter",
  "ink-sprite": "monster_ink_sprite",
  "archive-guardian": "monster_archive_guardian",
  "star-moth": "monster_star_moth",
  "lens-sentinel": "monster_lens_sentinel",
  "astral-keeper": "monster_astral_keeper"
};

export const monsterAnimationKeys: Record<MonsterKind, string> = {
  "field-rat": "anim_monster_field_rat_idle",
  "mist-slime": "anim_monster_mist_slime_idle",
  "tide-watcher": "anim_monster_tide_watcher_idle",
  "warehouse-rat": "anim_monster_warehouse_rat_idle",
  "mist-puppet": "anim_monster_mist_puppet_idle",
  "warehouse-sentry": "anim_monster_warehouse_sentry_idle",
  "cave-crab": "anim_monster_cave_crab_idle",
  "reef-wisp": "anim_monster_reef_wisp_idle",
  "coral-warden": "anim_monster_coral_warden_idle",
  "archive-drifter": "anim_monster_archive_drifter_idle",
  "ink-sprite": "anim_monster_ink_sprite_idle",
  "archive-guardian": "anim_monster_archive_guardian_idle",
  "star-moth": "anim_monster_star_moth_idle",
  "lens-sentinel": "anim_monster_lens_sentinel_idle",
  "astral-keeper": "anim_monster_astral_keeper_idle"
};

export const platformTextureKeys: Record<MapId, string> = {
  "fog-harbor-test": "tile_platform_stone",
  "mist-breakwater": "tile_platform_dock",
  "old-harbor-warehouse": "tile_platform_wood",
  "coral-tide-cavern": "tile_platform_dock",
  "sunken-archive": "tile_platform_roof",
  "starlit-observatory": "tile_platform_mountain"
};
export const mistOverlayTextureKey = "effect_mist_overlay";
export const anpingHarborClerkTextureKey = "npc_anping_harbor_clerk";
export const anpingHarborClerkAnimationKey = "anim_npc_anping_harbor_clerk_idle";
export const anpingCargoChestTextureKey = "prop_anping_cargo_chest";
export const basicInkSlashTextureKey = "effect_basic_ink_slash";
export const basicInkSlashAnimationKey = "anim_effect_basic_ink_slash";

export const scenePropTextureKeys = {
  cargoCrates: "prop_cargo_crates",
  burlapSacks: "prop_burlap_sacks",
  teaChestStack: "prop_tea_chest_stack",
  timberStack: "prop_timber_stack",
  bambooSieves: "prop_bamboo_sieves",
  ledgerManifest: "prop_ledger_manifest",
  teaDryingRack: "prop_tea_drying_rack",
  camphorStill: "prop_camphor_still"
} as const;

export const itemDropTextureKeys = {
  potion: "item_drop_potion", lunchbox: "item_drop_lunchbox", ratTail: "item_drop_rat_tail",
  mistGel: "item_drop_mist_gel", shell: "item_drop_shell", monsterCloth: "item_drop_monster_cloth",
  dampWood: "item_drop_damp_wood", reefSpark: "item_drop_reef_spark", questKey: "item_drop_quest_key",
  magicCore: "item_drop_magic_core", questSeal: "item_drop_quest_seal", equipment: "item_drop_equipment"
} as const;

export const interactableTextureKeys: Record<MapInteractableKind, string> = {
  lantern: "interactable_breakwater_lantern",
  "tide-gauge": "interactable_tide_gauge",
  seal: "interactable_tea_seal",
  tablet: "interactable_timber_tablet",
  lens: "interactable_camphor_lens"
};

export const skillEffectAssets = {
  "sword-cleave": { textureKey: "effect_sword_cleave", animationKey: "anim_effect_sword_cleave" },
  "spirit-talisman": { textureKey: "effect_spirit_talisman", animationKey: "anim_effect_spirit_talisman" },
  "hunter-shot": { textureKey: "effect_hunter_shot", animationKey: "anim_effect_hunter_shot" },
  impact: { textureKey: "effect_skill_impact", animationKey: "anim_effect_skill_impact" }
} as const;

export interface NpcVisualAsset {
  textureKey: string;
  animationKey: string;
}

export const npcVisualAssets: Record<string, NpcVisualAsset> = {
  "fog-harbor-guard": { textureKey: anpingHarborClerkTextureKey, animationKey: anpingHarborClerkAnimationKey },
  "herbalist-lin": { textureKey: "npc_herbalist_lin", animationKey: "anim_npc_herbalist_lin_idle" },
  "merchant-chen": { textureKey: "npc_merchant_chen", animationKey: "anim_npc_merchant_chen_idle" },
  "lighthouse-apprentice": { textureKey: "npc_lighthouse_apprentice", animationKey: "anim_npc_lighthouse_apprentice_idle" },
  "breakwater-scout": { textureKey: "npc_breakwater_scout", animationKey: "anim_npc_breakwater_scout_idle" },
  "tide-researcher-yu": { textureKey: "npc_tide_researcher_yu", animationKey: "anim_npc_tide_researcher_yu_idle" },
  "warehouse-keeper": { textureKey: "npc_warehouse_keeper", animationKey: "anim_npc_warehouse_keeper_idle" },
  "cavern-scholar": { textureKey: "npc_cavern_scholar", animationKey: "anim_npc_cavern_scholar_idle" },
  "archive-curator": { textureKey: "npc_archive_curator", animationKey: "anim_npc_archive_curator_idle" },
  "observatory-keeper": { textureKey: "npc_observatory_keeper", animationKey: "anim_npc_observatory_keeper_idle" }
};

const p8MonsterFrames: Partial<Record<MonsterKind, [number, number]>> = {
  "mist-slime": [64, 48], "tide-watcher": [96, 80], "warehouse-rat": [64, 48],
  "mist-puppet": [80, 80], "warehouse-sentry": [128, 96], "cave-crab": [80, 64],
  "reef-wisp": [64, 64], "coral-warden": [128, 96], "archive-drifter": [80, 64],
  "ink-sprite": [64, 64], "archive-guardian": [128, 96], "star-moth": [96, 80],
  "lens-sentinel": [80, 80], "astral-keeper": [128, 96]
};

export const mapBackgroundLayers: Record<MapId, MapBackgroundLayer[]> = {
  "fog-harbor-test": [
    { key: "bg_historical_fog_harbor_test", y: 270, height: 540, scrollFactor: 1, depth: -60, fitTextureHeight: true }
  ],
  "mist-breakwater": [
    { key: "bg_historical_mist_breakwater", y: 270, height: 540, scrollFactor: 1, depth: -60, fitTextureHeight: true }
  ],
  "old-harbor-warehouse": [
    { key: "bg_historical_old_harbor_warehouse", y: 270, height: 540, scrollFactor: 1, depth: -60, fitTextureHeight: true }
  ],
  "coral-tide-cavern": [
    { key: "bg_historical_coral_tide_cavern", y: 270, height: 540, scrollFactor: 1, depth: -60, fitTextureHeight: true }
  ],
  "sunken-archive": [
    { key: "bg_historical_sunken_archive", y: 270, height: 540, scrollFactor: 1, depth: -60, fitTextureHeight: true }
  ],
  "starlit-observatory": [
    { key: "bg_historical_starlit_observatory", y: 270, height: 540, scrollFactor: 1, depth: -60, fitTextureHeight: true }
  ]
};

export const optionalImageAssets: ImageAsset[] = [
  ...Object.entries(itemDropTextureKeys).map(([name, key]) => ({
    key,
    path: `assets/p9/items/${name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}.png`,
    enabled: externalMapArtEnabled
  })),
  {
    key: anpingCargoChestTextureKey,
    path: "assets/p8/props/anping_cargo_chest.png",
    enabled: externalMapArtEnabled
  },
  ...([
    [scenePropTextureKeys.cargoCrates, "cargo_crates"],
    [scenePropTextureKeys.burlapSacks, "burlap_sacks"],
    [scenePropTextureKeys.teaChestStack, "tea_chest_stack"],
    [scenePropTextureKeys.timberStack, "timber_stack"],
    [scenePropTextureKeys.bambooSieves, "bamboo_sieves"],
    [scenePropTextureKeys.ledgerManifest, "ledger_manifest"],
    [scenePropTextureKeys.teaDryingRack, "tea_drying_rack"],
    [scenePropTextureKeys.camphorStill, "camphor_still"]
  ] as const).map(([key, filename]) => ({
    key,
    path: `assets/p8/props/${filename}.png`,
    enabled: externalMapArtEnabled
  })),
  ...Object.entries(interactableTextureKeys).map(([kind, key]) => ({
    key,
    path: `assets/p8/interactables/${({ lantern: "breakwater_lantern", "tide-gauge": "tide_gauge", seal: "tea_seal", tablet: "timber_tablet", lens: "camphor_lens" } as const)[kind as MapInteractableKind]}.png`,
    enabled: externalMapArtEnabled
  })),
  {
    key: "bg_historical_fog_harbor_test",
    path: "assets/maps/historical/fog_harbor_test_backplate.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_historical_mist_breakwater",
    path: "assets/maps/historical/mist_breakwater_backplate.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_historical_old_harbor_warehouse",
    path: "assets/maps/historical/old_harbor_warehouse_backplate.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_historical_coral_tide_cavern",
    path: "assets/maps/historical/coral_tide_cavern_backplate.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_historical_sunken_archive",
    path: "assets/maps/historical/sunken_archive_backplate.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_historical_starlit_observatory",
    path: "assets/maps/historical/starlit_observatory_backplate.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_fog_harbor_sky",
    path: "assets/maps/fog_harbor_test/bg_sky.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_fog_harbor_far",
    path: "assets/maps/fog_harbor_test/bg_far.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_fog_harbor_buildings_back",
    path: "assets/maps/fog_harbor_test/bg_buildings_back.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_fog_harbor_buildings_mid",
    path: "assets/maps/fog_harbor_test/bg_buildings_mid.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_mist_breakwater_sky",
    path: "assets/maps/mist_breakwater/bg_sky.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_mist_breakwater_far",
    path: "assets/maps/mist_breakwater/bg_far.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_mist_breakwater_harbor_back",
    path: "assets/maps/mist_breakwater/bg_harbor_back.png",
    enabled: externalMapArtEnabled
  },
  {
    key: "bg_mist_breakwater_harbor_mid",
    path: "assets/maps/mist_breakwater/bg_harbor_mid.png",
    enabled: externalMapArtEnabled
  },
  {
    key: mistOverlayTextureKey,
    path: "assets/effects/mist_overlay.png",
    enabled: externalMapArtEnabled
  },
  ...Object.entries({ stone: "tile_platform_stone", wood: "tile_platform_wood", roof: "tile_platform_roof", dock: "tile_platform_dock", mountain: "tile_platform_mountain" })
    .map(([name, key]) => ({ key, path: `assets/p8/platforms/${name}.png`, enabled: externalMapArtEnabled }))
];

export const optionalSpriteSheets: SpriteSheetAsset[] = [
  {
    key: "player_idle",
    path: "assets/p8/characters/player/player_idle.png",
    frameWidth: 80,
    frameHeight: 80,
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    animationKey: "anim_player_idle",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_run",
    path: "assets/p8/characters/player/player_run.png",
    frameWidth: 96,
    frameHeight: 80,
    frameCount: 6,
    frameRate: 9,
    repeat: -1,
    animationKey: "anim_player_run",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_jump",
    path: "assets/p8/characters/player/player_jump.png",
    frameWidth: 80,
    frameHeight: 80,
    frameCount: 2,
    frameRate: 6,
    repeat: -1,
    animationKey: "anim_player_jump",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_attack",
    path: "assets/p8/characters/player/player_attack.png",
    frameWidth: 112,
    frameHeight: 80,
    frameCount: 4,
    frameRate: 12,
    repeat: 0,
    animationKey: "anim_player_attack",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_skill_slash",
    path: "assets/p8/characters/player/player_skill_slash.png",
    frameWidth: 128,
    frameHeight: 80,
    frameCount: 5,
    frameRate: 14,
    repeat: 0,
    animationKey: "anim_player_skill_slash",
    enabled: externalSpritesEnabled
  },
  {
    key: "monster_field_rat",
    path: "assets/p8/monsters/granary_rat_idle.png",
    frameWidth: 64,
    frameHeight: 48,
    frameCount: 4,
    frameRate: 6,
    repeat: -1,
    animationKey: "anim_monster_field_rat_idle",
    enabled: externalSpritesEnabled
  },
  {
    key: anpingHarborClerkTextureKey,
    path: "assets/p8/npcs/anping_harbor_clerk_idle.png",
    frameWidth: 80,
    frameHeight: 80,
    frameCount: 4,
    frameRate: 4,
    repeat: -1,
    animationKey: anpingHarborClerkAnimationKey,
    enabled: externalSpritesEnabled
  },
  ...Object.entries(npcVisualAssets)
    .filter(([npcId]) => npcId !== "fog-harbor-guard")
    .map(([npcId, visual]) => ({
      key: visual.textureKey,
      path: `assets/p8/npcs/${npcId.replaceAll("-", "_")}_idle.png`,
      frameWidth: 80,
      frameHeight: 80,
      frameCount: 4,
      frameRate: 4,
      repeat: -1,
      animationKey: visual.animationKey,
      enabled: externalSpritesEnabled
    })),
  {
    key: basicInkSlashTextureKey,
    path: "assets/p8/effects/basic_ink_slash.png",
    frameWidth: 96,
    frameHeight: 64,
    frameCount: 4,
    frameRate: 20,
    repeat: 0,
    animationKey: basicInkSlashAnimationKey,
    enabled: externalSpritesEnabled
  },
  ...([
    [skillEffectAssets["sword-cleave"], "sword_cleave", 128, 96],
    [skillEffectAssets["spirit-talisman"], "spirit_talisman", 128, 80],
    [skillEffectAssets["hunter-shot"], "hunter_shot", 160, 64],
    [skillEffectAssets.impact, "skill_impact", 96, 96]
  ] as const).map(([effect, filename, frameWidth, frameHeight]) => ({
    key: effect.textureKey,
    path: `assets/p8/effects/${filename}.png`,
    frameWidth,
    frameHeight,
    frameCount: 4,
    frameRate: 16,
    repeat: 0,
    animationKey: effect.animationKey,
    enabled: externalSpritesEnabled
  })),
  ...Object.entries(p8MonsterFrames).map(([kind, [frameWidth, frameHeight]]) => ({
    key: monsterTextureKeys[kind as MonsterKind],
    path: `assets/p8/monsters/${kind.replaceAll("-", "_")}_idle.png`,
    frameWidth,
    frameHeight,
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    animationKey: monsterAnimationKeys[kind as MonsterKind],
    enabled: externalSpritesEnabled
  }))
];
