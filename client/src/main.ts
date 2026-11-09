import Phaser from "phaser";
import { gameHeight, gameWidth } from "./game/constants";
import { GameScene } from "./scenes/GameScene";
import { AnpingScene } from "./scenes/AnpingScene";
import { mountAdminDashboard } from "./adminDashboard";
import "./styles.css";

const root = document.querySelector<HTMLElement>("#app");
export let game: Phaser.Game | undefined;

if (!root) {
  throw new Error("Missing #app root.");
}

if (new URLSearchParams(window.location.search).has("admin")) {
  mountAdminDashboard(root);
} else {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: root,
    width: gameWidth,
    height: gameHeight,
    render: {
      pixelArt: false,
      antialias: true,
      antialiasGL: true,
      roundPixels: true
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 980 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true
    },
    scene: new URLSearchParams(window.location.search).has("online") ? GameScene : AnpingScene
  });
}
