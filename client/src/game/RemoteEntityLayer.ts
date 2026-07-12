import Phaser from "phaser";
import { CLASS_SKILL_IDS, type CharacterClass, type ItemDropSnapshot, type MonsterSnapshot, type PlayerAnimation, type PlayerSnapshot } from "@penglai/shared";
import { monsterAnimationKeys, monsterTextureKeys } from "./assetManifest";
import { GameAudioManager } from "./audioManager";
import { ColorHex, ColorText, uiFont } from "./uiTheme";
import type { ItemDropView, MonsterView } from "./viewTypes";

const fallbackTextures: Record<MonsterSnapshot["kind"], string> = {
  "field-rat": "monster_field_rat_fallback", "mist-slime": "monster_mist_slime_fallback", "tide-watcher": "monster_tide_watcher_fallback",
  "warehouse-rat": "monster_warehouse_rat_fallback", "mist-puppet": "monster_mist_puppet_fallback", "warehouse-sentry": "monster_warehouse_sentry_fallback",
  "cave-crab": "monster_cave_crab_fallback", "reef-wisp": "monster_reef_wisp_fallback", "coral-warden": "monster_coral_warden_fallback",
  "archive-drifter": "monster_archive_drifter_fallback", "ink-sprite": "monster_ink_sprite_fallback", "archive-guardian": "monster_archive_guardian_fallback",
  "star-moth": "monster_star_moth_fallback", "lens-sentinel": "monster_lens_sentinel_fallback", "astral-keeper": "monster_astral_keeper_fallback"
};

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
      marker.setPosition(player.x, player.y).setFlipX(player.facing === "left").setAlpha(player.hp > 0 ? 1 : 0.35);
      this.options.applyPlayerAnimation(marker, player.animation);
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
      this.remoteAttackSoundReadyAt = this.scene.time.now + 150;
      this.options.audio.playRemoteAttackSound(isSkill, CLASS_SKILL_IDS[player.className]);
    }
  }

  private applyMonsters(monsters: MonsterSnapshot[]) {
    this.monsterSnapshots = new Map(monsters.map((monster) => [monster.id, monster]));
    for (const monster of monsters) {
      const view = this.getOrCreateMonster(monster);
      view.baseX = monster.x;
      view.body.setPosition(monster.x + view.hitOffsetX, monster.y).setAlpha(monster.alive ? 1 : 0.25);
      if (view.body instanceof Phaser.GameObjects.Sprite) { view.body.setFlipX(monster.facing === "left"); this.applyMonsterAnimation(view, monster.kind); }
      view.eye?.setPosition(monster.x + 8, monster.y - 4).setAlpha(monster.alive ? 1 : 0.1);
      view.hpBack.setPosition(monster.x, monster.y - 28).setAlpha(monster.alive ? 1 : 0);
      view.hpFill.setPosition(monster.x - 18, monster.y - 28).setDisplaySize(36 * Phaser.Math.Clamp(monster.maxHp ? monster.hp / monster.maxHp : 0, 0, 1), 5).setAlpha(monster.alive ? 1 : 0);
      view.label.setPosition(monster.x - 28, monster.y - 52).setAlpha(monster.alive ? 1 : 0.3);
      if (monster.hitAt > view.lastHitAt) {
        view.lastHitAt = monster.hitAt; this.flashMonster(view);
        this.scene.time.delayedCall(80, () => this.restoreMonster(view, monster.kind));
      }
    }
    const liveIds = new Set(monsters.map((monster) => monster.id));
    for (const [id, view] of this.monsters) {
      if (liveIds.has(id)) continue;
      this.scene.tweens.killTweensOf(view);
      view.body.destroy(); view.eye?.destroy(); view.hpBack.destroy(); view.hpFill.destroy(); view.label.destroy(); this.monsters.delete(id);
    }
    this.options.onMonsterSnapshotsChanged();
  }

  private applyItemDrops(drops: ItemDropSnapshot[]) {
    for (const drop of drops) {
      const view = this.getOrCreateItemDrop(drop);
      view.body.setPosition(drop.x, drop.y - 10); view.shine.setPosition(drop.x, drop.y - 18); view.label.setPosition(drop.x - 44, drop.y - 44);
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
    const body = this.scene.add.rectangle(drop.x, drop.y - 10, 24, 18, ColorHex.vermilion).setStrokeStyle(1, ColorHex.gold, 0.6).setDepth(30);
    const shine = this.scene.add.circle(drop.x, drop.y - 18, 4, ColorHex.goldBright, 0.9).setDepth(31);
    const label = this.scene.add.text(drop.x - 44, drop.y - 44, `${drop.name} x${drop.quantity}`, { fontFamily: uiFont, fontSize: "11px", color: ColorText.gold, backgroundColor: "#10271fcc", padding: { x: 5, y: 3 } }).setDepth(31);
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
    const eye = this.usesFallbackEye(monster.kind) ? this.scene.add.circle(monster.x + 8, monster.y - 4, 3, 0xf2efe6).setDepth(35) : undefined;
    const hpBack = this.scene.add.rectangle(monster.x, monster.y - 28, 40, 7, ColorHex.barTrack).setOrigin(0.5).setStrokeStyle(1, ColorHex.gold, 0.4).setDepth(36);
    const hpFill = this.scene.add.rectangle(monster.x - 18, monster.y - 28, 36, 5, ColorHex.hp).setOrigin(0, 0.5).setDepth(37);
    const label = this.scene.add.text(monster.x - 28, monster.y - 54, monster.name, { fontFamily: uiFont, fontSize: "11px", color: ColorText.parchment, stroke: ColorText.ink, strokeThickness: 3 }).setDepth(37);
    if (eye) this.scene.tweens.add({ targets: eye, y: eye.y - 2, duration: 360, yoyo: true, repeat: -1 });
    const view = { body, eye, hpBack, hpFill, label, lastHitAt: monster.hitAt, baseX: monster.x, hitOffsetX: 0 };
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
  private getColor(kind: MonsterSnapshot["kind"]) {
    const colors: Partial<Record<MonsterSnapshot["kind"], number>> = { "tide-watcher": ColorHex.vermilion, "warehouse-sentry": ColorHex.deepTeal, "coral-warden": 0xd46a4c, "archive-guardian": 0x6d5a83, "astral-keeper": 0x596b8f, "lens-sentinel": 0x4f7c86, "star-moth": 0x9f7a37, "ink-sprite": 0x6aa9d8, "archive-drifter": 0xd9e6e5, "reef-wisp": 0x7bd0d3, "cave-crab": 0x74c7c8, "mist-puppet": 0x9b7b52, "warehouse-rat": 0xc0703e };
    return colors[kind] ?? (kind === "mist-slime" ? 0x49b8ad : 0xa84f3c);
  }
}
