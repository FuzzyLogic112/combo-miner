import { Analytics } from './Analytics';

/**
 * 内购(IAP)接口 —— provider 无关的抽象层。
 *
 * 现在是 **沙盒模拟实现**：弹确认框、模拟成功回执，方便在没有支付后端时
 * 打通整套购买/发货/存档流程。上线时把 `RealIAPProvider` 接到具体渠道
 * （Stripe Checkout / 微信支付 / Apple StoreKit / Google Play Billing），
 * 业务侧只依赖下面的 `IAP.purchase(productId)`，无需改动。
 *
 * 安全边界：本项目不在前端采集任何银行卡/密码；真实支付一律跳转渠道自有
 * 收银台完成，前端只接收回执并据此发货。
 */

export interface IAPProduct {
  id: string;
  title: string;
  /** 展示价格，如 "¥6" / "$0.99" */
  price: string;
  /** 购买后发放：金币数量 */
  coins?: number;
  /** 购买后解锁的皮肤 id */
  unlockSkin?: string;
  /** 是否为"去广告"等一次性权益 */
  entitlement?: 'removeAds';
}

export interface PurchaseResult {
  ok: boolean;
  productId: string;
  /** 渠道交易号，用于对账 */
  transactionId?: string;
  error?: string;
}

export interface IAPProvider {
  purchase(product: IAPProduct): Promise<PurchaseResult>;
}

/** 沙盒实现：模拟一次成功支付（本地弹确认）。 */
class SandboxIAPProvider implements IAPProvider {
  async purchase(product: IAPProduct): Promise<PurchaseResult> {
    const ok = window.confirm(
      `【沙盒支付】\n购买「${product.title}」\n价格：${product.price}\n\n点击「确定」模拟支付成功。`
    );
    if (!ok) return { ok: false, productId: product.id, error: 'user_cancelled' };
    await new Promise((r) => setTimeout(r, 350)); // 模拟网络
    return { ok: true, productId: product.id, transactionId: 'sandbox_' + Date.now() };
  }
}

class IAPManager {
  private provider: IAPProvider = new SandboxIAPProvider();

  setProvider(p: IAPProvider) { this.provider = p; }

  async purchase(product: IAPProduct): Promise<PurchaseResult> {
    Analytics.track('iap_start', { product: product.id, price: product.price });
    const res = await this.provider.purchase(product);
    Analytics.track(res.ok ? 'iap_success' : 'iap_fail', { product: product.id, error: res.error });
    return res;
  }
}

export const IAP = new IAPManager();
