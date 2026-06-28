import type Phaser from "phaser";

export interface UiPanel {
  container: Phaser.GameObjects.Container;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
}

export function createUiPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
): UiPanel {
  const container = scene.add.container(x, y).setScrollFactor(0).setDepth(100);
  const background = scene.add.rectangle(0, 0, width, height, 0x111923, 0.92).setOrigin(0);
  const border = scene.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0);
  const header = scene.add.rectangle(0, 0, width, 28, 0x2c4b5f, 0.96).setOrigin(0);
  const accent = scene.add.rectangle(0, 27, width, 2, 0xe0a84f, 0.8).setOrigin(0);
  const titleText = scene.add.text(12, 7, title, {
    fontSize: "13px",
    color: "#f6ead2"
  });
  const body = scene.add.text(12, 38, "", {
    fontSize: "12px",
    color: "#f2efe6",
    lineSpacing: 4,
    wordWrap: { width: width - 24 }
  });

  border.setStrokeStyle(1, 0xe0a84f, 0.52);
  container.add([background, border, header, accent, titleText, body]);
  return {
    container,
    title: titleText,
    body
  };
}
