/** 关间 Roguelite 强化（每关三选一），仅在单局内生效。 */

export interface RunState {
  reelSpeed: number;
  shootSpeed: number;
  strength: number;
  swingSpeed: number;
  magnet: number;
  defuse: number;
  timeBonusPerGrab: number;
  comboCapBonus: number;
  greed: number;
}

export interface Upgrade {
  ic: string;
  t: string;
  d: string;
  apply: (r: RunState) => void;
}

export const UPGRADES: Upgrade[] = [
  { ic: '⚡', t: '高速绞盘', d: '收钩速度 +25%', apply: (r) => (r.reelSpeed *= 1.25) },
  { ic: '💪', t: '强力臂', d: '无视重量惩罚', apply: (r) => (r.strength += 0.6) },
  { ic: '🧲', t: '磁力钩', d: '钩头吸附宝石', apply: (r) => (r.magnet += 26) },
  { ic: '🔥', t: '连锁大师', d: '连锁倍率上限 +2', apply: (r) => (r.comboCapBonus += 2) },
  { ic: '⏱', t: '时间沙漏', d: '每次抓取 +0.6 秒', apply: (r) => (r.timeBonusPerGrab += 0.6) },
  { ic: '🛡', t: '防爆涂层', d: '下一关炸弹拆除', apply: (r) => (r.defuse += 1) },
  { ic: '🎯', t: '精准摆钩', d: '摆动变慢易瞄准', apply: (r) => (r.swingSpeed *= 0.8) },
  { ic: '💰', t: '贪婪之瞳', d: '所有得分 +20%', apply: (r) => (r.greed += 0.2) },
];

export function pickThree(): Upgrade[] {
  return [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
}
