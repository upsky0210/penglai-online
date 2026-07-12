import Phaser from "phaser";
import { CLASS_SKILL_IDS, ITEM_DEFINITIONS, type CharacterClass, type ItemDropSnapshot, type ItemId, type MonsterSnapshot, type PlayerAnimation, type PlayerSnapshot } from "@penglai/shared";
import { itemDropTextureKeys, monsterAnimationKeys, monsterTextureKeys } from "./assetManifest";
import { GameAudioManager } from "./audioManager";
import { ColorHex, ColorText, uiFont } from "./uiTheme";
import type { ItemDropView, MonsterView } from "./viewTypes";
import { visualQuality } from "./visualQuality";

const fallbackTextures: Record<MonsterSnapshot["kind"], string> = {
  "field-rat": "monster_field_rat_fallback", "mist-slime": "monster_mist_slime_fallback", "tide-watcher": "monster_tide_watcher_fallback",
  "warehouse-rat": "monster_warehouse_rat_fallback", "mist-puppet": "monster_mist_puppet_fallback", "warehouse-sentry": "monster_warehouse_sentry_fallback",
  "cave-crab": "monster_cave_crab_fallback", "reef-wisp": "monster_reef_wisp_fallback", "coral-warden": "monster_coral_warden_fallback",
  "archive-drifter": "monster_archive_drifter_fallback", "ink-sprite": "monster_ink_sprite_fallback", "archive-guardian": "monster_archive_guardian_fallback",
  "star-moth": "monster_star_moth_fallback", "lens-sentinel": "monster_lens_sentinel_fallback", "astral-keeper": "monster_astral_keeper_fallback"
};

const itemDropTextures: Partial<Record<ItemId, string>> = {
  "small-hp-potion": itemDropTextureKeys.potion, "medium-hp-potion": itemDropTextureKeys.potion,
  "harbor-lunchbox": itemDropTextureKeys.lunchbox, "rat-tail": itemDropTextureKeys.ratTail,
  "mist-gel": itemDropTextureKeys.mistGel, "watcher-shell": itemDropTextureKeys.shell,
  "warehouse-cloth": itemDropTextureKeys.monsterCloth, "damp-wood": itemDropTextureKeys.dampWood,
  "crab-shell": itemDropTextureKeys.shell, "reef-spark": itemDropTextureKeys.reefSpark,
  "coral-key": itemDropTextureKeys.questKey, "salted-page": itemDropTextureKeys.monsterCloth,
  "ink-core": itemDropTextureKeys.magicCore, "archive-seal": itemDropTextureKeys.questSeal,
  "star-dust": itemDropTextureKeys.reefSpark, "lens-core": itemDropTextureKeys.magicCore,
  "astral-seal": itemDropTextureKeys.questSeal
};

export function getItemDropTextureKey(itemId: ItemId) {
  const dedicated = itemDropTextures[itemId];
  if (dedicated) return dedicated;
  const item = ITEM_DEFINITIONS[itemId];
  if (item.kind === "consumable") return itemDropTextureKeys.potion;
  if (item.kind === "equipment") return itemDropTextureKeys.equipment;
  return itemDropTextureKeys.magicCore;
}

function getItemDropTint(itemId: ItemId) {
  const slot = ITEM_DEFINITIONS[itemId].equipmentSlot;
  if (slot === "weapon") return 0xffd77d;
  if (slot === "armor") return 0x9cc2d4;
  return 0xffffff;
}

export interface RemoteEntityLayerOptions {
  getPlayerId: () => string;
  getLocalPlayer: () => Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  getPlayerTextureKey: (animation: PlayerAnimation) => string;
  applyPlayerAnimation: (sprite: Phaser.GameObjects.Sprite, animation: PlayerAnimation) => void;
  flashAttackTelegraph: (x: number, y: number, direction: 1 | -1, className: CharacterClass, isSkill: boolean) => void;
  updateLocalPlayer: (player: PlayerSnapshot) => void;
  onMonsterSnapshotsChanged: () => void;
  hasUsableTexture: (key: string) => boolean;
  pendingPickupIds: Set<string>;
  audio: GameAudioManager;
}

