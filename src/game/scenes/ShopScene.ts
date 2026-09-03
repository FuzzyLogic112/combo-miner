import Phaser from 'phaser';
import { GAME_W } from '../../config';
import { Economy } from '../systems/Economy';
import { Shop } from '../systems/Shop';
import { Audio } from '../systems/Audio';
import { Analytics } from '../systems/Analytics';
import { Skin, skinsOfKind } from '../data/skins';
import { BOOSTERS, Booster } from '../data/boosters';
import { createCaveBackground } from '../gfx/background';
import { button, panel, coinBadge, FONT } from '../../ui/widgets';
import { gemKey } from './BootScene';

type Tab = 'skins' | 'boosters';
const RARITY: Record<string, number> = { common: 0x8b97b8, rare: 0x5bd6ff, epic: 0xc77dff };

export class ShopScene extends Phaser.Scene {
  private tab: Tab = 'skins';
  private coinSet!: (v: number) => void;
  private listLayer!: Phaser.GameObjects.Container;

  constructor() { super('Shop'); }

  create() {
    Analytics.screen('shop');
    createCaveBackground(this, false);

    this.add.text(GAME_W / 2, 44, '商店', { fontFamily: FONT, fontSize: '32px', color: '#ffd24a' }).setOrigin(0.5).setFontStyle('bold');
    this.coinSet = coinBadge(this, GAME_W - 90, 44, Economy.coins).set;

    // tab 切换
    this.makeTab(GAME_W / 2 - 90, 'skins', '👑 皮肤');
    this.makeTab(GAME_W / 2 + 90, 'boosters', '🎒 道具');

    this.listLayer = this.add.container(0, 0);
    this.renderList();

    button(this, GAME_W / 2, 900, '← 返回', () => { Audio.ui(); this.scene.start('Menu'); }, { w: 200, primary: false });
  }

  private makeTab(x: number, id: Tab, label: string) {
    const c = this.add.container(x, 96);
    const p = panel(this, -80, -22, 160, 44, { fill: this.tab === id ? 0x2a3352 : 0x141b30, stroke: this.tab === id ? 0xffd24a : 0x2a3352, radius: 22 });
    const t = this.add.text(0, 0, label, { fontFamily: FONT, fontSize: '18px', color: this.tab === id ? '#ffd24a' : '#8b97b8' }).setOrigin(0.5).setFontStyle('bold');
    c.add([p, t]); c.setSize(160, 44).setInteractive();
    c.on('pointerup', () => { if (this.tab === id) return; Audio.ui(); this.tab = id; this.scene.restart(); });
  }

  private renderList() {
    this.listLayer.removeAll(true);
    if (this.tab === 'skins') this.renderSkins();
    else this.renderBoosters();
  }

  private renderSkins() {
    const kinds: { key: Skin['kind']; label: string }[] = [
      { key: 'hook', label: '钩爪' }, { key: 'gemTheme', label: '宝石主题' }, { key: 'trail', label: '拖尾' },
    ];
    let y = 150;
    kinds.forEach((grp) => {
      this.listLayer.add(this.add.text(30, y, grp.label, { fontFamily: FONT, fontSize: '16px', color: '#8b97b8' }).setFontStyle('bold'));
      y += 30;
      const items = skinsOfKind(grp.key);
      items.forEach((skin, i) => {
        const col = i % 3, rowX = 96 + col * 174, rowY = y + Math.floor(i / 3) * 150 + 60;
        this.listLayer.add(this.skinCard(rowX, rowY, skin));
      });
      y += Math.ceil(items.length / 3) * 150 + 30;
    });
  }

  private skinCard(x: number, y: number, skin: Skin): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const owned = Shop.owns(skin.id), equipped = Shop.isEquipped(skin);
    const p = panel(this, -66, -66, 132, 132, { fill: 0x141b30, stroke: equipped ? 0x7fe08a : RARITY[skin.rarity] });
    c.add(p);

    // 预览
    c.add(this.skinPreview(skin));

    // 名称
    c.add(this.add.text(0, 20, skin.name, { fontFamily: FONT, fontSize: '13px', color: '#eaf0ff' }).setOrigin(0.5));

    // 状态/价格行
    let label: string, color: string;
    if (equipped) { label = '已装备'; color = '#7fe08a'; }
    else if (owned) { label = '装备'; color = '#5bd6ff'; }
    else if (skin.iapProductId) { label = skin.iapPrice ?? '购买'; color = '#ffd24a'; }
    else { label = `💰 ${skin.price}`; color = Economy.canAfford(skin.price) ? '#ffd24a' : '#ff5d73'; }
    const priceBg = panel(this, -54, 40, 108, 30, { fill: 0x0e1428, radius: 15 });
    const priceT = this.add.text(0, 55, label, { fontFamily: FONT, fontSize: '15px', color }).setOrigin(0.5).setFontStyle('bold');
    c.add([priceBg, priceT]);

