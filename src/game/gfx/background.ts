import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../../config';

/** 矿洞分层背景：天空渐变 + 地层渐变 + 地表草线 + 矿层微光 + 浮尘。 */
export function createCaveBackground(scene: Phaser.Scene, withDust = true) {
  const surfaceY = 230;
  const g = scene.add.graphics();
  // 天空
  g.fillGradientStyle(0x26335e, 0x26335e, 0x141d3a, 0x141d3a, 1);
  g.fillRect(0, 0, GAME_W, surfaceY);
  // 地层
  g.fillGradientStyle(0x3a2c1f, 0x3a2c1f, 0x0c0803, 0x0c0803, 1);
  g.fillRect(0, surfaceY, GAME_W, GAME_H - surfaceY);
  // 地表
  g.fillStyle(0x4b3a26, 1); g.fillRect(0, surfaceY, GAME_W, 10);
  g.fillStyle(0x5c7a3a, 1); g.fillRect(0, surfaceY - 4, GAME_W, 5);

  // 矿层微光
  const glowA = scene.add.image(GAME_W * 0.22, GAME_H * 0.6, 'glow').setScale(3.4).setTint(0xffce7a).setAlpha(0.10).setBlendMode(Phaser.BlendModes.ADD);
  const glowB = scene.add.image(GAME_W * 0.8, GAME_H * 0.82, 'glow').setScale(3.8).setTint(0x7ab8ff).setAlpha(0.08).setBlendMode(Phaser.BlendModes.ADD);

  if (withDust) {
    const em = scene.add.particles(0, 0, 'dot', {
      x: { min: 0, max: GAME_W },
      y: { min: surfaceY, max: GAME_H },
      scale: { min: 0.06, max: 0.16 },
      alpha: { start: 0.0, end: 0.22, ease: 'Sine.easeInOut' },
      tint: 0xffe6b0,
      lifespan: 4000,
      speedY: { min: -14, max: -4 },
      frequency: 220,
      blendMode: 'ADD',
      quantity: 1,
    });
    em.setDepth(1);
  }
  void glowA; void glowB;
  return { surfaceY };
}
