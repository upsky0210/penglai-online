import Phaser from "phaser";
import {
  CLASS_SKILL_IDS,
  DEFAULT_GAME_MAP,
  GAME_MAPS,
  ITEM_DEFINITIONS,
  MONSTER_KIND_NAMES,
  SKILL_DEFINITIONS,
  getGameMap,
  type CharacterClass,
  type EquipmentSnapshot,
  type GameMapData,
  type InventorySlot,
  type ItemDropSnapshot,
  type ItemId,
  type MapId,
  type MapInteractableData,
  type MonsterSnapshot,
  type PlayerAnimation,
  type PlayerSnapshot,
  type QuestSnapshot,
  type ShopDefinition,
  type SkillId
} from "@penglai/shared";
import { gameHeight, gameWidth, jumpSpeed, moveSpeed, normalAttackCooldownMs } from "../game/constants";
import { characterNamePresets, clientStorageKeys, fallbackPlayerMp, googleClientId } from "../game/clientConfig";
import { GameAudioManager } from "../game/audioManager";
import {
  optionalImageAssets,
  optionalSpriteSheets,
  playerAnimationKeys,
  playerAnimationTextureKeys
} from "../game/assetManifest";
import {
  characterClassOptions,
  getCharacterClassOption,
  getClassLabel,
  getDefaultCharacterDraft,
  isCharacterClass,
  normalizeCharacterName,
  readCharacterDraft,
  writeCharacterDraft
} from "../game/characterSetup";
import { renderGoogleSignInButton } from "../game/googleIdentity";
import {
  chapterQuestIds,
  getInteractableDoneLabel,
  getInteractablePendingLabel,
  getQuestTargetMapId,
  getQuestTargetX,
  isQuestUnlocked
} from "../game/questGuidance";
import { createUiPanel, type UiPanel } from "../game/uiPanel";
import { ColorHex, ColorText, uiFont } from "../game/uiTheme";
import { CombatVfx } from "../game/CombatVfx";
import { HudLayer } from "../game/HudLayer";
import { MapRenderer } from "../game/MapRenderer";
import { RemoteEntityLayer } from "../game/RemoteEntityLayer";
import { GameSocket, getGameSocketUrl } from "../net/GameSocket";
import {
  formatSaveSlot,
  generateSaveSlot,
  getOrCreateSaveSlot,
  normalizeSaveSlotCode,
  persistCurrentSaveSlot,
  persistPreviousSaveSlot,
  persistSaveSlotPair,
  readPreviousSaveSlot
} from "../save/SaveSlotStore";
import { FeedbackFormController, type FeedbackPayload } from "../ui/FeedbackForm";
import { TitleScreenView } from "../ui/TitleScreenView";

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
  | "h"
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
  | "t"
  | "u"
  | "x"
  | "z"
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

interface AnnouncementNotice {
  text: string;
  category: string;
  sentAt: number;
  expiresAt?: number;
}

