import Phaser from 'phaser';
import { GAME_W } from '../../config';
import { Analytics } from '../systems/Analytics';
import { createCaveBackground } from '../gfx/background';
import { button, panel, FONT } from '../../ui/widgets';

interface ResultData { score: number; level: number; coins: number; isBest: boolean; best: number; }

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create(data: ResultData) {
    Analytics.screen('result');
    createCaveBackground(this, false);

    this.add.text(GAME_W / 2, 190, data.isBest ? '🏆 新纪录！' : '时间到', { fontFamily: FONT, fontSize: '44px', color: '#ffd24a' })
      .setOrigin(0.5).setFontStyle('bold').setShadow(0, 4, '#00000066', 8);

    // 成绩面板
    panel(this, GAME_W / 2 - 180, 260, 360, 220, { fill: 0x0e1428 });
    const row = (y: number, k: string, v: string, color = '#eaf0ff') => {
      this.add.text(GAME_W / 2 - 150, y, k, { fontFamily: FONT, fontSize: '18px', color: '#8b97b8' }).setOrigin(0, 0.5);
      this.add.text(GAME_W / 2 + 150, y, v, { fontFamily: FONT, fontSize: '24px', color }).setOrigin(1, 0.5).setFontStyle('bold');
    };
    row(300, '本局得分', String(data.score));
    row(348, '抵达关卡', `第 ${data.level} 关`);
    row(396, '获得金币', `+${data.coins} 💰`, '#ffd24a');
    row(444, '历史最高', String(data.best), '#7fe08a');

    this.add.text(GAME_W / 2, 520, comment(data.score), { fontFamily: FONT, fontSize: '15px', color: '#8b97b8', align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);

    button(this, GAME_W / 2, 610, '再来一局', () => this.scene.start('Game', { booster: null }), { w: 260, h: 60, fontSize: 24 });
    button(this, GAME_W / 2 - 92, 690, '🛍 商店', () => this.scene.start('Shop'), { w: 168, primary: false, fontSize: 20 });
    button(this, GAME_W / 2 + 92, 690, '🏠 主菜单', () => this.scene.start('Menu'), { w: 168, primary: false, fontSize: 20 });
  }
}

function comment(s: number) {
  if (s >= 4000) return '矿业大亨！连锁玩得炉火纯青。';
  if (s >= 2000) return '老练的矿工，路线规划很到位。';
  if (s >= 800) return '不错的手感，试着把同色宝石连成更长的链。';
  return '先抓慢速目标、留住同色连锁，分数会翻倍增长。';
}
