import Phaser from "phaser";
import type { PlayerSnapshot, SkillDefinition } from "@penglai/shared";
import { gameHeight, gameWidth } from "./constants";
import { ColorHex, ColorText, uiFont } from "./uiTheme";

export interface BossHudStatus { hp: number; maxHp: number; alive: boolean; text: string; defeatedText: string; }
export interface ExistingHudElements {
  statusText: Phaser.GameObjects.Text; levelText: Phaser.GameObjects.Text;
  hpFill: Phaser.GameObjects.Rectangle; hpText: Phaser.GameObjects.Text;
  mpFill: Phaser.GameObjects.Rectangle; mpText: Phaser.GameObjects.Text;
  expFill: Phaser.GameObjects.Rectangle; expText: Phaser.GameObjects.Text;
  goldText: Phaser.GameObjects.Text; skillText: Phaser.GameObjects.Text;
  bossHpBack: Phaser.GameObjects.Rectangle; bossHpFill: Phaser.GameObjects.Rectangle; bossStatusText: Phaser.GameObjects.Text;
  dialogueBox: Phaser.GameObjects.Graphics; dialogueText: Phaser.GameObjects.Text;
  promptText: Phaser.GameObjects.Text; zoneText: Phaser.GameObjects.Text;
}

export class HudLayer {
  readonly promptText: Phaser.GameObjects.Text;
  readonly zoneText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly mpFill: Phaser.GameObjects.Rectangle;
  private readonly mpText: Phaser.GameObjects.Text;
  private readonly expFill: Phaser.GameObjects.Rectangle;
  private readonly expText: Phaser.GameObjects.Text;
  private readonly goldText: Phaser.GameObjects.Text;
  private readonly skillText: Phaser.GameObjects.Text;
  private readonly bossHpBack: Phaser.GameObjects.Rectangle;
  private readonly bossHpFill: Phaser.GameObjects.Rectangle;
  private readonly bossStatusText: Phaser.GameObjects.Text;
  private readonly dialogueBox: Phaser.GameObjects.Graphics;
  private readonly dialogueText: Phaser.GameObjects.Text;

  static bind(scene: Phaser.Scene, elements: ExistingHudElements) {
    const hud = Object.create(HudLayer.prototype) as HudLayer;
    Object.assign(hud, { scene, ...elements });
    return hud;
  }

