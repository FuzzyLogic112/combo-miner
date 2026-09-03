import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from './config';
import { Save } from './game/systems/Save';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { GameScene } from './game/scenes/GameScene';
import { ShopScene } from './game/scenes/ShopScene';
import { ResultScene } from './game/scenes/ResultScene';

async function main() {
  await Save.init(); // 先载入存档，再起游戏

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: COLORS.bg,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true, powerPreference: 'high-performance' },
    scene: [BootScene, MenuScene, GameScene, ShopScene, ResultScene],
  });

  if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;

  // 关闭前尽量落盘
  window.addEventListener('pagehide', () => Save.flush());
  window.addEventListener('visibilitychange', () => { if (document.hidden) Save.flush(); });
}

main();
