import Phaser from 'phaser';
import { Audio } from '../game/systems/Audio';

export const FONT = '"Baloo 2", system-ui, sans-serif';

/** 圆角面板（用 Graphics 画，随主题统一风格） */
export function panel(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  opts: { fill?: number; stroke?: number; radius?: number; alpha?: number } = {}
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const { fill = 0x141b30, stroke = 0x2a3352, radius = 16, alpha = 1 } = opts;
  g.fillStyle(fill, alpha); g.fillRoundedRect(x, y, w, h, radius);
  if (stroke >= 0) { g.lineStyle(1.5, stroke, 1); g.strokeRoundedRect(x, y, w, h, radius); }
  return g;
}

export interface ButtonOpts {
  w?: number; h?: number; fill?: number; text?: number; radius?: number;
  fontSize?: number; primary?: boolean;
}

/** 主/次按钮，含按下位移与音效。返回容器，可 .on('click') 监听。 */
export function button(
  scene: Phaser.Scene, x: number, y: number, label: string,
  onClick: () => void, opts: ButtonOpts = {}
): Phaser.GameObjects.Container {
  const { w = 220, h = 56, radius = 14, fontSize = 22, primary = true } = opts;
  const fill = opts.fill ?? (primary ? 0xffd24a : 0x38456e);
  const textColor = opts.text ?? (primary ? 0x3a2600 : 0xeaf0ff);
  const shadow = primary ? 0xa9701a : 0x1a2038;

  const c = scene.add.container(x, y);
  const gShadow = scene.add.graphics(); gShadow.fillStyle(shadow, 1); gShadow.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, radius);
  const g = scene.add.graphics(); g.fillStyle(fill, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  const t = scene.add.text(0, 0, label, { fontFamily: FONT, fontSize: `${fontSize}px`, color: '#' + textColor.toString(16).padStart(6, '0') })
    .setOrigin(0.5).setFontStyle('bold');
  c.add([gShadow, g, t]);
  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

  c.on('pointerdown', () => { g.y = 4; t.y = 4; });
  const release = () => { g.y = 0; t.y = 0; };
  c.on('pointerup', () => { release(); Audio.ui(); onClick(); });
  c.on('pointerout', release);
  return c;
}

/** 金币徽标（图标 + 数字），返回容器与更新方法 */
export function coinBadge(scene: Phaser.Scene, x: number, y: number, value: number) {
  const c = scene.add.container(x, y);
  const bg = panel(scene, -70, -18, 140, 36, { fill: 0x0e1428, radius: 18 });
  const icon = scene.add.text(-56, 0, '💰', { fontSize: '18px' }).setOrigin(0.5);
  const txt = scene.add.text(-34, 0, String(value), { fontFamily: FONT, fontSize: '20px', color: '#ffd24a' }).setOrigin(0, 0.5).setFontStyle('bold');
  c.add([bg, icon, txt]);
  return { container: c, set: (v: number) => txt.setText(String(v)) };
}

export function hexStr(n: number) { return '#' + n.toString(16).padStart(6, '0'); }
