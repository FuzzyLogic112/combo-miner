/** 皮肤目录（纯外观，不影响数值平衡——保证公平，利于长期运营）。 */

export type SkinKind = 'hook' | 'gemTheme' | 'trail';

export interface Skin {
  id: string;
  kind: SkinKind;
  name: string;
  rarity: 'common' | 'rare' | 'epic';
  /** 金币售价；为 0 表示默认已拥有 */
  price: number;
  /** 若走真实内购(独占付费皮肤)，填渠道商品号 */
  iapProductId?: string;
  iapPrice?: string;
  /** 渲染参数 */
  hookColor?: string;
  hookAccent?: string;
  gemPalette?: string; // 对应 config.GEM_PALETTES 的 key
  trailColor?: string | null;
}

export const SKINS: Skin[] = [
  // —— 钩爪 ——
  { id: 'hook_classic', kind: 'hook', name: '经典钩', rarity: 'common', price: 0, hookColor: '#e8ecf7', hookAccent: '#ffffff' },
  { id: 'hook_gold', kind: 'hook', name: '黄金钩', rarity: 'rare', price: 800, hookColor: '#ffd24a', hookAccent: '#fff3c0' },
  { id: 'hook_ruby', kind: 'hook', name: '烈焰钩', rarity: 'rare', price: 1200, hookColor: '#ff5d73', hookAccent: '#ffd0d8' },
  { id: 'hook_void', kind: 'hook', name: '虚空钩', rarity: 'epic', price: 0, iapProductId: 'skin_hook_void', iapPrice: '¥6', hookColor: '#9b6bff', hookAccent: '#e6d5ff' },

  // —— 宝石主题 ——
  { id: 'gem_classic', kind: 'gemTheme', name: '经典宝石', rarity: 'common', price: 0, gemPalette: 'classic' },
  { id: 'gem_candy', kind: 'gemTheme', name: '糖果乐园', rarity: 'rare', price: 1000, gemPalette: 'candy' },
  { id: 'gem_neon', kind: 'gemTheme', name: '霓虹赛博', rarity: 'epic', price: 0, iapProductId: 'skin_gem_neon', iapPrice: '¥12', gemPalette: 'neon' },

  // —— 拖尾 ——
  { id: 'trail_none', kind: 'trail', name: '无拖尾', rarity: 'common', price: 0, trailColor: null },
  { id: 'trail_spark', kind: 'trail', name: '火花拖尾', rarity: 'common', price: 500, trailColor: '#ffd24a' },
  { id: 'trail_comet', kind: 'trail', name: '彗星拖尾', rarity: 'rare', price: 1500, trailColor: '#5bd6ff' },
];

export const skinById = (id: string) => SKINS.find((s) => s.id === id);
export const skinsOfKind = (k: SkinKind) => SKINS.filter((s) => s.kind === k);
