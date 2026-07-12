import Phaser from "phaser";
import { DEFAULT_GAME_MAP, type GameMapData, type MapInteractableData, type QuestSnapshot } from "@penglai/shared";
import {
  anpingCargoChestTextureKey,
  interactableTextureKeys,
  mapBackgroundLayers,
  mistOverlayTextureKey,
  npcVisualAssets,
  platformTextureKeys,
  scenePropTextureKeys
} from "./assetManifest";
import { ColorHex, ColorText, uiFont } from "./uiTheme";
import { visualQuality } from "./visualQuality";

export interface MapRendererOptions {
  getPlayer: () => Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  getQuests: () => Map<string, QuestSnapshot>;
  hasUsableTexture: (key: string) => boolean;
}

interface ScenePropPlacement {
  key: string;
  x: number;
  y: number;
  scale?: number;
  flipX?: boolean;
}

export class MapRenderer {
  private currentMap: GameMapData = DEFAULT_GAME_MAP;
  private currentMapId = DEFAULT_GAME_MAP.id;
  private mapObjects: Phaser.GameObjects.GameObject[] = [];
  private chapterStateObjects: Phaser.GameObjects.GameObject[] = [];
  private platformColliders: Phaser.Physics.Arcade.Collider[] = [];
  private readonly interactableStatusTexts = new Map<string, Phaser.GameObjects.Text>();

  constructor(private readonly scene: Phaser.Scene, private readonly options: MapRendererOptions) {}

  private get add() { return this.scene.add; }
  private get tweens() { return this.scene.tweens; }
  private get physics() { return this.scene.physics; }
  private get player() { return this.options.getPlayer(); }
  private get quests() { return this.options.getQuests(); }
  private hasUsableTexture(key: string) { return this.options.hasUsableTexture(key); }

