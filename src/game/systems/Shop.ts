import { Save } from './Save';
import { Economy } from './Economy';
import { IAP } from './IAP';
import { Analytics } from './Analytics';
import { SKINS, Skin, skinById } from '../data/skins';
import { Booster, boosterById } from '../data/boosters';

export type BuyOutcome = 'owned' | 'bought_coins' | 'bought_iap' | 'insufficient' | 'cancelled' | 'error';

class ShopManager {
  owns(skinId: string) { return Save.data.ownedSkins.includes(skinId); }

  isEquipped(skin: Skin) { return Save.data.equipped[skin.kind] === skin.id; }

  /** 购买皮肤：优先金币，若为 IAP 独占皮肤走内购。 */
  async buySkin(skin: Skin): Promise<BuyOutcome> {
    if (this.owns(skin.id)) return 'owned';

    if (skin.iapProductId) {
      const res = await IAP.purchase({
        id: skin.iapProductId,
        title: skin.name,
        price: skin.iapPrice ?? '—',
        unlockSkin: skin.id,
      });
      if (!res.ok) return res.error === 'user_cancelled' ? 'cancelled' : 'error';
      this.grant(skin.id);
      return 'bought_iap';
    }

    if (!Economy.canAfford(skin.price)) return 'insufficient';
    Economy.spend(skin.price, 'skin:' + skin.id);
    this.grant(skin.id);
    return 'bought_coins';
  }

  private grant(skinId: string) {
    if (!Save.data.ownedSkins.includes(skinId)) Save.data.ownedSkins.push(skinId);
    Save.markDirty();
    Analytics.track('skin_unlock', { skin: skinId });
  }

  equip(skin: Skin) {
    if (!this.owns(skin.id)) return false;
    Save.data.equipped[skin.kind] = skin.id;
    Save.markDirty();
    Analytics.track('skin_equip', { skin: skin.id, kind: skin.kind });
    return true;
  }

  equippedSkin(kind: Skin['kind']): Skin {
    return skinById(Save.data.equipped[kind]) ?? SKINS[0];
  }

  // —— 道具 ——
  boosterCount(id: string) { return Save.data.boosters[id] ?? 0; }

  buyBooster(b: Booster): BuyOutcome {
    if (!Economy.canAfford(b.price)) return 'insufficient';
    Economy.spend(b.price, 'booster:' + b.id);
    Save.data.boosters[b.id] = this.boosterCount(b.id) + 1;
    Save.markDirty();
    Analytics.track('booster_buy', { booster: b.id });
    return 'bought_coins';
  }

  /** 消耗一个道具，成功返回 true */
  consumeBooster(id: string): boolean {
    if (this.boosterCount(id) <= 0) return false;
    Save.data.boosters[id]--;
    Save.markDirty();
    Analytics.track('booster_use', { booster: id });
    return true;
  }
}

export const Shop = new ShopManager();
export { boosterById };
