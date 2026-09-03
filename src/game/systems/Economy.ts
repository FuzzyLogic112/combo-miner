import { Save } from './Save';
import { Analytics } from './Analytics';

/** 金币经济：所有加减金币走这里，统一埋点与落盘。 */
class EconomyManager {
  get coins() { return Save.data.coins; }

  add(amount: number, source: string) {
    if (amount <= 0) return;
    Save.data.coins += Math.round(amount);
    Save.markDirty();
    Analytics.track('coin_earn', { amount, source, balance: Save.data.coins });
  }

  /** 花费金币，成功返回 true */
  spend(amount: number, sink: string): boolean {
    if (Save.data.coins < amount) return false;
    Save.data.coins -= amount;
    Save.markDirty();
    Analytics.track('coin_spend', { amount, sink, balance: Save.data.coins });
    return true;
  }

  canAfford(amount: number) { return Save.data.coins >= amount; }
}

export const Economy = new EconomyManager();
