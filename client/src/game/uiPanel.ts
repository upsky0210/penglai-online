import type Phaser from "phaser";
import { ColorHex, ColorText, PanelStyle, uiFont } from "./uiTheme";

export interface UiPanel {
  container: Phaser.GameObjects.Container;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
}

// 木框 + 墨綠底 + 金線收邊 + 朱紅印章的廟埕風面板。
// 對外維持 { container, title, body } 介面，GameScene 不需更動呼叫方式。
export function createUiPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
): UiPanel {
  const container = scene.add.container(x, y).setScrollFactor(0).setDepth(100);
  const { radius, headerHeight } = PanelStyle;

  const g = scene.add.graphics();

  // 落影
  g.fillStyle(ColorHex.shadow, 0.4);
  g.fillRoundedRect(3, 6, width, height, radius);
  // 木質外框
  g.fillStyle(ColorHex.woodDark, 1);
  g.fillRoundedRect(0, 0, width, height, radius);
  // 墨綠內底
  g.fillStyle(ColorHex.inkGreenDeep, 0.97);
  g.fillRoundedRect(3, 3, width - 6, height - 6, radius - 2);
  // 深青標頭
  g.fillStyle(ColorHex.deepTeal, 1);
  g.fillRoundedRect(3, 3, width - 6, headerHeight, {
    tl: radius - 2,
    tr: radius - 2,
    bl: 0,
    br: 0
  });
  // 標頭金線
  g.fillStyle(ColorHex.gold, 0.92);
  g.fillRect(3, headerHeight + 2, width - 6, 2);
  // 金色細收邊
  g.lineStyle(1, ColorHex.gold, 0.5);
  g.strokeRoundedRect(1.5, 1.5, width - 3, height - 3, radius - 1);

  // 朱紅印章
  g.fillStyle(ColorHex.vermilion, 1);
  g.fillRoundedRect(12, 9, 14, 14, 3);
  g.lineStyle(1, ColorHex.gold, 0.85);
  g.strokeRoundedRect(12, 9, 14, 14, 3);

  const titleText = scene.add.text(34, 8, title, {
    fontFamily: uiFont,
    fontSize: "14px",
    color: ColorText.gold,
    fontStyle: "bold"
  });

  const body = scene.add.text(14, headerHeight + 12, "", {
    fontFamily: uiFont,
    fontSize: "12px",
    color: ColorText.parchment,
    lineSpacing: 5,
    wordWrap: { width: width - 28 }
  });

  container.add([g, titleText, body]);
  return {
    container,
    title: titleText,
    body
  };
}
