import Phaser from "phaser";
import { authAllowMock, googleClientId } from "../game/clientConfig";
import { gameHeight, gameWidth } from "../game/constants";
import { ColorHex, ColorText, uiFont } from "../game/uiTheme";

export interface TitleScreenState {
  currentSaveSlot: string;
  previousSaveSlot: string;
  accountSaveSlotLines: string[];
  characterName: string;
  classLabel: string;
  classDescription: string;
  authAccountLabel: string;
  isAuthenticated: boolean;
}

interface TitleScreenCallbacks {
  onMockLogin: () => void;
}

export class TitleScreenView {
  private readonly overlay: Phaser.GameObjects.Container;
  private readonly titleSlotText: Phaser.GameObjects.Text;
  private readonly titleCharacterText: Phaser.GameObjects.Text;
  private readonly titleAuthText: Phaser.GameObjects.Text;
  private readonly titleNoticeText: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    callbacks: TitleScreenCallbacks
  ) {
    const overlay = scene.add.container(0, 0).setScrollFactor(0).setDepth(300);
    const shade = scene.add.rectangle(0, 0, gameWidth, gameHeight, ColorHex.inkGreenShade, 0.82).setOrigin(0);
    const woodFrame = scene.add.rectangle(gameWidth / 2, gameHeight / 2 + 3, 624, 374, ColorHex.woodDark, 0.96);
    const frame = scene.add.rectangle(gameWidth / 2, gameHeight / 2, 610, 360, ColorHex.inkGreenDeep, 0.97);
    const border = scene.add.rectangle(gameWidth / 2, gameHeight / 2, 610, 360, 0x000000, 0);
    const header = scene.add.rectangle(gameWidth / 2, gameHeight / 2 - 150, 610, 60, ColorHex.deepTeal, 0.99);
    const accent = scene.add.rectangle(gameWidth / 2, gameHeight / 2 - 119, 610, 3, ColorHex.gold, 0.92);
    const seal = scene.add.rectangle(gameWidth / 2 - 250, gameHeight / 2 - 150, 22, 22, ColorHex.vermilion, 1);
    seal.setStrokeStyle(1, ColorHex.gold, 0.9);
    const title = scene.add
      .text(gameWidth / 2, gameHeight / 2 - 158, "蓬萊異聞錄 Online", {
        fontFamily: uiFont,
        fontSize: "30px",
        color: ColorText.gold,
        stroke: ColorText.ink,
        strokeThickness: 4
      })
      .setOrigin(0.5);
    const subtitle = scene.add
      .text(gameWidth / 2, gameHeight / 2 - 104, "霧港試煉場", {
        fontFamily: uiFont,
        fontSize: "16px",
        color: ColorText.sand
      })
      .setOrigin(0.5);
    this.titleSlotText = scene.add
      .text(gameWidth / 2 - 245, gameHeight / 2 - 58, "", {
        fontSize: "15px",
        color: "#f2efe6",
        fixedWidth: 490,
        lineSpacing: 8,
        wordWrap: { width: 490 }
      })
      .setOrigin(0, 0);
    this.titleCharacterText = scene.add
      .text(gameWidth / 2 - 245, gameHeight / 2 - 4, "", {
        fontSize: "15px",
        color: "#f6ead2",
        fixedWidth: 490,
        lineSpacing: 7,
        wordWrap: { width: 490 }
      })
      .setOrigin(0, 0);
    const controls = scene.add
      .text(
        gameWidth / 2 - 245,
        gameHeight / 2 + 78,
        [
          "Enter 進入遊戲",
          "← / → 切換職業 | N 切換預設名稱",
          "直接輸入英文/數字改名 | Backspace 刪字",
          "R 新存檔 | L 上一個存檔 | Y 複製代碼 | G 登出",
          "1/2/3 切換帳號存檔（登入後）"
        ].join("\n"),
        {
          fontSize: "14px",
          color: "#d8cfae",
          fixedWidth: 490,
          lineSpacing: 7
        }
      )
      .setOrigin(0, 0);
    this.titleNoticeText = scene.add
      .text(gameWidth / 2, gameHeight / 2 + 152, "", {
        fontSize: "14px",
        color: "#91f0a5",
        fixedWidth: 520,
        align: "center"
      })
      .setOrigin(0.5);
    this.titleAuthText = scene.add
      .text(gameWidth / 2, gameHeight / 2 + 128, "", {
        fontSize: "13px",
        color: "#d8cfae",
        fixedWidth: 520,
        align: "center"
      })
      .setOrigin(0.5);

    border.setStrokeStyle(2, ColorHex.gold, 0.62);
    overlay.add([
      shade,
      woodFrame,
      frame,
      border,
      header,
      accent,
      seal,
      title,
      subtitle,
      this.titleSlotText,
      this.titleCharacterText,
      controls,
      this.titleAuthText,
      this.titleNoticeText
    ]);
    if (authAllowMock) {
      overlay.add(this.createMockLoginButton(callbacks.onMockLogin));
    }
    this.overlay = overlay;
  }

  update(state: TitleScreenState) {
    this.titleSlotText.setText(
      [
        `目前存檔：${state.currentSaveSlot}`,
        `上一個存檔：${state.previousSaveSlot || "無"}`,
        ...state.accountSaveSlotLines
      ].join("\n")
    );
    this.titleCharacterText.setText(
      [
        `角色名稱：${state.characterName}`,
        `職業：${state.classLabel}`,
        state.classDescription,
        "進入遊戲後會寫入 SQLite 角色資料。"
      ].join("\n")
    );
    this.titleAuthText.setText(this.getAuthText(state));
  }

  showNotice(text: string) {
    this.titleNoticeText.setText(text);
    this.titleNoticeText.setAlpha(1);
    this.scene.tweens.killTweensOf(this.titleNoticeText);
    this.scene.tweens.add({
      targets: this.titleNoticeText,
      alpha: 0,
      delay: 2200,
      duration: 360
    });
  }

  destroy() {
    this.overlay.destroy(true);
  }

  private createMockLoginButton(onMockLogin: () => void): Phaser.GameObjects.Text {
    const button = this.scene.add
      .text(gameWidth / 2, gameHeight / 2 + 184, "▶ 測試登入（輸入 Email）", {
        fontSize: "13px",
        color: "#ffd76a",
        backgroundColor: "#1c3b2e",
        padding: { x: 12, y: 6 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on("pointerdown", onMockLogin);
    return button;
  }

  private getAuthText(state: TitleScreenState) {
    if (state.isAuthenticated) {
      return `已登入：學校 Google 帳號（${state.authAccountLabel || "已登入"}），存檔會綁定帳號。`;
    }

    if (googleClientId) {
      return "登入：點下方的 Google 按鈕，用學校帳號登入後綁定存檔。";
    }

    if (authAllowMock) {
      return "登入（測試）：點下方「測試登入」輸入 Email 即可體驗帳號存檔。";
    }

    return "登入尚未開放，目前使用本機存檔。請按 P → Y 複製存檔碼備份。";
  }
}
