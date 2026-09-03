/**
 * 分析埋点接口（provider-agnostic）。
 * 现在只 console 输出；上线时把 track/screen 转发到 GA4 / 神策 / Firebase 即可，
 * 业务代码调用方式不变。
 */
type Props = Record<string, unknown>;

class AnalyticsManager {
  private enabled = true;

  /** 接入真实分析 SDK 时替换此方法内部实现 */
  private sink(event: string, props: Props) {
    if (!this.enabled) return;
    // 例：window.gtag?.('event', event, props);
    if (import.meta.env.DEV) console.debug('[analytics]', event, props);
  }

  track(event: string, props: Props = {}) { this.sink(event, { ...props, ts: Date.now() }); }
  screen(name: string) { this.sink('screen_view', { screen: name }); }
  setEnabled(on: boolean) { this.enabled = on; }
}

export const Analytics = new AnalyticsManager();
