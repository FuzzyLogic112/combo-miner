/** 消耗型道具（开局前激活，一次一个）。用金币购买，形成金币回收闭环。 */

export interface Booster {
  id: string;
  icon: string;
  name: string;
  desc: string;
  price: number;
}

export const BOOSTERS: Booster[] = [
  { id: 'time', icon: '⏱', name: '时间沙漏', desc: '开局 +8 秒', price: 120 },
  { id: 'magnet', icon: '🧲', name: '磁力启动', desc: '开局自带磁力吸附', price: 150 },
  { id: 'double', icon: '💰', name: '双倍金币', desc: '本局金币收益 ×2', price: 200 },
  { id: 'shield', icon: '🛡', name: '防爆护盾', desc: '免疫本局第一颗炸弹', price: 180 },
];

export const boosterById = (id: string) => BOOSTERS.find((b) => b.id === id);
