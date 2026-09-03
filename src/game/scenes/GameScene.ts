import Phaser from 'phaser';
import { GAME_W, GAME_H, GEM_PALETTES, TUNING } from '../../config';
import { Save } from '../systems/Save';
import { Economy } from '../systems/Economy';
import { Shop } from '../systems/Shop';
import { Audio } from '../systems/Audio';
import { Analytics } from '../systems/Analytics';
import { RunState, Upgrade, pickThree } from '../data/upgrades';
import { createCaveBackground } from '../gfx/background';
import { gemKey } from './BootScene';
import { panel, button, FONT } from '../../ui/widgets';

type OreType = 'gem' | 'gold' | 'rock' | 'bomb' | 'bag';
interface Ore {
  type: OreType; color: string; r: number; weight: number; base: number;
  x: number; y: number; main: Phaser.GameObjects.GameObject & { x: number; y: number };
  glow: Phaser.GameObjects.Image; extra?: Phaser.GameObjects.Text; seed: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private score = 0; private level = 1; private goal = 0; private roundTime = 30; private timeLeft = 30;
  private comboColor: string | null = null; private comboCount = 0; private comboMult = 1;
  private doubleCoins = false; private shield = false;
  private paused = false; private choosing = false; private ended = false;

  private palette: string[] = GEM_PALETTES.classic;
  private ores: Ore[] = [];
  private surfaceY = 230;

  // 钩
  private hook = { x: GAME_W / 2, y: 96, angle: 0, dir: 1, len: 34, state: 'swing' as 'swing' | 'shoot' | 'reel', grabbed: null as Ore | null };
  private hookImg!: Phaser.GameObjects.Image;
  private rope!: Phaser.GameObjects.Graphics;
  private hookLight!: Phaser.GameObjects.Image;
  private burstMgr!: Phaser.GameObjects.Particles.ParticleEmitter;

  // HUD
  private scoreT!: Phaser.GameObjects.Text; private goalT!: Phaser.GameObjects.Text;
  private timeT!: Phaser.GameObjects.Text; private lvlT!: Phaser.GameObjects.Text;
  private bar!: Phaser.GameObjects.Graphics; private comboT!: Phaser.GameObjects.Text;

  constructor() { super('Game'); }

  create(data: { booster?: string | null }) {
    Analytics.screen('game');
    this.resetState();
    createCaveBackground(this, true);

    this.palette = GEM_PALETTES[Shop.equippedSkin('gemTheme').gemPalette ?? 'classic'] ?? GEM_PALETTES.classic;

    // 钩 + 绳 + 光
    this.buildMachine();
    this.hookLight = this.add.image(this.hook.x, this.hook.y, 'glow').setTint(0xfff2cf).setAlpha(0.14).setBlendMode(Phaser.BlendModes.ADD).setScale(1.2).setDepth(6);
    this.rope = this.add.graphics().setDepth(9);
    this.hookImg = this.add.image(this.hook.x, this.hook.y, 'hook_' + Save.data.equipped.hook).setScale(1.15).setDepth(11);

    // 拖尾（皮肤）
    const trailColor = Shop.equippedSkin('trail').trailColor;
    if (trailColor) {
      this.add.particles(0, 0, 'dot', {
        follow: this.hookImg, scale: { start: 0.5, end: 0 }, alpha: { start: 0.7, end: 0 },
        tint: Phaser.Display.Color.HexStringToColor(trailColor).color, lifespan: 320, frequency: 24,
        blendMode: 'ADD', quantity: 1,
      }).setDepth(10);
    }

    // 抓取粒子
    this.burstMgr = this.add.particles(0, 0, 'dot', {
      lifespan: 620, speed: { min: 60, max: 300 }, scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 }, gravityY: 500, blendMode: 'ADD', emitting: false,
    }).setDepth(20);

    this.buildHud();

    // 开局道具
    this.applyBooster(data?.booster ?? null);

