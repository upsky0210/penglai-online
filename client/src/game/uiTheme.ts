// 蓬萊異聞錄 Online —— 遊戲 UI 美術常數
// 美術方向：台灣史地 + 奇幻蓬萊。
// 主色：墨綠 / 深青 / 米白 / 木色；點綴：金 / 朱紅 / 霧藍。
//
// 這個檔案只放「視覺常數」，不含任何遊戲邏輯。
// ColorHex：給 Phaser 的圖形 fill / stroke 用（0xRRGGBB 數值）。
// ColorText：給 Phaser 文字樣式與 HTML 用（#rrggbb 字串）。

/** Phaser 圖形（rectangle / circle / graphics）使用的數值色票。 */
export const ColorHex = {
  // 墨綠系（面板、夜霧）
  inkGreen: 0x1c3a2e,
  inkGreenDeep: 0x122a20,
  inkGreenShade: 0x0d1f17,
  // 深青系（標頭、海水）
  deepTeal: 0x1d3f49,
  teal: 0x255c66,
  tealSoft: 0x3b7d86,
  // 木色系（外框、平台、招牌）
  wood: 0x6b4a2f,
  woodDark: 0x432c1b,
  woodLight: 0x8a6038,
  woodPlank: 0x7a5131,
  // 米白系（文字、紙張）
  riceWhite: 0xf3ecdb,
  parchment: 0xe7dcc2,
  // 點綴
  gold: 0xd8a957,
  goldBright: 0xeac373,
  vermilion: 0xb83a2e,
  vermilionSoft: 0xcf5a45,
  mistBlue: 0x7ea7bb,
  jade: 0x8fd9a8,
  // 機能色
  hp: 0xc8463a,
  mp: 0x4f9fd6,
  exp: 0x69c08a,
  barTrack: 0x241d14,
  shadow: 0x0a1410
} as const;

/** Phaser 文字樣式與 HTML 使用的字串色票。 */
export const ColorText = {
  riceWhite: "#f3ecdb",
  parchment: "#e7dcc2",
  sand: "#cbbd9b",
  gold: "#eac373",
  goldSoft: "#d8a957",
  vermilion: "#e58068",
  mistBlue: "#9cc2d4",
  jade: "#8fd9a8",
  ink: "#101d18",
  danger: "#ff9b86"
} as const;

/** 介面字體堆疊：優先採用系統內建的正體中文黑體，確保畫布文字清晰。 */
export const uiFont = '"Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans TC", sans-serif';

/** 面板外觀參數。 */
export const PanelStyle = {
  radius: 12,
  headerHeight: 32
} as const;
