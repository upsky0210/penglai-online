import Phaser from "phaser";

const SAVE = "penglai-anping-solo-v1";
const font = '"Microsoft JhengHei", sans-serif';
const WALK_SPEED = 235 * 0.9;
const TIDE_PERIOD = 36000;
const LOW_TIDE_MS = 24000;
interface Progress { version: 1; flags: string[]; gold: number; checkpoint: number }
interface Spot { id: string; x: number; y: number; label: string; color: number }
const spots: Spot[] = [
  { id: "clerk", x: 150, y: 460, label: "帳房阿成", color: 0xeac887 },
  { id: "boatman", x: 510, y: 460, label: "船工阿水", color: 0x8cdbd0 },
  { id: "resident", x: 1100, y: 235, label: "居民阿秀", color: 0xe7a995 },
  { id: "supplies", x: 720, y: 320, label: "補給工具匣", color: 0xc99b50 },
  { id: "ledger", x: 1360, y: 235, label: "倉棧貨單箱", color: 0xc99b50 },
  { id: "bridge", x: 1500, y: 460, label: "修復棧橋", color: 0x8cdbd0 },
  { id: "letter", x: 1860, y: 580, label: "潮間藏物", color: 0xc99b50 },
  { id: "cargo", x: 2220, y: 460, label: "待驗貨箱", color: 0xc99b50 },
  { id: "bell", x: 2580, y: 460, label: "港口信號鐘", color: 0xeac887 }
];

/** Standalone prototype: all simulation and persistence stay in the browser. */
export class AnpingScene extends Phaser.Scene {
  private progress: Progress = { version: 1, flags: [], gold: 0, checkpoint: 150 };
  private hero!: Phaser.Physics.Arcade.Sprite;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hud!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private dialog?: Phaser.GameObjects.Container;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private enemies: { body: Phaser.GameObjects.Rectangle; hp: number; maxHp: number; origin: number; hitAt: number; bar: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }[] = [];
  private hp = 100;
  private hurtAt = 0;
  private attackAt = 0;
  private facing = 1;
  private tide = 0;
  private storageMessage = "";
  private bridgeArt?: Phaser.GameObjects.Rectangle;
  private water!: Phaser.GameObjects.Rectangle;
  private waves!: Phaser.GameObjects.Graphics;
  private waterY = 660;
  private submergedMs = 0;
  private tideClock = 0;
  private notice!: Phaser.GameObjects.Text;
  private noticeUntil = 0;
  constructor() { super("AnpingSolo"); }

  preload() {
    this.load.spritesheet("solo-player", `${import.meta.env.BASE_URL}assets/p8/characters/player/player_idle.png`, { frameWidth: 80, frameHeight: 80 });
  }

