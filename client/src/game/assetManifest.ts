import type { MapId, MonsterKind, PlayerAnimation } from "@penglai/shared";

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
  "warehouse-sentry": "monster_warehouse_sentry"
};

export const monsterAnimationKeys: Record<MonsterKind, string> = {
  "field-rat": "anim_monster_field_rat_idle",
  "mist-slime": "anim_monster_mist_slime_idle",
  "tide-watcher": "anim_monster_tide_watcher_idle",
  "warehouse-rat": "anim_monster_warehouse_rat_idle",
  "mist-puppet": "anim_monster_mist_puppet_idle",
  "warehouse-sentry": "anim_monster_warehouse_sentry_idle"
};

export const platformTextureKey = "tile_harbor_platform";
export const mistOverlayTextureKey = "effect_mist_overlay";

export const mapBackgroundLayers: Record<MapId, MapBackgroundLayer[]> = {
  "fog-harbor-test": [
    { key: "bg_fog_harbor_sky", y: 150, height: 300, scrollFactor: 0.2, depth: -60 },
    { key: "bg_fog_harbor_far", y: 246, height: 220, scrollFactor: 0.35, alpha: 0.95, depth: -55 },
    { key: "bg_fog_harbor_buildings_back", y: 320, height: 230, scrollFactor: 0.55, depth: -50 },
    { key: "bg_fog_harbor_buildings_mid", y: 398, height: 260, scrollFactor: 0.82, depth: -45 }
  ],
  "mist-breakwater": [
    { key: "bg_mist_breakwater_sky", y: 150, height: 300, scrollFactor: 0.2, depth: -60 },
    { key: "bg_mist_breakwater_far", y: 244, height: 220, scrollFactor: 0.35, alpha: 0.95, depth: -55 },
    { key: "bg_mist_breakwater_harbor_back", y: 326, height: 240, scrollFactor: 0.55, depth: -50 },
    { key: "bg_mist_breakwater_harbor_mid", y: 408, height: 260, scrollFactor: 0.82, depth: -45 }
  ],
  "old-harbor-warehouse": [
    { key: "bg_fog_harbor_sky", y: 150, height: 300, scrollFactor: 0.2, depth: -60 },
    { key: "bg_fog_harbor_far", y: 246, height: 220, scrollFactor: 0.35, alpha: 0.9, depth: -55 },
    { key: "bg_fog_harbor_buildings_back", y: 320, height: 230, scrollFactor: 0.5, alpha: 0.92, depth: -50 },
    { key: "bg_fog_harbor_buildings_mid", y: 408, height: 260, scrollFactor: 0.78, alpha: 0.9, depth: -45 }
  ]
};

export const optionalImageAssets: ImageAsset[] = [
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
  {
    key: platformTextureKey,
    path: "assets/tiles/harbor_platform_tiles.png",
    enabled: externalMapArtEnabled
  }
];

export const optionalSpriteSheets: SpriteSheetAsset[] = [
  {
    key: "player_idle",
    path: "assets/characters/player/player_idle.png",
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    animationKey: "anim_player_idle",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_run",
    path: "assets/characters/player/player_run.png",
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 6,
    frameRate: 9,
    repeat: -1,
    animationKey: "anim_player_run",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_jump",
    path: "assets/characters/player/player_jump.png",
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 2,
    frameRate: 6,
    repeat: -1,
    animationKey: "anim_player_jump",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_attack",
    path: "assets/characters/player/player_attack.png",
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 4,
    frameRate: 12,
    repeat: 0,
    animationKey: "anim_player_attack",
    enabled: externalSpritesEnabled
  },
  {
    key: "player_skill_slash",
    path: "assets/characters/player/player_skill_slash.png",
    frameWidth: 64,
    frameHeight: 48,
    frameCount: 5,
    frameRate: 14,
    repeat: 0,
    animationKey: "anim_player_skill_slash",
    enabled: externalSpritesEnabled
  },
  {
    key: "monster_field_rat",
    path: "assets/monsters/field_rat_idle.png",
    frameWidth: 32,
    frameHeight: 24,
    frameCount: 4,
    frameRate: 6,
    repeat: -1,
    animationKey: "anim_monster_field_rat_idle",
    enabled: externalSpritesEnabled
  },
  {
    key: "monster_mist_slime",
    path: "assets/monsters/mist_slime_idle.png",
    frameWidth: 40,
    frameHeight: 32,
    frameCount: 4,
    frameRate: 5,
    repeat: -1,
    animationKey: "anim_monster_mist_slime_idle",
    enabled: externalSpritesEnabled
  },
  {
    key: "monster_tide_watcher",
    path: "assets/monsters/tide_watcher_idle.png",
    frameWidth: 96,
    frameHeight: 96,
    frameCount: 6,
    frameRate: 5,
    repeat: -1,
    animationKey: "anim_monster_tide_watcher_idle",
    enabled: externalSpritesEnabled
  }
];
