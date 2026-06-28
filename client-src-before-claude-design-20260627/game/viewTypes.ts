import type Phaser from "phaser";

export interface MonsterView {
  body: Phaser.GameObjects.Rectangle;
  eye: Phaser.GameObjects.Arc;
  hpBack: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  lastHitAt: number;
}

export interface ItemDropView {
  body: Phaser.GameObjects.Rectangle;
  shine: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

