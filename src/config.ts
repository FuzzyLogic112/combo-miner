/** 全局常量与数值调优（把可平衡的数值集中在此，方便运营侧调参）。 */

export const GAME_W = 540;
export const GAME_H = 960;

/** 视觉主题色板 */
export const COLORS = {
  bg: 0x080b16,
  panel: 0x141b30,
  line: 0x2a3352,
  ink: 0xeaf0ff,
  muted: 0x8b97b8,
  gold: 0xffd24a,
  hot: 0xff7a59,
  good: 0x7fe08a,
  danger: 0xff5d73,
};

/** 宝石可用颜色（默认主题，皮肤可覆盖）——十六进制字符串给 Canvas 用 */
export const GEM_PALETTES: Record<string, string[]> = {
  classic: ['#ff5d73', '#5bd6ff', '#7fe08a', '#c77dff', '#ffd24a'],
  candy: ['#ff8fab', '#ffd6a5', '#a0e7e5', '#b5ead7', '#ffc6ff'],
  neon: ['#ff2e63', '#08d9d6', '#00ff87', '#f9f871', '#c471ed'],
};

/** 关卡与经济数值 */
export const TUNING = {
  baseTime: 34, // 第1关秒数
  minTime: 20,
  goalLevel1: 380,
  goalFactor: 0.42,
  goalPerLevel: 40,
  coinsPerScore: 0.04, // 每分转化的金币
  comboCapBase: 5,
};

export const STORAGE_KEY = 'combo-miner-save-v1';