    // 输入
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.y > 100) this.launch(); });
    this.input.keyboard?.on('keydown-SPACE', () => this.launch());
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

    this.makeLevel();
  }

  private resetState() {
    this.run = { reelSpeed: 520, shootSpeed: 900, strength: 1, swingSpeed: 1.7, magnet: 0, defuse: 0, timeBonusPerGrab: 0, comboCapBonus: 0, greed: 1 };
    this.score = 0; this.level = 1; this.doubleCoins = false; this.shield = false;
    this.paused = false; this.choosing = false; this.ended = false;
    this.ores = [];
    this.hook = { x: GAME_W / 2, y: 96, angle: 0, dir: 1, len: 34, state: 'swing', grabbed: null };
  }

  private applyBooster(id: string | null) {
    if (!id) return;
    if (id === 'time') this.roundTime += 8;
    else if (id === 'magnet') this.run.magnet += 26;
    else if (id === 'double') this.doubleCoins = true;
    else if (id === 'shield') this.shield = true;
    this.toast(`已激活道具：${boosterLabel(id)}`);
  }

  private buildMachine() {
    const g = this.add.graphics().setDepth(8);
    const cx = GAME_W / 2;
    g.fillStyle(0x0b0f1d, 1); g.fillRoundedRect(cx - 34, 66, 68, 38, 6);
    g.fillStyle(0x3a4a72, 1); g.fillRoundedRect(cx - 34, 66, 68, 8, 4);
    g.fillStyle(0x5a6a92, 1);
    [[-24, 96], [24, 96], [-24, 76], [24, 76]].forEach((p) => g.fillCircle(cx + p[0], p[1], 2.4));
    g.lineStyle(3, 0x8b97b8, 1); g.strokeCircle(cx, 86, 8);
  }

  // ---------- 关卡 ----------
  private makeLevel() {
    this.ores.forEach(destroyOre);
    this.ores = [];
    const lvl = this.level, areaTop = this.surfaceY + 60, areaBot = GAME_H - 120;
    const counts = {
      gem: 6 + Math.min(8, lvl), gold: 2 + Math.floor(lvl / 2), rock: 2 + Math.floor(lvl / 2),
      bomb: Math.min(5, Math.floor(lvl / 1.5)), bag: lvl >= 2 ? 1 + Math.floor(lvl / 4) : 1,
    };
    const place = (o: Ore) => {
      let tr = 0;
      do { o.x = rand(46, GAME_W - 46); o.y = rand(areaTop, areaBot); tr++; }
      while (tr < 30 && this.ores.some((p) => Math.hypot(p.x - o.x, p.y - o.y) < p.r + o.r + 16));
      this.spawnOre(o);
    };
    for (let i = 0; i < counts.gem; i++) place(mk('gem', pick(this.palette), rand(14, 18), 1, 55));
    for (let i = 0; i < counts.gold; i++) { const big = Math.random() < 0.4; place(mk('gold', '#ffd24a', big ? 27 : 20, big ? 3.2 : 2, big ? 260 : 120)); }
    for (let i = 0; i < counts.rock; i++) place(mk('rock', '#7d879e', rand(21, 28), 3.5, 14));
    for (let i = 0; i < counts.bomb; i++) place(mk('bomb', '#39406a', 16, 1.2, 0));
    for (let i = 0; i < counts.bag; i++) place(mk('bag', '#c77dff', 17, 1.5, 0));

    const potential = this.ores.reduce((s, o) => s + o.base, 0);
    this.goal = Math.round((lvl === 1 ? TUNING.goalLevel1 : potential * TUNING.goalFactor) + lvl * TUNING.goalPerLevel);
    this.roundTime = Math.max(TUNING.minTime, TUNING.baseTime - lvl);
    this.timeLeft = this.roundTime;
    this.comboColor = null; this.comboCount = 0; this.comboMult = 1; this.updateCombo();
    Object.assign(this.hook, { state: 'swing', len: 34, grabbed: null, angle: 0, dir: 1 });
    this.updateHud();
  }

  private spawnOre(o: Ore) {
    o.glow = this.add.image(o.x, o.y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(4);
    if (o.type === 'gem') { o.main = this.add.image(o.x, o.y, gemKey(o.color)).setDepth(5) as any; o.glow.setTint(Phaser.Display.Color.HexStringToColor(o.color).color).setScale(o.r * 2.1 / 64).setAlpha(0.18); }
    else if (o.type === 'gold') { o.main = this.add.image(o.x, o.y, 'orb_gold').setDepth(5) as any; o.glow.setTint(0xffdd66).setScale(o.r * 2 / 64).setAlpha(0.2); }
    else if (o.type === 'rock') { o.main = this.add.image(o.x, o.y, 'rock_' + ((o.seed | 0) % 3)).setDepth(5) as any; o.glow.setVisible(false); }
    else if (o.type === 'bomb') {
      o.main = this.add.image(o.x, o.y, 'orb_bomb').setDepth(5) as any;
      o.extra = this.add.text(o.x, o.y, '💣', { fontSize: '16px' }).setOrigin(0.5).setDepth(6);
      o.glow.setTint(0xff4d4d).setScale(o.r * 2 / 64).setAlpha(0.16);
    } else {
      o.main = this.add.text(o.x, o.y, '🎁', { fontSize: '30px' }).setOrigin(0.5).setDepth(5) as any;
      o.glow.setTint(0xc77dff).setScale(o.r * 2 / 64).setAlpha(0.22);
    }
    this.ores.push(o);
  }

  // ---------- 输入 ----------
  private launch() {
    if (this.paused || this.choosing || this.ended) return;
    if (this.hook.state === 'swing') { this.hook.state = 'shoot'; Audio.shoot(); }
  }

  // ---------- 主循环 ----------
  update(_t: number, deltaMs: number) {
    const dt = Math.min(0.033, deltaMs / 1000);
    if (this.paused || this.choosing || this.ended) return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endRun(); return; }

    const h = this.hook;
    if (h.state === 'swing') {
      h.angle += h.dir * this.run.swingSpeed * dt;
      if (h.angle > 1.32) { h.angle = 1.32; h.dir = -1; }
      if (h.angle < -1.32) { h.angle = -1.32; h.dir = 1; }
      h.len = 34;
    } else if (h.state === 'shoot') {
      h.len += this.run.shootSpeed * dt;
      const hp = this.head();
      let hit: Ore | null = null;
      for (const o of this.ores) { const rr = o.r + 10 + this.run.magnet * (o.type === 'gem' ? 1 : 0.4); if (Math.hypot(hp.x - o.x, hp.y - o.y) < rr) { hit = o; break; } }
      if (hit) { h.grabbed = hit; h.state = 'reel'; }
      else if (hp.x < 6 || hp.x > GAME_W - 6 || hp.y > GAME_H - 6 || h.len > 700) h.state = 'reel';
    } else if (h.state === 'reel') {
      let sp = this.run.reelSpeed;
      if (h.grabbed) { const w = h.grabbed.weight; sp *= Math.max(0.35, 1 - (w - 1) * 0.22 / this.run.strength); moveOre(h.grabbed, this.head()); }
      h.len -= sp * dt;
      if (h.len <= 34) {
        h.len = 34;
        if (h.grabbed) { this.resolve(h.grabbed); this.ores = this.ores.filter((o) => o !== h.grabbed); h.grabbed = null; if (this.score >= this.goal) { this.winLevel(); return; } }
        h.state = 'swing';
      }
    }

    // 渲染钩 & 绳 & 光
    const hp = this.head();
    this.hookImg.setPosition(hp.x, hp.y).setRotation(h.angle);
    this.hookImg.setTexture('hook_' + Save.data.equipped.hook);
    this.hookLight.setPosition(hp.x, hp.y);
    this.rope.clear().lineStyle(3, 0xcdd3e6, 1).beginPath();
    this.rope.moveTo(h.x, h.y); this.rope.lineTo(hp.x, hp.y); this.rope.strokePath();

    // 宝石辉光呼吸
    const tt = this.nowSec();
    for (const o of this.ores) {
      if (o.type === 'gem') o.glow.setAlpha(0.16 + 0.06 * Math.sin(tt * 3 + o.x));
      else if (o.type === 'bomb') o.glow.setAlpha(0.14 + 0.1 * Math.abs(Math.sin(tt * 4)));
    }
    this.updateHud();
  }

  private head() { return { x: this.hook.x + Math.sin(this.hook.angle) * this.hook.len, y: this.hook.y + Math.cos(this.hook.angle) * this.hook.len }; }
  private nowSec() { return performance.now() / 1000; }

  // ---------- 结算单个抓取 ----------
  private resolve(o: Ore) {
    this.timeLeft = Math.min(this.roundTime + 8, this.timeLeft + this.run.timeBonusPerGrab);
    const at = { x: o.x, y: o.y };

    if (o.type === 'bomb') {
      if (this.run.defuse > 0 || this.shield) { if (this.shield) this.shield = false; this.floatText(at, '已拆除', '#7fe08a'); this.burst(at, 0x7fe08a, 16); }
      else { const pen = 60 + this.level * 15; this.score = Math.max(0, this.score - pen); this.floatText(at, `-${pen} 💥`, '#ff5d73'); this.burst(at, 0xff7a59, 40); this.cameras.main.shake(180, 0.012); Audio.bomb(); this.comboColor = null; this.comboCount = 0; this.comboMult = 1; this.updateCombo(); }
      destroyOre(o); return;
    }
    if (o.type === 'bag') {
      const roll = Math.random(); let gain = 0;
      if (roll < 0.5) { gain = Math.round(rand(80, 180)); this.floatText(at, `+${gain} 🎁`, '#c77dff'); }
      else if (roll < 0.8) { gain = Math.round(rand(180, 320)); this.floatText(at, `大奖 +${gain}`, '#ffd24a'); }
      else { this.timeLeft += 4; this.floatText(at, '+4秒 ⏱', '#5bd6ff'); }
      this.score += Math.round(gain * this.run.greed); this.burst(at, 0xc77dff, 24); Audio.coin(); destroyOre(o); return;
    }

    let val = o.base;
    if (o.type === 'gem') {
      if (this.comboColor === o.color) this.comboCount++;
      else { this.comboColor = o.color; this.comboCount = 1; }
      const cap = TUNING.comboCapBase + this.run.comboCapBonus;
      this.comboMult = Math.min(cap, this.comboCount);
      val = Math.round(val * this.comboMult * this.run.greed);
      if (this.comboMult > 1) this.cameras.main.shake(90, 0.004 * this.comboMult);
    } else val = Math.round(val * this.run.greed);

    this.score += val;
    Audio.grab(o.type === 'gem' ? this.comboMult : 1);
    this.floatText(at, `+${val}${o.type === 'gem' && this.comboMult > 1 ? ' x' + this.comboMult : ''}`, o.color);
    this.burst(at, Phaser.Display.Color.HexStringToColor(o.color).color, o.type === 'gold' ? 28 : 18);
    this.updateCombo();
    destroyOre(o);
  }

  private burst(at: { x: number; y: number }, tint: number, n: number) {
    this.burstMgr.setParticleTint(tint);
    this.burstMgr.emitParticleAt(at.x, at.y, n);
  }

  private floatText(at: { x: number; y: number }, text: string, color: string) {
    const t = this.add.text(at.x, at.y, text, { fontFamily: FONT, fontSize: '20px', color }).setOrigin(0.5).setDepth(30).setFontStyle('bold').setStroke('#000000', 4);
    this.tweens.add({ targets: t, y: at.y - 46, alpha: 0, scale: { from: 1.4, to: 1 }, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  // ---------- 过关：三选一 ----------
  private winLevel() {
    this.choosing = true;
    this.run.defuse = Math.max(0, this.run.defuse - 1);
    Audio.win();
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x06090f, 0.86).setOrigin(0).setInteractive();
    const title = this.add.text(GAME_W / 2, 300, `⛏ 第 ${this.level} 关达成`, { fontFamily: FONT, fontSize: '30px', color: '#ffd24a' }).setOrigin(0.5).setFontStyle('bold');
    const sub = this.add.text(GAME_W / 2, 344, '选择一项强化继续下潜', { fontFamily: FONT, fontSize: '16px', color: '#8b97b8' }).setOrigin(0.5);
    layer.add([dim, title, sub]);

    pickThree().forEach((up: Upgrade, i) => {
      const y = 430 + i * 118;
      const card = this.add.container(GAME_W / 2, y);
      const p = panel(this, -200, -50, 400, 100, { fill: 0x141b30 });
      const ic = this.add.text(-160, 0, up.ic, { fontSize: '38px' }).setOrigin(0.5);
      const t = this.add.text(-118, -16, up.t, { fontFamily: FONT, fontSize: '22px', color: '#eaf0ff' }).setOrigin(0, 0.5).setFontStyle('bold');
      const d = this.add.text(-118, 14, up.d, { fontFamily: FONT, fontSize: '15px', color: '#8b97b8' }).setOrigin(0, 0.5);
      card.add([p, ic, t, d]);
      card.setSize(400, 100).setInteractive(new Phaser.Geom.Rectangle(-200, -50, 400, 100), Phaser.Geom.Rectangle.Contains);
      card.on('pointerover', () => p.clear().fillStyle(0x1c2542, 1).fillRoundedRect(-200, -50, 400, 100, 16).lineStyle(2, 0xffd24a, 1).strokeRoundedRect(-200, -50, 400, 100, 16));
      card.on('pointerout', () => p.clear().fillStyle(0x141b30, 1).fillRoundedRect(-200, -50, 400, 100, 16).lineStyle(1.5, 0x2a3352, 1).strokeRoundedRect(-200, -50, 400, 100, 16));
      card.on('pointerup', () => { Audio.ui(); up.apply(this.run); layer.destroy(); this.level++; this.choosing = false; this.makeLevel(); });
      layer.add(card);
    });
  }

  // ---------- 结束 ----------
  private endRun() {
    if (this.ended) return;
    this.ended = true;
    Audio.lose();
    const earned = Math.round(this.score * TUNING.coinsPerScore * (this.doubleCoins ? 2 : 1));
    Economy.add(earned, 'run_reward');

    const s = Save.data;
    const isBest = this.score > s.bestScore;
    if (isBest) s.bestScore = this.score;
    s.bestLevel = Math.max(s.bestLevel, this.level);
    s.runs += 1; s.totalScore += this.score;
    Save.markDirty();
    Analytics.track('run_end', { score: this.score, level: this.level, coins: earned });

    this.time.delayedCall(500, () => {
      this.scene.start('Result', { score: this.score, level: this.level, coins: earned, isBest, best: s.bestScore });
    });
  }

  // ---------- 暂停 ----------
  private togglePause() {
    if (this.choosing || this.ended) return;
    this.paused = !this.paused;
    if (this.paused) this.showPause(); else this.pauseLayer?.destroy();
  }
  private pauseLayer?: Phaser.GameObjects.Container;
  private showPause() {
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x06090f, 0.82).setOrigin(0).setInteractive();
    const t = this.add.text(GAME_W / 2, 340, '暂停', { fontFamily: FONT, fontSize: '40px', color: '#eaf0ff' }).setOrigin(0.5).setFontStyle('bold');
    layer.add([dim, t]);
    layer.add(button(this, GAME_W / 2, 440, '继续', () => this.togglePause(), { w: 220 }));
    layer.add(button(this, GAME_W / 2, 512, '返回主菜单', () => { Save.flush(); this.scene.start('Menu'); }, { w: 220, primary: false }));
    this.pauseLayer = layer;
  }

  // ---------- HUD ----------
  private buildHud() {
    const d = 100;
    panel(this, 12, 12, 150, 58, { fill: 0x141b30 }).setDepth(d);
    this.add.text(24, 22, '得分', { fontFamily: FONT, fontSize: '12px', color: '#8b97b8' }).setDepth(d);
    this.scoreT = this.add.text(24, 38, '0', { fontFamily: FONT, fontSize: '24px', color: '#eaf0ff' }).setFontStyle('bold').setDepth(d);

    panel(this, GAME_W / 2 - 75, 12, 150, 58, { fill: 0x141b30 }).setDepth(d);
    this.lvlT = this.add.text(GAME_W / 2, 24, '第 1 关 · 目标', { fontFamily: FONT, fontSize: '12px', color: '#8b97b8' }).setOrigin(0.5).setDepth(d);
    this.goalT = this.add.text(GAME_W / 2, 46, '0', { fontFamily: FONT, fontSize: '22px', color: '#ffd24a' }).setOrigin(0.5).setFontStyle('bold').setDepth(d);

    panel(this, GAME_W - 162, 12, 150, 58, { fill: 0x141b30 }).setDepth(d);
    this.add.text(GAME_W - 24, 22, '时间', { fontFamily: FONT, fontSize: '12px', color: '#8b97b8' }).setOrigin(1, 0).setDepth(d);
    this.timeT = this.add.text(GAME_W - 24, 38, '30', { fontFamily: FONT, fontSize: '24px', color: '#eaf0ff' }).setOrigin(1, 0).setFontStyle('bold').setDepth(d);

    // 进度条
    this.bar = this.add.graphics().setDepth(d);

    // 连锁提示
    this.comboT = this.add.text(GAME_W / 2, 150, '', { fontFamily: FONT, fontSize: '46px', color: '#fff' }).setOrigin(0.5).setDepth(d).setFontStyle('bold').setAlpha(0);

    // 暂停按钮
    const pb = this.add.text(GAME_W - 30, 84, '⏸', { fontSize: '22px' }).setOrigin(0.5).setDepth(d).setInteractive();
    pb.on('pointerup', () => this.togglePause());
  }

  private updateHud() {
    this.scoreT.setText(String(this.score));
    this.goalT.setText(String(this.goal));
    this.lvlT.setText(`第 ${this.level} 关 · 目标`);
    this.timeT.setText(String(Math.ceil(this.timeLeft))).setColor(this.timeLeft < 6 ? '#ff5d73' : '#eaf0ff');
    const w = Phaser.Math.Clamp(this.score / this.goal, 0, 1) * (GAME_W - 24);
    this.bar.clear();
    this.bar.fillStyle(0x0c1122, 1).fillRoundedRect(12, 78, GAME_W - 24, 6, 3);
    this.bar.fillStyle(0xffd24a, 1).fillRoundedRect(12, 78, w, 6, 3);
  }

  private updateCombo() {
    if (this.comboMult > 1 && this.comboColor) {
      this.comboT.setText('x' + this.comboMult).setColor(this.comboColor).setAlpha(1).setScale(1.3);
      this.tweens.add({ targets: this.comboT, scale: 1, duration: 180, ease: 'Back.easeOut' });
    } else {
      this.tweens.add({ targets: this.comboT, alpha: 0, duration: 150 });
    }
  }

  private toast(msg: string) {
    const t = this.add.text(GAME_W / 2, 720, msg, { fontFamily: FONT, fontSize: '16px', color: '#7fe08a', backgroundColor: '#0e1428' }).setOrigin(0.5).setPadding(14, 8, 14, 8).setDepth(120);
    this.tweens.add({ targets: t, alpha: 0, y: '-=20', delay: 900, duration: 700, onComplete: () => t.destroy() });
  }
}

// ---------- 辅助 ----------
function mk(type: OreType, color: string, r: number, weight: number, base: number): Ore {
  return { type, color, r, weight, base, x: 0, y: 0, main: null as any, glow: null as any, seed: (Math.random() * 9) | 0 };
}
function moveOre(o: Ore, at: { x: number; y: number }) {
  o.x = at.x; o.y = at.y; o.main.x = at.x; o.main.y = at.y; o.glow.setPosition(at.x, at.y);
  if (o.extra) o.extra.setPosition(at.x, at.y);
}
function destroyOre(o: Ore) { o.main?.destroy(); o.glow?.destroy(); o.extra?.destroy(); }
function boosterLabel(id: string) {
  return { time: '时间沙漏', magnet: '磁力启动', double: '双倍金币', shield: '防爆护盾' }[id] ?? id;
}
