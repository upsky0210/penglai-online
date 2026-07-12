import Phaser from "phaser";
import type { CharacterClass, SkillDefinition, SkillId } from "@penglai/shared";
import { ColorText, uiFont } from "./uiTheme";
import type { MonsterView } from "./viewTypes";
import { GameAudioManager } from "./audioManager";
import { basicInkSlashAnimationKey, basicInkSlashTextureKey } from "./assetManifest";

export class CombatVfx {
  constructor(private readonly scene: Phaser.Scene, private readonly audio: GameAudioManager) {}

  flashHitbox(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined,
    facing: "left" | "right",
    className: CharacterClass,
    isSkill: boolean,
    getPrimarySkill: (className: CharacterClass) => SkillDefinition
  ) {
    if (!player) return;
    this.flashAttackTelegraph(player.x, player.y, facing === "right" ? 1 : -1, className, isSkill, getPrimarySkill);
  }

  flashAttackTelegraph(
    x: number,
    y: number,
    direction: 1 | -1,
    className: CharacterClass,
    isSkill: boolean,
    getPrimarySkill: (className: CharacterClass) => SkillDefinition
  ) {
    if (!isSkill) return this.flashBasicAttack(x, y, direction);
    if (className === "swordsman") return this.flashSwordCleave(x, y, direction);
    if (className === "talisman") return this.flashSpiritTalisman(x, y, direction, getPrimarySkill("talisman"));
    this.flashHunterShot(x, y, direction, getPrimarySkill("hunter"));
  }

  showDamage(monster: MonsterView | undefined, damage: number, defeated: boolean, isSkill = false, skillId?: SkillId) {
    if (!monster) return;
    if (isSkill) this.flashSkillImpact(monster.body.x, monster.body.y, skillId);
    const text = this.scene.add.text(monster.body.x - 10, monster.body.y - 72, defeated ? "擊破" : `-${damage}`, {
      fontFamily: uiFont, fontSize: defeated ? "20px" : "17px",
      color: defeated ? ColorText.riceWhite : isSkill ? ColorText.mistBlue : ColorText.gold,
      stroke: ColorText.ink, strokeThickness: 4
    });
    this.scene.tweens.add({ targets: text, y: text.y - 28, alpha: 0, duration: 520, onComplete: () => text.destroy() });
  }

