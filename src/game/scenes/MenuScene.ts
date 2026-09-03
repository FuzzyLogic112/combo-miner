import Phaser from 'phaser';
import { GAME_W } from '../../config';
import { Save } from '../systems/Save';
import { Economy } from '../systems/Economy';
import { Shop } from '../systems/Shop';
import { Audio } from '../systems/Audio';
import { Analytics } from '../systems/Analytics';
import { BOOSTERS } from '../data/boosters';
import { createCaveBackground } from '../gfx/background';
import { button, coinBadge, panel, FONT } from '../../ui/widgets';

/** 主菜单：标题 / 最高分 / 金币 / 开始 / 商店 / 开局道具 / 每日奖励 / 设置。 */
export class MenuScene extends Phaser.Scene {
  private selectedBooster: string | null = null;

  constructor() { super('Menu'); }

  create() {
    Analytics.screen('menu');
    createCaveBackground(this, true);

    // 标题
    const hookImg = this.add.image(GAME_W / 2 - 108, 150, 'hook_' + Save.data.equipped.hook).setScale(1.6);
    this.tweens.add({ targets: hookImg, y: '+=8', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(GAME_W / 2, 148, '连锁矿工', { fontFamily: FONT, fontSize: '54px', color: '#ffd24a' })
      .setOrigin(0.5).setFontStyle('bold').setShadow(0, 4, '#00000066', 8);
    this.add.text(GAME_W / 2, 196, 'COMBO  MINER', { fontFamily: FONT, fontSize: '18px', color: '#8b97b8' })
      .setOrigin(0.5).setLetterSpacing(6);

    // 金币徽标（右上）
    coinBadge(this, GAME_W - 90, 40, Economy.coins);

    // 最高分卡
    panel(this, GAME_W / 2 - 150, 300, 300, 64, { fill: 0x0e1428 });
    this.add.text(GAME_W / 2, 322, '最高分', { fontFamily: FONT, fontSize: '14px', color: '#8b97b8' }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 346, String(Save.data.bestScore), { fontFamily: FONT, fontSize: '26px', color: '#eaf0ff' }).setOrigin(0.5).setFontStyle('bold');

    // 开局道具选择行
    this.add.text(GAME_W / 2, 402, '开局道具（点击装备，消耗 1 个）', { fontFamily: FONT, fontSize: '14px', color: '#8b97b8' }).setOrigin(0.5);
    this.buildBoosterRow(444);

    // 主按钮
    button(this, GAME_W / 2, 560, '开始挖矿', () => this.startGame(), { w: 260, h: 64, fontSize: 26 });
    button(this, GAME_W / 2 - 92, 648, '🛍 商店', () => { this.scene.start('Shop'); }, { w: 168, primary: false, fontSize: 20 });
    button(this, GAME_W / 2 + 92, 648, '🎁 每日', () => this.claimDaily(), { w: 168, primary: false, fontSize: 20 });

    // 设置（音效开关）
    this.buildSettings(732);

    this.add.text(GAME_W / 2, 900, '点击/空格放钩 · 同色宝石连锁滚雪球 · 躲开炸弹', { fontFamily: FONT, fontSize: '13px', color: '#5f6b8c' }).setOrigin(0.5);
  }

  private buildBoosterRow(y: number) {
    const gap = 112, startX = GAME_W / 2 - gap * 1.5;
    BOOSTERS.forEach((b, i) => {
      const x = startX + i * gap;
      const count = Shop.boosterCount(b.id);
      const c = this.add.container(x, y);
      const p = panel(this, -48, -34, 96, 68, { fill: count > 0 ? 0x1a2340 : 0x121830, stroke: 0x2a3352 });
      const icon = this.add.text(0, -12, b.icon, { fontSize: '26px' }).setOrigin(0.5).setAlpha(count > 0 ? 1 : 0.4);
      const name = this.add.text(0, 16, b.name, { fontFamily: FONT, fontSize: '11px', color: '#8b97b8' }).setOrigin(0.5);
      const badge = this.add.text(38, -28, 'x' + count, { fontFamily: FONT, fontSize: '12px', color: count > 0 ? '#7fe08a' : '#5f6b8c' }).setOrigin(0.5).setFontStyle('bold');
      c.add([p, icon, name, badge]);
      c.setSize(96, 68).setInteractive();
      c.on('pointerup', () => {
        Audio.ui();
        if (count <= 0) { this.scene.start('Shop'); return; }
        this.selectedBooster = this.selectedBooster === b.id ? null : b.id;
        this.refreshBoosterSelection();
      });
      (c as any)._boosterId = b.id;
      (c as any)._panel = p;
    });
    this.refreshBoosterSelection();
  }

  private refreshBoosterSelection() {
    this.children.list.forEach((o) => {
      const id = (o as any)._boosterId;
      if (!id) return;
      const p: Phaser.GameObjects.Graphics = (o as any)._panel;
      p.clear();
      const sel = this.selectedBooster === id;
      const has = Shop.boosterCount(id) > 0;
      p.fillStyle(sel ? 0x2a3352 : has ? 0x1a2340 : 0x121830, 1);
      p.fillRoundedRect(-48, -34, 96, 68, 12);
      p.lineStyle(2, sel ? 0xffd24a : 0x2a3352, 1);
      p.strokeRoundedRect(-48, -34, 96, 68, 12);
    });
  }

  private buildSettings(y: number) {
    const s = Save.data.settings;
    const makeToggle = (x: number, get: () => boolean, set: (v: boolean) => void, label: (on: boolean) => string) => {
      const c = this.add.container(x, y);
      const p = panel(this, -70, -18, 140, 36, { fill: 0x0e1428, radius: 18 });
      const t = this.add.text(0, 0, label(get()), { fontFamily: FONT, fontSize: '15px', color: get() ? '#7fe08a' : '#5f6b8c' }).setOrigin(0.5);
      c.add([p, t]); c.setSize(140, 36).setInteractive();
      c.on('pointerup', () => {
        Audio.ui(); set(!get()); Save.markDirty();
        t.setText(label(get())); t.setColor(get() ? '#7fe08a' : '#5f6b8c');
      });
    };
    makeToggle(GAME_W / 2 - 78, () => s.sfx, (v) => (s.sfx = v), (on) => (on ? '🔊 音效 开' : '🔇 音效 关'));
    makeToggle(GAME_W / 2 + 78, () => s.music, (v) => (s.music = v), (on) => (on ? '🎵 音乐 开' : '🎵 音乐 关'));
  }

  private claimDaily() {
    const today = new Date().toISOString().slice(0, 10);
    if (Save.data.lastDailyBonus === today) {
      this.toast('今日奖励已领取，明天再来~');
      return;
    }
    Save.data.lastDailyBonus = today;
    const reward = 300;
    Economy.add(reward, 'daily');
    Audio.coin();
    this.toast(`每日奖励 +${reward} 💰`);
    this.time.delayedCall(700, () => this.scene.restart());
  }

  private startGame() {
    let booster: string | null = null;
    if (this.selectedBooster && Shop.consumeBooster(this.selectedBooster)) booster = this.selectedBooster;
    this.scene.start('Game', { booster });
  }

  private toast(msg: string) {
    const t = this.add.text(GAME_W / 2, 500, msg, { fontFamily: FONT, fontSize: '20px', color: '#ffd24a', backgroundColor: '#0e1428' })
      .setOrigin(0.5).setPadding(16, 10, 16, 10).setDepth(100);
    this.tweens.add({ targets: t, y: '-=30', alpha: 0, duration: 1200, ease: 'Cubic.easeIn', onComplete: () => t.destroy() });
  }
}
