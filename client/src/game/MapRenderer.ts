import Phaser from "phaser";
import type { GameMapData } from "@penglai/shared";

export class MapRenderer {
  private mapObjects: Phaser.GameObjects.GameObject[] = [];
  private chapterObjects: Phaser.GameObjects.GameObject[] = [];
  private platformColliders: Phaser.Physics.Arcade.Collider[] = [];
  private readonly interactableStatusTexts = new Map<string, Phaser.GameObjects.Text>();

  constructor(private readonly scene: Phaser.Scene) {}

  rebuild(
    map: GameMapData,
    render: () => void,
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined,
    x = map.playerSpawn.x,
    y = map.playerSpawn.y
  ) {
    this.clear();
    this.scene.physics.world.setBounds(0, 0, map.width, map.height);
    this.scene.cameras.main.setBounds(0, 0, map.width, map.height);
    this.capture(render);
    player?.setPosition(x, y).setVelocity(0, 0);
  }

  capture(render: () => void) {
    const before = new Set(this.scene.children.list);
    render();
    for (const object of this.scene.children.list) if (!before.has(object)) this.mapObjects.push(object);
  }

  clear() {
    for (const collider of this.platformColliders) collider.destroy();
    this.platformColliders = [];
    for (const object of this.mapObjects) object.destroy();
    this.mapObjects = [];
    this.clearChapterObjects();
    this.interactableStatusTexts.clear();
  }

  addPlatformCollider(collider: Phaser.Physics.Arcade.Collider) { this.platformColliders.push(collider); }
  setInteractableStatusText(id: string, text: Phaser.GameObjects.Text) { this.interactableStatusTexts.set(id, text); }
  getInteractableStatusText(id: string) { return this.interactableStatusTexts.get(id); }
  addChapterObject<T extends Phaser.GameObjects.GameObject>(object: T) { this.chapterObjects.push(object); return object; }
  clearChapterObjects() {
    for (const object of this.chapterObjects) { this.scene.tweens.killTweensOf(object); object.destroy(); }
    this.chapterObjects = [];
  }
}