  showMiss(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined,
    facing: "left" | "right",
    isSkill = false,
    skillId?: SkillId
  ) {
    this.audio.playMissSound(isSkill, skillId);
    if (!player) return;
    const direction = facing === "right" ? 1 : -1;
    const color = isSkill ? this.getSkillEffectColor(skillId) : "#d8cfae";
    const x = player.x + direction * 58;
    const y = player.y - 52;
    const text = this.scene.add.text(x - 24, y, isSkill ? "未命中" : "落空", { fontSize: "14px", color, stroke: "#181018", strokeThickness: 3 });
    const marker = this.scene.add.circle(x, y + 12, isSkill ? 16 : 11, Phaser.Display.Color.HexStringToColor(color).color, 0.18);
    marker.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.72).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: [text, marker], x: `+=${direction * 16}`, y: "-=18", alpha: 0, duration: 420, ease: "Quad.easeOut", onComplete: () => { text.destroy(); marker.destroy(); } });
  }

  private flashBasicAttack(originX: number, originY: number, direction: 1 | -1) {
    if (this.scene.textures.exists(basicInkSlashTextureKey) && this.scene.anims.exists(basicInkSlashAnimationKey)) {
      const slash = this.scene.add
        .sprite(originX + direction * 46, originY - 4, basicInkSlashTextureKey)
        .setFlipX(direction < 0)
        .setDepth(54);
      slash.play(basicInkSlashAnimationKey);
      slash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => slash.destroy());
      return;
    }
    const hitbox = this.scene.add.rectangle(originX + direction * 42, originY, 58, 34, 0xffd36d, 0.45);
    this.scene.tweens.add({ targets: hitbox, alpha: 0, duration: 140, onComplete: () => hitbox.destroy() });
  }

  private flashSwordCleave(originX: number, originY: number, direction: 1 | -1) {
    const x = originX + direction * 52;
    const slash = this.scene.add.container(x, originY - 4);
    const outer = this.scene.add.rectangle(0, 0, 24, 96, 0x8fe7ff, 0.62).setAngle(direction * -30);
    const inner = this.scene.add.rectangle(direction * 8, 0, 9, 82, 0xf8fdff, 0.86).setAngle(direction * -30);
    slash.add([outer, inner, this.scene.add.circle(direction * 24, -26, 9, 0xfff0a6, 0.82)]).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: slash, x: x + direction * 28, scaleX: 1.35, scaleY: 0.78, alpha: 0, duration: 180, ease: "Quad.easeOut", onComplete: () => slash.destroy() });
  }

  private flashSpiritTalisman(originX: number, originY: number, direction: 1 | -1, skill: SkillDefinition) {
    const startX = originX + direction * 30;
    const charm = this.scene.add.container(startX, originY - 10);
    const trail = this.scene.add.rectangle(-direction * 24, 0, 52, 6, 0x70ddff, 0.32);
    const paper = this.scene.add.rectangle(0, 0, 18, 26, 0xffe7ad, 0.96).setStrokeStyle(2, 0x9b2f32, 0.85);
    const seal = this.scene.add.text(-6, -12, "符", { fontSize: "16px", color: "#9b2f32", stroke: "#fff2c7", strokeThickness: 1 });
    charm.add([this.scene.add.circle(0, 0, 18, 0x7ed7ff, 0.18), trail, paper, seal]).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: charm, x: startX + Math.min(skill.range, 140) * direction, angle: direction * 12, alpha: 0, duration: 260, ease: "Sine.easeOut", onComplete: () => charm.destroy() });
  }

  private flashHunterShot(originX: number, originY: number, direction: 1 | -1, skill: SkillDefinition) {
    const width = Math.min(skill.range, 150);
    const startX = originX + direction * (width / 2 + 22);
    const shot = this.scene.add.container(startX, originY - 7);
    const line = this.scene.add.rectangle(0, 0, width, 5, 0xd9f0ff, 0.78);
    const core = this.scene.add.rectangle(direction * 12, 0, width * 0.72, 2, 0xfff4b8, 0.94);
    const tip = this.scene.add.triangle(direction * (width / 2 + 8), 0, 0, 0, 18, 7, 0, 14, 0xd9f0ff, 0.9).setAngle(direction === 1 ? 0 : 180);
    shot.add([line, core, tip]).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: shot, x: startX + direction * 24, alpha: 0, scaleX: 1.1, duration: 150, ease: "Quad.easeOut", onComplete: () => shot.destroy() });
  }

  private flashSkillImpact(x: number, y: number, skillId?: SkillId) {
    const color = skillId === "sword-cleave" ? 0xa8edff : skillId === "spirit-talisman" ? 0xffd36d : 0xd9f0ff;
    const ring = this.scene.add.circle(x, y - 18, skillId === "spirit-talisman" ? 24 : 18, color, 0.24).setStrokeStyle(2, color, 0.9).setBlendMode(Phaser.BlendModes.ADD);
    const spark = this.scene.add.circle(x, y - 18, 7, 0xffffff, 0.62).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: [ring, spark], scale: 1.7, alpha: 0, duration: 230, ease: "Quad.easeOut", onComplete: () => { ring.destroy(); spark.destroy(); } });
  }

  private getSkillEffectColor(skillId?: SkillId) {
    if (skillId === "sword-cleave") return "#a8edff";
    if (skillId === "spirit-talisman") return "#ffd36d";
    return skillId === "hunter-shot" ? "#d9f0ff" : "#7ed7ff";
  }
}
