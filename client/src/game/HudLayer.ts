import Phaser from "phaser";
import type { PlayerSnapshot, SkillDefinition } from "@penglai/shared";
import { gameHeight, gameWidth } from "./constants";
import { ColorHex, ColorText, uiFont } from "./uiTheme";

export interface BossHudStatus {
  hp: number;
  maxHp: number;
  alive: boolean;
  text: string;
  defeatedText: string;
}

export class HudLayer {
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
  private readonly zoneText: Phaser.GameObjects.Text;
  private readonly questTargetText: Phaser.GameObjects.Text;
  private readonly bossHpBack: Phaser.GameObjects.Rectangle;
  private readonly bossHpFill: Phaser.GameObjects.Rectangle;
  private readonly bossStatusText: Phaser.GameObjects.Text;
  private readonly dialogueBox: Phaser.GameObjects.Graphics;
  private readonly dialogueText: Phaser.GameObjects.Text;
  private readonly promptText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene, characterName: string, primarySkill: SkillDefinition, maxMp: number) {
    const plate = scene.add.graphics().setScrollFactor(0);
    plate.fillStyle(ColorHex.shadow, 0.4);
    plate.fillRoundedRect(13, 13, 300, 188, 12);
    plate.fillStyle(ColorHex.woodDark, 0.96);
    plate.fillRoundedRect(11, 11, 300, 188, 12);
    plate.fillStyle(ColorHex.inkGreenDeep, 0.88);
    plate.fillRoundedRect(14, 14, 294, 182, 10);
    plate.lineStyle(1, ColorHex.gold, 0.42);
    plate.strokeRoundedRect(12.5, 12.5, 297, 185, 11);

    this.statusText = scene.add.text(24, 20, "連線中...", {
      fontFamily: uiFont,
      fontSize: "13px",
      color: ColorText.sand
    }).setScrollFactor(0);
    this.levelText = scene.add.text(24, 40, `${characterName} | 等級 1`, {
      fontFamily: uiFont,
      fontSize: "16px",
      color: ColorText.gold,
      fontStyle: "bold"
    }).setScrollFactor(0);

    [this.expFill, this.expText] = this.addBar("經驗", 70, ColorHex.exp, "0/60", ColorText.jade, 0);
    [this.hpFill, this.hpText] = this.addBar("生命", 98, ColorHex.hp, "100/100", ColorText.riceWhite, 1);
    [this.mpFill, this.mpText] = this.addBar("法力", 122, ColorHex.mp, `${maxMp}/${maxMp}`, ColorText.mistBlue, 1);

    this.goldText = scene.add.text(24, 150, "金幣 0", {
      fontFamily: uiFont,
      fontSize: "13px",
      color: ColorText.gold
    }).setScrollFactor(0);
    this.skillText = scene.add.text(24, 172, `J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | 可施放`, {
      fontFamily: uiFont,
      fontSize: "12px",
      color: ColorText.mistBlue
    }).setScrollFactor(0);

    scene.add.text(324, 18, "A/D 移動  W 跳躍  K 攻擊  J 技能  E 對話/互動  自動拾取\nI 背包  Q 任務  C 角色  P 存檔/帳號  Z 回安全區(連按兩下)", {
      fontFamily: uiFont,
      fontSize: "12px",
      color: ColorText.riceWhite,
      backgroundColor: "#10271fe6",
      padding: { x: 9, y: 5 },
      fixedWidth: 610,
      wordWrap: { width: 592 }
    }).setScrollFactor(0).setDepth(205);

    this.zoneText = scene.add.text(gameWidth / 2, 30, "", {
      fontFamily: uiFont,
      fontSize: "18px",
      color: ColorText.gold,
      backgroundColor: "#10271fdd",
      padding: { x: 18, y: 8 },
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
    this.questTargetText = scene.add.text(gameWidth / 2, 62, "", {
      fontFamily: uiFont,
      fontSize: "14px",
      color: ColorText.parchment,
      backgroundColor: "#10271fdd",
      padding: { x: 12, y: 6 },
      fixedWidth: 360,
      align: "center",
      wordWrap: { width: 340 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(198).setVisible(false);

    this.bossHpBack = scene.add.rectangle(gameWidth / 2, 104, 284, 14, ColorHex.barTrack)
      .setScrollFactor(0).setDepth(198).setStrokeStyle(1, ColorHex.gold, 0.45).setVisible(false);
    this.bossHpFill = scene.add.rectangle(gameWidth / 2 - 140, 104, 280, 10, ColorHex.vermilion)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(199).setVisible(false);
    this.bossStatusText = scene.add.text(gameWidth / 2, 84, "", {
      fontFamily: uiFont,
      fontSize: "13px",
      color: ColorText.gold,
      backgroundColor: "#10271fdd",
      padding: { x: 10, y: 4 },
      fixedWidth: 330,
      align: "center",
      wordWrap: { width: 310 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(199).setVisible(false);

    this.dialogueBox = scene.add.graphics().setScrollFactor(0).setDepth(200).setVisible(false);
    const boxX = gameWidth / 2 - 260;
    const boxY = 112;
    this.dialogueBox.fillStyle(ColorHex.shadow, 0.45);
    this.dialogueBox.fillRoundedRect(boxX + 3, boxY + 5, 520, 66, 12);
    this.dialogueBox.fillStyle(ColorHex.woodDark, 1);
    this.dialogueBox.fillRoundedRect(boxX, boxY, 520, 66, 12);
    this.dialogueBox.fillStyle(ColorHex.inkGreenDeep, 0.97);
    this.dialogueBox.fillRoundedRect(boxX + 4, boxY + 4, 512, 58, 9);
    this.dialogueBox.fillStyle(ColorHex.gold, 0.85);
    this.dialogueBox.fillRect(boxX + 14, boxY + 12, 3, 42);
    this.dialogueBox.lineStyle(1, ColorHex.gold, 0.55);
    this.dialogueBox.strokeRoundedRect(boxX + 2, boxY + 2, 516, 62, 10);

    this.dialogueText = scene.add.text(gameWidth / 2, 145, "", {
      fontFamily: uiFont,
      fontSize: "14px",
      color: ColorText.parchment,
      padding: { x: 12, y: 7 },
      fixedWidth: 486,
      align: "center",
      wordWrap: { width: 462 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);
    this.promptText = scene.add.text(gameWidth / 2, gameHeight - 118, "E 對話", {
      fontFamily: uiFont,
      fontSize: "14px",
      color: ColorText.ink,
      backgroundColor: "#eac373",
      padding: { x: 12, y: 6 },
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);
  }

  setStatus(text: string) {
    this.statusText.setText(text);
  }

  updatePlayer(player: PlayerSnapshot) {
    this.levelText.setText(`${player.name} | 等級 ${player.level}`);
    this.expText.setText(`${player.exp}/${player.expToNext}`);
    this.hpText.setText(`${player.hp}/${player.maxHp}`);
    this.mpText.setText(`${Math.floor(player.mp)}/${player.maxMp}`);
    this.goldText.setText(`金幣 ${player.gold}`);
    this.expFill.setDisplaySize(180 * Phaser.Math.Clamp(player.exp / player.expToNext, 0, 1), 8);
    this.hpFill.setDisplaySize(180 * Phaser.Math.Clamp(player.hp / player.maxHp, 0, 1), 8);
    this.mpFill.setDisplaySize(180 * Phaser.Math.Clamp(player.mp / player.maxMp, 0, 1), 8);
  }

  updateSkill(primarySkill: SkillDefinition, localMp: number, remainingMs: number) {
    const status = remainingMs > 0
      ? `${(remainingMs / 1000).toFixed(1)}秒`
      : localMp >= primarySkill.mpCost
        ? "可施放"
        : `缺 ${Math.ceil(primarySkill.mpCost - localMp)} 法力`;
    const color = remainingMs > 0 ? ColorText.sand : localMp >= primarySkill.mpCost ? ColorText.mistBlue : ColorText.danger;
    this.skillText.setText(`J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | ${status}`).setColor(color);
  }

  setPrompt(text?: string) {
    if (!text) {
      this.promptText.setVisible(false);
      return;
    }
    this.promptText.setText(text).setVisible(true);
  }

  showZone(name: string) {
    this.zoneText.setText(name).setAlpha(1).setVisible(true);
    this.scene.tweens.killTweensOf(this.zoneText);
    this.scene.tweens.add({
      targets: this.zoneText,
      alpha: 0,
      delay: 1400,
      duration: 420,
      onComplete: () => this.zoneText.setVisible(false)
    });
  }

  setQuestTarget(text?: string) {
    if (!text) {
      this.questTargetText.setVisible(false);
      return;
    }
    this.questTargetText.setText(text).setVisible(true);
  }

  updateBoss(status?: BossHudStatus) {
    if (!status) {
      this.bossHpBack.setVisible(false);
      this.bossHpFill.setVisible(false);
      this.bossStatusText.setVisible(false);
      return;
    }
    const ratio = status.maxHp > 0 ? Phaser.Math.Clamp(status.hp / status.maxHp, 0, 1) : 0;
    this.bossHpBack.setVisible(true);
    this.bossHpFill.setVisible(status.alive).setDisplaySize(280 * ratio, 10);
    this.bossStatusText.setVisible(true)
      .setText(status.alive ? status.text : status.defeatedText)
      .setColor(status.alive ? ColorText.gold : ColorText.jade);
  }

  showDialogue(text: string) {
    this.dialogueText.setText(text).setAlpha(1).setVisible(true);
    this.dialogueBox.setAlpha(1).setVisible(true);
    this.scene.time.delayedCall(2400, () => {
      this.scene.tweens.add({
        targets: this.dialogueText,
        alpha: 0,
        duration: 260,
        onComplete: () => this.dialogueText.setVisible(false)
      });
      this.scene.tweens.add({
        targets: this.dialogueBox,
        alpha: 0,
        duration: 260,
        onComplete: () => this.dialogueBox.setVisible(false)
      });
    });
  }

  private addBar(
    label: string,
    y: number,
    color: number,
    value: string,
    labelColor: string,
    initialRatio: number
  ): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text] {
    this.scene.add.text(24, y, label, { fontFamily: uiFont, fontSize: "12px", color: labelColor })
      .setOrigin(0, 0.5).setScrollFactor(0);
    this.scene.add.rectangle(95, y, 184, 12, ColorHex.barTrack)
      .setOrigin(0, 0.5).setScrollFactor(0).setStrokeStyle(1, ColorHex.gold, 0.3);
    const fill = this.scene.add.rectangle(97, y, 180 * initialRatio, 8, color).setOrigin(0, 0.5).setScrollFactor(0);
    const text = this.scene.add.text(276, y, value, { fontFamily: uiFont, fontSize: "11px", color: ColorText.parchment })
      .setOrigin(1, 0.5).setScrollFactor(0);
    return [fill, text];
  }
}