  create() {
    this.readSave();
    this.physics.world.setBounds(0, 0, 2800, 720);
    this.cameras.main.setBounds(0, 0, 2800, 720).setBackgroundColor(0x163b44);
    this.platforms = this.physics.add.staticGroup();
    // Harbor skyline is procedural so the prototype needs no new remote assets.
    this.add.rectangle(1400, 630, 2800, 180, 0x205b66);
    for (let x = 50; x < 2800; x += 180) {
      this.add.rectangle(x, 420, 130, 140, 0x35524c);
      this.add.triangle(x, 333, 0, 35, 75, 0, 150, 35, 0x694f45);
      this.add.rectangle(x, 448, 28, 70, 0x1c3334);
    }
    this.add.text(70, 85, "安平・港霧中的貨單", { fontFamily: font, fontSize: "36px", color: "#f2d5a0" });
    this.add.text(72, 137, "1860–1870 年代｜開港、洋行與港區勞動", { fontFamily: font, fontSize: "18px", color: "#bad6cd" });
    // Ground is deliberately interrupted. The loft route and tide route reconnect.
    this.floor(0, 780, 500); this.floor(940, 1560, 500); this.floor(2040, 2800, 500);
    this.floor(555, 770, 425);
    this.floor(660, 820, 360); this.floor(800, 970, 285); this.floor(940, 1450, 275);
    this.floor(750, 950, 610); this.floor(1500, 2070, 620);
    this.floor(1980, 2130, 555);
    this.water = this.add.rectangle(1400, 720, 2800, 60, 0x318da3, 0.65).setOrigin(0.5, 1).setDepth(4);
    this.waves = this.add.graphics().setDepth(5);
    this.add.text(548, 370, "① 跳上木台 → ② 上方倉棧", { fontFamily: font, fontSize: "16px", color: "#ffe6a8", backgroundColor: "#16332e" });
    this.add.text(690, 215, "↑ 倉棧高架道", { fontFamily: font, fontSize: "18px", color: "#f2d5a0" });
    this.add.text(1570, 670, "退潮通道：水漲時請回到岸上", { fontFamily: font, fontSize: "18px", color: "#bad6cd" });
    if (this.has("bridge")) this.buildBridge();
    this.hero = this.physics.add.sprite(this.progress.checkpoint, 420, "solo-player").setDisplaySize(56, 56).setDepth(8);
    this.hero.setSize(25, 44).setOffset(27, 25).setCollideWorldBounds(true);
    this.physics.add.collider(this.hero, this.platforms);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12, -180, 30);
    this.keys = this.input.keyboard!.addKeys("A,D,W,E,K,J,Q,R,ESC,SPACE") as Record<string, Phaser.Input.Keyboard.Key>;
    for (const s of spots) {
      this.add.rectangle(s.x, s.y, 30, 40, s.color).setStrokeStyle(2, 0x172e31);
      this.labels.set(s.id, this.add.text(s.x, s.y - 43, s.label, { fontFamily: font, fontSize: "16px", color: "#fff0cc", backgroundColor: "#16332e" }).setOrigin(0.5));
    }
    for (const x of [1000, 1260, 2140]) {
      const body = this.add.rectangle(x, 480, 32, 30, 0xb57e89).setStrokeStyle(2, 0xf0bac1);
      this.addEnemy(body, 3, x, "霧化鼠");
    }
    if (!this.has("boss")) this.addEnemy(this.add.rectangle(2450, 465, 64, 60, 0x688fc0).setStrokeStyle(3, 0xc6e5ff), 10, 2450, "霧潮守衛");
    this.hud = this.add.text(18, 12, "", { fontFamily: font, fontSize: "17px", color: "#fff0cc", backgroundColor: "#102a2e", padding: { x: 12, y: 8 } }).setScrollFactor(0).setDepth(30);
    this.prompt = this.add.text(480, 493, "", { fontFamily: font, fontSize: "18px", color: "#fff0cc", backgroundColor: "#102a2e", padding: { x: 12, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
    this.notice = this.add.text(480, 100, "", { fontFamily: font, fontSize: "20px", color: "#ffe6a8", backgroundColor: "#102a2e", padding: { x: 14, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(40).setVisible(false);
    this.add.text(18, 463, "A/D 移動 · W/空白 跳躍 · E 互動 · K 攻擊 · J 技能 · Q 筆記 · R 回檢查點", { fontFamily: font, fontSize: "14px", color: "#bad6cd" }).setScrollFactor(0).setDepth(30);
    this.updateLabels();
    this.input.keyboard!.on("keydown-ESC", () => this.closeDialog());
    if (!this.has("intro")) this.show("安平試作關卡", "你受託找回一批走錯倉棧的貨物。\n先找帳房阿成，再聽聽船工與居民的線索。\n\n上方倉棧與下方潮間道可以探索；落水會回檢查點。\n年代與產業取材自史料；角色、貨單事件、潮霧敵人及機關為虛構。\n\n按 E 或 Esc 關閉。進度會自動儲存在這個瀏覽器。 ");
  }

  private floor(left: number, right: number, top: number) {
    const r = this.add.rectangle((left + right) / 2, top + 12, right - left, 24, 0x846d4e).setStrokeStyle(2, 0xb69d6a);
    this.physics.add.existing(r, true); this.platforms.add(r);
    // One-way tops let the player jump up through the wooden scaffolding.
    const body = r.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }
  private addEnemy(body: Phaser.GameObjects.Rectangle, hp: number, origin: number, name: string) {
    body.setDepth(7);
    this.enemies.push({ body, hp, maxHp: hp, origin, hitAt: 0,
      bar: this.add.graphics().setDepth(12),
      label: this.add.text(body.x, body.y - body.height / 2 - 28, name, { fontFamily: font, fontSize: "14px", color: "#ffdbd7", backgroundColor: "#16332e" }).setOrigin(0.5).setDepth(12) });
  }
  private notify(text: string) { this.notice.setText(text).setVisible(true); this.noticeUntil = this.time.now + 3500; }
  private damageNumber(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y - 30, text, { fontFamily: font, fontSize: "25px", color, stroke: "#102a2e", strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: label, y: y - 85, alpha: 0, duration: 650, onComplete: () => label.destroy() });
  }
  private buildBridge() {
    this.floor(1560, 2040, 500);
    this.bridgeArt = this.add.rectangle(1800, 510, 480, 8, 0xd4bd82);
  }
  private has(id: string) { return this.progress.flags.includes(id); }
  private award(id: string, gold = 0) {
    if (this.has(id)) return;
    this.progress.flags.push(id); this.progress.gold += gold; this.save(); this.updateLabels();
  }
  private readSave() {
    try {
      const p = JSON.parse(localStorage.getItem(SAVE) || "null");
      if (p?.version === 1 && Array.isArray(p.flags) && p.flags.every((v: unknown) => typeof v === "string") && Number.isFinite(p.gold) && [150, 510, 1100, 1500, 2200].includes(p.checkpoint)) this.progress = p;
    } catch { this.storageMessage = "無法讀取舊存檔，本次使用新進度"; }
  }
  private save() {
    try { localStorage.setItem(SAVE, JSON.stringify(this.progress)); this.storageMessage = "已儲存"; }
    catch { this.storageMessage = "本機儲存不可用，離開後進度可能遺失"; }
  }
  private updateLabels() {
    for (const s of spots) this.labels.get(s.id)?.setText(`${s.label}${this.has(s.id) ? " ✓" : ""}`);
  }
  private show(title: string, body: string) {
    this.closeDialog(); this.hero?.setVelocityX(0);
    const bg = this.add.rectangle(480, 270, 850, 340, 0x102a2e, 0.98).setStrokeStyle(2, 0xd5b675);
    const t = this.add.text(85, 125, title, { fontFamily: font, fontSize: "26px", color: "#f2d5a0" });
    const b = this.add.text(85, 176, body, { fontFamily: font, fontSize: "19px", color: "#e2eadd", wordWrap: { width: 780 }, lineSpacing: 9 });
    this.dialog = this.add.container(0, 0, [bg, t, b]).setScrollFactor(0).setDepth(100);
    this.physics.pause();
  }
  private closeDialog() { this.dialog?.destroy(true); this.dialog = undefined; this.physics.resume(); }
  private objective() {
    if (!this.has("clerk")) return "向帳房阿成詢問貨物";
    if (!this.has("ledger")) return "走倉棧高架道，找到貨單箱";
    if (!this.has("cargo")) return "參考船工線索越過斷橋，查驗東側貨箱";
    if (!this.has("boss")) return "擊退東碼頭的霧潮守衛（虛構）";
    return this.has("clear") ? "主線完成！可探索藏物，或回訪居民" : "敲響東碼頭信號鐘，完成交接";
  }
  private interact(id: string) {
    switch (id) {
      case "clerk": this.award("intro"); this.award(id); this.show("帳房阿成｜貨物去了哪？", "安平開港後，港區的海關、洋行與倉棧連接海外貿易。\n這批貨的記錄留在高架倉棧，請先找貨單，再查東碼頭貨箱。\n\n提示：往右找到木台，逐層跳上倉棧。沿地面無法直接通過缺口。"); break;
      case "boatman": this.award(id); this.show("船工阿水｜看潮行路", "港口運輸也仰賴熟悉水路的勞動者。\n東邊棧橋斷了：你可以取工具修橋，或等退潮走下方通道。\n\n退潮可通行，漲潮時請走棧橋或回到岸上。\n看藍色水面：一循環 36 秒，前 24 秒退潮，最後 4 秒會預警。\n對話期間潮汐暫停，不用急著讀完。"); break;
      case "resident": this.award(id); this.progress.checkpoint = 1100; this.save(); this.show("居民阿秀｜港口不只有商人", "貨物搬運、倉儲與市街生活彼此相連；這些工作讓貿易成為可能。\n\n我把一封家書收在東邊潮間道的藏物處。若順路，請替我找回。\n這封家書與人物都是虛構，用來呈現港區居民的生活視角。\n\n檢查點已設在倉棧下方。"); break;
      case "supplies": this.award(id, 15); this.hp = 100; this.show("工具匣", "取得修橋工具，並恢復體力。\n可在東側斷橋前按 E 修復棧橋，打開永久捷徑。 "); break;
      case "ledger": if (!this.has("clerk")) { this.show("貨單箱", "先向西側帳房確認委託，才能查閱貨單。"); break; } this.award(id, 20); this.show("貨單片段｜查驗線索", "虛構貨單：目的地為東碼頭倉棧，箱記是「帆船」。\n請到貨箱前依照箱記查驗，避免再送錯貨。\n\n史實背景：洋行、倉棧與海運共同支撐開港後的貿易網絡。"); break;
      case "bridge": if (this.has(id)) { this.show("棧橋已修復", "高處捷徑已開通，往返不必等待潮位。"); break; } if (!this.has("supplies")) { this.show("斷橋", "需要高架道木台上的工具匣。也可以等低潮走下方通道。"); break; } this.award(id); this.buildBridge(); this.show("棧橋修復", "現在可以從棧橋通往東碼頭，也可從下方回訪潮間藏物。"); break;
      case "letter": if (!this.has("resident")) { this.show("潮間藏物", "有居民留下的封存物，先找高架倉棧的阿秀確認。"); break; } this.award(id, 30); this.show("家書｜可選探索", "找到阿秀的家書：『船期又改了，等貨卸完，我就回家吃飯。』\n\n這是虛構文本，提醒我們港口史也包含勞動者與家庭。\n回訪阿秀可以完成支線。"); break;
      case "cargo": if (!this.has("ledger")) { this.show("待驗貨箱", "缺少貨單，請先走高架道查閱記錄。"); break; } if (this.has(id)) { this.show("貨物已核對", "往右處理霧潮守衛，再敲響信號鐘。"); break; } this.chooseCargo(); break;
      case "bell": if (!this.has("cargo") || !this.has("boss")) { this.show("交接尚未完成", "先依貨單查驗東碼頭貨箱，並擊退旁邊的霧潮守衛。"); break; } this.award("clear", 50); this.show("安平交接完成", `你找回貨單、查驗貨箱，讓港區恢復運作。\n\n回顧：安平如何連接海外？海關、洋行、倉棧與航運形成網絡。\n還有哪些人在支撐港口？船工、搬運者、帳房與居民。\n\n探索 ${["boatman", "resident", "supplies", "bridge", "letter", "returned"].filter(x => this.has(x)).length}/6；金幣 ${this.progress.gold}。可繼續探索。`); break;
    }
    if (id === "resident" && this.has("letter")) { this.award("returned", 20); this.show("阿秀｜家書回來了", "謝謝你。這座港口有遠洋貿易，也有等人回家的日常。\n\n支線完成，獲得 20 金幣。家書已收錄於 Q 探索筆記。"); }
  }
  private chooseCargo() {
    this.show("依貨單查驗箱記", "請選擇與貨單一致的箱記（點擊下方選項）：");
    ["茶葉", "帆船", "木槌"].forEach((v, i) => {
      const b = this.add.text(170 + i * 240, 290, `[ ${v} ]`, { fontFamily: font, fontSize: "26px", color: "#f2d5a0", backgroundColor: "#35524c", padding: { x: 20, y: 15 } }).setInteractive({ useHandCursor: true });
      b.on("pointerdown", () => { if (i === 1) { this.award("cargo", 30); this.progress.checkpoint = 2200; this.save(); this.show("箱記核對完成", "貨單與貨箱一致！\n東碼頭已設為檢查點。守衛是遊戲虛構，並非歷史人物或族群。\nK 普攻；J 範圍技能，冷卻約一秒。"); } else this.show("再看一次貨單", "這個箱記與貨單不符，不扣獎勵。\n貨單記的是「帆船」。再按 E 查驗即可。"); });
      this.dialog!.add(b);
    });
  }
  private respawn(reason = "手動返回檢查點") {
    this.hero.setPosition(this.progress.checkpoint, 420).setVelocity(0, 0);
    this.hp = 100; this.hurtAt = this.time.now + 2500; this.submergedMs = 0;
    const place: Record<number, string> = { 150: "西碼頭", 510: "船工木台旁", 1100: "倉棧下方", 1500: "棧橋入口", 2200: "東碼頭" };
    this.show("已返回檢查點", `${reason}\n\n回到${place[this.progress.checkpoint]}，體力已恢復。\n任務、藏物與金幣都保留，不扣獎勵。\n\n按 E 或 Esc 繼續。`);
  }

  update(time: number, delta: number) {
    if (!this.hero) return;
    if (this.dialog) { if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.closeDialog(); return; }
    this.tideClock += Math.min(delta, 100);
    this.tide = this.tideClock % TIDE_PERIOD;
    const low = this.tide < LOW_TIDE_MS;
    const warning = low && this.tide > LOW_TIDE_MS - 4000;
    // The visible water surface is also the actual drowning threshold.
    const targetWaterY = low ? 660 : 552;
    this.waterY = Phaser.Math.Linear(this.waterY, targetWaterY, Math.min(delta / 900, 1));
    this.water.setDisplaySize(2800, 720 - this.waterY).setFillStyle(low ? 0x318da3 : 0x4076bc, 0.68);
    this.waves.clear().lineStyle(3, warning ? 0xffc06a : 0xa8ebef, 0.9);
    for (let x = 0; x < 2800; x += 35) {
      this.waves.lineBetween(x, this.waterY + Math.sin(time / 350 + x / 35) * 3, x + 25, this.waterY + Math.sin(time / 350 + x / 35 + 1) * 3);
    }
    this.notice.setVisible(time < this.noticeUntil);
    this.hero.setVelocityX((this.keys.D.isDown ? 1 : 0) * WALK_SPEED - (this.keys.A.isDown ? 1 : 0) * WALK_SPEED);
    if (this.hero.body!.velocity.x) { this.facing = Math.sign(this.hero.body!.velocity.x); this.hero.setFlipX(this.facing < 0); }
    if ((Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) && (this.hero.body as Phaser.Physics.Arcade.Body).blocked.down) this.hero.setVelocityY(-530);
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) { this.respawn(); return; }
    if (this.hero.y > 690) { this.respawn("落入深水，船工將你救回岸上。"); return; }
    this.submergedMs = this.hero.y > this.waterY ? this.submergedMs + delta : 0;
    if (this.submergedMs > 0) this.notify("水位已淹過通道！快回岸上或跳上木台");
    if (this.submergedMs > 1600) { this.respawn("在漲潮通道停留太久，船工將你救回岸上。"); return; }
    if (warning && this.hero.x > 1480 && this.hero.x < 2100) this.notify("即將漲潮！離開下方通道，返回岸上");
    const grounded = (this.hero.body as Phaser.Physics.Arcade.Body).blocked.down;
    const checkpoint = grounded && this.hero.y < 510
      ? this.hero.x > 1460 && this.hero.x < 1560 ? 1500
        : this.hero.x > 970 && this.hero.x < 1450 ? 1100
          : this.hero.x > 480 && this.hero.x < 780 ? 510 : 0
      : 0;
    if (checkpoint && checkpoint > this.progress.checkpoint) { this.progress.checkpoint = checkpoint; this.save(); this.notify("檢查點已更新，失足後會從附近重新出發"); }
    const near = spots.find(s => Math.abs(s.x - this.hero.x) < 65 && Math.abs(s.y - this.hero.y) < 80);
    this.prompt.setText(near ? `E · ${near.label}` : "探索高架倉棧與潮間通道");
    if (near && Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact(near.id);
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.show("探索筆記", `目標：${this.objective()}\n貨單：${this.has("ledger") ? "東碼頭・帆船箱記" : "尚未找到"}\n家書：${this.has("returned") ? "已交還" : this.has("letter") ? "已找到，請交給阿秀" : "尚未找到"}\n\n史料背景：臺南市安平區公所古蹟導覽、南市文資處《貿易推手──安平洋行》。\n角色、家書、機關與怪物皆屬虛構。進度只存在此瀏覽器。`);
    const skill = Phaser.Input.Keyboard.JustDown(this.keys.J);
    const attack = Phaser.Input.Keyboard.JustDown(this.keys.K);
    if ((attack || skill) && time > this.attackAt) {
      this.attackAt = time + (skill ? 950 : 330);
      const slash = this.add.graphics().setPosition(this.hero.x, this.hero.y).setScale(this.facing, 1).setDepth(10);
      slash.lineStyle(skill ? 12 : 7, skill ? 0x8defff : 0xffdf92, 0.95);
      slash.beginPath().arc(0, 0, skill ? 145 : 78, -1.1, 1.1, false).strokePath();
      slash.lineStyle(3, 0xffffff, 0.95).beginPath().arc(0, 0, skill ? 135 : 68, -1, 1, false).strokePath();
      if (skill) { slash.fillStyle(0x8defff, 0.25).fillTriangle(12, 0, 140, -48, 140, 48); }
      this.tweens.add({ targets: slash, alpha: 0, scaleX: this.facing * 1.1, duration: skill ? 320 : 220, onComplete: () => slash.destroy() });
      for (const e of this.enemies) {
        if (e.hp <= 0 || Math.abs(e.body.y - this.hero.y) > 70 || (e.body.x - this.hero.x) * this.facing < -15 || Math.abs(e.body.x - this.hero.x) > (skill ? 155 : 95)) continue;
        e.hp -= skill ? 2 : 1; e.hitAt = time + 180;
        this.damageNumber(e.body.x, e.body.y, skill ? "−2" : "−1", "#ffe39b");
        if (e.hp <= 0) { e.body.setVisible(false); e.bar.clear(); e.label.setVisible(false); if (e.origin === 2450) { this.award("boss", 40); this.notify("霧潮守衛已擊退！前往信號鐘完成交接"); } }
        this.cameras.main.shake(60, 0.002);
      }
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.body.x = e.origin + Math.sin(time / (e.origin === 2450 ? 700 : 1100)) * (e.origin === 2450 ? 70 : 45);
      e.body.setAlpha(time < e.hitAt ? 0.4 : 1);
      e.label.setPosition(e.body.x, e.body.y - e.body.height / 2 - 28);
      e.bar.clear().fillStyle(0x172e31).fillRect(e.body.x - 27, e.body.y - e.body.height / 2 - 15, 54, 7);
      e.bar.fillStyle(0xf28c85).fillRect(e.body.x - 26, e.body.y - e.body.height / 2 - 14, 52 * e.hp / e.maxHp, 5);
      if (time > this.hurtAt && Math.abs(e.body.x - this.hero.x) < (e.origin === 2450 ? 55 : 32) && Math.abs(e.body.y - this.hero.y) < 45) {
        this.hp -= e.origin === 2450 ? 22 : 12; this.hurtAt = time + 1100;
        this.damageNumber(this.hero.x, this.hero.y, e.origin === 2450 ? "−22" : "−12", "#ff9797");
        this.cameras.main.flash(100, 120, 20, 20);
        this.notify("碰到敵人會受傷！K 普攻／J 範圍斬擊，注意左上體力");
        if (this.hp <= 0) { this.respawn("體力耗盡，已在附近檢查點休息恢復。"); return; }
      }
    }
    this.hero.setAlpha(time < this.hurtAt ? 0.65 : 1);
    this.hud.setText(`安平・單人探索   體力 ${this.hp}/100   金幣 ${this.progress.gold}   ${warning ? "⚠ 即將漲潮" : low ? "退潮・通道可走" : "漲潮・請走棧橋"} ${Math.ceil((low ? LOW_TIDE_MS - this.tide : TIDE_PERIOD - this.tide) / 1000)}秒\n${this.objective()}   ｜${this.storageMessage}`);
  }
}


