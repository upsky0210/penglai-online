import type Phaser from "phaser";

export interface MonsterView {
  body: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
  eye?: Phaser.GameObjects.Arc;
  hpBack: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  lastHitAt: number;
  // 受擊位移只動 view 不動同步座標;baseX 是快照座標,hitOffsetX 由受擊 tween 推動
  baseX: number;
  hitOffsetX: number;
}

export interface ItemDropView {
  body: Phaser.GameObjects.Rectangle;
  shine: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}