  constructor(private readonly scene: Phaser.Scene, characterName: string, primarySkill: SkillDefinition, maxMp: number) {
    const add = scene.add;
    const plate = add.graphics().setScrollFactor(0);
    plate.fillStyle(ColorHex.shadow, 0.4); plate.fillRoundedRect(13, 13, 300, 188, 12);
    plate.fillStyle(ColorHex.woodDark, 0.96); plate.fillRoundedRect(11, 11, 300, 188, 12);
    plate.fillStyle(ColorHex.inkGreenDeep, 0.88); plate.fillRoundedRect(14, 14, 294, 182, 10);
    plate.lineStyle(1, ColorHex.gold, 0.42); plate.strokeRoundedRect(12.5, 12.5, 297, 185, 11);
    this.statusText = add.text(24, 20, "連線中...", { fontFamily: uiFont, fontSize: "13px", color: ColorText.sand }).setScrollFactor(0);
    this.levelText = add.text(24, 40, `${characterName} | 等級 1`, { fontFamily: uiFont, fontSize: "16px", color: ColorText.gold, fontStyle: "bold" }).setScrollFactor(0);
    this.expFill = this.addBar("經驗", 70, ColorHex.exp, "0/60", ColorText.jade);
    this.expText = this.lastBarText!;
    this.hpFill = this.addBar("生命", 98, ColorHex.hp, "100/100", ColorText.riceWhite);
    this.hpText = this.lastBarText!;
    this.mpFill = this.addBar("法力", 122, ColorHex.mp, `${maxMp}/${maxMp}`, ColorText.mistBlue);
    this.mpText = this.lastBarText!;
    this.goldText = add.text(24, 150, "金幣 0", { fontFamily: uiFont, fontSize: "13px", color: ColorText.gold }).setScrollFactor(0);
    this.skillText = add.text(24, 172, `J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | 可施放`, { fontFamily: uiFont, fontSize: "12px", color: ColorText.mistBlue }).setScrollFactor(0);
    add.text(324, 18, "A/D 移動  W 跳躍  K 攻擊  J 技能  E 對話/互動  自動拾取\nI 背包  Q 任務  C 角色  P 存檔/帳號  Z 回安全區(連按兩下)", { fontFamily: uiFont, fontSize: "12px", color: ColorText.riceWhite, backgroundColor: "#10271fe6", padding: { x: 9, y: 5 }, fixedWidth: 610, wordWrap: { width: 592 } }).setScrollFactor(0).setDepth(205);
    this.zoneText = add.text(gameWidth / 2, 30, "", { fontFamily: uiFont, fontSize: "18px", color: ColorText.gold, backgroundColor: "#10271fdd", padding: { x: 18, y: 8 }, fontStyle: "bold" }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
    add.text(gameWidth / 2, 62, "", { fontFamily: uiFont, fontSize: "14px", color: ColorText.parchment, backgroundColor: "#10271fdd", padding: { x: 12, y: 6 }, fixedWidth: 360, align: "center", wordWrap: { width: 340 } }).setOrigin(0.5).setScrollFactor(0).setDepth(198).setVisible(false);
    this.bossHpBack = add.rectangle(gameWidth / 2, 104, 284, 14, ColorHex.barTrack).setScrollFactor(0).setDepth(198).setStrokeStyle(1, ColorHex.gold, 0.45).setVisible(false);
    this.bossHpFill = add.rectangle(gameWidth / 2 - 140, 104, 280, 10, ColorHex.vermilion).setOrigin(0, 0.5).setScrollFactor(0).setDepth(199).setVisible(false);
    this.bossStatusText = add.text(gameWidth / 2, 84, "", { fontFamily: uiFont, fontSize: "13px", color: ColorText.gold, backgroundColor: "#10271fdd", padding: { x: 10, y: 4 }, fixedWidth: 330, align: "center", wordWrap: { width: 310 } }).setOrigin(0.5).setScrollFactor(0).setDepth(199).setVisible(false);
    this.dialogueBox = add.graphics().setScrollFactor(0).setDepth(200).setVisible(false);
    const bx = gameWidth / 2 - 260; const by = 112;
    this.dialogueBox.fillStyle(ColorHex.shadow, 0.45); this.dialogueBox.fillRoundedRect(bx + 3, by + 5, 520, 66, 12);
    this.dialogueBox.fillStyle(ColorHex.woodDark, 1); this.dialogueBox.fillRoundedRect(bx, by, 520, 66, 12);
    this.dialogueBox.fillStyle(ColorHex.inkGreenDeep, 0.97); this.dialogueBox.fillRoundedRect(bx + 4, by + 4, 512, 58, 9);
    this.dialogueBox.fillStyle(ColorHex.gold, 0.85); this.dialogueBox.fillRect(bx + 14, by + 12, 3, 42);
    this.dialogueBox.lineStyle(1, ColorHex.gold, 0.55); this.dialogueBox.strokeRoundedRect(bx + 2, by + 2, 516, 62, 10);
    this.dialogueText = add.text(gameWidth / 2, 145, "", { fontFamily: uiFont, fontSize: "14px", color: ColorText.parchment, padding: { x: 12, y: 7 }, fixedWidth: 486, align: "center", wordWrap: { width: 462 } }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);
    this.promptText = add.text(gameWidth / 2, gameHeight - 118, "E 對話", { fontFamily: uiFont, fontSize: "14px", color: ColorText.ink, backgroundColor: "#eac373", padding: { x: 12, y: 6 }, fontStyle: "bold" }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
  }

  private lastBarText?: Phaser.GameObjects.Text;
  private addBar(label: string, y: number, color: number, value: string, textColor: string) {
    this.scene.add.text(24, y, label, { fontFamily: uiFont, fontSize: "12px", color: textColor }).setOrigin(0, 0.5).setScrollFactor(0);
    this.scene.add.rectangle(95, y, 184, 12, ColorHex.barTrack).setOrigin(0, 0.5).setScrollFactor(0).setStrokeStyle(1, ColorHex.gold, 0.3);
    const fill = this.scene.add.rectangle(97, y, 0, 8, color).setOrigin(0, 0.5).setScrollFactor(0);
    this.lastBarText = this.scene.add.text(276, y, value, { fontFamily: uiFont, fontSize: "11px", color: ColorText.parchment }).setOrigin(1, 0.5).setScrollFactor(0);
    return fill;
  }

  setStatus(text: string) { this.statusText.setText(text); }
  updatePlayer(player: PlayerSnapshot) {
    this.levelText.setText(`${player.name} | 等級 ${player.level}`); this.expText.setText(`${player.exp}/${player.expToNext}`); this.hpText.setText(`${player.hp}/${player.maxHp}`); this.mpText.setText(`${Math.floor(player.mp)}/${player.maxMp}`); this.goldText.setText(`金幣 ${player.gold}`);
    this.expFill.setDisplaySize(180 * Phaser.Math.Clamp(player.exp / player.expToNext, 0, 1), 8); this.hpFill.setDisplaySize(180 * Phaser.Math.Clamp(player.hp / player.maxHp, 0, 1), 8); this.mpFill.setDisplaySize(180 * Phaser.Math.Clamp(player.mp / player.maxMp, 0, 1), 8);
  }
  updateSkill(primarySkill: SkillDefinition, localMp: number, remainingMs: number) {
    const status = remainingMs > 0 ? `${(remainingMs / 1000).toFixed(1)}秒` : localMp >= primarySkill.mpCost ? "可施放" : `缺 ${Math.ceil(primarySkill.mpCost - localMp)} 法力`;
    this.skillText.setText(`J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | ${status}`).setColor(remainingMs > 0 ? ColorText.sand : localMp >= primarySkill.mpCost ? ColorText.mistBlue : ColorText.danger);
  }
  updateBoss(status?: BossHudStatus) {
    if (!status) { this.bossHpBack.setVisible(false); this.bossHpFill.setVisible(false); this.bossStatusText.setVisible(false); return; }
    const ratio = status.maxHp > 0 ? Phaser.Math.Clamp(status.hp / status.maxHp, 0, 1) : 0;
    this.bossHpBack.setVisible(true); this.bossHpFill.setVisible(status.alive).setDisplaySize(280 * ratio, 10); this.bossStatusText.setVisible(true).setText(status.alive ? status.text : status.defeatedText).setColor(status.alive ? ColorText.gold : ColorText.jade);
  }
  showDialogue(text: string) {
    this.dialogueText.setText(text).setAlpha(1).setVisible(true); this.dialogueBox.setAlpha(1).setVisible(true);
    this.scene.time.delayedCall(2400, () => { this.scene.tweens.add({ targets: this.dialogueText, alpha: 0, duration: 260, onComplete: () => this.dialogueText.setVisible(false) }); this.scene.tweens.add({ targets: this.dialogueBox, alpha: 0, duration: 260, onComplete: () => this.dialogueBox.setVisible(false) }); });
  }
}
