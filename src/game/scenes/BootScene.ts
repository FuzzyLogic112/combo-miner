import Phaser from 'phaser';
import { GEM_PALETTES } from '../../config';
import { SKINS } from '../data/skins';
import {
  makeGemTexture, makeOrbTexture, makeRockTexture, makeGlowTexture, makeDotTexture, makeHookTexture,
} from '../gfx/textures';

/** 一次性烘焙所有程序化纹理，再进入主菜单。 */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // 宝石：所有主题用到的颜色各烘一张
    const colors = new Set<string>();
    Object.values(GEM_PALETTES).forEach((arr) => arr.forEach((c) => colors.add(c)));
    colors.forEach((c) => makeGemTexture(this, gemKey(c), c, 18));

    // 金块 / 炸弹壳 / 岩石变体
    makeOrbTexture(this, 'orb_gold', '#ffd24a', 22);
    makeOrbTexture(this, 'orb_bomb', '#2a2f52', 16);
    for (let i = 0; i < 3; i++) makeRockTexture(this, 'rock_' + i, 25, i * 2.1 + 1);

    // 通用光效
    makeGlowTexture(this, 'glow', 128);
    makeDotTexture(this, 'dot', 16);

    // 钩爪皮肤
    SKINS.filter((s) => s.kind === 'hook').forEach((s) =>
      makeHookTexture(this, 'hook_' + s.id, s.hookColor ?? '#e8ecf7', s.hookAccent ?? '#fff'));

    // 移除 HTML 加载遮罩
    const boot = document.getElementById('boot');
    if (boot) { boot.style.opacity = '0'; setTimeout(() => boot.remove(), 400); }

    this.scene.start('Menu');
  }
}

export const gemKey = (hex: string) => 'gem_' + hex.replace('#', '');
