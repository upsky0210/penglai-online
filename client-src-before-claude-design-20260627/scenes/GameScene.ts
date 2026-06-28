import Phaser from "phaser";
import {
  CLASS_SKILL_IDS,
  FOG_HARBOR_TEST_MAP,
  ITEM_DEFINITIONS,
  MONSTER_KIND_NAMES,
  SKILL_DEFINITIONS,
  type CharacterClass,
  type EquipmentSnapshot,
  type InventorySlot,
  type ItemDropSnapshot,
  type ItemId,
  type MonsterSnapshot,
  type PlayerAnimation,
  type PlayerSnapshot,
  type QuestSnapshot,
  type ServerMessage,
  type ShopDefinition,
  type SkillId
} from "@penglai/shared";
import { gameHeight, gameWidth, jumpSpeed, moveSpeed } from "../game/constants";
import { characterNamePresets, clientStorageKeys, fallbackPlayerMp, googleClientId } from "../game/clientConfig";
import { GameAudioManager } from "../game/audioManager";
import { renderGoogleSignInButton } from "../game/googleIdentity";
import { createUiPanel, type UiPanel } from "../game/uiPanel";
import type { ItemDropView, MonsterView } from "../game/viewTypes";

type KeyName =
  | "a"
  | "d"
  | "w"
  | "s"
  | "j"
  | "k"
  | "e"
  | "f"
  | "g"
  | "b"
  | "i"
  | "q"
  | "o"
  | "c"
  | "n"
  | "m"
  | "p"
  | "v"
  | "r"
  | "l"
  | "y"
  | "enter"
  | "one"
  | "two"
  | "three";

interface AuthAccountSummary {
  email?: string;
  hostedDomain?: string;
  displayName?: string;
}

interface AuthSaveSlotSummary {
  saveSlot: string;
  characterName?: string;
  level?: number;
  updatedAt: number;
}

interface StoredAuthSession {
  sessionId: string;
  expiresAt: number;
  account?: AuthAccountSummary;
  saveSlots?: AuthSaveSlotSummary[];
}

const maxPlayerMp = fallbackPlayerMp;
const characterClassOptions: Array<{
  className: CharacterClass;
  label: string;
  description: string;
}> = [
  {
    className: "swordsman",
    label: "劍士",
    description: "生命 115 / 法力 36，技能：斬擊。"
  },
  {
    className: "talisman",
    label: "符咒師",
    description: "生命 90 / 法力 60，技能：靈符彈。"
  },
  {
    className: "hunter",
    label: "獵人",
    description: "生命 100 / 法力 42，技能：遠射。"
  }
];
const emptyEquipment: EquipmentSnapshot = {
  weapon: null,
  armor: null
};