const maxPlayerMp = fallbackPlayerMp;
const emptyEquipment: EquipmentSnapshot = {
  weapon: null,
  armor: null
};
const fallbackPlayerTextureKey = "player";
export class GameScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private facing: "left" | "right" = "right";
  private playerId = "";
  private ws?: GameSocket;
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
  private bossHpBack?: Phaser.GameObjects.Rectangle;
  private bossHpFill?: Phaser.GameObjects.Rectangle;
  private bossStatusText?: Phaser.GameObjects.Text;
  private goldText?: Phaser.GameObjects.Text;
  private skillText?: Phaser.GameObjects.Text;
  private inventoryPanel?: UiPanel;
  private questPanel?: UiPanel;
  private questLogPanel?: UiPanel;
  private characterPanel?: UiPanel;
  private guidePanel?: UiPanel;
  private announcementPanel?: UiPanel;
  private shopPanel?: UiPanel;
  private savePanel?: UiPanel;
  private settingsPanel?: UiPanel;
  private dialogueText?: Phaser.GameObjects.Text;
  private dialogueBox?: Phaser.GameObjects.Graphics;
  private promptText?: Phaser.GameObjects.Text;
  private questTargetText?: Phaser.GameObjects.Text;
  private zoneText?: Phaser.GameObjects.Text;
  private quests = new Map<string, QuestSnapshot>();
  private announcements: AnnouncementNotice[] = [];
  private inventory: InventorySlot[] = [];
  private equipment: EquipmentSnapshot = { ...emptyEquipment };
  private openShop?: ShopDefinition;
  private selectedShopIndex = 0;
  private inventoryPanelVisible = false;
  private questPanelVisible = true;
  private questLogPanelVisible = false;
  private characterPanelVisible = false;
  private guidePanelVisible = true;
  private announcementPanelVisible = false;
  private shopPanelVisible = false;
  private savePanelVisible = false;
  private settingsPanelVisible = false;
  private nearbyNpcId = "";
  private returnSafeArmedAt = 0;
  private nearbyInteractableId = "";
  private nearbyDropId = "";
  private nearbyPortalId = "";
  private pendingPickupIds = new Set<string>();
  private currentZoneId = "";
  private currentMap: GameMapData = DEFAULT_GAME_MAP;
  private currentMapId: MapId = DEFAULT_GAME_MAP.id;

  private failedAssetKeys = new Set<string>();
  private stageClearShown = false;
  private portalReadyAt = 0;
  private bossWarningReadyAt = 0;
  private bossEntryHintShown = false;
  private currentSaveSlot = "";
  private previousSaveSlot = "";
  private authSessionId = "";
  private authAccountLabel = "";
  private authSaveSlots: AuthSaveSlotSummary[] = [];
  private googleButtonElement?: HTMLDivElement;
  private feedbackForm?: FeedbackFormController;
  private lastPlayerUpdateAt = 0;
  private localHp = 100;
  private localMp = maxPlayerMp;
  private localMaxHp = 100;
  private localMaxMp = maxPlayerMp;
  private localAttack = 12;
  private localDefense = 0;
  private skillReadyAt = 0;
  private attackReadyAt = 0;
  private gameStarted = false;
  private titleScreen?: TitleScreenView;
  private characterName = "霧港旅人";
  private selectedClass: CharacterClass = "swordsman";
  private localPlayerName = "霧港旅人";
  private localClassName: CharacterClass = "swordsman";
  private audio = new GameAudioManager();
  private combatVfx = new CombatVfx(this, this.audio);
  private mapRenderer = new MapRenderer(this, {
    getPlayer: () => this.player,
    getQuests: () => this.quests,
    hasUsableTexture: (key) => this.hasUsableTexture(key)
  });
  private remoteEntities?: RemoteEntityLayer;
  private hud?: HudLayer;

  constructor() {
    super("boot");
  }

  preload() {
    this.createGeneratedTextures();
    this.loadOptionalSpriteSheets();
  }

  create() {
    this.physics.world.setBounds(0, 0, this.currentMap.width, this.currentMap.height);
    this.cameras.main.setBackgroundColor("#17233b");

    this.mapRenderer.renderPreview(this.currentMap);
    this.currentSaveSlot = this.getSaveSlot();
    this.previousSaveSlot = this.getPreviousSaveSlot();
    this.loadStoredAuthSession();
    this.loadCharacterDraft();
    this.audio.loadSettings();
    this.createOptionalSpriteAnimations();

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
      h: Phaser.Input.Keyboard.KeyCodes.H,
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
      t: Phaser.Input.Keyboard.KeyCodes.T,
      u: Phaser.Input.Keyboard.KeyCodes.U,
      x: Phaser.Input.Keyboard.KeyCodes.X,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE
    }) as Record<KeyName, Phaser.Input.Keyboard.Key>;
    this.input.keyboard?.on("keydown", this.handleTitleNameKeyDown, this);
    this.feedbackForm = new FeedbackFormController({
      setKeyboardEnabled: (enabled) => {
        if (this.input.keyboard) {
          this.input.keyboard.enabled = enabled;
        }
      },
      getGameContext: () => this.getFeedbackGameContext(),
      submit: (payload) => this.submitFeedback(payload),
      onNotice: (text) => this.showToast(text)
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown", this.handleTitleNameKeyDown, this);
      this.removeGoogleButton();
      this.removeFeedbackForm();
    });

    this.addTitleScreen();
  }

  private addTitleScreen() {
    this.titleScreen = new TitleScreenView(this, {
      onMockLogin: () => this.promptMockLogin()
    });
    this.updateTitleScreen();
    void this.mountGoogleButton();
    void this.refreshAuthSession();
  }

  private promptMockLogin() {
    if (this.authSessionId) {
      this.showTitleNotice("已登入，無需再測試登入。");
      return;
    }

    const email = window.prompt("輸入測試用 Email（例如 student01@test.local）：", "student01@test.local");
    if (email === null) {
      return;
    }

    const trimmed = email.trim();
    if (!trimmed.includes("@") || trimmed.startsWith("@") || trimmed.endsWith("@")) {
      this.showTitleNotice("Email 格式不正確，請輸入含 @ 的完整 Email。");
      return;
    }

    void this.handleGoogleCredential(`mock:${trimmed}`);
  }

  private updateTitleScreen() {
    if (!this.titleScreen) {
      return;
    }

    const previous = this.previousSaveSlot || this.getPreviousSaveSlot();
    const option = this.getSelectedClassOption();
    this.titleScreen.update({
      currentSaveSlot: formatSaveSlot(this.currentSaveSlot || this.getSaveSlot()),
      previousSaveSlot: previous ? formatSaveSlot(previous) : "",
      accountSaveSlotLines: this.getAccountSaveSlotLines(2),
      characterName: this.characterName,
      classLabel: option.label,
      classDescription: option.description,
      authAccountLabel: this.authAccountLabel,
      isAuthenticated: Boolean(this.authSessionId)
    });
  }

  private showTitleNotice(text: string) {
    this.titleScreen?.showNotice(text);
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

  private toggleFeedbackForm() {
    this.feedbackForm?.toggle();
  }

  private removeFeedbackForm() {
    this.feedbackForm?.close();
  }

  private getFeedbackGameContext() {
    const activeQuest = this.getGuidedQuest();
    return {
      playerName: this.localPlayerName || this.characterName,
      saveSlot: this.currentSaveSlot || this.getSaveSlot(),
      sessionId: this.authSessionId || this.getAuthSessionId(),
      mapId: this.currentMapId,
      currentZone: this.getCurrentZoneName(this.player?.x ?? 0, this.player?.y ?? 0).name,
      activeQuest: activeQuest ? this.formatQuestLine(activeQuest) : "無進行中任務",
      chapterProgress: `${this.getChapterStepSummary()} / ${this.getChapterChecklist()}`
    };
  }

  private async submitFeedback(payload: FeedbackPayload) {
    const response = await fetch(this.getApiUrl("/feedback"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
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
    this.restartForSaveSlot(`已切換到帳號存檔 ${index + 1}：${formatSaveSlot(slot.saveSlot)}。`);
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
      return `${index + 1}. ${name}${level} / ${formatSaveSlot(slot.saveSlot)}`;
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
    this.characterName = normalizeCharacterName(name);
    this.localPlayerName = this.characterName;
    this.saveCharacterDraft();
    this.updateTitleScreen();
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
    return getCharacterClassOption(this.selectedClass);
  }

  private getClassLabel(className: CharacterClass) {
    return getClassLabel(className);
  }

  private getPrimarySkill() {
    return this.getPrimarySkillFor(this.localClassName);
  }

  private getPrimarySkillFor(className: CharacterClass) {
    return SKILL_DEFINITIONS[CLASS_SKILL_IDS[className]];
  }

  private isCharacterClass(value: unknown): value is CharacterClass {
    return isCharacterClass(value);
  }

  private loadCharacterDraft() {
    const saveSlot = this.currentSaveSlot || this.getSaveSlot();
    const draft = readCharacterDraft(saveSlot);
    this.characterName = draft.name;
    this.selectedClass = draft.className;
    this.localPlayerName = this.characterName;
    this.localClassName = this.selectedClass;
  }

  private saveCharacterDraft() {
    const saveSlot = this.currentSaveSlot || this.getSaveSlot();
    writeCharacterDraft(saveSlot, {
      name: this.characterName,
      className: this.selectedClass
    });
  }

  private resetCharacterDraftForSlot() {
    const draft = getDefaultCharacterDraft();
    this.characterName = draft.name;
    this.selectedClass = draft.className;
    this.localPlayerName = this.characterName;
    this.localClassName = this.selectedClass;
    this.saveCharacterDraft();
    this.updateTitleScreen();
  }

  private startGame() {
    if (this.gameStarted) {
      return;
    }

    this.characterName = normalizeCharacterName(this.characterName);
    this.localPlayerName = this.characterName;
    this.localClassName = this.selectedClass;
    this.saveCharacterDraft();
    this.removeGoogleButton();
    this.gameStarted = true;
    this.titleScreen?.destroy();
    this.titleScreen = undefined;

    this.addHud();
    this.addPlayer();
    this.remoteEntities = new RemoteEntityLayer(this, {
      getPlayerId: () => this.playerId,
      getLocalPlayer: () => this.player,
      getPlayerTextureKey: (animation) => this.getPlayerTextureKey(animation),
      applyPlayerAnimation: (sprite, animation) => this.applyPlayerSpriteAnimation(sprite, animation),
      flashAttackTelegraph: (x, y, direction, className, isSkill) => this.combatVfx.flashAttackTelegraph(x, y, direction, className, isSkill, (targetClass) => this.getPrimarySkillFor(targetClass)),
      updateLocalPlayer: (player) => this.updateHud(player),
      onMonsterSnapshotsChanged: () => this.updateBossStatusPanel(),
      hasUsableTexture: (key) => this.hasUsableTexture(key),
      pendingPickupIds: this.pendingPickupIds,
      audio: this.audio
    });
    this.rebuildMap(this.currentMap);
    this.connect();
    this.maybeShowFirstRunSaveReminder();
  }

  private maybeShowFirstRunSaveReminder() {
    // Logged-in accounts persist server-side, so only anonymous players need the nudge.
    if (this.authSessionId) {
      return;
    }

    let alreadySeen = false;
    try {
      alreadySeen = window.localStorage.getItem(clientStorageKeys.saveReminderSeen) === "1";
    } catch {
      // Storage blocked means the save is even more fragile, so keep reminding.
    }
    if (alreadySeen) {
      return;
    }

    this.time.delayedCall(1600, () => {
      // The player may have logged in during the delay.
      if (this.authSessionId) {
        return;
      }

      this.showDialogue(
        "提醒：匿名存檔只存在這個瀏覽器。請按 P → Y 複製存檔碼備份，或登入 Google 帳號跨裝置保存。"
      );

      try {
        window.localStorage.setItem(clientStorageKeys.saveReminderSeen, "1");
      } catch {
        // Cannot persist the flag; the reminder may reappear next session.
      }
    });
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
    this.updateQuestTargetIndicator();
    this.updateQuestTracker();
    this.updateGuidePanel();
    this.updateBossAreaWarning();

    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.w);
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.k);
    const skill = Phaser.Input.Keyboard.JustDown(this.keys.j);
    const interact = Phaser.Input.Keyboard.JustDown(this.keys.e);
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
    const importSaveSlot = Phaser.Input.Keyboard.JustDown(this.keys.x);
    const toggleFeedback = Phaser.Input.Keyboard.JustDown(this.keys.t);
    const returnSafe = Phaser.Input.Keyboard.JustDown(this.keys.z);
    const logoutAuth = Phaser.Input.Keyboard.JustDown(this.keys.g);
    const toggleAnnouncements = Phaser.Input.Keyboard.JustDown(this.keys.u);
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
      this.questLogPanelVisible = !this.questLogPanelVisible;
      this.syncPanelVisibility();
      this.updateQuestLogPanel();
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

    if (toggleAnnouncements) {
      this.announcementPanelVisible = !this.announcementPanelVisible;
      this.syncPanelVisibility();
      this.updateAnnouncementPanel();
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

    if (importSaveSlot && this.savePanelVisible) {
      this.importSaveSlotFromCode();
      return;
    }

    if (toggleFeedback) {
      this.toggleFeedbackForm();
      return;
    }

    if (returnSafe) {
      this.confirmReturnSafe();
      return;
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

    if (attack && this.time.now >= this.attackReadyAt) {
      // 節奏鎖期間按 K 不出手也不播音效,空揮音效會讓拍子感覺像失靈(D2)
      this.attackReadyAt = this.time.now + normalAttackCooldownMs;
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
    } else if (interact && this.nearbyInteractableId) {
      this.sendMapInteract(this.nearbyInteractableId);
    } else if (interact && this.nearbyPortalId) {
      this.sendPortalEnter(this.nearbyPortalId);
    }

    if (buy && this.openShop && this.nearbyNpcId === this.openShop.npcId) {
      const offer = this.openShop.items[this.selectedShopIndex] ?? this.openShop.items[0];
      if (offer) {
        this.sendShopBuy(this.openShop.npcId, offer.itemId, 1);
      }
    }

    if (usePotion) {
      this.tryUsePotion();
    }

    if (equipWeapon) {
      this.tryEquipBestItem("weapon");
    }

    if (equipArmor) {
      this.tryEquipBestItem("armor");
    }

    const animation = attack ? "attack" : skillFired ? "skill" : this.getAnimation(left || right);
    this.updateLocalPlayerAnimation(animation);
    this.updateSkillCooldownHud();
    this.sendPlayerUpdate(animation);
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

    g.fillStyle(0x6b2f2a);
    g.fillRect(5, 10, 22, 10);
    g.fillStyle(0xa84f3c);
    g.fillRect(8, 7, 18, 12);
    g.fillStyle(0xd8a957);
    g.fillRect(23, 6, 4, 4);
    g.fillStyle(0x2a1714);
    g.fillRect(3, 13, 7, 3);
    g.fillRect(11, 20, 4, 4);
    g.fillRect(22, 20, 4, 4);
    g.fillStyle(0xf2efe6);
    g.fillRect(23, 10, 3, 3);
    g.generateTexture("monster_field_rat_fallback", 34, 24);
    g.clear();

    g.fillStyle(0x49b8ad);
    g.fillRect(7, 11, 26, 13);
    g.fillStyle(0x72d8c9);
    g.fillRect(11, 7, 18, 8);
    g.fillStyle(0x123034);
    g.fillRect(24, 13, 4, 4);
    g.fillStyle(0x8fd9a8);
    g.fillRect(13, 5, 8, 3);
    g.generateTexture("monster_mist_slime_fallback", 40, 32);
    g.clear();

    g.fillStyle(0x7d2d26);
    g.fillRect(26, 22, 44, 46);
    g.fillStyle(0xb83a2e);
    g.fillRect(20, 30, 56, 28);
    g.fillStyle(0xeac373);
    g.fillRect(34, 12, 28, 12);
    g.fillStyle(0x122a20);
    g.fillRect(44, 36, 8, 8);
    g.fillStyle(0x8fd9a8);
    g.fillRect(30, 68, 10, 12);
    g.fillRect(58, 68, 10, 12);
    g.generateTexture("monster_tide_watcher_fallback", 96, 96);
    g.clear();

    g.fillStyle(0x6d3f28);
    g.fillRect(5, 10, 24, 11);
    g.fillStyle(0xc0703e);
    g.fillRect(8, 7, 19, 12);
    g.fillStyle(0xf1c26d);
    g.fillRect(24, 6, 4, 4);
    g.fillStyle(0x261915);
    g.fillRect(3, 14, 8, 3);
    g.fillRect(12, 20, 4, 4);
    g.fillRect(23, 20, 4, 4);
    g.generateTexture("monster_warehouse_rat_fallback", 36, 26);
    g.clear();

    g.fillStyle(0x5a5447);
    g.fillRect(13, 8, 24, 36);
    g.fillStyle(0x9b7b52);
    g.fillRect(9, 16, 32, 22);
    g.fillStyle(0x8fd9a8);
    g.fillRect(20, 11, 10, 5);
    g.fillStyle(0x2a1f19);
    g.fillRect(14, 44, 6, 8);
    g.fillRect(30, 44, 6, 8);
    g.generateTexture("monster_mist_puppet_fallback", 50, 56);
    g.clear();

    g.fillStyle(0x31494e);
    g.fillRect(24, 18, 48, 54);
    g.fillStyle(0x5d7f86);
    g.fillRect(18, 28, 60, 32);
    g.fillStyle(0xeac373);
    g.fillRect(36, 10, 24, 12);
    g.fillStyle(0xb83a2e);
    g.fillRect(42, 36, 12, 10);
    g.fillStyle(0x1b241f);
    g.fillRect(30, 72, 10, 12);
    g.fillRect(58, 72, 10, 12);
    g.generateTexture("monster_warehouse_sentry_fallback", 96, 96);
    g.clear();

    g.fillStyle(0x2f6f78);
    g.fillRect(10, 14, 34, 20);
    g.fillStyle(0x74c7c8);
    g.fillRect(14, 9, 26, 16);
    g.fillStyle(0xf0d68a);
    g.fillRect(6, 18, 7, 5);
    g.fillRect(41, 18, 7, 5);
    g.fillStyle(0x122a20);
    g.fillRect(18, 14, 4, 4);
    g.fillRect(32, 14, 4, 4);
    g.generateTexture("monster_cave_crab_fallback", 56, 42);
    g.clear();

    g.fillStyle(0x7bd0d3, 0.82);
    g.fillCircle(24, 22, 18);
    g.fillStyle(0xf0d68a, 0.88);
    g.fillRect(18, 10, 12, 6);
    g.fillStyle(0xd9e6e5, 0.78);
    g.fillCircle(17, 20, 5);
    g.fillCircle(31, 20, 5);
    g.generateTexture("monster_reef_wisp_fallback", 48, 48);
    g.clear();

    g.fillStyle(0x384f54);
    g.fillRect(24, 18, 48, 58);
    g.fillStyle(0xd46a4c);
    g.fillRect(18, 30, 60, 28);
    g.fillStyle(0x74c7c8);
    g.fillRect(34, 8, 28, 18);
    g.fillStyle(0xf0d68a);
    g.fillRect(40, 34, 16, 10);
    g.fillStyle(0x1b241f);
    g.fillRect(30, 76, 10, 12);
    g.fillRect(58, 76, 10, 12);
    g.generateTexture("monster_coral_warden_fallback", 96, 100);
    g.clear();

    g.fillStyle(0x2b3f55);
    g.fillRect(10, 12, 36, 28);
    g.fillStyle(0xd9e6e5);
    g.fillRect(14, 8, 28, 22);
    g.fillStyle(0x5d7f86);
    g.fillRect(17, 14, 22, 3);
    g.fillRect(17, 21, 18, 3);
    g.fillStyle(0x122a20);
    g.fillRect(38, 16, 4, 4);
    g.generateTexture("monster_archive_drifter_fallback", 56, 48);
    g.clear();

    g.fillStyle(0x28324d, 0.86);
    g.fillCircle(24, 22, 18);
    g.fillStyle(0x6aa9d8, 0.8);
    g.fillCircle(24, 22, 11);
    g.fillStyle(0xf0d68a, 0.86);
    g.fillRect(18, 10, 12, 5);
    g.fillStyle(0xd9e6e5, 0.8);
    g.fillCircle(18, 22, 4);
    g.fillCircle(30, 22, 4);
    g.generateTexture("monster_ink_sprite_fallback", 48, 48);
    g.clear();

    g.fillStyle(0x253342);
    g.fillRect(24, 16, 50, 62);
    g.fillStyle(0x6d5a83);
    g.fillRect(18, 30, 62, 30);
    g.fillStyle(0xf0d68a);
    g.fillRect(34, 8, 30, 14);
    g.fillStyle(0x6aa9d8);
    g.fillRect(40, 36, 16, 10);
    g.fillStyle(0x1b241f);
    g.fillRect(30, 78, 10, 12);
    g.fillRect(60, 78, 10, 12);
    g.generateTexture("monster_archive_guardian_fallback", 100, 102);
    g.clear();

    g.fillStyle(0x9f7a37, 0.86);
    g.fillCircle(28, 24, 15);
    g.fillStyle(0xf0d68a, 0.72);
    g.fillTriangle(27, 22, 5, 8, 9, 38);
    g.fillTriangle(29, 22, 51, 8, 47, 38);
    g.fillStyle(0xd9e6e5, 0.75);
    g.fillCircle(22, 21, 4);
    g.fillCircle(34, 21, 4);
    g.fillStyle(0x253342);
    g.fillRect(42, 24, 8, 4);
    g.generateTexture("monster_star_moth_fallback", 56, 48);
    g.clear();

    g.fillStyle(0x24334e);
    g.fillRect(16, 16, 34, 36);
    g.fillStyle(0x4f7c86);
    g.fillRect(10, 26, 46, 18);
    g.fillStyle(0xf0d68a);
    g.fillRect(22, 6, 22, 12);
    g.fillStyle(0xd9e6e5, 0.9);
    g.fillCircle(33, 24, 10);
    g.fillStyle(0x122a20);
    g.fillRect(24, 52, 7, 8);
    g.fillRect(43, 52, 7, 8);
    g.generateTexture("monster_lens_sentinel_fallback", 64, 58);
    g.clear();

    g.fillStyle(0x172536);
    g.fillRect(26, 18, 52, 64);
    g.fillStyle(0x596b8f);
    g.fillRect(18, 32, 68, 30);
    g.fillStyle(0xf0d68a);
    g.fillRect(36, 8, 32, 14);
    g.fillStyle(0xd9e6e5, 0.85);
    g.fillCircle(52, 34, 14);
    g.fillStyle(0x8fd9a8, 0.7);
    g.fillCircle(52, 34, 7);
    g.fillStyle(0x1b241f);
    g.fillRect(32, 82, 10, 12);
    g.fillRect(64, 82, 10, 12);
    g.generateTexture("monster_astral_keeper_fallback", 104, 104);
    g.clear();

    g.destroy();
  }

  private loadOptionalSpriteSheets() {
    this.load.on("loaderror", (file: { key?: string }) => {
      if (file.key) {
        this.failedAssetKeys.add(file.key);
      }
    });

    for (const asset of optionalImageAssets) {
      if (!asset.enabled) {
        continue;
      }

      this.load.image(asset.key, asset.path);
    }

    for (const asset of optionalSpriteSheets) {
      if (!asset.enabled) {
        continue;
      }

      this.load.spritesheet(asset.key, asset.path, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight
      });
    }
  }

  private createOptionalSpriteAnimations() {
    for (const asset of optionalSpriteSheets) {
      if (!asset.enabled || !this.hasUsableTexture(asset.key) || this.anims.exists(asset.animationKey)) {
        continue;
      }

      this.anims.create({
        key: asset.animationKey,
        frames: this.anims.generateFrameNumbers(asset.key, { start: 0, end: asset.frameCount - 1 }),
        frameRate: asset.frameRate,
        repeat: asset.repeat
      });
    }
  }

  private hasUsableTexture(key: string) {
    return this.textures.exists(key) && !this.failedAssetKeys.has(key);
  }

  private rebuildMap(map: GameMapData, x = map.playerSpawn.x, y = map.playerSpawn.y) {
    this.currentMap = map;
    this.currentMapId = map.id;
    this.mapRenderer.rebuild(map, x, y);
    this.currentZoneId = "";
    this.bossEntryHintShown = false;
    this.nearbyNpcId = "";
    this.nearbyInteractableId = "";
    this.nearbyDropId = "";
    this.nearbyPortalId = "";
    this.updateQuestTracker();
    this.updateGuidePanel();
    this.updateQuestTargetIndicator();
    this.updateInteractableStatusLabels();
    this.updateBossStatusPanel();
    this.refreshChapterWorldState();
  }

  private refreshChapterWorldState() {
    this.mapRenderer.refreshChapterWorldState();
  }

  private addHud() {
    this.currentSaveSlot = this.getSaveSlot();
    this.previousSaveSlot = this.getPreviousSaveSlot();

    const hudPlate = this.add.graphics().setScrollFactor(0);
    hudPlate.fillStyle(ColorHex.shadow, 0.4);
    hudPlate.fillRoundedRect(13, 13, 300, 188, 12);
    hudPlate.fillStyle(ColorHex.woodDark, 0.96);
    hudPlate.fillRoundedRect(11, 11, 300, 188, 12);
    hudPlate.fillStyle(ColorHex.inkGreenDeep, 0.88);
    hudPlate.fillRoundedRect(14, 14, 294, 182, 10);
    hudPlate.lineStyle(1, ColorHex.gold, 0.42);
    hudPlate.strokeRoundedRect(12.5, 12.5, 297, 185, 11);

    this.statusText = this.add
      .text(24, 20, "連線中...", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.sand
      })
      .setScrollFactor(0);

    this.levelText = this.add
      .text(24, 40, `${this.characterName} | 等級 1`, {
        fontFamily: uiFont,
        fontSize: "16px",
        color: ColorText.gold,
        fontStyle: "bold"
      })
      .setScrollFactor(0);

    this.add
      .text(24, 70, "經驗", { fontFamily: uiFont, fontSize: "12px", color: ColorText.jade })
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
    this.expBack = this.add
      .rectangle(95, 70, 184, 12, ColorHex.barTrack)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setStrokeStyle(1, ColorHex.gold, 0.3);
    this.expFill = this.add.rectangle(97, 70, 0, 8, ColorHex.exp).setOrigin(0, 0.5).setScrollFactor(0);
    this.expText = this.add
      .text(276, 70, "0/60", { fontFamily: uiFont, fontSize: "11px", color: ColorText.parchment })
      .setOrigin(1, 0.5)
      .setScrollFactor(0);

    this.add
      .text(24, 98, "生命", { fontFamily: uiFont, fontSize: "12px", color: ColorText.riceWhite })
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
    this.hpBack = this.add
      .rectangle(95, 98, 184, 12, ColorHex.barTrack)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setStrokeStyle(1, ColorHex.gold, 0.3);
    this.hpFill = this.add.rectangle(97, 98, 180, 8, ColorHex.hp).setOrigin(0, 0.5).setScrollFactor(0);
    this.hpText = this.add
      .text(276, 98, "100/100", { fontFamily: uiFont, fontSize: "11px", color: ColorText.riceWhite })
      .setOrigin(1, 0.5)
      .setScrollFactor(0);

    this.add
      .text(24, 122, "法力", { fontFamily: uiFont, fontSize: "12px", color: ColorText.mistBlue })
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
    this.mpBack = this.add
      .rectangle(95, 122, 184, 12, ColorHex.barTrack)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setStrokeStyle(1, ColorHex.gold, 0.3);
    this.mpFill = this.add.rectangle(97, 122, 180, 8, ColorHex.mp).setOrigin(0, 0.5).setScrollFactor(0);
    this.mpText = this.add
      .text(276, 122, `${maxPlayerMp}/${maxPlayerMp}`, { fontFamily: uiFont, fontSize: "11px", color: ColorText.riceWhite })
      .setOrigin(1, 0.5)
      .setScrollFactor(0);

    this.goldText = this.add
      .text(24, 150, "金幣 0", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold
      })
      .setScrollFactor(0);

    const primarySkill = this.getPrimarySkill();
    this.skillText = this.add
      .text(24, 172, `J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | 可施放`, {
        fontFamily: uiFont,
        fontSize: "12px",
        color: ColorText.mistBlue
      })
      .setScrollFactor(0);

    this.add
      .text(324, 18, "A/D 移動  W 跳躍  K 攻擊  J 技能  E 對話/互動  自動拾取\nI 背包  Q 任務  C 角色  P 存檔/帳號  Z 回安全區(連按兩下)", {
        fontFamily: uiFont,
        fontSize: "12px",
        color: ColorText.riceWhite,
        backgroundColor: "#10271fe6",
        padding: { x: 9, y: 5 },
        fixedWidth: 610,
        wordWrap: { width: 592 }
      })
      .setScrollFactor(0)
      .setDepth(205);

    this.inventoryPanel = this.addUiPanel(18, 194, 250, 154, "背包");
    this.questPanel = this.addUiPanel(gameWidth - 292, 18, 274, 136, "任務");
    this.questLogPanel = this.addUiPanel(114, 72, 600, 336, "任務日誌");
    this.characterPanel = this.addUiPanel(gameWidth - 292, 168, 274, 152, "角色");
    this.guidePanel = this.addUiPanel(gameWidth - 292, 168, 274, 122, "地圖 / 流程");
    this.announcementPanel = this.addUiPanel(gameWidth / 2 - 210, 86, 420, 150, "公告");
    this.shopPanel = this.addUiPanel(gameWidth / 2 - 190, gameHeight - 390, 380, 206, "商店");
    this.savePanel = this.addUiPanel(18, 350, 306, 180, "存檔");
    this.settingsPanel = this.addUiPanel(gameWidth - 310, 372, 292, 112, "設定");
    this.shopPanel.container.setVisible(false);
    this.savePanel.container.setVisible(false);
    this.settingsPanel.container.setVisible(false);
    this.syncPanelVisibility();
    this.updateInventoryHud();
    this.updateQuestTracker();
    this.updateQuestLogPanel();
    this.updateCharacterPanel();
    this.updateGuidePanel();
    this.updateAnnouncementPanel();
    this.updateShopPanel();
    this.updateSavePanel();
    this.updateSettingsPanel();

    this.zoneText = this.add
      .text(gameWidth / 2, 30, "", {
        fontFamily: uiFont,
        fontSize: "18px",
        color: ColorText.gold,
        backgroundColor: "#10271fdd",
        padding: { x: 18, y: 8 },
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setVisible(false);

    this.questTargetText = this.add
      .text(gameWidth / 2, 62, "", {
        fontFamily: uiFont,
        fontSize: "14px",
        color: ColorText.parchment,
        backgroundColor: "#10271fdd",
        padding: { x: 12, y: 6 },
        fixedWidth: 360,
        align: "center",
        wordWrap: { width: 340 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(198)
      .setVisible(false);

    this.bossHpBack = this.add
      .rectangle(gameWidth / 2, 104, 284, 14, ColorHex.barTrack)
      .setScrollFactor(0)
      .setDepth(198)
      .setStrokeStyle(1, ColorHex.gold, 0.45)
      .setVisible(false);
    this.bossHpFill = this.add
      .rectangle(gameWidth / 2 - 140, 104, 280, 10, ColorHex.vermilion)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(199)
      .setVisible(false);
    this.bossStatusText = this.add
      .text(gameWidth / 2, 84, "", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold,
        backgroundColor: "#10271fdd",
        padding: { x: 10, y: 4 },
        fixedWidth: 330,
        align: "center",
        wordWrap: { width: 310 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(199)
      .setVisible(false);

    this.dialogueBox = this.add.graphics().setScrollFactor(0).setDepth(200).setVisible(false);
    {
      const bw = 520;
      const bh = 66;
      const bx = gameWidth / 2 - bw / 2;
      const by = 112;
      this.dialogueBox.fillStyle(ColorHex.shadow, 0.45);
      this.dialogueBox.fillRoundedRect(bx + 3, by + 5, bw, bh, 12);
      this.dialogueBox.fillStyle(ColorHex.woodDark, 1);
      this.dialogueBox.fillRoundedRect(bx, by, bw, bh, 12);
      this.dialogueBox.fillStyle(ColorHex.inkGreenDeep, 0.97);
      this.dialogueBox.fillRoundedRect(bx + 4, by + 4, bw - 8, bh - 8, 9);
      this.dialogueBox.fillStyle(ColorHex.gold, 0.85);
      this.dialogueBox.fillRect(bx + 14, by + 12, 3, bh - 24);
      this.dialogueBox.lineStyle(1, ColorHex.gold, 0.55);
      this.dialogueBox.strokeRoundedRect(bx + 2, by + 2, bw - 4, bh - 4, 10);
    }

    this.dialogueText = this.add
      .text(gameWidth / 2, 145, "", {
        fontFamily: uiFont,
        fontSize: "14px",
        color: ColorText.parchment,
        padding: { x: 12, y: 7 },
        fixedWidth: 486,
        align: "center",
        wordWrap: { width: 462 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201)
      .setVisible(false);

    this.promptText = this.add
      .text(gameWidth / 2, gameHeight - 118, "E 對話", {
        fontFamily: uiFont,
        fontSize: "14px",
        color: ColorText.ink,
        backgroundColor: "#eac373",
        padding: { x: 12, y: 6 },
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setVisible(false);

    this.hud = HudLayer.bind(this, {
      statusText: this.statusText!, levelText: this.levelText!, hpFill: this.hpFill!, hpText: this.hpText!,
      mpFill: this.mpFill!, mpText: this.mpText!, expFill: this.expFill!, expText: this.expText!,
      goldText: this.goldText!, skillText: this.skillText!, bossHpBack: this.bossHpBack!, bossHpFill: this.bossHpFill!,
      bossStatusText: this.bossStatusText!, dialogueBox: this.dialogueBox!, dialogueText: this.dialogueText!,
      promptText: this.promptText!, zoneText: this.zoneText!
    });
  }

  private addUiPanel(x: number, y: number, width: number, height: number, title: string): UiPanel {
    return createUiPanel(this, x, y, width, height, title);
  }

  private syncPanelVisibility() {
    this.inventoryPanel?.container.setVisible(this.inventoryPanelVisible);
    this.questPanel?.container.setVisible(this.questPanelVisible);
    this.questLogPanel?.container.setVisible(this.questLogPanelVisible && !this.settingsPanelVisible);
    this.characterPanel?.container.setVisible(this.characterPanelVisible);
    this.guidePanel?.container.setVisible(this.guidePanelVisible && !this.settingsPanelVisible && !this.characterPanelVisible);
    this.announcementPanel?.container.setVisible(this.announcementPanelVisible && !this.settingsPanelVisible);
    this.shopPanel?.container.setVisible(this.shopPanelVisible && Boolean(this.openShop));
    this.savePanel?.container.setVisible(this.savePanelVisible);
    this.settingsPanel?.container.setVisible(this.settingsPanelVisible);
  }

  private addPlayer() {
    this.player = this.physics.add.sprite(this.currentMap.playerSpawn.x, this.currentMap.playerSpawn.y, this.getPlayerTextureKey("idle"));
    this.player.setDepth(45);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 34);
    this.player.body.setOffset(8, 8);
    this.updateLocalPlayerAnimation("idle");
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, this.currentMap.width, this.currentMap.height);
  }

  private getPlayerTextureKey(animation: PlayerAnimation) {
    const externalTextureKey = playerAnimationTextureKeys[animation];
    return this.hasUsableTexture(externalTextureKey) ? externalTextureKey : fallbackPlayerTextureKey;
  }

  private updateLocalPlayerAnimation(animation: PlayerAnimation) {
    if (!this.player) {
      return;
    }

    this.applyPlayerSpriteAnimation(this.player, animation);
  }

  private applyPlayerSpriteAnimation(sprite: Phaser.GameObjects.Sprite, animation: PlayerAnimation) {
    const textureKey = this.getPlayerTextureKey(animation);
    const animationKey = playerAnimationKeys[animation];
    if (this.hasUsableTexture(textureKey) && this.anims.exists(animationKey)) {
      if (sprite.anims.currentAnim?.key !== animationKey) {
        sprite.play(animationKey, true);
      }
      return;
    }

    if (sprite.texture.key !== fallbackPlayerTextureKey) {
      sprite.setTexture(fallbackPlayerTextureKey);
    }
    sprite.stop();
  }

  private connect() {
    const wsUrl = this.getWsUrl();
    this.ws = new GameSocket(wsUrl, {
      onOpen: () => {
        this.statusText?.setText(`已連線 | 存檔 ${formatSaveSlot(this.currentSaveSlot)}`);
      },
      onError: () => {
        this.statusText?.setText("連線失敗，請確認伺服器是否啟動");
        this.showToast("連線失敗，請確認伺服器或網路。");
      },
      onMessage: (message) => {
      if (message.type === "session:welcome") {
        this.playerId = message.playerId;
        if (this.authSessionId && !message.authenticated) {
          this.clearAuthSession(false);
        }
        if (message.saveSlot) {
          this.currentSaveSlot = message.saveSlot;
          persistCurrentSaveSlot(message.saveSlot);
          this.updateSavePanel();
          this.statusText?.setText(
            message.authenticated
              ? `已連線 | Google | 存檔 ${formatSaveSlot(message.saveSlot)}`
              : `已連線 | 存檔 ${formatSaveSlot(message.saveSlot)}`
          );
        }
        return;
      }

      if (message.type === "world:snapshot") {
        const snapshotMap = getGameMap(message.mapId);
        if (message.mapId !== this.currentMapId) {
          this.rebuildMap(snapshotMap);
        } else {
          this.currentMapId = message.mapId;
          this.currentMap = snapshotMap;
        }
        this.applySnapshot(message.players, message.monsters, message.itemDrops);
        return;
      }

      if (message.type === "map:change" && message.playerId === this.playerId) {
        this.rebuildMap(message.map, message.x, message.y);
        this.showToast(`進入 ${message.map.name}（進度已自動存檔）`);
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
        this.showToast(message.text);
        if (message.healed && message.healed > 0) {
          this.showHeal(message.healed);
        }
        return;
      }

      if (message.type === "quest:update" && message.playerId === this.playerId) {
        this.quests.set(message.quest.id, message.quest);
        this.updateQuestTracker();
        this.updateGuidePanel();
        this.updateQuestTargetIndicator();
        this.updateInteractableStatusLabels();
        this.updateBossStatusPanel();
        this.refreshChapterWorldState();
        this.maybeShowStageClear(message.quest);
        return;
      }

      if (message.type === "quest:notice" && message.playerId === this.playerId) {
        this.showToast(message.text);
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
        this.showToast(message.text);
        return;
      }

      if (message.type === "skill:notice" && message.playerId === this.playerId) {
        this.localMp = message.mp;
        if (message.cooldownRemainingMs && message.cooldownRemainingMs > 0) {
          this.skillReadyAt = this.time.now + message.cooldownRemainingMs;
        }
        this.updateSkillCooldownHud();
        this.showCompactNotice(message.text, ColorText.mistBlue);
        return;
      }

      if (message.type === "combat:hit") {
        this.showDamage(message.monsterId, message.damage, message.defeated, message.isSkill, message.skillId);
        if (message.playerId === this.playerId) {
          this.audio.playHitSound(message.isSkill, message.defeated, message.skillId);
          if (message.isSkill) {
            this.cameras.main.shake(110, 0.002);
          } else if (message.defeated) {
            this.cameras.main.shake(100, 0.0018);
          } else {
            this.cameras.main.shake(60, 0.0008);
          }
          this.nudgeMonsterView(message.monsterId);
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
        this.updateGuidePanel();
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
        this.recordAnnouncement({
          text: message.text,
          category: message.category ?? "classroom",
          sentAt: message.sentAt,
          expiresAt: message.expiresAt
        });
        this.showDialogue(`教師公告：${message.text}`);
      }
      },
      onClose: () => {
        this.statusText?.setText("伺服器連線中斷");
        this.showToast("伺服器連線中斷，請重新整理或重新啟動伺服器。");
      }
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
    return getGameSocketUrl(query);
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
    const saveSlot = getOrCreateSaveSlot();
    this.currentSaveSlot = saveSlot;
    return saveSlot;
  }

  private getPreviousSaveSlot() {
    return readPreviousSaveSlot();
  }

  private setSaveSlot(nextSaveSlot: string, rememberPrevious: boolean) {
    const current = this.currentSaveSlot || this.getSaveSlot();
    if (rememberPrevious && current && current !== nextSaveSlot) {
      this.previousSaveSlot = current;
    }

    this.currentSaveSlot = nextSaveSlot;
    persistSaveSlotPair(nextSaveSlot, this.previousSaveSlot);

    this.updateSavePanel();
    this.updateTitleScreen();
  }

  private createNewSaveSlot() {
    const nextSlot = generateSaveSlot();
    this.setSaveSlot(nextSlot, true);
    this.resetCharacterDraftForSlot();
    this.restartForSaveSlot(`已建立新存檔：${formatSaveSlot(nextSlot)}。`);
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

    persistPreviousSaveSlot(current);

    this.restartForSaveSlot(`已載入存檔：${formatSaveSlot(previous)}。`);
  }

  private restartForSaveSlot(message: string) {
    if (!this.gameStarted) {
      this.updateTitleScreen();
      this.showTitleNotice(message);
      return;
    }

    this.showDialogue(message);
    this.ws?.close();
    this.resetRuntimeForSceneRestart();
    this.scene.restart();
  }

  private resetRuntimeForSceneRestart() {
    this.gameStarted = false;
    this.player = undefined;
    this.playerId = "";
    this.ws = undefined;
    this.remoteEntities = undefined;
    this.hud = undefined;
    this.titleScreen = undefined;
    this.currentMap = DEFAULT_GAME_MAP;
    this.currentMapId = DEFAULT_GAME_MAP.id;
    this.quests.clear();
    this.announcements = [];
    this.inventory = [];
    this.equipment = { ...emptyEquipment };
    this.openShop = undefined;
    this.selectedShopIndex = 0;
    this.inventoryPanelVisible = false;
    this.questPanelVisible = true;
    this.questLogPanelVisible = false;
    this.characterPanelVisible = false;
    this.guidePanelVisible = true;
    this.announcementPanelVisible = false;
    this.shopPanelVisible = false;
    this.savePanelVisible = false;
    this.settingsPanelVisible = false;
    this.nearbyNpcId = "";
    this.nearbyInteractableId = "";
    this.nearbyDropId = "";
    this.nearbyPortalId = "";
    this.pendingPickupIds.clear();
    this.currentZoneId = "";
    this.stageClearShown = false;
    this.bossEntryHintShown = false;
    this.lastPlayerUpdateAt = 0;
    this.localHp = 100;
    this.localMp = maxPlayerMp;
    this.localMaxHp = 100;
    this.localMaxMp = maxPlayerMp;
    this.localAttack = 12;
    this.localDefense = 0;
    this.skillReadyAt = 0;
    this.attackReadyAt = 0;
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

  private importSaveSlotFromCode() {
    const raw = window.prompt(
      "貼上先前用「Y 複製」取得的存檔代碼，即可在這個瀏覽器或裝置還原存檔：",
      ""
    );
    if (raw === null) {
      return;
    }

    const code = normalizeSaveSlotCode(raw);
    if (!code) {
      this.showSaveMessage("存檔代碼格式不正確（需 8 碼以上英數字或 - _）。");
      return;
    }

    const current = this.currentSaveSlot || this.getSaveSlot();
    if (code === current) {
      this.showSaveMessage("這已經是目前使用中的存檔。");
      return;
    }

    this.setSaveSlot(code, true);
    this.loadCharacterDraft();
    this.updateTitleScreen();
    this.restartForSaveSlot(`已匯入存檔：${formatSaveSlot(code)}。`);
  }

  private updateSavePanel() {
    if (!this.savePanel) {
      return;
    }

    const saveSlot = this.currentSaveSlot || this.getSaveSlot();
    const previous = this.previousSaveSlot || this.getPreviousSaveSlot();
    const accountLine = this.authSessionId
      ? `模式：學校 Google 帳號 / ${this.authAccountLabel || "Google 已登入"}`
      : "模式：匿名測試存檔（未綁定學校帳號）";
    const accountHint = this.authSessionId
      ? "1/2/3 可切換帳號存檔"
      : "Google 登入後會將存檔綁定到帳號";
    const accountSlots =
      this.authSaveSlots.length > 0
        ? this.authSaveSlots
            .slice(0, 3)
            .map((slot) => {
              const name = slot.characterName ? `${slot.characterName}` : "未命名角色";
              const level = slot.level ? ` Lv.${slot.level}` : "";
              return `- ${name}${level} / ${formatSaveSlot(slot.saveSlot)}`;
            })
        : ["- 尚無帳號存檔摘要"];
    this.savePanel.body.setText(
      [
        `目前：${formatSaveSlot(saveSlot)}`,
        `上一個：${previous ? formatSaveSlot(previous) : "無"}`,
        accountLine,
        accountHint,
        ...accountSlots,
        "",
        "P 關閉 | R 新角色 | L 上一個",
        "Y 複製存檔碼 | X 匯入存檔碼 | G 登出"
      ].join("\n")
    );
  }

  private applySnapshot(players: PlayerSnapshot[], monsters: MonsterSnapshot[], itemDrops: ItemDropSnapshot[]) {
    this.remoteEntities?.applySnapshot(players, monsters, itemDrops);
  }

  private nudgeMonsterView(monsterId: string) {
    this.remoteEntities?.nudgeMonsterView(monsterId);
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
    this.ws.send({
      type: "player:update",
      player: {
        id: this.playerId,
        name: this.characterName,
        className: this.selectedClass,
        mapId: this.currentMapId,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        facing: this.facing,
        animation
      }
    });
  }

  private sendAttack(isSkill: boolean) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    const primarySkill = this.getPrimarySkill();
    this.ws.send({
      type: "combat:attack",
      attackId: `${this.playerId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      isSkill,
      skillId: isSkill ? primarySkill.id : undefined
    });
  }

  private sendNpcInteract(npcId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send({
      type: "npc:interact",
      npcId
    });
  }

  private sendMapInteract(interactableId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send({
      type: "map:interact",
      interactableId
    });
  }

  private sendPortalEnter(portalId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    const now = Date.now();
    if (now < this.portalReadyAt) {
      this.showToast("傳送門正在穩定中。");
      return;
    }
    this.portalReadyAt = now + 900;

    this.ws.send({
      type: "portal:enter",
      portalId
    });
  }

  private confirmReturnSafe() {
    const now = this.time.now;
    // Require a second press within the window so a stray key never teleports mid-combat.
    if (now - this.returnSafeArmedAt > 1200) {
      this.returnSafeArmedAt = now;
      this.showToast("再按一次 Z 確認回安全區。");
      return;
    }

    this.returnSafeArmedAt = 0;
    this.sendReturnSafe();
  }

  private sendReturnSafe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      this.showToast("目前無法回安全區，請確認連線與角色狀態。");
      return;
    }

    this.ws.send({
      type: "player:return-safe"
    });
    this.showToast("正在返回安全區...");
  }

  private sendItemPickup(dropId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send({
      type: "item:pickup",
      dropId
    });
  }

  private tryAutoPickupDrop(dropId: string) {
    if (this.pendingPickupIds.has(dropId)) {
      return;
    }

    this.pendingPickupIds.add(dropId);
    this.sendItemPickup(dropId);
    this.time.delayedCall(900, () => {
      this.pendingPickupIds.delete(dropId);
    });
  }

  private tryUsePotion() {
    const bestPotion = this.inventory
      .filter((slot) => {
        const item = ITEM_DEFINITIONS[slot.itemId];
        return slot.quantity > 0 && item.kind === "consumable" && Boolean(item.healHp);
      })
      .sort((a, b) => (ITEM_DEFINITIONS[b.itemId].healHp ?? 0) - (ITEM_DEFINITIONS[a.itemId].healHp ?? 0))[0];

    if (!bestPotion) {
      this.showCompactNotice("沒有可使用補給品", ColorText.sand);
      return;
    }

    this.sendUseItem(bestPotion.itemId);
  }

  private tryEquipItem(itemId: ItemId) {
    const item = ITEM_DEFINITIONS[itemId];
    if (!item || item.kind !== "equipment" || !item.equipmentSlot) {
      return;
    }

    if (!this.hasInventoryItem(itemId) && this.equipment[item.equipmentSlot] !== itemId) {
      this.showCompactNotice(`背包沒有 ${item.name}`, ColorText.sand);
      return;
    }

    this.sendEquipItem(itemId);
  }

  private tryEquipBestItem(slot: "weapon" | "armor") {
    const candidates = this.inventory
      .filter((inventorySlot) => {
        const item = ITEM_DEFINITIONS[inventorySlot.itemId];
        return inventorySlot.quantity > 0 && item.kind === "equipment" && item.equipmentSlot === slot;
      })
      .sort((a, b) => this.getEquipmentScore(b.itemId) - this.getEquipmentScore(a.itemId));

    const candidate = candidates[0];
    if (!candidate) {
      this.showCompactNotice(slot === "weapon" ? "背包沒有可裝備武器" : "背包沒有可裝備防具", ColorText.sand);
      return;
    }

    if (this.equipment[slot] === candidate.itemId) {
      this.showCompactNotice(`${ITEM_DEFINITIONS[candidate.itemId].name} 已裝備`, ColorText.jade);
      return;
    }

    this.sendEquipItem(candidate.itemId);
  }

  private getEquipmentScore(itemId: ItemId) {
    const item = ITEM_DEFINITIONS[itemId];
    return (item.attackBonus ?? 0) + (item.defenseBonus ?? 0);
  }

  private hasInventoryItem(itemId: ItemId) {
    return (this.inventory.find((slot) => slot.itemId === itemId)?.quantity ?? 0) > 0;
  }

  private sendUseItem(itemId: ItemId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send({
      type: "inventory:use",
      itemId
    });
  }

  private sendEquipItem(itemId: ItemId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send({
      type: "inventory:equip",
      itemId
    });
  }

  private sendShopBuy(npcId: string, itemId: ItemId, quantity: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.playerId || this.localHp <= 0) {
      return;
    }

    this.ws.send({
      type: "shop:buy",
      npcId,
      itemId,
      quantity
    });
  }

  private getAnimation(isMoving: boolean): PlayerAnimation {
    if (!this.player?.body.blocked.down) {
      return "jump";
    }

    return isMoving ? "run" : "idle";
  }

  private flashHitbox(isSkill: boolean) {
    this.combatVfx.flashHitbox(this.player, this.facing, this.localClassName, isSkill, (className) =>
      this.getPrimarySkillFor(className)
    );
  }

  private showDamage(monsterId: string, damage: number, defeated: boolean, isSkill = false, skillId?: SkillId) {
    this.combatVfx.showDamage(this.remoteEntities?.getMonsterView(monsterId), damage, defeated, isSkill, skillId);
  }

  private showMiss(isSkill = false, skillId?: SkillId) {
    this.combatVfx.showMiss(this.player, this.facing, isSkill, skillId);
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
    this.hud?.updatePlayer(player);
    this.levelText?.setText(`${player.name} | 等級 ${player.level}`);
    this.expText?.setText(`${player.exp}/${player.expToNext}`);
    this.hpText?.setText(`${player.hp}/${player.maxHp}`);
    this.mpText?.setText(`${Math.floor(player.mp)}/${player.maxMp}`);
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
      this.showCompactNotice(`${primarySkill.name} 冷卻中 ${(remainingMs / 1000).toFixed(1)} 秒`, ColorText.sand);
      return;
    }

    this.showCompactNotice(`${primarySkill.name} 需要 ${primarySkill.mpCost} 法力`, ColorText.danger);
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
    const color = remainingMs > 0 ? ColorText.sand : this.localMp >= primarySkill.mpCost ? ColorText.mistBlue : ColorText.danger;

    this.hud?.updateSkill(primarySkill, this.localMp, remainingMs);
    this.skillText.setText(`J ${primarySkill.name} | ${primarySkill.mpCost} 法力 | ${status}`);
    this.skillText.setColor(color);
  }

  private updateInventoryHud() {
    if (!this.inventoryPanel) {
      return;
    }

    const consumableLine =
      this.inventory
        .filter((slot) => ITEM_DEFINITIONS[slot.itemId].kind === "consumable" && slot.quantity > 0)
        .sort((a, b) => (ITEM_DEFINITIONS[b.itemId].healHp ?? 0) - (ITEM_DEFINITIONS[a.itemId].healHp ?? 0))
        .map((slot) => `${ITEM_DEFINITIONS[slot.itemId].name} x${slot.quantity}`)[0] ?? "無";
    const weaponName = this.equipment.weapon ? ITEM_DEFINITIONS[this.equipment.weapon].name : "未裝備";
    const armorName = this.equipment.armor ? ITEM_DEFINITIONS[this.equipment.armor].name : "未裝備";
    const materialLines = this.inventory
      .filter((slot) => ITEM_DEFINITIONS[slot.itemId].kind === "material" && slot.quantity > 0)
      .slice(0, 4)
      .map((slot) => `   ${ITEM_DEFINITIONS[slot.itemId].name} x${slot.quantity}`);
    const extraEquipmentLines = this.inventory
      .filter((slot) => {
        const item = ITEM_DEFINITIONS[slot.itemId];
        return item.kind === "equipment" && slot.quantity > 0 && this.equipment[item.equipmentSlot!] !== slot.itemId;
      })
      .slice(0, 2)
      .map((slot) => `   可裝備：${ITEM_DEFINITIONS[slot.itemId].name}`);

    this.inventoryPanel.body.setText(
      [
        `1 使用最佳補給：${consumableLine}`,
        `2 裝備最佳武器：${weaponName}`,
        `3 裝備最佳防具：${armorName}`,
        ...extraEquipmentLines,
        ...materialLines,
        "",
        "掉落物：碰到自動拾取"
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
        "2 裝備武器 | 3 裝備防具"
      ].join("\n")
    );
  }

  private updateActionPrompt() {
    if (!this.player || !this.promptText) {
      return;
    }

    this.nearbyNpcId = "";
    this.nearbyInteractableId = "";
    this.nearbyDropId = "";
    this.nearbyPortalId = "";

    const nearbyNpc = this.currentMap.npcs.find((npc) => {
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

    const nearbyInteractable = this.currentMap.interactables.find((interactable) => {
      return (
        Math.abs(this.player!.x - interactable.x) <= interactable.interactionRadius &&
        Math.abs(this.player!.y - interactable.y) <= interactable.interactionRadius
      );
    });

    if (nearbyInteractable) {
      this.nearbyInteractableId = nearbyInteractable.id;
      const state = this.getInteractableState(nearbyInteractable);
      this.promptText.setText(`${state.done ? "已完成" : nearbyInteractable.prompt}：${nearbyInteractable.name}（${state.label}）`);
      this.promptText.setVisible(true);
      return;
    }

    const nearbyPortal = this.currentMap.portals.find((portal) => {
      return (
        Math.abs(this.player!.x - portal.x) <= portal.width / 2 + 24 &&
        Math.abs(this.player!.y - portal.y) <= portal.height / 2 + 32
      );
    });

    if (nearbyPortal) {
      this.nearbyPortalId = nearbyPortal.id;
      this.promptText.setText(`E 傳送：${nearbyPortal.name}`);
      this.promptText.setVisible(true);
      return;
    }

    for (const [dropId, view] of this.remoteEntities?.getItemDrops() ?? []) {
      if (Math.abs(this.player.x - view.body.x) <= 64 && Math.abs(this.player.y - view.body.y) <= 72) {
        this.nearbyDropId = dropId;
        this.tryAutoPickupDrop(dropId);
        this.promptText.setText("自動拾取");
        this.promptText.setVisible(true);
        return;
      }
    }

    this.promptText.setVisible(false);
  }

  private updateInteractableStatusLabels() {
    for (const interactable of this.currentMap.interactables) {
      const label = this.mapRenderer.getInteractableStatusText(interactable.id);
      if (!label) {
        continue;
      }

      const state = this.getInteractableState(interactable);
      label.setText(state.label);
      label.setColor(state.color);
    }
  }

  private getInteractableState(interactable: MapInteractableData) {
    const quest = this.getInteractableQuest(interactable);
    if (!quest || quest.status === "available") {
      return { label: "未接任務", color: ColorText.sand, done: false };
    }

    if (quest.status === "completed") {
      return { label: getInteractableDoneLabel(interactable), color: ColorText.jade, done: true };
    }

    const interacted = quest.interactedTargetIds?.includes(interactable.id) ?? false;
    if (interacted) {
      return { label: getInteractableDoneLabel(interactable), color: ColorText.jade, done: true };
    }

    if (quest.status === "ready") {
      return { label: "可回報", color: ColorText.gold, done: true };
    }

    return { label: getInteractablePendingLabel(interactable), color: ColorText.danger, done: false };
  }

  private getInteractableQuest(interactable: MapInteractableData) {
    return [...this.quests.values()].find(
      (quest) => quest.objective.type === "interact" && quest.objective.targetId === interactable.targetId
    );
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
    const safeZone = this.currentMap.safeZones.find((zone) => {
      const left = zone.x - zone.width / 2;
      const right = zone.x + zone.width / 2;
      const top = zone.y - zone.height / 2;
      const bottom = zone.y + zone.height / 2;
      return x >= left && x <= right && y >= top && y <= bottom;
    });

    if (safeZone) {
      return { id: safeZone.id, name: safeZone.name };
    }

    if (this.currentMapId === "mist-breakwater") {
      if (x >= 1450) {
        return { id: "watcher-platform", name: "潮眼守衛平台" };
      }

      if (x >= 720) {
        return { id: "mist-breakwater-mid", name: "海霧堤道中段" };
      }

      return { id: "mist-breakwater-entry", name: "堤道入口" };
    }

    if (this.currentMapId === "old-harbor-warehouse") {
      if (x >= 1600) {
        return { id: "warehouse-sentry-zone", name: "倉庫深處" };
      }

      if (x >= 900) {
        return { id: "warehouse-mid", name: "舊港倉庫中段" };
      }

      return { id: "warehouse-entry", name: "倉庫入口" };
    }

    if (this.currentMapId === "coral-tide-cavern") {
      if (x >= 1880) {
        return { id: "coral-warden-core", name: "潮洞核心" };
      }

      if (x >= 1180) {
        return { id: "reef-seal-zone", name: "礁光封印區" };
      }

      return { id: "cavern-entry", name: "珊瑚潮洞入口" };
    }

    if (this.currentMapId === "sunken-archive") {
      if (x >= 2080) {
        return { id: "archive-guardian-core", name: "書庫核心" };
      }

      if (x >= 1280) {
        return { id: "archive-tablet-zone", name: "書庫碑廊" };
      }

      return { id: "archive-entry", name: "沉船書庫入口" };
    }

    if (this.currentMapId === "starlit-observatory") {
      if (x >= 2240) {
        return { id: "astral-keeper-core", name: "星穹核心" };
      }

      if (x >= 1360) {
        return { id: "observatory-lens-zone", name: "觀測鏡台" };
      }

      return { id: "observatory-entry", name: "觀測台入口" };
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

    const allQuestLines = [...this.quests.values()]
      .sort((a, b) => this.getQuestStatusPriority(a) - this.getQuestStatusPriority(b))
      .filter((quest) => quest.status !== "available" || isQuestUnlocked(quest, this.quests))
      .map((quest) => `${this.formatQuestLine(quest)}${this.getQuestDirectionHint(quest)}`);
    const questLines = allQuestLines.slice(0, 4);
    const hiddenQuestCount = allQuestLines.length - questLines.length;
    if (hiddenQuestCount > 0) {
      questLines.push(`... 還有 ${hiddenQuestCount} 個任務，按 Q 開關`);
    }
    this.questPanel.body.setText(questLines.join("\n") || "找港口守衛接任務");
    this.updateQuestLogPanel();
  }

  private updateQuestLogPanel() {
    if (!this.questLogPanel) {
      return;
    }

    const quests = [...this.quests.values()].sort((a, b) => this.getQuestStatusPriority(a) - this.getQuestStatusPriority(b));
    if (quests.length === 0) {
      this.questLogPanel.body.setText("任務同步中。\n請稍候或重新連線。");
      return;
    }

    const lines = quests.flatMap((quest) => [
      `${this.getQuestStatusLabel(quest)} ${quest.title}`,
      `  ${this.formatQuestProgress(quest)} | 回報：${this.getNpcName(quest.npcId)} | EXP ${quest.rewardExp} / 金幣 ${quest.rewardGold}`
    ]);
    this.questLogPanel.body.setText([...lines, "", "Q 關閉 | E 找 NPC 接取 / 回報"].join("\n"));
  }

  private getQuestStatusLabel(quest: QuestSnapshot) {
    if (quest.status === "available" && !isQuestUnlocked(quest, this.quests)) {
      return "[鎖定]";
    }

    const labels: Record<QuestSnapshot["status"], string> = {
      available: "[可接]",
      active: "[進行]",
      ready: "[回報]",
      completed: "[完成]"
    };
    return labels[quest.status];
  }

  private updateGuidePanel() {
    if (!this.guidePanel) {
      return;
    }

    const chapterStep = this.getChapterStepSummary();
    const routeHint = this.getRouteHint();
    const zoneName = this.getCurrentZoneName(this.player?.x ?? 0, this.player?.y ?? 0).name;
    this.guidePanel.body.setText(
      [
        this.fitPanelLine(`${this.currentMap.name} | ${zoneName}`, 22),
        this.fitPanelLine(`狀態：${this.getSurvivalSummary()}`, 24),
        this.fitPanelLine(`進度：${chapterStep}`, 24),
        this.fitPanelLine(`${this.getChapterChecklist()} | ${routeHint.replace("下一步：", "")}`, 28)
      ].join("\n")
    );
  }

  private recordAnnouncement(notice: AnnouncementNotice) {
    const duplicate = this.announcements.find(
      (announcement) => announcement.text === notice.text && announcement.sentAt === notice.sentAt
    );
    if (!duplicate) {
      this.announcements = [notice, ...this.announcements].slice(0, 5);
    }
    this.updateAnnouncementPanel();
  }

  private updateAnnouncementPanel() {
    if (!this.announcementPanel) {
      return;
    }

    if (this.announcements.length === 0) {
      this.announcementPanel.body.setText("目前沒有公告。\n收到教師公告後會保留在這裡。");
      return;
    }

    this.announcementPanel.body.setText(
      this.announcements
        .slice(0, 4)
        .map((announcement) => {
          const category = this.getAnnouncementCategoryLabel(announcement.category);
          const time = new Date(announcement.sentAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
          return this.fitPanelLine(`[${category}] ${time} ${announcement.text}`, 34);
        })
        .join("\n")
    );
  }

  private getAnnouncementCategoryLabel(category: string) {
    const labels: Record<string, string> = {
      system: "系統",
      classroom: "課堂",
      maintenance: "維護",
      event: "活動"
    };
    return labels[category] ?? "公告";
  }

  private fitPanelLine(text: string, maxLength: number) {
    return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text;
  }

  private getSurvivalSummary() {
    if (this.localHp <= 0) {
      return "倒地，等待復活";
    }

    const ratio = this.localMaxHp > 0 ? this.localHp / this.localMaxHp : 1;
    if (ratio <= 0.3) {
      return "生命偏低，先補血";
    }

    if (this.currentMapId === "mist-breakwater" && this.player && this.player.x >= 1450) {
      return "Boss 區域，注意距離";
    }

    return "可探索";
  }

  private getChapterStepSummary() {
    if (this.quests.size === 0) {
      return "任務同步中";
    }

    const steps = chapterQuestIds.map((questId) => this.quests.get(questId));
    const completed = steps.filter((quest) => quest?.status === "completed").length;
    const active = steps.find((quest) => quest && quest.status !== "completed" && isQuestUnlocked(quest, this.quests));

    if (!active) {
      return completed >= steps.length ? "目前內容完成" : "下一階段尚未解鎖";
    }

    return `${completed + 1}/${steps.length} ${active.title}`;
  }

  private getChapterChecklist() {
    return chapterQuestIds
      .map((questId, index) => {
        const quest = this.quests.get(questId);
        if (quest?.status === "completed") {
          return `${index + 1}✓`;
        }
        return quest && isQuestUnlocked(quest, this.quests) ? `${index + 1}-` : `${index + 1}鎖`;
      })
      .join(" ");
  }

  private getRouteHint() {
    if (!this.player) {
      return "提示：Enter 開始遊戲";
    }

    const activeQuest = [...this.quests.values()]
      .sort((a, b) => this.getQuestStatusPriority(a) - this.getQuestStatusPriority(b))
      .find((quest) => quest.status !== "completed" && isQuestUnlocked(quest, this.quests));
    if (activeQuest) {
      const hint = this.getQuestDirectionHint(activeQuest);
      return `下一步：${this.formatQuestLine(activeQuest)}${hint}${this.getSafeReturnHint()}`;
    }

    const portal = this.getNearestPortal();
    if (portal) {
      return `下一步：可前往 ${GAME_MAPS[portal.targetMapId].name}${this.getSafeReturnHint()}`;
    }

    return `下一步：記錄測試回饋，等待第二章${this.getSafeReturnHint()}`;
  }

  private updateQuestTargetIndicator() {
    if (!this.questTargetText || !this.player) {
      return;
    }

    const quest = this.getGuidedQuest();
    if (!quest) {
      this.questTargetText.setVisible(false);
      return;
    }

    const targetMapId = getQuestTargetMapId(quest);
    if (targetMapId && targetMapId !== this.currentMapId) {
      const portal = this.currentMap.portals.find((candidate) => candidate.targetMapId === targetMapId);
      if (portal) {
        this.questTargetText.setText(this.formatTargetIndicator(portal.x, `前往 ${GAME_MAPS[targetMapId].name}`));
        this.questTargetText.setVisible(true);
        return;
      }
    }

    const targetX = getQuestTargetX(quest, this.currentMap);
    if (targetX === undefined) {
      this.questTargetText.setVisible(false);
      return;
    }

    this.questTargetText.setText(this.formatTargetIndicator(targetX, this.getQuestTargetLabel(quest)));
    this.questTargetText.setVisible(true);
  }

  private getGuidedQuest() {
    return [...this.quests.values()]
      .sort((a, b) => this.getQuestStatusPriority(a) - this.getQuestStatusPriority(b))
      .find((quest) => quest.status !== "completed" && isQuestUnlocked(quest, this.quests));
  }

  private formatTargetIndicator(targetX: number, label: string) {
    if (!this.player) {
      return label;
    }

    const dx = targetX - this.player.x;
    const distance = Math.round(Math.abs(dx) / 10) * 10;
    if (distance < 80) {
      return `目標附近：${label}`;
    }

    const direction = dx > 0 ? ">>" : "<<";
    const textDirection = dx > 0 ? "往右" : "往左";
    return `${direction} ${label} | ${textDirection} ${distance}`;
  }

  private getQuestTargetLabel(quest: QuestSnapshot) {
    if (quest.status === "available" || quest.status === "ready") {
      return this.getNpcName(quest.npcId);
    }

    if (quest.objective.type === "kill") {
      return MONSTER_KIND_NAMES[quest.objective.targetKind];
    }

    if (quest.objective.type === "collect") {
      return ITEM_DEFINITIONS[quest.objective.itemId].name;
    }

    return this.getInteractableTargetName(quest.objective.targetId);
  }

  private getSafeReturnHint() {
    if (!this.player || this.localHp <= 0 || this.isInSafeZone(this.player.x, this.player.y)) {
      return "";
    }

    return " | H 回安全區";
  }

  private isInSafeZone(x: number, y: number) {
    return this.currentMap.safeZones.some((zone) => {
      const left = zone.x - zone.width / 2;
      const right = zone.x + zone.width / 2;
      const top = zone.y - zone.height / 2;
      const bottom = zone.y + zone.height / 2;
      return x >= left && x <= right && y >= top && y <= bottom;
    });
  }

  private getQuestStatusPriority(quest: QuestSnapshot) {
    if (quest.status === "available" && !isQuestUnlocked(quest, this.quests)) {
      return 4;
    }

    const statusOrder: Record<QuestSnapshot["status"], number> = {
      ready: 0,
      active: 1,
      available: 2,
      completed: 3
    };

    return statusOrder[quest.status];
  }

  private getNearestPortal() {
    if (!this.player || this.currentMap.portals.length === 0) {
      return undefined;
    }

    return [...this.currentMap.portals].sort(
      (a, b) => Math.abs(a.x - this.player!.x) - Math.abs(b.x - this.player!.x)
    )[0];
  }

  private updateBossAreaWarning() {
    if (!this.player || this.localHp <= 0) {
      return;
    }

    const bossArea =
      this.currentMapId === "mist-breakwater"
        ? {
            entryX: 1360,
            repeatX: 1450,
            dialogue: "前方是潮眼守衛平台。先確認生命與法力，必要時按 H 回安全區。",
            toast: "前方為潮眼守衛區，建議補滿生命後再挑戰。"
          }
        : this.currentMapId === "old-harbor-warehouse"
          ? {
              entryX: 1520,
              repeatX: 1640,
              dialogue: "前方是倉庫巡弋者活動區。先確認補給與裝備，必要時按 H 回入口。",
              toast: "前方為倉庫巡弋者區，建議裝備舊港短刀或補丁布衣後再挑戰。"
            }
          : this.currentMapId === "coral-tide-cavern"
            ? {
                entryX: 1840,
                repeatX: 1940,
                dialogue: "前方是珊瑚守望者核心。先確認補給、裝備與封印進度，必要時按 H 回入口。",
                toast: "前方為珊瑚守望者區，建議完成潮封印後再挑戰。"
              }
            : this.currentMapId === "sunken-archive"
              ? {
                  entryX: 2040,
                  repeatX: 2140,
                  dialogue: "前方是書庫守衛核心。先確認補給、裝備與書庫碑進度，必要時按 H 回入口。",
                  toast: "前方為書庫守衛區，建議校準書庫碑後再挑戰。"
                }
              : this.currentMapId === "starlit-observatory"
                ? {
                    entryX: 2200,
                    repeatX: 2300,
                    dialogue: "前方是星穹守望者核心。先確認補給、星鏡校準與裝備，必要時按 H 回入口。",
                    toast: "前方為星穹守望者區，建議校準三座觀測鏡後再挑戰。"
                  }
                : undefined;
    if (!bossArea) {
      return;
    }

    if (this.player.x >= bossArea.entryX && !this.bossEntryHintShown) {
      this.bossEntryHintShown = true;
      this.showDialogue(bossArea.dialogue);
    }

    if (this.player.x < bossArea.repeatX || this.time.now < this.bossWarningReadyAt) {
      return;
    }

    this.bossWarningReadyAt = this.time.now + 8500;
    this.showToast(bossArea.toast);
  }

  private updateBossStatusPanel() {
    if (this.hud) {
      const boss = this.getCurrentBossStatusTarget();
      if (!boss) {
        this.hud.updateBoss();
        return;
      }
      const questHint = this.quests.get(boss.questId)?.status === "active" ? "任務目標" : "危險區域";
      this.hud.updateBoss({
        hp: boss.monster.hp,
        maxHp: boss.monster.maxHp,
        alive: boss.monster.alive,
        text: `${boss.name} ${boss.monster.hp}/${boss.monster.maxHp} | ${questHint} | K/J 攻擊`,
        defeatedText: boss.defeatedText
      });
      return;
    }
    if (!this.bossHpBack || !this.bossHpFill || !this.bossStatusText) {
      return;
    }

    const boss = this.getCurrentBossStatusTarget();
    if (!boss) {
      this.bossHpBack.setVisible(false);
      this.bossHpFill.setVisible(false);
      this.bossStatusText.setVisible(false);
      return;
    }

    const hpRatio = boss.monster.maxHp > 0 ? Phaser.Math.Clamp(boss.monster.hp / boss.monster.maxHp, 0, 1) : 0;
    this.bossHpBack.setVisible(true);
    this.bossHpFill.setVisible(true).setDisplaySize(280 * hpRatio, 10);
    this.bossStatusText.setVisible(true);

    if (!boss.monster.alive) {
      this.bossHpFill.setVisible(false);
      this.bossStatusText.setText(boss.defeatedText);
      this.bossStatusText.setColor(ColorText.jade);
      return;
    }

    const quest = this.quests.get(boss.questId);
    const questHint = quest?.status === "active" ? "任務目標" : "危險區域";
    this.bossStatusText.setText(`${boss.name} ${boss.monster.hp}/${boss.monster.maxHp} | ${questHint} | K/J 攻擊`);
    this.bossStatusText.setColor(ColorText.gold);
  }

  private getCurrentBossStatusTarget() {
    if (this.currentMapId === "mist-breakwater") {
      const monster = this.remoteEntities?.getMonsterSnapshot("tide-watcher-1");
      const quest = this.quests.get("tide-watcher-core");
      const shouldShow = Boolean((quest && quest.status !== "completed" && quest.status !== "available") || (this.player && this.player.x >= 1320));
      return monster && shouldShow
        ? {
            monster,
            questId: "tide-watcher-core",
            name: "潮眼守衛",
            defeatedText: "潮眼守衛已擊退 | 拾取甲片後找測潮學徒阿汐"
          }
        : undefined;
    }

    if (this.currentMapId === "old-harbor-warehouse") {
      const monster = this.remoteEntities?.getMonsterSnapshot("warehouse-sentry-1");
      const quest = this.quests.get("warehouse-sentry-core");
      const shouldShow = Boolean((quest && quest.status !== "completed" && quest.status !== "available") || (this.player && this.player.x >= 1500));
      return monster && shouldShow
        ? {
            monster,
            questId: "warehouse-sentry-core",
            name: "倉庫巡弋者",
            defeatedText: "倉庫巡弋者已擊退 | 回報倉庫管理員阿桂"
          }
        : undefined;
    }

    if (this.currentMapId === "coral-tide-cavern") {
      const monster = this.remoteEntities?.getMonsterSnapshot("coral-warden-1");
      const quest = this.quests.get("coral-warden-core");
      const shouldShow = Boolean((quest && quest.status !== "completed" && quest.status !== "available") || (this.player && this.player.x >= 1840));
      return monster && shouldShow
        ? {
            monster,
            questId: "coral-warden-core",
            name: "珊瑚守望者",
            defeatedText: "珊瑚守望者已擊退 | 拾取珊瑚潮鑰後找潮洞學者阿璇"
          }
        : undefined;
    }

    if (this.currentMapId === "sunken-archive") {
      const monster = this.remoteEntities?.getMonsterSnapshot("archive-guardian-1");
      const quest = this.quests.get("archive-guardian-core");
      const shouldShow = Boolean((quest && quest.status !== "completed" && quest.status !== "available") || (this.player && this.player.x >= 2040));
      return monster && shouldShow
        ? {
            monster,
            questId: "archive-guardian-core",
            name: "書庫守衛",
            defeatedText: "書庫守衛已擊退 | 拾取書庫封印後找書庫管理員阿澈"
          }
        : undefined;
    }

    if (this.currentMapId === "starlit-observatory") {
      const monster = this.remoteEntities?.getMonsterSnapshot("astral-keeper-1");
      const quest = this.quests.get("astral-keeper-core");
      const shouldShow = Boolean((quest && quest.status !== "completed" && quest.status !== "available") || (this.player && this.player.x >= 2200));
      return monster && shouldShow
        ? {
            monster,
            questId: "astral-keeper-core",
            name: "星穹守望者",
            defeatedText: "星穹守望者已擊退 | 拾取星穹封印後找觀測員阿曜"
          }
        : undefined;
    }

    return undefined;
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
    if (quest.status === "available" && !isQuestUnlocked(quest, this.quests)) {
      return `${quest.title}：${this.getQuestLockedHint(quest)}`;
    }

    if (quest.status === "available") {
      return `找 ${this.getNpcName(quest.npcId)} 接任務`;
    }

    if (quest.status === "active") {
      return `${quest.title}：${this.formatQuestProgress(quest)}`;
    }

    if (quest.status === "ready") {
      return `${quest.title}：回報給 ${this.getNpcName(quest.npcId)}`;
    }

    return `${quest.title}：完成`;
  }

  private getQuestLockedHint(quest: QuestSnapshot) {
    const missingQuestId = (quest.prerequisiteQuestIds ?? []).find((questId) => this.quests.get(questId)?.status !== "completed");
    return `先完成「${this.quests.get(missingQuestId ?? "")?.title ?? "前置任務"}」`;
  }

  private formatQuestProgress(quest: QuestSnapshot) {
    if (quest.objective.type === "collect") {
      return `${ITEM_DEFINITIONS[quest.objective.itemId].name} ${quest.progress}/${quest.targetCount}`;
    }

    if (quest.objective.type === "interact") {
      return `${this.getInteractableTargetName(quest.objective.targetId)} ${quest.progress}/${quest.targetCount}`;
    }

    return `${MONSTER_KIND_NAMES[quest.objective.targetKind]} ${quest.progress}/${quest.targetCount}`;
  }

  private getNpcName(npcId: string) {
    for (const map of Object.values(GAME_MAPS)) {
      const npc = map.npcs.find((candidate) => candidate.id === npcId);
      if (npc) {
        return npc.name;
      }
    }

    return "委託人";
  }

  private getQuestDirectionHint(quest: QuestSnapshot) {
    if (!this.player || quest.status === "completed") {
      return "";
    }

    const targetMapId = getQuestTargetMapId(quest);
    if (targetMapId && targetMapId !== this.currentMapId) {
      const portal = this.currentMap.portals.find((candidate) => candidate.targetMapId === targetMapId);
      if (!portal) {
        return "（目標在其他區域）";
      }

      return this.formatDistanceHint(portal.x, `傳送門：${GAME_MAPS[targetMapId].name}`);
    }

    const targetX = getQuestTargetX(quest, this.currentMap);
    if (targetX === undefined) {
      return "";
    }

    return this.formatDistanceHint(targetX);
  }

  private formatDistanceHint(targetX: number, label = "目標") {
    if (!this.player) {
      return "";
    }

    const dx = targetX - this.player.x;
    const distance = Math.round(Math.abs(dx) / 10) * 10;
    if (distance < 80) {
      return `（${label}附近）`;
    }

    return dx > 0 ? `（往右 ${distance}）` : `（往左 ${distance}）`;
  }

  private getInteractableTargetName(targetId: string) {
    for (const map of Object.values(GAME_MAPS)) {
      const interactable = map.interactables.find((candidate) => candidate.targetId === targetId);
      if (interactable) {
        return interactable.name;
      }
    }

    return "地圖目標";
  }

  private showExpGain(expGained: number) {
    if (!this.player) {
      return;
    }

    const text = this.add.text(this.player.x - 18, this.player.y - 88, `+${expGained} 經驗`, {
      fontFamily: uiFont,
      fontSize: "14px",
      color: ColorText.jade,
      stroke: ColorText.ink,
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

  private showToast(text: string) {
    const toast = this.add
      .text(gameWidth - 26, gameHeight - 34, text, {
        fontFamily: uiFont,
        fontSize: "14px",
        color: ColorText.parchment,
        backgroundColor: "#10271fe6",
        padding: { x: 12, y: 7 },
        wordWrap: { width: 360 }
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(260)
      .setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: toast.y - 10,
      duration: 140,
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          y: toast.y - 12,
          delay: 1700,
          duration: 260,
          onComplete: () => toast.destroy()
        });
      }
    });
  }

  private showFloatingNotice(text: string) {
    if (!this.player) {
      this.showToast(text);
      return;
    }

    const notice = this.add.text(this.player.x - 36, this.player.y - 92, text, {
      fontFamily: uiFont,
      fontSize: "14px",
      color: ColorText.mistBlue,
      stroke: ColorText.ink,
      strokeThickness: 3
    });

    this.tweens.add({
      targets: notice,
      y: notice.y - 28,
      alpha: 0,
      duration: 760,
      onComplete: () => notice.destroy()
    });
  }

  private showCompactNotice(text: string, color: string = ColorText.parchment) {
    const notice = this.add
      .text(gameWidth / 2, 104, text, {
        fontFamily: uiFont,
        fontSize: "12px",
        color,
        backgroundColor: "#10271fe6",
        padding: { x: 9, y: 5 },
        fixedWidth: 250,
        align: "center",
        wordWrap: { width: 232 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(262)
      .setAlpha(0);

    this.tweens.add({
      targets: notice,
      alpha: 1,
      y: notice.y - 4,
      duration: 100,
      onComplete: () => {
        this.tweens.add({
          targets: notice,
          alpha: 0,
          y: notice.y - 8,
          delay: 680,
          duration: 180,
          onComplete: () => notice.destroy()
        });
      }
    });
  }

  private showDialogue(text: string) {
    if (this.hud) {
      this.hud.showDialogue(text);
      return;
    }
    if (!this.dialogueText) {
      return;
    }

    this.dialogueText.setText(text);
    this.dialogueText.setAlpha(1);
    this.dialogueText.setVisible(true);
    this.dialogueBox?.setAlpha(1).setVisible(true);

    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: this.dialogueText,
        alpha: 0,
        duration: 260,
        onComplete: () => this.dialogueText?.setVisible(false)
      });
      if (this.dialogueBox) {
        this.tweens.add({
          targets: this.dialogueBox,
          alpha: 0,
          duration: 260,
          onComplete: () => this.dialogueBox?.setVisible(false)
        });
      }
    });
  }

  private showReward(exp: number, gold: number) {
    if (!this.player) {
      return;
    }

    const text = this.add.text(this.player.x - 28, this.player.y - 108, `+${exp} 經驗  +${gold} 金幣`, {
      fontFamily: uiFont,
      fontSize: "14px",
      color: ColorText.gold,
      stroke: ColorText.ink,
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

  private maybeShowStageClear(quest: QuestSnapshot) {
    if (this.stageClearShown || quest.id !== "tide-gauge-survey" || quest.status !== "completed") {
      return;
    }

    this.stageClearShown = true;
    const panel = this.add.graphics().setScrollFactor(0).setDepth(8000);
    panel.fillStyle(ColorHex.inkGreenDeep, 0.92);
    panel.fillRoundedRect(gameWidth / 2 - 270, 72, 540, 186, 12);
    panel.lineStyle(2, ColorHex.gold, 0.8);
    panel.strokeRoundedRect(gameWidth / 2 - 270, 72, 540, 186, 12);
    panel.lineStyle(1, ColorHex.gold, 0.38);
    panel.strokeRoundedRect(gameWidth / 2 - 258, 84, 516, 162, 8);

    const title = this.add
      .text(gameWidth / 2, 100, "第一章完成", {
        fontFamily: uiFont,
        fontSize: "24px",
        color: ColorText.gold,
        stroke: ColorText.ink,
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(8001);
    const body = this.add
      .text(gameWidth / 2, 166, this.getChapterClearSummary(), {
        fontFamily: uiFont,
        fontSize: "14px",
        color: ColorText.parchment,
        align: "center",
        fixedWidth: 470,
        lineSpacing: 7,
        wordWrap: { width: 470 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(8001);

    this.tweens.add({
      targets: [panel, title, body],
      alpha: 0,
      delay: 5200,
      duration: 600,
      onComplete: () => {
        panel.destroy();
        title.destroy();
        body.destroy();
      }
    });
  }

  private getChapterClearSummary() {
    const completed = chapterQuestIds.filter((questId) => this.quests.get(questId)?.status === "completed").length;
    const total = chapterQuestIds.length;
    return [
      `完成進度：${completed}/${total}`,
      "霧港、海霧堤道、舊港倉庫、珊瑚潮洞、沉船書庫與星砂觀測台已納入章節導引。",
      "可繼續自由探索，或按 T 回報測試意見。",
      "下一階段：平衡數值、正式素材與學生測試回饋。"
    ].join("\n");
  }

  private showHeal(healed: number) {
    if (!this.player) {
      return;
    }

    const text = this.add.text(this.player.x - 16, this.player.y - 98, `+${healed} 生命`, {
      fontFamily: uiFont,
      fontSize: "15px",
      color: ColorText.jade,
      stroke: ColorText.ink,
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
        fontFamily: uiFont,
        fontSize: "28px",
        color: ColorText.gold,
        stroke: ColorText.ink,
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
      fontFamily: uiFont,
      fontSize: defeated ? "18px" : "15px",
      color: defeated ? ColorText.riceWhite : ColorText.danger,
      stroke: ColorText.ink,
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

    if (defeated) {
      this.showToast("你倒下了，數秒後會在安全區復活。");
    }
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
    this.updateGuidePanel();
    this.showToast("已在安全區復活，建議補血後再挑戰。");

    const text = this.add
      .text(gameWidth / 2, 136, "復活", {
        fontFamily: uiFont,
        fontSize: "20px",
        color: ColorText.jade,
        stroke: ColorText.ink,
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