  renderPreview(map: GameMapData) {
    this.clearMapObjects();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearMapObjects());
    this.currentMap = map;
    this.currentMapId = map.id;
    this.captureMapObjects(() => this.addBackground());
  }

  rebuild(map: GameMapData, x = map.playerSpawn.x, y = map.playerSpawn.y) {
    this.clearMapObjects();
    this.currentMap = map;
    this.currentMapId = map.id;
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.scene.cameras.main.setBounds(0, 0, map.width, map.height);
    this.captureMapObjects(() => {
      this.addBackground();
      this.addNpcs();
      this.addPlatforms();
    });
    this.player?.setPosition(x, y).setVelocity(0, 0);
  }

  getInteractableStatusText(id: string) { return this.interactableStatusTexts.get(id); }

  private captureMapObjects(render: () => void) {
    const before = new Set(this.scene.children.list);
    render();
    for (const object of this.scene.children.list) if (!before.has(object)) this.mapObjects.push(object);
  }

  private clearMapObjects() {
    for (const collider of this.platformColliders) {
      if (collider.active) collider.destroy();
    }
    this.platformColliders = [];
    for (const object of this.mapObjects) {
      this.tweens.killTweensOf(object);
      if (object.scene) object.destroy();
    }
    this.mapObjects = [];
    this.clearChapterStateObjects();
    this.interactableStatusTexts.clear();
  }

  private clearChapterStateObjects() {
    for (const object of this.chapterStateObjects) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.chapterStateObjects = [];
  }

  private addChapterStateObject<T extends Phaser.GameObjects.GameObject>(object: T) {
    this.chapterStateObjects.push(object);
    return object;
  }

  private addBackground() {
    if (!this.addExternalBackgroundLayers()) {
      this.addFallbackBackgroundArt();
    }

    for (const zone of this.currentMap.safeZones) {
      const markerY = zone.y + zone.height / 2 - 8;
      this.add.ellipse(zone.x, markerY, Math.min(zone.width, 150), 18, ColorHex.goldBright, 0.08)
        .setStrokeStyle(1, ColorHex.jade, 0.46).setDepth(14);
      for (const direction of [-1, 1]) {
        this.add.rectangle(zone.x + direction * Math.min(zone.width / 2 - 12, 58), markerY - 22, 4, 38, ColorHex.woodDark).setDepth(15);
        this.add.circle(zone.x + direction * Math.min(zone.width / 2 - 12, 58), markerY - 44, 7, ColorHex.goldBright, 0.82).setDepth(16);
      }
      this.add.text(zone.x - 52, markerY - 68, zone.name, {
        fontFamily: uiFont,
        fontSize: "11px",
        color: ColorText.jade,
        backgroundColor: "#10271fcc",
        fixedWidth: 104,
        align: "center",
        padding: { x: 4, y: 2 }
      }).setDepth(46);
    }
    this.addHistoricalMapLandmarks();
    for (const portal of this.currentMap.portals) {
      this.addPortalLandmark(portal);
    }

  }

  private addExternalBackgroundLayers() {
    const layers = mapBackgroundLayers[this.currentMapId] ?? [];
    const usableLayers = layers.filter((layer) => this.hasUsableTexture(layer.key));
    if (usableLayers.length === 0) {
      return false;
    }

    const mapCenterX = this.currentMap.width / 2;
    this.add.rectangle(mapCenterX, 300, this.currentMap.width, 560, 0x15323b).setDepth(-70);

    for (const layer of usableLayers) {
      const background = this.add
        .tileSprite(mapCenterX, layer.y, this.currentMap.width, layer.height, layer.key)
        .setScrollFactor(layer.scrollFactor)
        .setAlpha(layer.alpha ?? 1)
        .setDepth(layer.depth);
      if (layer.fitTextureHeight) {
        const textureSource = this.scene.textures.get(layer.key).getSourceImage() as HTMLImageElement;
        const scale = layer.height / textureSource.height;
        background.setTileScale(scale, scale);
      }
    }

    if (this.hasUsableTexture(mistOverlayTextureKey)) {
      const mist = this.add
        .tileSprite(mapCenterX, 250, this.currentMap.width, 190, mistOverlayTextureKey)
        .setScrollFactor(0.62)
        .setAlpha(0.42)
        .setDepth(-40);
      if (visualQuality.animateAmbientLayers) {
        this.tweens.add({ targets: mist, tilePositionX: 192, duration: 12000, repeat: -1 });
      }
    }

    return true;
  }

  private addHistoricalMapLandmarks() {
    const mapId = this.currentMapId;
    if (mapId === "fog-harbor-test") {
      this.addSignpost(1320, 456, "安平港埠貨棧");
      this.addSignpost(1600, 456, "洋行航標燈");
      this.addSignpost(1980, 456, "府城至滬尾航路");
      this.addSignpost(2210, 456, "北岸商棧路");
      if (this.hasUsableTexture(anpingCargoChestTextureKey)) {
        this.add.image(1190, 474, anpingCargoChestTextureKey).setOrigin(0.5, 1).setDepth(24);
      }
      this.addSceneProps([
        { key: scenePropTextureKeys.cargoCrates, x: 760, y: 474 },
        { key: scenePropTextureKeys.burlapSacks, x: 960, y: 474 },
        { key: scenePropTextureKeys.ledgerManifest, x: 1400, y: 474, scale: 0.82 }
      ]);
      return;
    }

    if (mapId === "mist-breakwater") {
      this.addSignpost(430, 456, "河岸航標");
      this.addSignpost(1040, 456, "滬尾河港");
      this.addSignpost(1260, 456, "新學測繪所");
      this.addSignpost(1510, 456, "淡水河潮尺");
      for (const interactable of this.currentMap.interactables) this.addInteractableLandmark(interactable);
      this.addSceneProps([
        { key: scenePropTextureKeys.cargoCrates, x: 700, y: 474, scale: 0.88 },
        { key: scenePropTextureKeys.burlapSacks, x: 1080, y: 474, scale: 0.9 },
        { key: scenePropTextureKeys.ledgerManifest, x: 1370, y: 474, scale: 0.82 }
      ]);
      this.addMistVeil(620, 364, 260);
      this.addMistVeil(1120, 338, 300);
      return;
    }

    if (mapId === "old-harbor-warehouse") {
      this.addSignpost(410, 456, "鹿港商棧口");
      this.addSignpost(930, 456, "郊商貨棧");
      this.addSignpost(1510, 456, "受潮木料區");
      this.addSignpost(2040, 456, "稻江茶市航路");
      this.addSceneProps([
        { key: scenePropTextureKeys.cargoCrates, x: 650, y: 474, scale: 0.92 },
        { key: scenePropTextureKeys.burlapSacks, x: 1080, y: 474 },
        { key: scenePropTextureKeys.timberStack, x: 1530, y: 474 }
      ]);
      this.addMistVeil(760, 360, 260);
      this.addMistVeil(1460, 350, 310);
      return;
    }

    if (mapId === "coral-tide-cavern") {
      this.addSignpost(470, 456, "大稻埕茶埠");
      this.addSignpost(1040, 456, "焙茶與裝箱");
      this.addSignpost(1430, 456, "茶霧礁光");
      this.addSignpost(1960, 456, "艋舺木料街航路");
      for (const interactable of this.currentMap.interactables) this.addInteractableLandmark(interactable);
      this.addSceneProps([
        { key: scenePropTextureKeys.teaChestStack, x: 700, y: 474 },
        { key: scenePropTextureKeys.bambooSieves, x: 1090, y: 474 },
        { key: scenePropTextureKeys.teaDryingRack, x: 1530, y: 474, scale: 0.88 }
      ]);
      this.addMistVeil(720, 336, 280);
      this.addMistVeil(1320, 330, 320);
      this.addMistVeil(1900, 348, 340);
      return;
    }

    if (mapId === "sunken-archive") {
      this.addSignpost(500, 456, "艋舺木料街");
      this.addSignpost(1040, 456, "木作工坊");
      this.addSignpost(1540, 456, "木料貨單");
      this.addSignpost(2140, 456, "大嵙崁山產線");
      for (const interactable of this.currentMap.interactables) this.addInteractableLandmark(interactable);
      this.addSceneProps([
        { key: scenePropTextureKeys.timberStack, x: 720, y: 474 },
        { key: scenePropTextureKeys.ledgerManifest, x: 1320, y: 474, scale: 0.84 },
        { key: scenePropTextureKeys.cargoCrates, x: 1840, y: 474, scale: 0.86 }
      ]);
      this.addMistVeil(780, 334, 300);
      this.addMistVeil(1400, 328, 340);
      this.addMistVeil(2100, 350, 360);
      return;
    }

    this.addSignpost(310, 456, "大嵙崁產線口");
    this.addSignpost(520, 456, "山區茶園");
    this.addSignpost(1120, 456, "樟腦蒸餾棚");
    this.addSignpost(1660, 456, "蒸餾記錄儀");
    this.addSignpost(2280, 456, "山產線終點");
    for (const interactable of this.currentMap.interactables) this.addInteractableLandmark(interactable);
    this.addSceneProps([
      { key: scenePropTextureKeys.teaDryingRack, x: 650, y: 474, scale: 0.84 },
      { key: scenePropTextureKeys.camphorStill, x: 1280, y: 474, scale: 0.86 },
      { key: scenePropTextureKeys.teaChestStack, x: 1820, y: 474, scale: 0.82 }
    ]);
    this.addMistVeil(760, 330, 300);
    this.addMistVeil(1460, 318, 340);
    this.addMistVeil(2140, 346, 360);
  }

  private addFallbackBackgroundArt() {
    const mapCenterX = this.currentMap.width / 2;
    this.add.rectangle(mapCenterX, 160, this.currentMap.width, 320, 0x15323b).setScrollFactor(1);
    this.add.rectangle(mapCenterX, 300, this.currentMap.width, 90, 0x1a3b3a, 0.55).setScrollFactor(1);
    this.add.rectangle(mapCenterX, 420, this.currentMap.width, 172, 0x1c4034).setScrollFactor(1);
    this.add.rectangle(mapCenterX, 506, this.currentMap.width, 34, 0x32261c).setScrollFactor(1);
    this.add.rectangle(mapCenterX, 522, this.currentMap.width, 20, ColorHex.woodPlank).setScrollFactor(1);

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
      this.add.rectangle(x, 444, 6, 64, ColorHex.woodDark);
      this.add.circle(x, 402, 26, ColorHex.gold, 0.16);
      this.add.circle(x, 402, 13, ColorHex.vermilion, 0.95);
      this.add.circle(x, 400, 6, ColorHex.goldBright, 0.9);
    }
  }

  private addSceneProps(placements: ScenePropPlacement[]) {
    for (const placement of placements) {
      if (!this.hasUsableTexture(placement.key)) continue;
      this.add
        .image(placement.x, placement.y, placement.key)
        .setOrigin(0.5, 1)
        .setScale(placement.scale ?? 1)
        .setFlipX(placement.flipX ?? false)
        .setDepth(24);
    }
  }

  private addMapLandmarks() {
    if (this.currentMapId === "mist-breakwater") {
      this.addSignpost(430, 456, "前方：海霧凝膠");
      this.addSignpost(1040, 456, "往右：潮眼平台");
      this.addSignpost(1260, 456, "測潮學徒：回收甲片");
      this.addSignpost(1510, 456, "菁英怪：潮眼守衛");
      for (const interactable of this.currentMap.interactables) {
        this.addInteractableLandmark(interactable);
      }
      this.addMistVeil(620, 364, 260);
      this.addMistVeil(1120, 338, 300);
      this.add.rectangle(1580, 392, 330, 110, ColorHex.vermilion, 0.08).setStrokeStyle(2, ColorHex.vermilion, 0.35);
      this.add.circle(1580, 318, 34, ColorHex.goldBright, 0.18);
      this.add.text(1482, 296, "第一章終點", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      });
      return;
    }

    if (this.currentMapId === "coral-tide-cavern") {
      this.addSignpost(470, 456, "潮洞蟹群");
      this.addSignpost(1040, 456, "潮封印");
      this.addSignpost(1430, 456, "礁光幽影");
      this.addSignpost(1960, 456, "珊瑚守望者");
      for (const interactable of this.currentMap.interactables) {
        this.addInteractableLandmark(interactable);
      }
      this.addMistVeil(720, 336, 280);
      this.addMistVeil(1320, 330, 320);
      this.addMistVeil(1900, 348, 340);
      this.add.rectangle(2030, 392, 380, 118, ColorHex.vermilion, 0.08).setStrokeStyle(2, ColorHex.gold, 0.35);
      this.add.circle(2030, 316, 42, ColorHex.mistBlue, 0.16);
      this.add.text(1910, 292, "潮洞核心", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      });
      return;
    }

    if (this.currentMapId === "sunken-archive") {
      this.addSignpost(500, 456, "沉船漂書");
      this.addSignpost(1040, 456, "書庫碑");
      this.addSignpost(1540, 456, "墨潮精靈");
      this.addSignpost(2140, 456, "書庫守衛");
      for (const interactable of this.currentMap.interactables) {
        this.addInteractableLandmark(interactable);
      }
      this.addMistVeil(780, 334, 300);
      this.addMistVeil(1400, 328, 340);
      this.addMistVeil(2100, 350, 360);
      this.add.rectangle(2240, 392, 410, 120, ColorHex.vermilion, 0.08).setStrokeStyle(2, ColorHex.gold, 0.35);
      this.add.circle(2240, 316, 46, ColorHex.mistBlue, 0.14);
      this.add.text(2110, 292, "書庫核心", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      });
      return;
    }

    if (this.currentMapId === "starlit-observatory") {
      this.addSignpost(310, 456, "回報：觀測員阿曜");
      this.addSignpost(520, 456, "星砂蛾群");
      this.addSignpost(1120, 456, "觀測鏡");
      this.addSignpost(1660, 456, "星鏡哨兵");
      this.addSignpost(2280, 456, "星穹守望者");
      for (const interactable of this.currentMap.interactables) {
        this.addInteractableLandmark(interactable);
      }
      this.addMistVeil(760, 330, 300);
      this.addMistVeil(1460, 318, 340);
      this.addMistVeil(2140, 346, 360);
      this.add.rectangle(2400, 392, 430, 122, ColorHex.vermilion, 0.08).setStrokeStyle(2, ColorHex.gold, 0.35);
      this.add.circle(2400, 314, 50, ColorHex.goldBright, 0.12);
      this.add.text(2276, 290, "星穹核心", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      });
      this.add.text(2050, 348, "先校準三座觀測鏡，再挑戰核心", {
        fontFamily: uiFont,
        fontSize: "12px",
        color: ColorText.parchment,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      });
      return;
    }

    if (this.currentMapId === "old-harbor-warehouse") {
      this.addSignpost(410, 456, "清理倉鼠");
      this.addSignpost(930, 456, "霧化木偶區");
      this.addSignpost(1510, 456, "倉庫巡弋者");
      this.addSignpost(2040, 456, "前往珊瑚潮洞");
      this.addMistVeil(760, 360, 260);
      this.addMistVeil(1460, 350, 310);
      this.add.rectangle(1740, 392, 360, 110, ColorHex.deepTeal, 0.12).setStrokeStyle(2, ColorHex.gold, 0.32);
      this.add.text(1618, 296, "倉庫深處", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      });
      return;
    }

    this.addSignpost(1320, 456, "往右：燈塔營地");
    this.addSignpost(1600, 456, "往右：潮汐林道");
    this.addSignpost(1980, 456, "注意：海霧史萊姆");
    this.addSignpost(2210, 456, "傳送：海霧堤道");
  }

  private addInteractableLandmark(interactable: MapInteractableData) {
    const textureKey = interactableTextureKeys[interactable.kind];
    if (this.hasUsableTexture(textureKey)) {
      this.add.image(interactable.x, interactable.y, textureKey).setOrigin(0.5, 1).setDepth(15);
    } else if (interactable.kind === "lantern") {
      this.addBreakwaterLantern(interactable.x, interactable.y, interactable.name);
      this.add.circle(interactable.x, interactable.y - 46, 32, ColorHex.goldBright, 0.07).setStrokeStyle(1, ColorHex.gold, 0.28);
    } else if (interactable.kind === "tide-gauge") {
      this.addTideGauge(interactable.x, interactable.y);
      this.add.circle(interactable.x + 22, interactable.y - 52, 30, ColorHex.mistBlue, 0.08).setStrokeStyle(1, ColorHex.mistBlue, 0.3);
    } else if (interactable.kind === "seal") {
      this.addReefSeal(interactable.x, interactable.y, interactable.name);
      this.add.circle(interactable.x, interactable.y - 46, 34, ColorHex.mistBlue, 0.08).setStrokeStyle(1, ColorHex.gold, 0.28);
    } else if (interactable.kind === "tablet") {
      this.addArchiveTablet(interactable.x, interactable.y, interactable.name);
      this.add.circle(interactable.x, interactable.y - 46, 34, ColorHex.mistBlue, 0.08).setStrokeStyle(1, ColorHex.gold, 0.28);
    } else {
      this.addObservatoryLens(interactable.x, interactable.y, interactable.name);
      this.add.circle(interactable.x, interactable.y - 50, 36, ColorHex.goldBright, 0.08).setStrokeStyle(1, ColorHex.gold, 0.3);
    }

    const status = this.add.text(interactable.x - 48, interactable.y - 118, "", {
      fontFamily: uiFont,
      fontSize: "11px",
      color: ColorText.sand,
      backgroundColor: "#10271fcc",
      fixedWidth: 96,
      align: "center",
      padding: { x: 4, y: 2 }
    });
    this.interactableStatusTexts.set(interactable.id, status);
  }

  private addPortalLandmark(portal: GameMapData["portals"][number]) {
    const { x, y } = portal;
    if (this.currentMapId === "fog-harbor-test") {
      this.add.rectangle(x - 26, y - 30, 7, 60, ColorHex.woodDark).setDepth(20);
      this.add.rectangle(x + 26, y - 30, 7, 60, ColorHex.woodDark).setDepth(20);
      this.add.triangle(x, y - 70, -40, 15, 40, 15, 0, -12, 0x6f3f32).setDepth(21);
    } else if (this.currentMapId === "mist-breakwater" || this.currentMapId === "coral-tide-cavern") {
      this.add.rectangle(x, y - 5, 90, 14, ColorHex.woodPlank).setStrokeStyle(1, ColorHex.gold, 0.45).setDepth(20);
      this.add.rectangle(x - 38, y - 25, 7, 48, ColorHex.woodDark).setDepth(19);
      this.add.rectangle(x + 38, y - 25, 7, 48, ColorHex.woodDark).setDepth(19);
      if (visualQuality.showSecondaryGlows) this.add.circle(x, y - 18, 30, ColorHex.goldBright, 0.08).setDepth(18);
    } else if (this.currentMapId === "old-harbor-warehouse" || this.currentMapId === "sunken-archive") {
      this.add.rectangle(x, y - 4, 100, 16, ColorHex.woodPlank).setStrokeStyle(1, ColorHex.gold, 0.42).setDepth(20);
      for (const direction of [-1, 1]) {
        this.add.rectangle(x + direction * 44, y - 25, 5, 46, ColorHex.woodDark).setDepth(21);
        this.add.line(x, y - 21, direction * 42, 0, direction * 42, -28, ColorHex.gold, 0.58).setLineWidth(2).setDepth(21);
      }
    } else {
      this.add.ellipse(x, y - 2, 108, 22, 0x806747, 0.78).setStrokeStyle(1, ColorHex.gold, 0.36).setDepth(20);
      for (const direction of [-1, 1]) {
        this.add.rectangle(x + direction * 42, y - 24, 4, 42, ColorHex.woodDark).setDepth(21);
        this.add.triangle(x + direction * 34, y - 48, 0, 0, direction * 18, 7, 0, 14, ColorHex.vermilion, 0.9).setDepth(22);
      }
    }
    this.add.text(x - 52, y - 94, portal.name, {
      fontFamily: uiFont, fontSize: "11px", color: ColorText.gold, backgroundColor: "#10271fcc",
      fixedWidth: 104, align: "center", padding: { x: 4, y: 2 }
    }).setDepth(46);
  }

  private addSignpost(x: number, y: number, text: string) {
    this.add.rectangle(x, y, 10, 62, ColorHex.woodDark);
    this.add.rectangle(x + 52, y - 34, 116, 34, ColorHex.woodPlank);
    this.add.rectangle(x + 52, y - 34, 108, 26, ColorHex.inkGreenDeep).setStrokeStyle(1, ColorHex.gold, 0.5);
    this.add.text(x + 2, y - 44, text, {
      fontFamily: uiFont,
      fontSize: "12px",
      color: ColorText.parchment,
      fixedWidth: 104,
      align: "center",
      wordWrap: { width: 104 }
    });
  }

  private addBreakwaterLantern(x: number, y: number, label: string) {
    this.add.rectangle(x, y, 7, 66, ColorHex.woodDark);
    this.add.circle(x, y - 46, 24, ColorHex.goldBright, 0.13);
    const glow = this.add.circle(x, y - 46, 13, ColorHex.goldBright, 0.3);
    this.add.circle(x, y - 46, 7, ColorHex.vermilion, 0.95).setStrokeStyle(1, ColorHex.gold, 0.65);
    this.add.text(x - 34, y - 86, label, {
      fontFamily: uiFont,
      fontSize: "11px",
      color: ColorText.gold,
      backgroundColor: "#10271fcc",
      padding: { x: 5, y: 3 }
    });
    this.tweens.add({
      targets: glow,
      alpha: 0.08,
      scale: 1.28,
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }

  private addTideGauge(x: number, y: number) {
    this.add.rectangle(x, y - 34, 10, 92, ColorHex.woodDark);
    this.add.rectangle(x + 24, y - 54, 52, 18, ColorHex.deepTeal, 0.92).setStrokeStyle(1, ColorHex.gold, 0.6);
    this.add.rectangle(x + 24, y - 47, 34, 4, ColorHex.mistBlue, 0.82);
    this.add.text(x - 18, y - 92, "潮位尺", {
      fontFamily: uiFont,
      fontSize: "11px",
      color: ColorText.mistBlue,
      backgroundColor: "#10271fcc",
      padding: { x: 5, y: 3 }
    });
  }

  private addReefSeal(x: number, y: number, label: string) {
    this.add.rectangle(x, y - 24, 46, 64, ColorHex.deepTeal, 0.88).setStrokeStyle(2, ColorHex.gold, 0.58);
    this.add.circle(x, y - 32, 18, ColorHex.mistBlue, 0.18);
    const pulse = this.add.circle(x, y - 32, 9, ColorHex.goldBright, 0.32);
    this.add.text(x - 42, y - 92, label, {
      fontFamily: uiFont,
      fontSize: "11px",
      color: ColorText.mistBlue,
      backgroundColor: "#10271fcc",
      padding: { x: 5, y: 3 }
    });
    this.tweens.add({
      targets: pulse,
      alpha: 0.08,
      scale: 1.45,
      duration: 1050,
      yoyo: true,
      repeat: -1
    });
  }

  private addArchiveTablet(x: number, y: number, label: string) {
    this.add.rectangle(x, y - 26, 50, 68, 0x253342, 0.9).setStrokeStyle(2, ColorHex.gold, 0.5);
    this.add.rectangle(x, y - 42, 30, 6, ColorHex.mistBlue, 0.72);
    this.add.rectangle(x, y - 28, 28, 4, ColorHex.goldBright, 0.64);
    const pulse = this.add.circle(x, y - 34, 10, ColorHex.mistBlue, 0.3);
    this.add.text(x - 42, y - 94, label, {
      fontFamily: uiFont,
      fontSize: "11px",
      color: ColorText.mistBlue,
      backgroundColor: "#10271fcc",
      padding: { x: 5, y: 3 }
    });
    this.tweens.add({
      targets: pulse,
      alpha: 0.08,
      scale: 1.35,
      duration: 1150,
      yoyo: true,
      repeat: -1
    });
  }

  private addObservatoryLens(x: number, y: number, label: string) {
    this.add.rectangle(x, y - 22, 10, 58, ColorHex.woodDark);
    this.add.circle(x, y - 52, 24, 0x253342, 0.9).setStrokeStyle(2, ColorHex.gold, 0.62);
    this.add.circle(x, y - 52, 15, ColorHex.mistBlue, 0.18);
    const pulse = this.add.circle(x, y - 52, 8, ColorHex.goldBright, 0.34);
    this.add.rectangle(x + 24, y - 28, 34, 8, ColorHex.woodPlank, 0.86);
    this.add.text(x - 42, y - 98, label, {
      fontFamily: uiFont,
      fontSize: "11px",
      color: ColorText.gold,
      backgroundColor: "#10271fcc",
      padding: { x: 5, y: 3 }
    });
    this.tweens.add({
      targets: pulse,
      alpha: 0.08,
      scale: 1.55,
      duration: 980,
      yoyo: true,
      repeat: -1
    });
  }

  private addMistVeil(x: number, y: number, width: number) {
    if (!visualQuality.showSecondaryGlows) return;
    const veil = this.add.ellipse(x, y, width, 46, 0xd9e6e5, 0.08);
    const veil2 = this.add.ellipse(x + 44, y - 16, width * 0.64, 34, 0xd9e6e5, 0.06);
    if (visualQuality.animateAmbientLayers) this.tweens.add({
      targets: [veil, veil2],
      x: "+=18",
      alpha: 0.14,
      duration: 2400,
      yoyo: true,
      repeat: -1
    });
  }

  refreshChapterWorldState() {
    this.clearChapterStateObjects();
    if (this.currentMapId !== "mist-breakwater") {
      return;
    }

    this.addRepairedLanternEffects();
    this.addWatcherClearEffects();
    this.addChapterClearEffects();
  }

  private addRepairedLanternEffects() {
    const lanternQuest = this.quests.get("breakwater-lantern-repair");
    if (!lanternQuest || lanternQuest.status === "available") {
      return;
    }

    const repaired = new Set(lanternQuest.status === "completed" ? ["lantern-west", "lantern-mid", "lantern-east"] : lanternQuest.interactedTargetIds ?? []);
    for (const interactable of this.currentMap.interactables) {
      if (interactable.kind !== "lantern" || !repaired.has(interactable.id)) {
        continue;
      }

      const glow = this.addChapterStateObject(
        this.add.circle(interactable.x, interactable.y - 46, 36, ColorHex.goldBright, 0.18).setDepth(16)
      );
      this.addChapterStateObject(
        this.add.text(interactable.x - 30, interactable.y - 134, "燈已復明", {
          fontFamily: uiFont,
          fontSize: "11px",
          color: ColorText.jade,
          backgroundColor: "#10271fcc",
          padding: { x: 5, y: 3 }
        })
      );
      this.tweens.add({
        targets: glow,
        alpha: 0.08,
        scale: 1.22,
        duration: 1300,
        yoyo: true,
        repeat: -1
      });
    }

    if (this.currentMapId === "old-harbor-warehouse") {
      this.addSignpost(410, 456, "清理倉鼠");
      this.addSignpost(930, 456, "霧化木偶區");
      this.addSignpost(1510, 456, "倉庫巡弋者");
      this.addMistVeil(760, 360, 260);
      this.addMistVeil(1460, 350, 310);
      this.add.rectangle(1740, 392, 360, 110, ColorHex.deepTeal, 0.12).setStrokeStyle(2, ColorHex.gold, 0.32);
      this.add.text(1618, 296, "舊倉深處", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.gold,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      });
    }
  }

  private addWatcherClearEffects() {
    const watcher = this.quests.get("tide-watcher-core");
    const shell = this.quests.get("watcher-shell-report");
    if (watcher?.status !== "completed" && shell?.status !== "completed") {
      return;
    }

    this.addChapterStateObject(
      this.add.rectangle(1580, 392, 344, 118, ColorHex.jade, 0.08).setStrokeStyle(2, ColorHex.jade, 0.38)
    );
    this.addChapterStateObject(this.add.circle(1580, 318, 42, ColorHex.jade, 0.16));
    this.addChapterStateObject(
      this.add.text(1504, 272, "潮眼已平定", {
        fontFamily: uiFont,
        fontSize: "13px",
        color: ColorText.jade,
        backgroundColor: "#10271fcc",
        padding: { x: 6, y: 4 }
      })
    );
  }

  private addChapterClearEffects() {
    if (!this.isChapterOneCleared()) {
      return;
    }

    this.addChapterStateObject(this.add.rectangle(900, 296, 1540, 42, ColorHex.jade, 0.06));
    this.addChapterStateObject(
      this.add.text(760, 274, "海霧穩定，第一章完成", {
        fontFamily: uiFont,
        fontSize: "15px",
        color: ColorText.jade,
        backgroundColor: "#10271fcc",
        padding: { x: 8, y: 5 }
      })
    );
  }

  private isChapterOneCleared() {
    return this.quests.get("tide-gauge-survey")?.status === "completed";
  }

  private addNpcs() {
    for (const npc of this.currentMap.npcs) {
      // Keep NPC body + nameplate above map background/foreground art so labels are never covered.
      this.add.ellipse(npc.x, npc.y - 2, 30, 10, ColorHex.shadow, 0.4).setDepth(28);
      const visual = npcVisualAssets[npc.id];
      if (visual && this.hasUsableTexture(visual.textureKey)) {
        const sprite = this.add.sprite(npc.x, npc.y, visual.textureKey).setOrigin(0.5, 1).setDepth(30);
        if (this.scene.anims.exists(visual.animationKey)) sprite.play(visual.animationKey);
      } else {
        this.add.rectangle(npc.x, npc.y - 24, 24, 44, ColorHex.teal).setDepth(30);
        this.add.rectangle(npc.x, npc.y - 24, 24, 44, 0x000000, 0).setStrokeStyle(1, ColorHex.gold, 0.4).setDepth(30);
        this.add.rectangle(npc.x, npc.y - 50, 34, 10, ColorHex.gold).setDepth(30);
        this.add.circle(npc.x, npc.y - 54, 10, 0xf2c078).setDepth(30);
      }
      this.add
        .text(npc.x - 48, npc.y - 88, npc.name, {
          fontFamily: uiFont,
          fontSize: "11px",
          color: ColorText.gold,
          backgroundColor: "#10271f",
          fixedWidth: 96,
          align: "center",
          padding: { x: 4, y: 2 }
        })
        .setDepth(46);
    }
  }

  private addPlatforms() {
    if (!this.player) {
      return;
    }

    const platformTextureKey = platformTextureKeys[this.currentMapId];
    for (const platformData of this.currentMap.platforms) {
      if (this.hasUsableTexture(platformTextureKey)) {
        this.add
          .tileSprite(platformData.x, platformData.y, platformData.width, platformData.height, platformTextureKey)
          .setDepth(18);
        this.add
          .rectangle(platformData.x, platformData.y - platformData.height / 2 + 3, platformData.width, 4, ColorHex.jade, 0.72)
          .setDepth(19);
      } else {
        this.add.rectangle(platformData.x, platformData.y, platformData.width, platformData.height, 0x67442b);
        this.add.rectangle(platformData.x, platformData.y - platformData.height / 2 + 3, platformData.width, 6, 0x2f7d44);
      }

      const platform = this.add.rectangle(
        platformData.x,
        platformData.y,
        platformData.width,
        platformData.height,
        0x000000,
        0
      );
      this.physics.add.existing(platform, true);

      const body = platform.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(platformData.width, platformData.height);
      body.updateFromGameObject();
      const collider = this.physics.add.collider(this.player, platform);
      this.platformColliders.push(collider);
    }
  }

}