export class GameScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private facing: "left" | "right" = "right";
  private playerId = "";
  private ws?: WebSocket;
  private remotePlayers = new Map<string, Phaser.GameObjects.Rectangle>();
  private monsters = new Map<string, MonsterView>();
  private itemDrops = new Map<string, ItemDropView>();
  private statusText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private hpBack?: Phaser.GameObjects.Rectangle;
  private hpFill?: Phaser.GameObjects.Rectangle;
  private hpText?: Phaser.GameObjects.Text;
  private mpBack?: Phaser.GameObjects.Rectangle;
  private mpFill?: Phaser.GameObjects.Rectangle;
  private mpText?: Phaser.GameObjects.Text;
  private expBack?: Phaser.GameObjects.Rectangle;
  private expFill?: Phaser.GameObjects.Rectangle;
  private expText?: Phaser.GameObjects.Text;
  private goldText?: Phaser.GameObjects.Text;
  private skillText?: Phaser.GameObjects.Text;
  private inventoryPanel?: UiPanel;
  private questPanel?: UiPanel;
  private characterPanel?: UiPanel;
  private shopPanel?: UiPanel;
  private savePanel?: UiPanel;
  private settingsPanel?: UiPanel;
  private dialogueText?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  private zoneText?: Phaser.GameObjects.Text;
  private quests = new Map<string, QuestSnapshot>();
  private inventory: InventorySlot[] = [];
  private equipment: EquipmentSnapshot = { ...emptyEquipment };
  private openShop?: ShopDefinition;
  private selectedShopIndex = 0;
  private inventoryPanelVisible = true;
  private questPanelVisible = true;
  private characterPanelVisible = true;
  private shopPanelVisible = false;
  private savePanelVisible = false;
  private settingsPanelVisible = false;
  private nearbyNpcId = "";
  private nearbyDropId = "";
  private currentZoneId = "";
  private currentSaveSlot = "";
  private previousSaveSlot = "";
  private authSessionId = "";
  private authAccountLabel = "";
  private authSaveSlots: AuthSaveSlotSummary[] = [];
  private googleButtonElement?: HTMLDivElement;
  private titleAuthText?: Phaser.GameObjects.Text;
  private lastPlayerUpdateAt = 0;
  private localHp = 100;
  private localMp = maxPlayerMp;
  private localMaxHp = 100;
  private localMaxMp = maxPlayerMp;
  private localAttack = 12;
  private localDefense = 0;
  private skillReadyAt = 0;
  private gameStarted = false;
  private titleOverlay?: Phaser.GameObjects.Container;
  private titleSlotText?: Phaser.GameObjects.Text;
  private titleCharacterText?: Phaser.GameObjects.Text;
  private titleNoticeText?: Phaser.GameObjects.Text;
  private characterName = "霧港旅人";
  private selectedClass: CharacterClass = "swordsman";
  private localPlayerName = "霧港旅人";
  private localClassName: CharacterClass = "swordsman";
  private audio = new GameAudioManager();

  constructor() {
    super("boot");
  }

  preload() {
    this.createGeneratedTextures();
  }

  create() {
    this.physics.world.setBounds(0, 0, FOG_HARBOR_TEST_MAP.width, FOG_HARBOR_TEST_MAP.height);
    this.cameras.main.setBackgroundColor("#17233b");

    this.addBackground();
    this.currentSaveSlot = this.getSaveSlot();
    this.previousSaveSlot = this.getPreviousSaveSlot();
    this.loadStoredAuthSession();
    this.loadCharacterDraft();
    this.audio.loadSettings();

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      k: Phaser.Input.Keyboard.KeyCodes.K,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      g: Phaser.Input.Keyboard.KeyCodes.G,
      b: Phaser.Input.Keyboard.KeyCodes.B,
      i: Phaser.Input.Keyboard.KeyCodes.I,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      o: Phaser.Input.Keyboard.KeyCodes.O,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      n: Phaser.Input.Keyboard.KeyCodes.N,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      v: Phaser.Input.Keyboard.KeyCodes.V,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      l: Phaser.Input.Keyboard.KeyCodes.L,
      y: Phaser.Input.Keyboard.KeyCodes.Y,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE
    }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
    this.input.keyboard?.on("keydown", this.handleTitleNameKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown", this.handleTitleNameKeyDown, this);
      this.removeGoogleButton();
    });

    this.addTitleScreen();
  }

  private addTitleScreen() {
    const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(300);
    const shade = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x09111c, 0.74).setOrigin(0);
    const frame = this.add.rectangle(gameWidth / 2, gameHeight / 2, 610, 360, 0x111923, 0.94);
    const border = this.add.rectangle(gameWidth / 2, gameHeight / 2, 610, 360, 0x000000, 0);
    const header = this.add.rectangle(gameWidth / 2, gameHeight / 2 - 150, 610, 60, 0x2c4b5f, 0.98);
    const accent = this.add.rectangle(gameWidth / 2, gameHeight / 2 - 119, 610, 3, 0xe0a84f, 0.9);
    const title = this.add
      .text(gameWidth / 2, gameHeight / 2 - 158, "蓬萊異聞錄 Online", {
        fontSize: "30px",
        color: "#f6ead2",
        stroke: "#111923",
        strokeThickness: 4
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(gameWidth / 2, gameHeight / 2 - 104, "霧港試煉場", {
        fontSize: "16px",
        color: "#d8cfae"
      })
      .setOrigin(0.5);
    this.titleSlotText = this.add
      .text(gameWidth / 2 - 245, gameHeight / 2 - 58, "", {
        fontSize: "15px",
        color: "#f2efe6",
        fixedWidth: 490,
        lineSpacing: 8,
        wordWrap: { width: 490 }
      })
      .setOrigin(0, 0);
    this.titleCharacterText = this.add
      .text(gameWidth / 2 - 245, gameHeight / 2 - 4, "", {
        fontSize: "15px",
        color: "#f6ead2",
        fixedWidth: 490,
        lineSpacing: 7,
        wordWrap: { width: 490 }
      })
      .setOrigin(0, 0);
    const controls = this.add
      .text(
        gameWidth / 2 - 245,
        gameHeight / 2 + 78,
        [
          "Enter 進入遊戲",
          "← / → 切換職業 | N 切換預設名稱",
          "直接輸入英文/數字改名 | Backspace 刪字",
          "R 新存檔 | L 上一個存檔 | Y 複製代碼 | G 登出",
          "1/2/3 切換帳號存檔"
        ].join("\n"),
        {
          fontSize: "14px",
          color: "#d8cfae",
          fixedWidth: 490,
          lineSpacing: 7
        }
      )
      .setOrigin(0, 0);
    this.titleNoticeText = this.add
      .text(gameWidth / 2, gameHeight / 2 + 152, "", {
        fontSize: "14px",
        color: "#91f0a5",
        fixedWidth: 520,
        align: "center"
      })
      .setOrigin(0.5);
    this.titleAuthText = this.add
      .text(gameWidth / 2, gameHeight / 2 + 128, "", {
        fontSize: "13px",
        color: "#d8cfae",
        fixedWidth: 520,
        align: "center"
      })
      .setOrigin(0.5);

    border.setStrokeStyle(2, 0xe0a84f, 0.58);
    overlay.add([
      shade,
      frame,
      border,
      header,
      accent,
      title,
      subtitle,
      this.titleSlotText,
      this.titleCharacterText,
      controls,
      this.titleAuthText,
      this.titleNoticeText
    ]);
    this.titleOverlay = overlay;
    this.updateTitleScreen();
    void this.mountGoogleButton();
    void this.refreshAuthSession();
  }

  private updateTitleScreen() {
    if (!this.titleSlotText) {
      return;
    }

    const previous = this.previousSaveSlot || this.getPreviousSaveSlot();
    this.titleSlotText.setText(
      [
        `目前存檔：${this.formatSaveSlot(this.currentSaveSlot || this.getSaveSlot())}`,
        `上一個存檔：${previous ? this.formatSaveSlot(previous) : "無"}`,
        ...this.getAccountSaveSlotLines(2)
      ].join("\n")
    );

    const option = this.getSelectedClassOption();
    this.titleCharacterText?.setText(
      [
        `角色名稱：${this.characterName}`,
        `職業：${option.label}`,
        option.description,
        "進入遊戲後會寫入 SQLite 角色資料。"
      ].join("\n")
    );
    this.titleAuthText?.setText(
      this.authSessionId
        ? `Google 帳號：${this.authAccountLabel || "已登入"}，會使用帳號綁定存檔。`
        : googleClientId
          ? "可使用學校 Google 帳號登入。"
          : "Google 登入尚未設定，仍可使用本機存檔遊玩。"
    );
  }

  private showTitleNotice(text: string) {
    if (!this.titleNoticeText) {
      return;
    }

    this.titleNoticeText.setText(text);
    this.titleNoticeText.setAlpha(1);
    this.tweens.killTweensOf(this.titleNoticeText);
    this.tweens.add({
      targets: this.titleNoticeText,
      alpha: 0,
      delay: 2200,
      duration: 360
    });
  }

  private async mountGoogleButton() {
    this.removeGoogleButton();

    if (!googleClientId || this.authSessionId) {
      return;
    }

    const buttonElement = document.createElement("div");
    buttonElement.style.position = "fixed";
    buttonElement.style.zIndex = "50";
    buttonElement.style.width = "240px";
    buttonElement.style.height = "40px";
    buttonElement.style.transform = "translateX(-50%)";
    document.body.appendChild(buttonElement);
    this.googleButtonElement = buttonElement;
    this.positionGoogleButton();
    window.addEventListener("resize", this.positionGoogleButton);

    try {
      await renderGoogleSignInButton(buttonElement, googleClientId, (credential) => {
        void this.handleGoogleCredential(credential);
      });
    } catch {
      this.showTitleNotice("Google 登入元件載入失敗，請確認網路與 Client ID 設定。");
    }
  }

  private positionGoogleButton = () => {
    if (!this.googleButtonElement) {
      return;
    }

    const rect = this.game.canvas.getBoundingClientRect();
    this.googleButtonElement.style.left = `${rect.left + rect.width / 2}px`;
    this.googleButtonElement.style.top = `${rect.top + rect.height / 2 + 166}px`;
  };

  private removeGoogleButton() {
    if (!this.googleButtonElement) {
      return;
    }

    window.removeEventListener("resize", this.positionGoogleButton);
    this.googleButtonElement.remove();
    this.googleButtonElement = undefined;
  }

  private async handleGoogleCredential(credential: string) {
    try {
      this.showTitleNotice("正在驗證 Google 帳號...");
      const response = await fetch(this.getAuthUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential,
          saveSlot: this.currentSaveSlot || this.getSaveSlot(),
          characterName: this.characterName
        })
      });
      const result = (await response.json()) as {
        sessionId?: string;
        expiresAt?: number;
        saveSlot?: string;
        account?: AuthAccountSummary;
        saveSlots?: AuthSaveSlotSummary[];
        error?: string;
      };

      if (!response.ok || !result.sessionId || !result.saveSlot) {
        throw new Error(result.error ?? "google_auth_failed");
      }

      this.authSessionId = result.sessionId;
      this.authAccountLabel = this.formatAccountLabel(result.account);
      this.authSaveSlots = result.saveSlots ?? [];
      this.persistAuthSession(result.sessionId, result.expiresAt, result.account, result.saveSlots);
      this.setSaveSlot(result.saveSlot, true);
      this.removeGoogleButton();
      this.updateTitleScreen();
      this.showTitleNotice("Google 帳號登入完成，存檔已綁定。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "google_auth_failed";
      this.showTitleNotice(`Google 登入失敗：${message}`);
    }
  }

  private async refreshAuthSession() {
    if (!this.authSessionId) {
      return;
    }

    try {
      const response = await fetch(`${this.getApiUrl("/auth/session")}?session=${encodeURIComponent(this.authSessionId)}`);
      const result = (await response.json()) as {
        active?: boolean;
        sessionId?: string;
        expiresAt?: number;
        account?: AuthAccountSummary;
        saveSlots?: AuthSaveSlotSummary[];
      };

      if (!response.ok || !result.active || !result.sessionId) {
        this.clearAuthSession(false);
        this.showTitleNotice("Google 登入已過期，請重新登入。");
        return;
      }

      this.authSessionId = result.sessionId;
      this.authAccountLabel = this.formatAccountLabel(result.account);
      this.authSaveSlots = result.saveSlots ?? [];
      this.persistAuthSession(result.sessionId, result.expiresAt, result.account, result.saveSlots);
      this.updateTitleScreen();
      this.updateSavePanel();
    } catch {
      this.updateTitleScreen();
    }
  }

  private async logoutAuthSession(restartScene: boolean) {
    if (!this.authSessionId) {
      this.showSaveMessage("目前沒有登入 Google 帳號。");
      return;
    }

    const sessionId = this.authSessionId;
    try {
      await fetch(this.getApiUrl("/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
    } catch {
      // Local logout is still valid if the network call fails.
    }

    this.clearAuthSession(true);
    this.showSaveMessage("已登出 Google 帳號。");
    if (restartScene) {
      this.ws?.close();
      this.scene.restart();
    }
  }

  private clearAuthSession(refreshUi: boolean) {
    this.authSessionId = "";
    this.authAccountLabel = "";
    this.authSaveSlots = [];
    try {
      window.localStorage.removeItem(clientStorageKeys.authSession);
    } catch {
      // In-memory state is already cleared.
    }

    if (refreshUi) {
      this.updateTitleScreen();
      this.updateSavePanel();
      void this.mountGoogleButton();
    }
  }

  private formatAccountLabel(account: AuthAccountSummary | undefined) {
    return account?.email ?? account?.displayName ?? account?.hostedDomain ?? "";
  }

  private getPressedAccountSaveSlotIndex() {
    if (!this.keys) {
      return undefined;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      return 0;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      return 1;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
      return 2;
    }

    return undefined;
  }

  private loadAccountSaveSlot(index: number) {
    const slot = this.authSaveSlots[index];
    if (!slot) {
      this.showSaveMessage(`沒有第 ${index + 1} 個帳號存檔。`);
      return;
    }

    if (slot.saveSlot === this.currentSaveSlot) {
      this.showSaveMessage(`已經在帳號存檔 ${index + 1}。`);
      return;
    }

    this.setSaveSlot(slot.saveSlot, true);
    this.loadCharacterDraft();
    this.restartForSaveSlot(`已切換到帳號存檔 ${index + 1}：${this.formatSaveSlot(slot.saveSlot)}。`);
  }

  private getAccountSaveSlotLines(limit: number) {
    if (!this.authSessionId) {
      return [];
    }

    if (this.authSaveSlots.length === 0) {
      return ["帳號存檔：尚無摘要"];
    }

    return this.authSaveSlots.slice(0, limit).map((slot, index) => {
      const name = slot.characterName || "未命名角色";
      const level = slot.level ? ` Lv.${slot.level}` : "";
      return `${index + 1}. ${name}${level} / ${this.formatSaveSlot(slot.saveSlot)}`;
    });
  }

  private handleTitleInput() {
    if (!this.keys) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
      this.startGame();
      return;
    }

    if (this.cursors?.left && Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.cycleCharacterClass(-1);
      return;
    }

    if (this.cursors?.right && Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.cycleCharacterClass(1);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.n)) {
      this.cyclePresetName();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      this.createNewSaveSlot();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.l)) {
      this.loadPreviousSaveSlot();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.y)) {
      void this.copyCurrentSaveSlot();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.g)) {
      void this.logoutAuthSession(false);
      return;
    }

    const accountSlotIndex = this.getPressedAccountSaveSlotIndex();
    if (accountSlotIndex !== undefined) {
      this.loadAccountSaveSlot(accountSlotIndex);
    }
  }

  private handleTitleNameKeyDown(event: KeyboardEvent) {
    if (this.gameStarted || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      const nextName = Array.from(this.characterName).slice(0, -1).join("");
      this.setCharacterName(nextName || "旅人");
      return;
    }

    const shortcutKey = event.key.toLowerCase();
    if (["enter", "arrowleft", "arrowright", "r", "l", "y", "n", "g", "1", "2", "3"].includes(shortcutKey)) {
      return;
    }

    if (/^[\p{L}\p{N}_-]$/u.test(event.key) && Array.from(this.characterName).length < 12) {
      this.setCharacterName(`${this.characterName}${event.key}`);
    }
  }

  private setCharacterName(name: string) {
    this.characterName = this.normalizeCharacterName(name);
    this.localPlayerName = this.characterName;
    this.saveCharacterDraft();
    this.updateTitleScreen();
  }

  private normalizeCharacterName(name: string) {
    const normalized = Array.from(name.trim().replace(/\s+/g, "")).slice(0, 12).join("");
    return normalized || "旅人";
  }

  private cyclePresetName() {
    const currentIndex = characterNamePresets.indexOf(this.characterName);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % characterNamePresets.length : 0;
    this.setCharacterName(characterNamePresets[nextIndex]);
    this.showTitleNotice(`角色名稱：${this.characterName}`);
  }

  private cycleCharacterClass(direction: -1 | 1) {
    const currentIndex = characterClassOptions.findIndex((option) => option.className === this.selectedClass);
    const nextIndex = (currentIndex + direction + characterClassOptions.length) % characterClassOptions.length;
    this.selectedClass = characterClassOptions[nextIndex].className;
    this.localClassName = this.selectedClass;
    this.saveCharacterDraft();
    this.updateTitleScreen();
    this.showTitleNotice(`職業：${characterClassOptions[nextIndex].label}`);
  }

  private getSelectedClassOption() {
    return characterClassOptions.find((option) => option.className === this.selectedClass) ?? characterClassOptions[0];
  }

  private getClassLabel(className: CharacterClass) {
    return characterClassOptions.find((option) => option.className === className)?.label ?? "劍士";
  }

  private getPrimarySkill() {
    return SKILL_DEFINITIONS[CLASS_SKILL_IDS[this.localClassName]];
  }

  private isCharacterClass(value: unknown): value is CharacterClass {
    return characterClassOptions.some((option) => option.className === value);
  }

  private getCharacterDrafts() {
    try {
      return JSON.parse(window.localStorage.getItem(clientStorageKeys.characterDrafts) ?? "{}") as Record<
        string,
        {
          name?: string;
          className?: CharacterClass;
        }
      >;
    } catch {
      return {};
    }
  }

  private loadCharacterDraft() {
    const saveSlot = this.currentSaveSlot || this.getSaveSlot();
    const draft = this.getCharacterDrafts()[saveSlot];
    this.characterName = this.normalizeCharacterName(draft?.name ?? characterNamePresets[0]);
    this.selectedClass = this.isCharacterClass(draft?.className) ? draft.className : "swordsman";
    this.localPlayerName = this.characterName;
    this.localClassName = this.selectedClass;
  }

  private saveCharacterDraft() {
    const saveSlot = this.currentSaveSlot || this.getSaveSlot();
    try {
      const drafts = this.getCharacterDrafts();
      drafts[saveSlot] = {
        name: this.characterName,
        className: this.selectedClass
      };
      window.localStorage.setItem(clientStorageKeys.characterDrafts, JSON.stringify(drafts));
    } catch {
      // localStorage can be unavailable; the active session still keeps the selected character data in memory.
    }
  }

  private resetCharacterDraftForSlot() {
    this.characterName = characterNamePresets[0];
    this.selectedClass = "swordsman";
    this.localPlayerName = this.characterName;
    this.localClassName = this.selectedClass;
    this.saveCharacterDraft();
    this.updateTitleScreen();
  }

  private startGame() {
    if (this.gameStarted) {
      return;
    }

    this.characterName = this.normalizeCharacterName(this.characterName);
    this.localPlayerName = this.characterName;
    this.localClassName = this.selectedClass;
    this.saveCharacterDraft();
    this.removeGoogleButton();
    this.gameStarted = true;
    this.titleOverlay?.destroy(true);
    this.titleOverlay = undefined;
    this.titleSlotText = undefined;
    this.titleCharacterText = undefined;
    this.titleAuthText = undefined;
    this.titleNoticeText = undefined;

    this.addNpcs();
    this.addHud();
    this.addPlayer();
    this.addPlatforms();
    this.connect();
  }

  update() {
    if (!this.keys || !this.cursors) {
      return;
    }

    if (!this.gameStarted) {
      this.handleTitleInput();
      return;
    }

    if (!this.player) {
      return;
    }

    if (this.localHp <= 0) {
      this.player.setVelocityX(0);
      this.promptText?.setVisible(false);
      return;
    }

    this.updateActionPrompt();
    this.updateZoneBanner();
    this.updateQuestTracker();

    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.w);
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.k);
    const skill = Phaser.Input.Keyboard.JustDown(this.keys.j);
    const interact = Phaser.Input.Keyboard.JustDown(this.keys.e);
    const pickup = Phaser.Input.Keyboard.JustDown(this.keys.f);
    const buy = Phaser.Input.Keyboard.JustDown(this.keys.b);
    const toggleInventory = Phaser.Input.Keyboard.JustDown(this.keys.i);
    const toggleQuest = Phaser.Input.Keyboard.JustDown(this.keys.q);
    const toggleShop = Phaser.Input.Keyboard.JustDown(this.keys.o);
    const toggleCharacter = Phaser.Input.Keyboard.JustDown(this.keys.c);
    const toggleSave = Phaser.Input.Keyboard.JustDown(this.keys.p);
    const toggleSettings = Phaser.Input.Keyboard.JustDown(this.keys.v);
    const toggleAudioMute = Phaser.Input.Keyboard.JustDown(this.keys.m);
    const cycleShopItem = Phaser.Input.Keyboard.JustDown(this.keys.n);
    const createNewSave = Phaser.Input.Keyboard.JustDown(this.keys.r);
    const loadPreviousSave = Phaser.Input.Keyboard.JustDown(this.keys.l);
    const copySaveSlot = Phaser.Input.Keyboard.JustDown(this.keys.y);
    const logoutAuth = Phaser.Input.Keyboard.JustDown(this.keys.g);
    const usePotion = Phaser.Input.Keyboard.JustDown(this.keys.one);
    const equipWeapon = Phaser.Input.Keyboard.JustDown(this.keys.two);
    const equipArmor = Phaser.Input.Keyboard.JustDown(this.keys.three);
    const accountSlotIndex = usePotion ? 0 : equipWeapon ? 1 : equipArmor ? 2 : undefined;
    let skillFired = false;

    if (toggleInventory) {
      this.inventoryPanelVisible = !this.inventoryPanelVisible;
      this.syncPanelVisibility();
    }

    if (toggleQuest) {
      this.questPanelVisible = !this.questPanelVisible;
      this.syncPanelVisibility();
    }

    if (toggleCharacter) {
      this.characterPanelVisible = !this.characterPanelVisible;
      this.syncPanelVisibility();
    }

    if (toggleShop) {
      if (this.openShop) {
        this.shopPanelVisible = !this.shopPanelVisible;
        this.syncPanelVisibility();
      } else {
        this.showDialogue("目前沒有開啟商店。");
      }
    }

    if (toggleSave) {
      this.savePanelVisible = !this.savePanelVisible;
      this.syncPanelVisibility();
      this.updateSavePanel();
    }

    if (toggleSettings) {
      this.settingsPanelVisible = !this.settingsPanelVisible;
      this.syncPanelVisibility();
      this.updateSettingsPanel();
    }

    if (toggleAudioMute) {
      this.audio.setMuted(!this.audio.isMuted());
      this.updateSettingsPanel();
      this.showDialogue(this.audio.isMuted() ? "音效已關閉。" : "音效已開啟。");
    }

    if (this.settingsPanelVisible && cycleShopItem) {
      this.adjustAudioVolume(-0.1);
      return;
    }

    if (this.settingsPanelVisible && buy) {
      this.adjustAudioVolume(0.1);
      return;
    }

    if (createNewSave && this.savePanelVisible) {
      this.createNewSaveSlot();
      return;
    }

    if (loadPreviousSave && this.savePanelVisible) {
      this.loadPreviousSaveSlot();
      return;
    }

    if (copySaveSlot && this.savePanelVisible) {
      void this.copyCurrentSaveSlot();
    }

    if (logoutAuth && this.savePanelVisible) {
      void this.logoutAuthSession(true);
      return;
    }

    if (accountSlotIndex !== undefined && this.savePanelVisible) {
      this.loadAccountSaveSlot(accountSlotIndex);
      return;
    }

    if (cycleShopItem && this.openShop) {
      this.selectedShopIndex = (this.selectedShopIndex + 1) % this.openShop.items.length;
      this.updateShopPanel();
    }

    if (left) {
      this.player.setVelocityX(-moveSpeed);
      this.facing = "left";
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(moveSpeed);
      this.facing = "right";
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(jumpSpeed);
    }

    if (attack) {
      this.audio.playAttackSound(false);
      this.flashHitbox(false);
      this.sendAttack(false);
    }

    if (skill) {
      if (this.canUsePrimarySkill()) {
        skillFired = true;
        this.audio.playAttackSound(true, this.getPrimarySkill().id);
        this.flashHitbox(true);
        this.sendAttack(true);
      } else {
        this.showSkillBlocked();
      }
    }

    if (interact && this.nearbyNpcId) {
      this.sendNpcInteract(this.nearbyNpcId);
    }

    if (pickup && this.nearbyDropId) {
      this.sendItemPickup(this.nearbyDropId);
    }

    if (buy && this.openShop && this.nearbyNpcId === this.openShop.npcId) {
      const offer = this.openShop.items[this.selectedShopIndex] ?? this.openShop.items[0];
      if (offer) {
        this.sendShopBuy(this.openShop.npcId, offer.itemId, 1);
      }
    }

    if (usePotion) {
      this.sendUseItem("small-hp-potion");
    }

    if (equipWeapon) {
      this.sendEquipItem("training-sword");
    }

    if (equipArmor) {
      this.sendEquipItem("cloth-vest");
    }

    this.updateSkillCooldownHud();
    this.sendPlayerUpdate(attack ? "attack" : skillFired ? "skill" : this.getAnimation(left || right));
  }

  private createGeneratedTextures() {
    const g = this.add.graphics();

    g.fillStyle(0xf4d7aa);
    g.fillRect(12, 5, 12, 11);
    g.fillStyle(0x2b1d2a);
    g.fillRect(10, 2, 16, 5);
    g.fillStyle(0x234f65);
    g.fillRect(8, 16, 20, 18);
    g.fillStyle(0xd1a14e);
    g.fillRect(10, 19, 16, 4);
    g.fillStyle(0x182336);
    g.fillRect(10, 34, 7, 6);
    g.fillRect(20, 34, 7, 6);
    g.generateTexture("player", 36, 42);
    g.clear();
    g.destroy();
  }

  private addBackground() {
    const mapCenterX = FOG_HARBOR_TEST_MAP.width / 2;
    this.add.rectangle(mapCenterX, 160, FOG_HARBOR_TEST_MAP.width, 320, 0x1d3552).setScrollFactor(1);
    this.add.rectangle(mapCenterX, 420, FOG_HARBOR_TEST_MAP.width, 172, 0x23423d).setScrollFactor(1);
    this.add.rectangle(mapCenterX, 506, FOG_HARBOR_TEST_MAP.width, 34, 0x2d2528).setScrollFactor(1);
    this.add.rectangle(mapCenterX, 522, FOG_HARBOR_TEST_MAP.width, 20, 0x5b4c43).setScrollFactor(1);

    for (const x of [160, 540, 940, 1320, 1660, 2060, 2280]) {
      this.add.circle(x, 88, 32, 0xd9e6e5, 0.18);
      this.add.circle(x + 30, 78, 24, 0xd9e6e5, 0.12);
      this.add.circle(x - 28, 80, 20, 0xd9e6e5, 0.1);
    }

    this.add.rectangle(330, 132, 190, 150, 0x8b4a3a);
    this.add.rectangle(330, 45, 226, 45, 0x263047);
    this.add.rectangle(330, 70, 246, 18, 0x1b2238);
    this.add.rectangle(700, 172, 260, 190, 0x745f45);
    this.add.rectangle(700, 70, 304, 54, 0x263047);
    this.add.rectangle(700, 102, 324, 18, 0x1b2238);
    this.add.rectangle(1510, 190, 120, 250, 0x6b6f7c);
    this.add.rectangle(1510, 42, 150, 42, 0xf0d68a);
    this.add.circle(1510, 42, 34, 0xf0d68a, 0.22);
    this.add.rectangle(2010, 432, 290, 44, 0x315f58);
    this.add.rectangle(2010, 454, 330, 16, 0x8eb8ac);

    for (const x of [250, 420, 600, 780, 1020, 1280, 1600, 1840, 2140]) {
      this.add.rectangle(x, 444, 8, 64, 0x2b1d2a);
      this.add.circle(x, 402, 18, 0xe0a84f, 0.85);
      this.add.circle(x, 402, 28, 0xe0a84f, 0.14);
    }

    for (const zone of FOG_HARBOR_TEST_MAP.safeZones) {
      this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0x5ac06f, 0.14);
      this.add.text(zone.x - 52, zone.y - zone.height / 2 + 18, zone.name, {
        fontSize: "13px",
        color: "#91f0a5"
      });
    }
    this.addSignpost(1320, 456, "往右：燈塔營地");
    this.addSignpost(1600, 456, "往右：潮汐林道");
    this.addSignpost(1980, 456, "注意：海霧史萊姆");
    this.add.text(54, 42, FOG_HARBOR_TEST_MAP.name, {
      fontSize: "26px",
      color: "#f6ead2",
      stroke: "#111923",
      strokeThickness: 4
    });
    this.add.text(54, 80, "A/D 移動 | W 跳躍 | K 攻擊 | J 靈斬 | E 對話 | F 拾取 | I/Q/C/O/P 面板", {
      fontSize: "14px",
      color: "#d8cfae",
      fixedWidth: 880,
      wordWrap: { width: 880 }
    });
  }

  private addSignpost(x: number, y: number, text: string) {
    this.add.rectangle(x, y, 10, 62, 0x5b3a24);
    this.add.rectangle(x + 52, y - 34, 116, 34, 0x7a5131);
    this.add.rectangle(x + 52, y - 34, 108, 26, 0x2d2528);
    this.add.text(x + 2, y - 44, text, {
      fontSize: "12px",
      color: "#f6ead2",
      fixedWidth: 104,
      align: "center",
      wordWrap: { width: 104 }
    });
  }

  private addNpcs() {
    for (const npc of FOG_HARBOR_TEST_MAP.npcs) {
      this.add.rectangle(npc.x, npc.y - 24, 24, 44, 0x3e6f8f);
      this.add.rectangle(npc.x, npc.y - 50, 34, 10, 0xd9a441);
      this.add.circle(npc.x, npc.y - 54, 10, 0xf2c078);
      this.add.text(npc.x - 42, npc.y - 84, npc.name, {
        fontSize: "12px",
        color: "#f2efe6",
        backgroundColor: "#00000066",
        padding: { x: 4, y: 3 }
      });
    }
  }

  private addPlatforms() {
    if (!this.player) {
      return;
    }

    for (const platformData of FOG_HARBOR_TEST_MAP.platforms) {
      const platform = this.add.rectangle(
        platformData.x,
        platformData.y,
        platformData.width,
        platformData.height,
        0x67442b
      );
      this.add.rectangle(
        platformData.x,
        platformData.y - platformData.height / 2 + 3,
        platformData.width,
        6,
        0x2f7d44
      );
      this.physics.add.existing(platform, true);

      const body = platform.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(platformData.width, platformData.height);
      body.updateFromGameObject();
      this.physics.add.collider(this.player, platform);
    }
  }

  private addHud() {
    this.currentSaveSlot = this.getSaveSlot();
    this.previousSaveSlot = this.getPreviousSaveSlot();

    this.statusText = this.add
      .text(18, 18, "連線中...", {
        fontSize: "14px",
        color: "#f2efe6",
        backgroundColor: "#00000088",
        padding: { x: 8, y: 6 }
      })
      .setScrollFactor(0);

    this.levelText = this.add
      .text(18, 54, `${this.characterName} | 等級 1`, {
        fontSize: "14px",
        color: "#f2efe6",
        backgroundColor: "#00000088",
        padding: { x: 8, y: 6 }
      })
      .setScrollFactor(0);

    this.expBack = this.add.rectangle(95, 72, 184, 12, 0x181018).setOrigin(0, 0.5).setScrollFactor(0);
    this.expFill = this.add.rectangle(97, 72, 0, 8, 0x5ac06f).setOrigin(0, 0.5).setScrollFactor(0);
    this.expText = this.add
      .text(290, 63, "經驗 0/60", {
        fontSize: "12px",
        color: "#d8cfae"
      })
      .setScrollFactor(0);

    this.hpBack = this.add.rectangle(95, 104, 184, 12, 0x181018).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpFill = this.add.rectangle(97, 104, 180, 8, 0xd94a38).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpText = this.add
      .text(18, 95, "生命 100/100", {
        fontSize: "12px",
        color: "#f2efe6"
      })
      .setScrollFactor(0);

    this.mpBack = this.add.rectangle(95, 128, 184, 12, 0x181018).setOrigin(0, 0.5).setScrollFactor(0);
    this.mpFill = this.add.rectangle(97, 128, 180, 8, 0x4aa4d9).setOrigin(0, 0.5).setScrollFactor(0);
    this.mpText = this.add
      .text(18, 119, `法力 ${maxPlayerMp}/${maxPlayerMp}`, {
        fontSize: "12px",
        color: "#f2efe6"
      })
      .setScrollFactor(0);

    this.goldText = this.add
      .text(18, 144, "金幣 0", {
        fontSize: "12px",
        color: "#ffd36d"
      })
      .setScrollFactor(0);

    const primarySkill = this.getPrimarySkill();
    this.skillText = this.add
      .text(18, 166, `J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | 可施放`, {
        fontSize: "12px",
        color: "#7ed7ff",
        backgroundColor: "#00000066",
        padding: { x: 8, y: 5 }
      })
      .setScrollFactor(0);

    this.inventoryPanel = this.addUiPanel(18, 194, 250, 146, "背包");
    this.questPanel = this.addUiPanel(gameWidth - 310, 18, 292, 154, "任務");
    this.characterPanel = this.addUiPanel(gameWidth - 310, 184, 292, 176, "角色");
    this.shopPanel = this.addUiPanel(gameWidth / 2 - 190, gameHeight - 390, 380, 206, "商店");
    this.savePanel = this.addUiPanel(18, 328, 306, 180, "存檔");
    this.settingsPanel = this.addUiPanel(gameWidth - 310, 372, 292, 112, "設定");
    this.shopPanel.container.setVisible(false);
    this.savePanel.container.setVisible(false);
    this.settingsPanel.container.setVisible(false);
    this.updateInventoryHud();
    this.updateQuestTracker();
    this.updateCharacterPanel();
    this.updateShopPanel();
    this.updateSavePanel();
    this.updateSettingsPanel();

    this.zoneText = this.add
      .text(gameWidth / 2, 28, "", {
        fontSize: "18px",
        color: "#f6ead2",
        backgroundColor: "#00000088",
        padding: { x: 16, y: 8 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false);

    this.dialogueText = this.add
      .text(gameWidth / 2, gameHeight - 72, "", {
        fontSize: "15px",
        color: "#f2efe6",
        backgroundColor: "#000000cc",
        padding: { x: 14, y: 10 },
        fixedWidth: 520,
        align: "center"
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false);

    this.promptText = this.add
      .text(gameWidth / 2, gameHeight - 126, "E 對話", {
        fontSize: "14px",
        color: "#181018",
        backgroundColor: "#f2efe6",
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false);
  }

  private addUiPanel(x: number, y: number, width: number, height: number, title: string): UiPanel {
    return createUiPanel(this, x, y, width, height, title);
  }

  private syncPanelVisibility() {
    this.inventoryPanel?.container.setVisible(this.inventoryPanelVisible);
    this.questPanel?.container.setVisible(this.questPanelVisible);
    this.characterPanel?.container.setVisible(this.characterPanelVisible);
    this.shopPanel?.container.setVisible(this.shopPanelVisible && Boolean(this.openShop));
    this.savePanel?.container.setVisible(this.savePanelVisible);
    this.settingsPanel?.container.setVisible(this.settingsPanelVisible);
  }

  private addPlayer() {
    this.player = this.physics.add.sprite(FOG_HARBOR_TEST_MAP.playerSpawn.x, FOG_HARBOR_TEST_MAP.playerSpawn.y, "player");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 34);
    this.player.body.setOffset(8, 8);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, FOG_HARBOR_TEST_MAP.width, FOG_HARBOR_TEST_MAP.height);
  }

  private connect() {
    const wsUrl = this.getWsUrl();
    this.ws = new WebSocket(wsUrl);

    this.ws.addEventListener("open", () => {
      this.statusText?.setText(`已連線 | 存檔 ${this.formatSaveSlot(this.currentSaveSlot)}`);
    });

    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data.toString()) as ServerMessage;

      if (message.type === "session:welcome") {
        this.playerId = message.playerId;
        if (this.authSessionId && !message.authenticated) {
          this.clearAuthSession(false);
        }
        if (message.saveSlot) {
          this.currentSaveSlot = message.saveSlot;
          this.persistCurrentSaveSlot(message.saveSlot);
          this.updateSavePanel();
          this.statusText?.setText(
            message.authenticated
              ? `已連線 | Google | 存檔 ${this.formatSaveSlot(message.saveSlot)}`
              : `已連線 | 存檔 ${this.formatSaveSlot(message.saveSlot)}`
          );
        }
        return;
      }

      if (message.type === "world:snapshot") {
        this.applySnapshot(message.players, message.monsters, message.itemDrops);
        return;
      }

      if (message.type === "inventory:update" && message.playerId === this.playerId) {
        this.inventory = message.slots;
        this.updateInventoryHud();
        return;
      }

      if (message.type === "equipment:update" && message.playerId === this.playerId) {
        this.equipment = message.equipment;
        this.localAttack = message.attack;
        this.localDefense = message.defense;
        this.updateInventoryHud();
        this.updateCharacterPanel();
        return;
      }

      if (message.type === "item:notice" && message.playerId === this.playerId) {
        this.showDialogue(message.text);
        if (message.healed && message.healed > 0) {
          this.showHeal(message.healed);
        }
        return;
      }

      if (message.type === "quest:update" && message.playerId === this.playerId) {
        this.quests.set(message.quest.id, message.quest);
        this.updateQuestTracker();
        return;
      }

      if (message.type === "quest:notice" && message.playerId === this.playerId) {
        this.showDialogue(message.text);
        if (message.rewardExp || message.rewardGold) {
          this.showReward(message.rewardExp ?? 0, message.rewardGold ?? 0);
        }
        return;
      }

      if (message.type === "shop:open" && message.playerId === this.playerId) {
        this.openShop = message.shop;
        this.selectedShopIndex = 0;
        this.shopPanelVisible = true;
        this.updateShopPanel();
        const offer = message.shop.items[0];
        if (offer) {
          this.showDialogue(
            `${message.shop.name}：按 N 選商品，按 B 購買 ${ITEM_DEFINITIONS[offer.itemId].name} x${offer.quantity}。`
          );
        }
        return;
      }

      if (message.type === "shop:notice" && message.playerId === this.playerId) {
        this.showDialogue(message.text);
        return;
      }

      if (message.type === "skill:notice" && message.playerId === this.playerId) {
        this.localMp = message.mp;
        if (message.cooldownRemainingMs && message.cooldownRemainingMs > 0) {
          this.skillReadyAt = this.time.now + message.cooldownRemainingMs;
        }
        this.updateSkillCooldownHud();
        this.showDialogue(message.text);
        return;
      }

      if (message.type === "combat:hit") {
        this.showDamage(message.monsterId, message.damage, message.defeated, message.isSkill, message.skillId);
        if (message.playerId === this.playerId) {
          this.audio.playHitSound(message.isSkill, message.defeated, message.skillId);
          if (message.isSkill) {
            this.cameras.main.shake(90, 0.0014);
          }
          if (message.expGained > 0) {
            this.showExpGain(message.expGained);
          }
        }
        return;
      }

      if (message.type === "combat:miss" && message.playerId === this.playerId) {
        this.showMiss(message.isSkill, message.skillId);
        return;
      }

      if (message.type === "player:level-up" && message.playerId === this.playerId) {
        this.showLevelUp(message.level);
        return;
      }

      if (message.type === "player:damaged" && message.playerId === this.playerId) {
        this.localHp = message.hp;
        this.showPlayerDamage(message.damage, message.defeated);
        return;
      }

      if (message.type === "player:respawn" && message.playerId === this.playerId) {
        this.respawnLocalPlayer(message.x, message.y);
        return;
      }

      if (message.type === "chat:notice" && message.playerId === this.playerId) {
        this.showDialogue(message.text);
        return;
      }

      if (message.type === "admin:notice") {
        this.showDialogue(`教師公告：${message.text}`);
      }
    });

    this.ws.addEventListener("close", () => {
      this.statusText?.setText("伺服器連線中斷");
    });
  }

  private getWsUrl() {
    const params = new URLSearchParams({
      slot: this.currentSaveSlot || this.getSaveSlot()
    });
    const sessionId = this.authSessionId || this.getAuthSessionId();
    if (sessionId) {
      params.set("session", sessionId);
    }
    const query = `?${params.toString()}`;
    const host = window.location.hostname;
    if (isDevFrontend()) {
      return `ws://${host}:8787${query}`;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws${query}`;
  }

  private getAuthUrl() {
    return this.getApiUrl("/auth/google");
  }

  private getApiUrl(path: string) {
    const host = window.location.hostname;
    if (isDevFrontend()) {
      return `http://${host}:8787${path}`;
    }

    return `${window.location.origin}${path}`;
  }

  private loadStoredAuthSession() {
    const storedSession = this.getStoredAuthSession();
    this.authSessionId = storedSession?.sessionId ?? "";
    this.authAccountLabel = this.formatAccountLabel(storedSession?.account);
    this.authSaveSlots = storedSession?.saveSlots ?? [];
  }

  private getAuthSessionId() {
    return this.getStoredAuthSession()?.sessionId ?? "";
  }

  private getStoredAuthSession(): StoredAuthSession | undefined {
    try {
      const raw = window.localStorage.getItem(clientStorageKeys.authSession);
      if (!raw) {
        return undefined;
      }

      const session = JSON.parse(raw) as {
        sessionId?: unknown;
        expiresAt?: unknown;
        account?: AuthAccountSummary;
        saveSlots?: AuthSaveSlotSummary[];
      };
      if (typeof session.sessionId !== "string") {
        return undefined;
      }

      if (typeof session.expiresAt === "number" && session.expiresAt <= Date.now()) {
        window.localStorage.removeItem(clientStorageKeys.authSession);
        return undefined;
      }

      return {
        sessionId: session.sessionId,
        expiresAt:
          typeof session.expiresAt === "number" ? session.expiresAt : Date.now() + 7 * 24 * 60 * 60 * 1000,
        account: session.account,
        saveSlots: session.saveSlots
      };
    } catch {
      return undefined;
    }
  }

  private persistAuthSession(
    sessionId: string,
    expiresAt: number | undefined,
    account?: AuthAccountSummary,
    saveSlots?: AuthSaveSlotSummary[]
  ) {
    try {
      window.localStorage.setItem(
        clientStorageKeys.authSession,
        JSON.stringify({
          sessionId,
          expiresAt: expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
          account,
          saveSlots
        })
      );
    } catch {
      // The login still works for the current scene even if browser storage is blocked.
    }
  }

  private getSaveSlot() {
    try {
      const existing = window.localStorage.getItem(clientStorageKeys.saveSlot);
      if (existing) {
        this.currentSaveSlot = existing;
        return existing;
      }

      const nextSlot = this.generateSaveSlot();
      window.localStorage.setItem(clientStorageKeys.saveSlot, nextSlot);
      this.currentSaveSlot = nextSlot;
      return nextSlot;
    } catch {
      this.currentSaveSlot = "browser-fallback-slot";
      return "browser-fallback-slot";
    }
  }

  private getPreviousSaveSlot() {
    try {
      return window.localStorage.getItem(clientStorageKeys.previousSaveSlot) ?? "";
    } catch {
      return "";
    }
  }

  private generateSaveSlot() {
    return window.crypto?.randomUUID?.() ?? `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private persistCurrentSaveSlot(saveSlot: string) {
    try {
      window.localStorage.setItem(clientStorageKeys.saveSlot, saveSlot);
    } catch {
      // localStorage can be unavailable in privacy modes; the in-memory slot still works for this session.
    }
  }

  private setSaveSlot(nextSaveSlot: string, rememberPrevious: boolean) {
    const current = this.currentSaveSlot || this.getSaveSlot();
    if (rememberPrevious && current && current !== nextSaveSlot) {
      this.previousSaveSlot = current;
    }

    this.currentSaveSlot = nextSaveSlot;

    try {
      window.localStorage.setItem(clientStorageKeys.saveSlot, nextSaveSlot);
      if (this.previousSaveSlot) {
        window.localStorage.setItem(clientStorageKeys.previousSaveSlot, this.previousSaveSlot);
      }
    } catch {
      // The game can continue with an in-memory save slot if browser storage is blocked.
    }

    this.updateSavePanel();
    this.updateTitleScreen();
  }

  private createNewSaveSlot() {
    const nextSlot = this.generateSaveSlot();
    this.setSaveSlot(nextSlot, true);
    this.resetCharacterDraftForSlot();
    this.restartForSaveSlot(`已建立新存檔：${this.formatSaveSlot(nextSlot)}。`);
  }

  private loadPreviousSaveSlot() {
    const previous = this.previousSaveSlot || this.getPreviousSaveSlot();
    if (!previous) {
      this.showSaveMessage("沒有上一個存檔。");
      return;
    }

    const current = this.currentSaveSlot || this.getSaveSlot();
    this.previousSaveSlot = current;
    this.setSaveSlot(previous, false);
    this.loadCharacterDraft();
    this.updateTitleScreen();

    try {
      window.localStorage.setItem(clientStorageKeys.previousSaveSlot, current);
    } catch {
      // Keep the swap in memory if browser storage is blocked.
    }

    this.restartForSaveSlot(`已載入存檔：${this.formatSaveSlot(previous)}。`);
  }

  private restartForSaveSlot(message: string) {
    if (!this.gameStarted) {
      this.updateTitleScreen();
      this.showTitleNotice(message);
      return;
    }

    this.showDialogue(message);
    this.ws?.close();
    this.scene.restart();
  }

  private showSaveMessage(text: string) {
    if (this.gameStarted) {
      this.showDialogue(text);
      return;
    }

    this.showTitleNotice(text);
  }

  private async copyCurrentSaveSlot() {
    const saveSlot = this.currentSaveSlot || this.getSaveSlot();
    if (!navigator.clipboard?.writeText) {
      this.showSaveMessage("目前無法使用剪貼簿。");
      return;
    }

    try {
      await navigator.clipboard.writeText(saveSlot);
      this.showSaveMessage("已複製目前存檔代碼。");
    } catch {
      this.showSaveMessage("無法複製存檔代碼。");
    }
  }

  private updateSavePanel() {
    if (!this.savePanel) {
      return;
    }

    const saveSlot = this.currentSaveSlot || this.getSaveSlot();
    const previous = this.previousSaveSlot || this.getPreviousSaveSlot();
    const accountLine = this.authSessionId ? `帳號：${this.authAccountLabel || "Google 已登入"}` : "帳號：未登入";
    const accountSlots =
      this.authSaveSlots.length > 0
        ? this.authSaveSlots
            .slice(0, 3)
            .map((slot) => {
              const name = slot.characterName ? `${slot.characterName}` : "未命名角色";
              const level = slot.level ? ` Lv.${slot.level}` : "";
              return `- ${name}${level} / ${this.formatSaveSlot(slot.saveSlot)}`;
            })
        : ["- 尚無帳號存檔摘要"];
    this.savePanel.body.setText(
      [
        `目前：${this.formatSaveSlot(saveSlot)}`,
        `上一個：${previous ? this.formatSaveSlot(previous) : "無"}`,
        accountLine,
        ...accountSlots,
        "",
        "P 關閉 | R 新角色",
        "L 上一個 | Y 複製 | G 登出"
      ].join("\n")
    );
  }

  private formatSaveSlot(saveSlot: string) {
    if (saveSlot.length <= 12) {
      return saveSlot;
    }

    return `${saveSlot.slice(0, 8)}...${saveSlot.slice(-4)}`;
  }

  private applySnapshot(players: PlayerSnapshot[], monsters: MonsterSnapshot[], itemDrops: ItemDropSnapshot[]) {
    this.applyPlayerSnapshot(players);
    this.applyMonsterSnapshot(monsters);
    this.applyItemDropSnapshot(itemDrops);
  }

  private applyPlayerSnapshot(players: PlayerSnapshot[]) {
    for (const player of players) {
      if (player.id === this.playerId) {
        this.updateHud(player);
        continue;
      }

      let marker = this.remotePlayers.get(player.id);
      if (!marker) {
        marker = this.add.rectangle(player.x, player.y, 26, 38, 0xd9a441);
        this.remotePlayers.set(player.id, marker);
      }

      marker.setPosition(player.x, player.y);
      marker.setAlpha(player.hp > 0 ? 1 : 0.35);
    }

    const liveIds = new Set(players.map((player) => player.id));
    for (const [id, marker] of this.remotePlayers) {
      if (!liveIds.has(id)) {
        marker.destroy();
        this.remotePlayers.delete(id);
      }
    }
  }

  private applyMonsterSnapshot(monsters: MonsterSnapshot[]) {
    for (const monster of monsters) {
      const view = this.getOrCreateMonsterView(monster);
      view.body.setPosition(monster.x, monster.y);
      view.body.setAlpha(monster.alive ? 1 : 0.25);
      view.eye.setPosition(monster.x + 8, monster.y - 4);
      view.eye.setAlpha(monster.alive ? 1 : 0.1);
      view.hpBack.setPosition(monster.x, monster.y - 28);
      view.hpFill.setPosition(monster.x - 18, monster.y - 28);
      view.label.setPosition(monster.x - 28, monster.y - 52);
      view.label.setAlpha(monster.alive ? 1 : 0.3);

      const hpRatio = monster.maxHp === 0 ? 0 : Phaser.Math.Clamp(monster.hp / monster.maxHp, 0, 1);
      view.hpFill.setDisplaySize(36 * hpRatio, 5);
      view.hpFill.setAlpha(monster.alive ? 1 : 0);
      view.hpBack.setAlpha(monster.alive ? 1 : 0);

      if (monster.hitAt > view.lastHitAt) {
        view.lastHitAt = monster.hitAt;
        view.body.setFillStyle(0xf2efe6);
        this.time.delayedCall(80, () => {
          view.body.setFillStyle(this.getMonsterColor(monster.kind));
        });
      }
    }

    const liveIds = new Set(monsters.map((monster) => monster.id));
    for (const [id, view] of this.monsters) {
      if (!liveIds.has(id)) {
        view.body.destroy();
        view.eye.destroy();
        view.hpBack.destroy();
        view.hpFill.destroy();
        view.label.destroy();
        this.monsters.delete(id);
      }
    }
  }

  private applyItemDropSnapshot(itemDrops: ItemDropSnapshot[]) {
    for (const drop of itemDrops) {
      const view = this.getOrCreateItemDropView(drop);
      view.body.setPosition(drop.x, drop.y - 10);
      view.shine.setPosition(drop.x, drop.y - 18);
      view.label.setPosition(drop.x - 44, drop.y - 44);
    }

    const liveIds = new Set(itemDrops.map((drop) => drop.id));
    for (const [id, view] of this.itemDrops) {
      if (!liveIds.has(id)) {
        view.body.destroy();
        view.shine.destroy();
        view.label.destroy();
        this.itemDrops.delete(id);
      }
    }
  }

  private getOrCreateItemDropView(drop: ItemDropSnapshot) {
    let view = this.itemDrops.get(drop.id);
    if (view) {
      return view;
    }

    const body = this.add.rectangle(drop.x, drop.y - 10, 24, 18, 0xd94a38);
    const shine = this.add.circle(drop.x, drop.y - 18, 4, 0xf2efe6, 0.85);
    const label = this.add.text(drop.x - 44, drop.y - 44, `${drop.name} x${drop.quantity}`, {
      fontSize: "11px",
      color: "#f2efe6",
      backgroundColor: "#00000066",
      padding: { x: 4, y: 3 }
    });

    this.tweens.add({
      targets: [body, shine],
      y: "-=3",
      duration: 520,
      yoyo: true,
      repeat: -1
    });

    view = { body, shine, label };
    this.itemDrops.set(drop.id, view);
    return view;
  }

  private getOrCreateMonsterView(monster: MonsterSnapshot) {
    let view = this.monsters.get(monster.id);
    if (view) {
      return view;
    }

    const body = this.add.rectangle(
      monster.x,
      monster.y,
      monster.kind === "mist-slime" ? 40 : 34,
      monster.kind === "mist-slime" ? 28 : 24,
      this.getMonsterColor(monster.kind)
    );
    const eye = this.add.circle(monster.x + 8, monster.y - 4, 3, monster.kind === "mist-slime" ? 0x123034 : 0xf2efe6);
    const hpBack = this.add.rectangle(monster.x, monster.y - 28, 40, 7, 0x2b1f1c).setOrigin(0.5);
    const hpFill = this.add.rectangle(monster.x - 18, monster.y - 28, 36, 5, 0xd94a38).setOrigin(0, 0.5);
    const label = this.add.text(monster.x - 28, monster.y - 52, monster.name, {
      fontSize: "11px",
      color: "#f2efe6"
    });

    this.tweens.add({
      targets: eye,
      y: eye.y - 2,
      duration: 360,
      yoyo: true,
      repeat: -1
    });

    view = { body, eye, hpBack, hpFill, label, lastHitAt: monster.hitAt };
    this.monsters.set(monster.id, view);
    return view;
  }

  private getMonsterColor(kind: MonsterSnapshot["kind"]) {
    return kind === "mist-slime" ? 0x49b8ad : 0xa84f3c;
  }

  private sendPlayerUpdate(animation: PlayerAnimation) {
    const now = this.time.now;
    if (now - this.lastPlayerUpdateAt < 1000 / 20) {
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.player || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.lastPlayerUpdateAt = now;
    this.ws.send(
      JSON.stringify({
        type: "player:update",
        player: {
          id: this.playerId,
          name: this.characterName,
          className: this.selectedClass,
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          facing: this.facing,
          animation
        }
      })
    );
  }

  private sendAttack(isSkill: boolean) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    const primarySkill = this.getPrimarySkill();
    this.ws.send(
      JSON.stringify({
        type: "combat:attack",
        attackId: `${this.playerId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        isSkill,
        skillId: isSkill ? primarySkill.id : undefined
      })
    );
  }

  private sendNpcInteract(npcId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "npc:interact",
        npcId
      })
    );
  }

  private sendItemPickup(dropId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "item:pickup",
        dropId
      })
    );
  }

  private sendUseItem(itemId: ItemId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "inventory:use",
        itemId
      })
    );
  }

  private sendEquipItem(itemId: ItemId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "inventory:equip",
        itemId
      })
    );
  }

  private sendShopBuy(npcId: string, itemId: ItemId, quantity: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "shop:buy",
        npcId,
        itemId,
        quantity
      })
    );
  }

  private getAnimation(isMoving: boolean): PlayerAnimation {
    if (!this.player?.body.blocked.down) {
      return "jump";
    }

    return isMoving ? "run" : "idle";
  }

  private flashHitbox(isSkill: boolean) {
    if (!this.player) {
      return;
    }

    if (!isSkill) {
      this.flashBasicAttack();
      return;
    }

    if (this.localClassName === "swordsman") {
      this.flashSwordCleave();
      return;
    }

    if (this.localClassName === "talisman") {
      this.flashSpiritTalisman();
      return;
    }

    this.flashHunterShot();
  }

  private flashBasicAttack() {
    if (!this.player) {
      return;
    }

    const x = this.player.x + (this.facing === "right" ? 42 : -42);
    const hitbox = this.add.rectangle(x, this.player.y, 58, 34, 0xffd36d, 0.45);
    this.tweens.add({
      targets: hitbox,
      alpha: 0,
      duration: 140,
      onComplete: () => hitbox.destroy()
    });
  }

  private flashSwordCleave() {
    if (!this.player) {
      return;
    }

    const direction = this.facing === "right" ? 1 : -1;
    const x = this.player.x + direction * 52;
    const y = this.player.y - 4;
    const slash = this.add.container(x, y);
    const outer = this.add.rectangle(0, 0, 24, 96, 0x8fe7ff, 0.62).setAngle(direction * -30);
    const inner = this.add.rectangle(direction * 8, 0, 9, 82, 0xf8fdff, 0.86).setAngle(direction * -30);
    const spark = this.add.circle(direction * 24, -26, 9, 0xfff0a6, 0.82);
    slash.add([outer, inner, spark]);
    slash.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: slash,
      x: x + direction * 28,
      scaleX: 1.35,
      scaleY: 0.78,
      alpha: 0,
      duration: 180,
      ease: "Quad.easeOut",
      onComplete: () => slash.destroy()
    });
  }

  private flashSpiritTalisman() {
    if (!this.player) {
      return;
    }

    const direction = this.facing === "right" ? 1 : -1;
    const startX = this.player.x + direction * 30;
    const y = this.player.y - 10;
    const skill = this.getPrimarySkill();
    const travel = Math.min(skill.range, 140) * direction;
    const charm = this.add.container(startX, y);
    const trail = this.add.rectangle(-direction * 24, 0, 52, 6, 0x70ddff, 0.32);
    const paper = this.add.rectangle(0, 0, 18, 26, 0xffe7ad, 0.96);
    const seal = this.add.text(-6, -12, "符", {
      fontSize: "16px",
      color: "#9b2f32",
      stroke: "#fff2c7",
      strokeThickness: 1
    });
    const glow = this.add.circle(0, 0, 18, 0x7ed7ff, 0.18);
    paper.setStrokeStyle(2, 0x9b2f32, 0.85);
    charm.add([glow, trail, paper, seal]);
    charm.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: charm,
      x: startX + travel,
      angle: direction * 12,
      alpha: 0,
      duration: 260,
      ease: "Sine.easeOut",
      onComplete: () => charm.destroy()
    });
  }

  private flashHunterShot() {
    if (!this.player) {
      return;
    }

    const primarySkill = this.getPrimarySkill();
    const direction = this.facing === "right" ? 1 : -1;
    const width = Math.min(primarySkill.range, 150);
    const startX = this.player.x + direction * (width / 2 + 22);
    const y = this.player.y - 7;
    const shot = this.add.container(startX, y);
    const line = this.add.rectangle(0, 0, width, 5, 0xd9f0ff, 0.78);
    const core = this.add.rectangle(direction * 12, 0, width * 0.72, 2, 0xfff4b8, 0.94);
    const tip = this.add.triangle(
      direction * (width / 2 + 8),
      0,
      0,
      0,
      18,
      7,
      0,
      14,
      0xd9f0ff,
      0.9
    );
    tip.setAngle(direction === 1 ? 0 : 180);
    shot.add([line, core, tip]);
    shot.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: shot,
      x: startX + direction * 24,
      alpha: 0,
      scaleX: 1.1,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => shot.destroy()
    });
  }

  private showDamage(monsterId: string, damage: number, defeated: boolean, isSkill = false, skillId?: SkillId) {
    const view = this.monsters.get(monsterId);
    if (!view) {
      return;
    }

    if (isSkill) {
      this.flashSkillImpact(view.body.x, view.body.y, skillId);
    }

    const text = this.add.text(view.body.x - 10, view.body.y - 72, defeated ? "擊破" : `-${damage}`, {
      fontSize: "16px",
      color: defeated ? "#f2efe6" : isSkill ? "#7ed7ff" : "#ffd36d",
      stroke: "#181018",
      strokeThickness: 3
    });
    this.tweens.add({
      targets: text,
      y: text.y - 28,
      alpha: 0,
      duration: 520,
      onComplete: () => text.destroy()
    });
  }

  private flashSkillImpact(x: number, y: number, skillId?: SkillId) {
    const color =
      skillId === "sword-cleave" ? 0xa8edff : skillId === "spirit-talisman" ? 0xffd36d : 0xd9f0ff;
    const ring = this.add.circle(x, y - 18, skillId === "spirit-talisman" ? 24 : 18, color, 0.24);
    const spark = this.add.circle(x, y - 18, 7, 0xffffff, 0.62);
    ring.setStrokeStyle(2, color, 0.9);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    spark.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [ring, spark],
      scale: 1.7,
      alpha: 0,
      duration: 230,
      ease: "Quad.easeOut",
      onComplete: () => {
        ring.destroy();
        spark.destroy();
      }
    });
  }

  private showMiss(isSkill = false, skillId?: SkillId) {
    this.audio.playMissSound(isSkill, skillId);
    if (!this.player) {
      return;
    }

    const direction = this.facing === "right" ? 1 : -1;
    const color = isSkill ? this.getSkillEffectColor(skillId) : "#d8cfae";
    const x = this.player.x + direction * 58;
    const y = this.player.y - 52;
    const text = this.add.text(x - 24, y, isSkill ? "未命中" : "落空", {
      fontSize: "14px",
      color,
      stroke: "#181018",
      strokeThickness: 3
    });
    const marker = this.add.circle(x, y + 12, isSkill ? 16 : 11, Phaser.Display.Color.HexStringToColor(color).color, 0.18);
    marker.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.72);
    marker.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [text, marker],
      x: `+=${direction * 16}`,
      y: "-=18",
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => {
        text.destroy();
        marker.destroy();
      }
    });
  }

  private getSkillEffectColor(skillId?: SkillId) {
    if (skillId === "sword-cleave") {
      return "#a8edff";
    }

    if (skillId === "spirit-talisman") {
      return "#ffd36d";
    }

    if (skillId === "hunter-shot") {
      return "#d9f0ff";
    }

    return "#7ed7ff";
  }

  private adjustAudioVolume(delta: number) {
    this.audio.adjustVolume(delta);
    this.updateSettingsPanel();
    this.showDialogue(`音量：${Math.round(this.audio.getVolume() * 100)}%`);
    this.audio.playVolumePreview();
  }

  private updateSettingsPanel() {
    if (!this.settingsPanel) {
      return;
    }

    this.settingsPanel.body.setText(
      [
        `音效：${this.audio.isMuted() ? "關閉" : "開啟"}`,
        `音量：${Math.round(this.audio.getVolume() * 100)}%`,
        "",
        "V 關閉 | M 靜音",
        "N 降低 | B 提高"
      ].join("\n")
    );
  }

  private updateHud(player: PlayerSnapshot) {
    this.localHp = player.hp;
    this.localMp = player.mp;
    this.localMaxHp = player.maxHp;
    this.localMaxMp = player.maxMp;
    this.localAttack = player.attack;
    this.localDefense = player.defense;
    this.localPlayerName = player.name;
    this.localClassName = player.className;
    this.levelText?.setText(`${player.name} | 等級 ${player.level}`);
    this.expText?.setText(`經驗 ${player.exp}/${player.expToNext}`);
    this.hpText?.setText(`生命 ${player.hp}/${player.maxHp}`);
    this.mpText?.setText(`法力 ${Math.floor(player.mp)}/${player.maxMp}`);
    this.goldText?.setText(`金幣 ${player.gold}`);

    const ratio = Phaser.Math.Clamp(player.exp / player.expToNext, 0, 1);
    this.expFill?.setDisplaySize(180 * ratio, 8);

    const hpRatio = Phaser.Math.Clamp(player.hp / player.maxHp, 0, 1);
    this.hpFill?.setDisplaySize(180 * hpRatio, 8);

    const mpRatio = Phaser.Math.Clamp(player.mp / player.maxMp, 0, 1);
    this.mpFill?.setDisplaySize(180 * mpRatio, 8);
    this.updateSkillCooldownHud();
    this.updateCharacterPanel();
    this.player?.setAlpha(player.hp > 0 ? 1 : 0.35);
  }

  private getSkillCooldownRemainingMs() {
    return Math.max(0, this.skillReadyAt - this.time.now);
  }

  private canUsePrimarySkill() {
    const primarySkill = this.getPrimarySkill();
    return this.localMp >= primarySkill.mpCost && this.getSkillCooldownRemainingMs() <= 0;
  }

  private showSkillBlocked() {
    const primarySkill = this.getPrimarySkill();
    const remainingMs = this.getSkillCooldownRemainingMs();
    this.audio.playBlockedSound();
    if (remainingMs > 0) {
      this.showDialogue(`${primarySkill.name} 冷卻中：${(remainingMs / 1000).toFixed(1)} 秒。`);
      return;
    }

    this.showDialogue(`${primarySkill.name} 需要 ${primarySkill.mpCost} 法力。`);
  }

  private updateSkillCooldownHud() {
    if (!this.skillText) {
      return;
    }

    const remainingMs = this.getSkillCooldownRemainingMs();
    const primarySkill = this.getPrimarySkill();
    const status =
      remainingMs > 0
        ? `${(remainingMs / 1000).toFixed(1)}秒`
        : this.localMp >= primarySkill.mpCost
          ? "可施放"
          : `缺 ${Math.ceil(primarySkill.mpCost - this.localMp)} 法力`;
    const color = remainingMs > 0 ? "#d8cfae" : this.localMp >= primarySkill.mpCost ? "#7ed7ff" : "#ff8f7d";

    this.skillText.setText(`J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | ${status}`);
    this.skillText.setColor(color);
  }

  private updateInventoryHud() {
    if (!this.inventoryPanel) {
      return;
    }

    const potion = this.inventory.find((slot) => slot.itemId === "small-hp-potion");
    const potionCount = potion?.quantity ?? 0;
    const ratTail = this.inventory.find((slot) => slot.itemId === "rat-tail");
    const ratTailCount = ratTail?.quantity ?? 0;
    const mistGel = this.inventory.find((slot) => slot.itemId === "mist-gel");
    const mistGelCount = mistGel?.quantity ?? 0;
    const trainingSword = this.inventory.find((slot) => slot.itemId === "training-sword");
    const trainingSwordCount = trainingSword?.quantity ?? 0;
    const clothVest = this.inventory.find((slot) => slot.itemId === "cloth-vest");
    const clothVestCount = clothVest?.quantity ?? 0;
    const swordStatus = this.equipment.weapon === "training-sword" ? " [裝備中]" : "";
    const vestStatus = this.equipment.armor === "cloth-vest" ? " [裝備中]" : "";

    this.inventoryPanel.body.setText(
      [
        `1  小型補血藥水 x${potionCount}`,
        `2  練習木劍 x${trainingSwordCount}${swordStatus}`,
        `3  粗布背心 x${clothVestCount}${vestStatus}`,
        `   田鼠尾巴 x${ratTailCount}`,
        `   海霧凝膠 x${mistGelCount}`,
        "",
        "1 使用 | 2/3 裝備"
      ].join("\n")
    );
  }

  private updateCharacterPanel() {
    if (!this.characterPanel) {
      return;
    }

    const weaponName = this.equipment.weapon ? ITEM_DEFINITIONS[this.equipment.weapon].name : "未裝備";
    const armorName = this.equipment.armor ? ITEM_DEFINITIONS[this.equipment.armor].name : "未裝備";
    this.characterPanel.body.setText(
      [
        `名稱：${this.localPlayerName}`,
        `職業：${this.getClassLabel(this.localClassName)}`,
        `攻擊 ${this.localAttack}`,
        `防禦 ${this.localDefense}`,
        `武器：${weaponName}`,
        `防具：${armorName}`,
        "",
        "C 關閉 | 2/3 裝備"
      ].join("\n")
    );
  }

  private updateActionPrompt() {
    if (!this.player || !this.promptText) {
      return;
    }

    this.nearbyNpcId = "";
    this.nearbyDropId = "";

    const nearbyNpc = FOG_HARBOR_TEST_MAP.npcs.find((npc) => {
      return (
        Math.abs(this.player!.x - npc.x) <= npc.interactionRadius &&
        Math.abs(this.player!.y - npc.y) <= npc.interactionRadius
      );
    });

    if (nearbyNpc) {
      this.nearbyNpcId = nearbyNpc.id;
      if (this.openShop && this.openShop.npcId !== nearbyNpc.id) {
        this.openShop = undefined;
        this.shopPanelVisible = false;
        this.updateShopPanel();
      }

      const action = this.openShop?.npcId === nearbyNpc.id ? "E 對話 / N 選擇 / B 購買" : "E 對話";
      this.promptText.setText(`${action}：${nearbyNpc.name}`);
      this.promptText.setVisible(true);
      return;
    }

    if (this.openShop) {
      this.openShop = undefined;
      this.shopPanelVisible = false;
      this.updateShopPanel();
    }

    for (const [dropId, view] of this.itemDrops) {
      if (Math.abs(this.player.x - view.body.x) <= 64 && Math.abs(this.player.y - view.body.y) <= 72) {
        this.nearbyDropId = dropId;
        this.promptText.setText("F 拾取");
        this.promptText.setVisible(true);
        return;
      }
    }

    this.promptText.setVisible(false);
  }

  private updateZoneBanner() {
    if (!this.player || !this.zoneText) {
      return;
    }

    const zone = this.getCurrentZoneName(this.player.x, this.player.y);
    if (zone.id === this.currentZoneId) {
      return;
    }

    this.currentZoneId = zone.id;
    this.zoneText.setText(zone.name);
    this.zoneText.setAlpha(1);
    this.zoneText.setVisible(true);
    this.tweens.killTweensOf(this.zoneText);
    this.tweens.add({
      targets: this.zoneText,
      alpha: 0,
      delay: 1400,
      duration: 420,
      onComplete: () => this.zoneText?.setVisible(false)
    });
  }

  private getCurrentZoneName(x: number, y: number) {
    const safeZone = FOG_HARBOR_TEST_MAP.safeZones.find((zone) => {
      const left = zone.x - zone.width / 2;
      const right = zone.x + zone.width / 2;
      const top = zone.y - zone.height / 2;
      const bottom = zone.y + zone.height / 2;
      return x >= left && x <= right && y >= top && y <= bottom;
    });

    if (safeZone) {
      return { id: safeZone.id, name: safeZone.name };
    }

    if (x >= 1850) {
      return { id: "outer-tideway", name: "潮汐林道深處" };
    }

    if (x >= 1320) {
      return { id: "tideway", name: "潮汐林道" };
    }

    return { id: "fog-harbor-outskirts", name: "霧港郊外" };
  }

  private updateQuestTracker() {
    if (!this.questPanel) {
      return;
    }

    const questLines = [...this.quests.values()].map(
      (quest) => `${this.formatQuestLine(quest)}${this.getQuestDirectionHint(quest)}`
    );
    this.questPanel.body.setText(questLines.join("\n") || "找港口守衛接任務");
  }

  private updateShopPanel() {
    if (!this.shopPanel) {
      return;
    }

    if (!this.openShop) {
      this.shopPanel.title.setText("商店");
      this.shopPanel.body.setText("找陳老闆開啟商店。");
      this.syncPanelVisibility();
      return;
    }

    const offerLines = this.openShop.items.map((offer, index) => {
      const item = ITEM_DEFINITIONS[offer.itemId];
      const marker = index === this.selectedShopIndex ? ">" : " ";
      return `${marker} ${item.name} x${offer.quantity}\n   ${offer.priceGold} 金幣`;
    });

    this.shopPanel.title.setText(this.openShop.name);
    this.shopPanel.body.setText([...offerLines, "", "N 選擇 | B 購買"].join("\n"));
    this.syncPanelVisibility();
  }

  private formatQuestLine(quest: QuestSnapshot) {
    if (quest.status === "available") {
      return `找 ${this.getNpcName(quest.npcId)} 接任務`;
    }

    if (quest.status === "active") {
      return `${quest.title}：${this.formatQuestProgress(quest)}`;
    }

    if (quest.status === "ready") {
      return `${quest.title}：可回報`;
    }

    return `${quest.title}：完成`;
  }

  private formatQuestProgress(quest: QuestSnapshot) {
    if (quest.objective.type === "collect") {
      return `${ITEM_DEFINITIONS[quest.objective.itemId].name} ${quest.progress}/${quest.targetCount}`;
    }

    return `${MONSTER_KIND_NAMES[quest.objective.targetKind]} ${quest.progress}/${quest.targetCount}`;
  }

  private getNpcName(npcId: string) {
    return FOG_HARBOR_TEST_MAP.npcs.find((npc) => npc.id === npcId)?.name ?? "委託人";
  }

  private getQuestDirectionHint(quest: QuestSnapshot) {
    if (!this.player || quest.status === "completed") {
      return "";
    }

    const targetX = this.getQuestTargetX(quest);
    if (targetX === undefined) {
      return "";
    }

    const dx = targetX - this.player.x;
    const distance = Math.round(Math.abs(dx) / 10) * 10;
    if (distance < 80) {
      return "（附近）";
    }

    return dx > 0 ? `（往右 ${distance}）` : `（往左 ${distance}）`;
  }

  private getQuestTargetX(quest: QuestSnapshot) {
    if (quest.status === "available" || quest.status === "ready") {
      return FOG_HARBOR_TEST_MAP.npcs.find((npc) => npc.id === quest.npcId)?.x;
    }

    if (quest.status !== "active") {
      return undefined;
    }

    if (quest.objective.type === "kill") {
      return this.getMonsterTargetX(quest.objective.targetKind);
    }

    if (quest.objective.itemId === "rat-tail") {
      return this.getMonsterTargetX("field-rat");
    }

    if (quest.objective.itemId === "mist-gel") {
      return this.getMonsterTargetX("mist-slime");
    }

    return undefined;
  }

  private getMonsterTargetX(kind: MonsterSnapshot["kind"]) {
    return FOG_HARBOR_TEST_MAP.monsterSpawns.find((spawn) => spawn.kind === kind)?.x;
  }

  private showExpGain(expGained: number) {
    if (!this.player) {
      return;
    }

    const text = this.add.text(this.player.x - 18, this.player.y - 88, `+${expGained} 經驗`, {
      fontSize: "14px",
      color: "#91f0a5",
      stroke: "#102017",
      strokeThickness: 3
    });
    this.tweens.add({
      targets: text,
      y: text.y - 24,
      alpha: 0,
      duration: 700,
      onComplete: () => text.destroy()
    });
  }

  private showDialogue(text: string) {
    if (!this.dialogueText) {
      return;
    }

    this.dialogueText.setText(text);
    this.dialogueText.setAlpha(1);
    this.dialogueText.setVisible(true);

    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: this.dialogueText,
        alpha: 0,
        duration: 260,
        onComplete: () => this.dialogueText?.setVisible(false)
      });
    });
  }

  private showReward(exp: number, gold: number) {
    if (!this.player) {
      return;
    }

    const text = this.add.text(this.player.x - 28, this.player.y - 108, `+${exp} 經驗  +${gold} 金幣`, {
      fontSize: "14px",
      color: "#ffd36d",
      stroke: "#181018",
      strokeThickness: 3
    });

    this.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 900,
      onComplete: () => text.destroy()
    });
  }

  private showHeal(healed: number) {
    if (!this.player) {
      return;
    }

    const text = this.add.text(this.player.x - 16, this.player.y - 98, `+${healed} 生命`, {
      fontSize: "15px",
      color: "#91f0a5",
      stroke: "#102017",
      strokeThickness: 3
    });

    this.tweens.add({
      targets: text,
      y: text.y - 24,
      alpha: 0,
      duration: 720,
      onComplete: () => text.destroy()
    });
  }

  private showLevelUp(level: number) {
    const text = this.add
      .text(gameWidth / 2, 106, `升到 ${level} 級`, {
        fontSize: "28px",
        color: "#f2efe6",
        stroke: "#181018",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.tweens.add({
      targets: text,
      y: 82,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy()
    });
  }

  private showPlayerDamage(damage: number, defeated: boolean) {
    if (!this.player) {
      return;
    }

    const text = this.add.text(this.player.x - 12, this.player.y - 76, defeated ? "倒下" : `-${damage}`, {
      fontSize: defeated ? "18px" : "15px",
      color: defeated ? "#f2efe6" : "#ff8f7d",
      stroke: "#181018",
      strokeThickness: 3
    });

    this.player.setTint(0xff8f7d);
    this.time.delayedCall(90, () => {
      this.player?.clearTint();
    });

    this.tweens.add({
      targets: text,
      y: text.y - 28,
      alpha: 0,
      duration: defeated ? 900 : 620,
      onComplete: () => text.destroy()
    });
  }

  private respawnLocalPlayer(x: number, y: number) {
    if (!this.player) {
      return;
    }

    this.localHp = this.localMaxHp;
    this.player.setPosition(x, y);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.clearTint();

    const text = this.add
      .text(gameWidth / 2, 136, "復活", {
        fontSize: "20px",
        color: "#91f0a5",
        stroke: "#102017",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.tweens.add({
      targets: text,
      y: 112,
      alpha: 0,
      duration: 900,
      onComplete: () => text.destroy()
    });
  }
}

function isDevFrontend() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || window.location.port === "5173" || window.location.port === "5174";
}