    c.setSize(132, 132).setInteractive(new Phaser.Geom.Rectangle(-66, -66, 132, 132), Phaser.Geom.Rectangle.Contains);
    c.on('pointerup', () => this.onSkinTap(skin));
    return c;
  }

  private skinPreview(skin: Skin): Phaser.GameObjects.GameObject {
    if (skin.kind === 'hook') return this.add.image(0, -22, 'hook_' + skin.id).setScale(1.5);
    if (skin.kind === 'gemTheme') {
      const pal = { classic: 'classic', candy: 'candy', neon: 'neon' }[skin.gemPalette ?? 'classic'];
      const colors = (({ classic: ['#ff5d73', '#5bd6ff', '#7fe08a'], candy: ['#ff8fab', '#a0e7e5', '#ffc6ff'], neon: ['#ff2e63', '#08d9d6', '#f9f871'] } as any)[pal!]) as string[];
      const cc = this.add.container(0, -22);
      colors.forEach((col, i) => cc.add(this.add.image((i - 1) * 22, 0, gemKey(col)).setScale(0.8)));
      return cc;
    }
    // trail
    const col = skin.trailColor;
    if (!col) return this.add.text(0, -22, '∅', { fontSize: '26px', color: '#5f6b8c' }).setOrigin(0.5);
    const cc = this.add.container(0, -22);
    for (let i = 0; i < 4; i++) cc.add(this.add.image(-24 + i * 16, 0, 'dot').setScale(0.9 - i * 0.15).setTint(Phaser.Display.Color.HexStringToColor(col).color).setAlpha(1 - i * 0.2).setBlendMode(Phaser.BlendModes.ADD));
    return cc;
  }

  private async onSkinTap(skin: Skin) {
    Audio.ui();
    if (Shop.isEquipped(skin)) return;
    if (Shop.owns(skin.id)) { Shop.equip(skin); this.scene.restart(); return; }
    const outcome = await Shop.buySkin(skin);
    switch (outcome) {
      case 'bought_coins': case 'bought_iap':
        Audio.coin(); Shop.equip(skin); this.coinSet(Economy.coins); this.toast(`已解锁并装备「${skin.name}」`); this.scene.restart(); break;
      case 'insufficient': this.toast('金币不足'); break;
      case 'error': this.toast('购买失败，请重试'); break;
      default: break; // cancelled
    }
  }

  private renderBoosters() {
    this.listLayer.add(this.add.text(GAME_W / 2, 160, '开局前在主菜单装备道具，每个消耗一次', { fontFamily: FONT, fontSize: '14px', color: '#8b97b8' }).setOrigin(0.5));
    BOOSTERS.forEach((b, i) => this.listLayer.add(this.boosterCard(GAME_W / 2, 230 + i * 120, b)));
  }

  private boosterCard(x: number, y: number, b: Booster): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const p = panel(this, -200, -50, 400, 100, { fill: 0x141b30 });
    const ic = this.add.text(-160, 0, b.icon, { fontSize: '40px' }).setOrigin(0.5);
    const name = this.add.text(-118, -18, b.name, { fontFamily: FONT, fontSize: '20px', color: '#eaf0ff' }).setOrigin(0, 0.5).setFontStyle('bold');
    const desc = this.add.text(-118, 12, `${b.desc}   持有 x${Shop.boosterCount(b.id)}`, { fontFamily: FONT, fontSize: '14px', color: '#8b97b8' }).setOrigin(0, 0.5);
    const buyBg = panel(this, 96, -22, 96, 44, { fill: 0x0e1428, radius: 22 });
    const buyT = this.add.text(144, 0, `💰 ${b.price}`, { fontFamily: FONT, fontSize: '17px', color: Economy.canAfford(b.price) ? '#ffd24a' : '#ff5d73' }).setOrigin(0.5).setFontStyle('bold');
    c.add([p, ic, name, desc, buyBg, buyT]);
    c.setSize(400, 100).setInteractive(new Phaser.Geom.Rectangle(-200, -50, 400, 100), Phaser.Geom.Rectangle.Contains);
    c.on('pointerup', () => {
      Audio.ui();
      const r = Shop.buyBooster(b);
      if (r === 'bought_coins') { Audio.coin(); this.coinSet(Economy.coins); desc.setText(`${b.desc}   持有 x${Shop.boosterCount(b.id)}`); this.toast(`购买成功：${b.name}`); }
      else this.toast('金币不足');
    });
    return c;
  }

  private toast(msg: string) {
    const t = this.add.text(GAME_W / 2, 820, msg, { fontFamily: FONT, fontSize: '18px', color: '#ffd24a', backgroundColor: '#0e1428' }).setOrigin(0.5).setPadding(16, 10, 16, 10).setDepth(300);
    this.tweens.add({ targets: t, alpha: 0, y: '-=24', delay: 1000, duration: 700, onComplete: () => t.destroy() });
  }
}