export class RemoteEntityLayer {
  private readonly remotePlayers = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly remotePlayerAnimations = new Map<string, PlayerAnimation>();
  private readonly monsters = new Map<string, MonsterView>();
  private readonly itemDrops = new Map<string, ItemDropView>();
  private monsterSnapshots = new Map<string, MonsterSnapshot>();
  private readonly monsterAliveStates = new Map<string, boolean>();
  private remoteAttackSoundReadyAt = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly options: RemoteEntityLayerOptions) {}

  applySnapshot(players: PlayerSnapshot[], monsters: MonsterSnapshot[], itemDrops: ItemDropSnapshot[]) {
    this.applyPlayers(players);
    this.applyMonsters(monsters);
    this.applyItemDrops(itemDrops);
  }

  getMonsterView(monsterId: string) { return this.monsters.get(monsterId); }
  getMonsterSnapshot(monsterId: string) { return this.monsterSnapshots.get(monsterId); }
  getItemDrops() { return this.itemDrops; }

  nudgeMonsterView(monsterId: string) {
    const view = this.monsters.get(monsterId);
    const player = this.options.getLocalPlayer();
    if (!view || !player) return;
    const direction = view.baseX >= player.x ? 1 : -1;
    this.scene.tweens.killTweensOf(view);
    view.hitOffsetX = 0;
    this.scene.tweens.add({ targets: view, hitOffsetX: direction * 8, duration: 60, yoyo: true, ease: "Quad.easeOut",
      onUpdate: () => { if (view.body.active) view.body.x = view.baseX + view.hitOffsetX; },
      onComplete: () => { view.hitOffsetX = 0; if (view.body.active) view.body.x = view.baseX; }
    });
  }

  private applyPlayers(players: PlayerSnapshot[]) {
    for (const player of players) {
      if (player.id === this.options.getPlayerId()) { this.options.updateLocalPlayer(player); continue; }
      let marker = this.remotePlayers.get(player.id);
      if (!marker) {
        marker = this.scene.add.sprite(player.x, player.y, this.options.getPlayerTextureKey(player.animation)).setTint(0xd9a441).setDepth(42);
        this.remotePlayers.set(player.id, marker);
      }
      const visible = this.isNearCamera(player.x, player.y, 120);
      marker.setPosition(player.x, player.y).setFlipX(player.facing === "left").setAlpha(player.hp > 0 ? 1 : 0.35).setVisible(visible);
      if (visible) this.options.applyPlayerAnimation(marker, player.animation); else marker.stop();
      const previous = this.remotePlayerAnimations.get(player.id);
      const attacking = player.animation === "attack" || player.animation === "skill";
      if (attacking && player.animation !== previous && player.hp > 0) this.playRemoteAttackTelegraph(player);
      this.remotePlayerAnimations.set(player.id, player.animation);
    }
    const liveIds = new Set(players.map((player) => player.id));
    for (const [id, marker] of this.remotePlayers) {
      if (liveIds.has(id)) continue;
      marker.destroy(); this.remotePlayers.delete(id); this.remotePlayerAnimations.delete(id);
    }
  }

  private playRemoteAttackTelegraph(player: PlayerSnapshot) {
    const isSkill = player.animation === "skill";
    this.options.flashAttackTelegraph(player.x, player.y, player.facing === "left" ? -1 : 1, player.className, isSkill);
    if (this.scene.cameras.main.worldView.contains(player.x, player.y) && this.scene.time.now >= this.remoteAttackSoundReadyAt) {
      this.remoteAttackSoundReadyAt = this.scene.time.now + visualQuality.remoteEffectCooldownMs;
      this.options.audio.playRemoteAttackSound(isSkill, CLASS_SKILL_IDS[player.className]);
    }
  }

  private applyMonsters(monsters: MonsterSnapshot[]) {
    this.monsterSnapshots = new Map(monsters.map((monster) => [monster.id, monster]));
    let visibleLabelCount = 0;
    for (const monster of monsters) {
      const view = this.getOrCreateMonster(monster);
      const visible = this.isNearCamera(monster.x, monster.y, 110);
      const wasAlive = this.monsterAliveStates.get(monster.id);
      view.baseX = monster.x;
      view.body.setPosition(monster.x + view.hitOffsetX, monster.y).setVisible(visible);
      view.shadow.setPosition(monster.x, monster.y + 16).setVisible(visible && monster.alive);
      if (monster.alive) {
        view.body.setAlpha(1).setDisplaySize(...this.getDisplaySize(monster.kind));
        if (view.body instanceof Phaser.GameObjects.Sprite) view.body.clearTint();
      } else if (wasAlive !== false) {
        this.playMonsterDeath(view, monster.x, monster.y);
      }
      if (view.body instanceof Phaser.GameObjects.Sprite) {
        view.body.setFlipX(monster.facing === "left");
        if (visible && monster.alive) this.applyMonsterAnimation(view, monster.kind); else view.body.stop();
      }
      view.eye?.setPosition(monster.x + 8, monster.y - 4).setVisible(visible && monster.alive);
      view.hpBack.setPosition(monster.x, monster.y - 28).setVisible(visible && monster.alive);
      view.hpFill.setPosition(monster.x - 18, monster.y - 28).setDisplaySize(36 * Phaser.Math.Clamp(monster.maxHp ? monster.hp / monster.maxHp : 0, 0, 1), 5).setVisible(visible && monster.alive);
      const showLabel = visible && monster.alive && visibleLabelCount < visualQuality.maxWorldLabels;
      if (showLabel) visibleLabelCount += 1;
      view.label.setPosition(monster.x - 42, monster.y - 54).setVisible(showLabel);
      this.monsterAliveStates.set(monster.id, monster.alive);
      if (monster.hitAt > view.lastHitAt) {
        view.lastHitAt = monster.hitAt; this.flashMonster(view);
        this.scene.time.delayedCall(80, () => this.restoreMonster(view, monster.kind));
      }
    }
    const liveIds = new Set(monsters.map((monster) => monster.id));
    for (const [id, view] of this.monsters) {
      if (liveIds.has(id)) continue;
      this.scene.tweens.killTweensOf(view);
      view.body.destroy(); view.shadow.destroy(); view.eye?.destroy(); view.hpBack.destroy(); view.hpFill.destroy(); view.label.destroy(); this.monsters.delete(id);
      this.monsterAliveStates.delete(id);
    }
    this.options.onMonsterSnapshotsChanged();
  }

  private applyItemDrops(drops: ItemDropSnapshot[]) {
    let visibleLabelCount = 0;
    for (const drop of drops) {
      const view = this.getOrCreateItemDrop(drop);
      const visible = this.isNearCamera(drop.x, drop.y, 80);
      view.body.setPosition(drop.x, drop.y - 14).setVisible(visible);
      view.shine.setPosition(drop.x, drop.y - 18).setVisible(visible && visualQuality.showSecondaryGlows);
      const showLabel = visible && visibleLabelCount < visualQuality.maxWorldLabels;
      if (showLabel) visibleLabelCount += 1;
      view.label.setPosition(drop.x - 48, drop.y - 52).setVisible(showLabel);
    }
    const liveIds = new Set(drops.map((drop) => drop.id));
    for (const [id, view] of this.itemDrops) {
      if (liveIds.has(id)) continue;
      view.body.destroy(); view.shine.destroy(); view.label.destroy(); this.options.pendingPickupIds.delete(id); this.itemDrops.delete(id);
    }
  }

  private getOrCreateItemDrop(drop: ItemDropSnapshot) {
    const existing = this.itemDrops.get(drop.id);
    if (existing) return existing;
    const body = this.scene.add.sprite(drop.x, drop.y - 14, getItemDropTextureKey(drop.itemId)).setDisplaySize(34, 34).setOrigin(0.5, 1).setTint(getItemDropTint(drop.itemId)).setDepth(30);
    const shine = this.scene.add.circle(drop.x, drop.y - 18, 5, ColorHex.goldBright, 0.3).setDepth(29);
    const label = this.scene.add.text(drop.x - 48, drop.y - 52, `${drop.name} ×${drop.quantity}`, { fontFamily: uiFont, fontSize: "11px", color: ColorText.gold, backgroundColor: "#10271fe6", padding: { x: 5, y: 3 }, fixedWidth: 96, align: "center" }).setDepth(31);
    this.scene.tweens.add({ targets: [body, shine], y: "-=3", duration: 520, yoyo: true, repeat: -1 });
    const view = { body, shine, label };
    this.itemDrops.set(drop.id, view);
    return view;
  }

  private getOrCreateMonster(monster: MonsterSnapshot) {
    const existing = this.monsters.get(monster.id);
    if (existing) return existing;
    const body = this.scene.add.sprite(monster.x, monster.y, this.getTextureKey(monster.kind)).setDepth(34);
    body.setDisplaySize(...this.getDisplaySize(monster.kind));
    const shadow = this.scene.add.ellipse(monster.x, monster.y + 16, 42, 10, ColorHex.shadow, 0.48).setDepth(33);
    const eye = this.usesFallbackEye(monster.kind) ? this.scene.add.circle(monster.x + 8, monster.y - 4, 3, 0xf2efe6).setDepth(35) : undefined;
    const hpBack = this.scene.add.rectangle(monster.x, monster.y - 28, 40, 7, ColorHex.barTrack).setOrigin(0.5).setStrokeStyle(1, ColorHex.gold, 0.4).setDepth(36);
    const hpFill = this.scene.add.rectangle(monster.x - 18, monster.y - 28, 36, 5, ColorHex.hp).setOrigin(0, 0.5).setDepth(37);
    const label = this.scene.add.text(monster.x - 42, monster.y - 54, monster.name, { fontFamily: uiFont, fontSize: "11px", color: ColorText.parchment, stroke: ColorText.ink, strokeThickness: 3, fixedWidth: 84, align: "center" }).setDepth(37);
    if (eye) this.scene.tweens.add({ targets: eye, y: eye.y - 2, duration: 360, yoyo: true, repeat: -1 });
    const view = { body, shadow, eye, hpBack, hpFill, label, lastHitAt: monster.hitAt, baseX: monster.x, hitOffsetX: 0 };
    this.monsters.set(monster.id, view);
    return view;
  }

  private getTextureKey(kind: MonsterSnapshot["kind"]) { const key = monsterTextureKeys[kind]; return this.options.hasUsableTexture(key) ? key : fallbackTextures[kind]; }
  private usesFallbackEye(kind: MonsterSnapshot["kind"]) { return !this.options.hasUsableTexture(monsterTextureKeys[kind]) && ["tide-watcher", "coral-warden", "archive-guardian", "astral-keeper"].includes(kind); }
  private getDisplaySize(kind: MonsterSnapshot["kind"]): [number, number] {
    if (kind === "astral-keeper") return [88, 88];
    if (["tide-watcher", "warehouse-sentry", "coral-warden", "archive-guardian"].includes(kind)) return [86, 86];
    if (kind === "lens-sentinel") return [58, 52];
    if (["reef-wisp", "ink-sprite"].includes(kind)) return [46, 46];
    if (["archive-drifter", "star-moth"].includes(kind)) return [50, 42];
    if (kind === "cave-crab") return [50, 38];
    if (kind === "mist-puppet") return [46, 52];
    if (kind === "field-rat") return [58, 44];
    return kind === "mist-slime" ? [40, 32] : [36, 26];
  }
  private applyMonsterAnimation(view: MonsterView, kind: MonsterSnapshot["kind"]) {
    if (!(view.body instanceof Phaser.GameObjects.Sprite)) return;
    const animation = monsterAnimationKeys[kind];
    if (this.options.hasUsableTexture(monsterTextureKeys[kind]) && this.scene.anims.exists(animation)) { if (view.body.anims.currentAnim?.key !== animation) view.body.play(animation, true); return; }
    view.body.stop();
  }
  private flashMonster(view: MonsterView) { if (view.body instanceof Phaser.GameObjects.Sprite) view.body.setTint(0xf2efe6); else view.body.setFillStyle(0xf2efe6); }
  private restoreMonster(view: MonsterView, kind: MonsterSnapshot["kind"]) { if (view.body instanceof Phaser.GameObjects.Sprite) view.body.clearTint(); else view.body.setFillStyle(this.getColor(kind)); }
  private playMonsterDeath(view: MonsterView, x: number, y: number) {
    if (view.body instanceof Phaser.GameObjects.Sprite) view.body.stop().setTint(0x24332f);
    else view.body.setFillStyle(0x24332f);
    this.scene.tweens.add({ targets: view.body, alpha: 0.08, scaleX: view.body.scaleX * 0.72, scaleY: view.body.scaleY * 0.72, y: y - 12, duration: 360, ease: "Quad.easeIn" });
    if (!visualQuality.showSecondaryGlows || !this.isNearCamera(x, y, 40)) return;
    const motes = Array.from({ length: 4 }, (_, index) => this.scene.add.circle(x, y - 10, 3 + index % 2, index % 2 ? ColorHex.mistBlue : ColorHex.inkGreenDeep, 0.72).setDepth(38));
    motes.forEach((mote, index) => this.scene.tweens.add({ targets: mote, x: x + (index - 1.5) * 14, y: y - 28 - index * 4, alpha: 0, duration: 320, onComplete: () => mote.destroy() }));
  }
  private isNearCamera(x: number, y: number, padding: number) {
    const view = this.scene.cameras.main.worldView;
    return Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(view.x - padding, view.y - padding, view.width + padding * 2, view.height + padding * 2), x, y);
  }
  private getColor(kind: MonsterSnapshot["kind"]) {
    const colors: Partial<Record<MonsterSnapshot["kind"], number>> = { "tide-watcher": ColorHex.vermilion, "warehouse-sentry": ColorHex.deepTeal, "coral-warden": 0xd46a4c, "archive-guardian": 0x6d5a83, "astral-keeper": 0x596b8f, "lens-sentinel": 0x4f7c86, "star-moth": 0x9f7a37, "ink-sprite": 0x6aa9d8, "archive-drifter": 0xd9e6e5, "reef-wisp": 0x7bd0d3, "cave-crab": 0x74c7c8, "mist-puppet": 0x9b7b52, "warehouse-rat": 0xc0703e };
    return colors[kind] ?? (kind === "mist-slime" ? 0x49b8ad : 0xa84f3c);
  }
}
