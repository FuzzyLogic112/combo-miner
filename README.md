<img src="public/favicon.svg" alt="连锁矿工图标" width="64">

# 连锁矿工 · Combo Miner

一款商业级 HTML5 休闲街机游戏。核心玩法借鉴《黄金矿工》的摆钩抓取，创新点是 **同色宝石连锁倍率系统**——抓取顺序决定分数倍率，逼玩家规划路线、滚雪球式得分。配合关间 Roguelite 强化、皮肤商店与货币系统，形成"再来一局"的留存循环。

## 技术栈

- **Phaser 3** — 游戏引擎
- **TypeScript** — 类型安全
- **Vite** — 构建与开发服务器
- **vite-plugin-pwa** — PWA / 离线安装

纯前端、可静态部署（Vercel / Netlify / 任意静态托管）。无位图资源，所有美术由 `src/game/gfx/textures.ts` **程序化烘焙**为 Phaser 纹理。

## 开发

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
npm run build      # 类型检查 + 生产构建到 dist/
npm run preview    # 预览生产包
```

## 部署

`npm run build` 产出 `dist/` 静态目录，直接托管即可。`vite.config.ts` 用相对 base，可部署到子路径。已配置 PWA，支持"添加到主屏幕"离线游玩。

## 目录结构

```
src/
  main.ts                 引导：载入存档 → 启动 Phaser
  config.ts               常量与数值调优（关卡/经济/色板集中在此）
  ui/widgets.ts           通用 UI 组件（按钮/面板/金币徽标）
  game/
    scenes/               Boot/Menu/Game/Shop/Result 场景
    systems/              Save 存档 · Economy 货币 · Shop 商店 · IAP 内购
                          Audio 程序化音效 · Analytics 埋点
    data/                 skins 皮肤 · boosters 道具 · upgrades 强化 目录
    gfx/                  textures 纹理烘焙 · background 背景
```

## 商业化系统（已内置，接口就绪）

| 系统 | 现状 | 上线接入点 |
|---|---|---|
| **金币经济** | 局末按分转化，全程埋点 | `systems/Economy.ts` |
| **皮肤商店** | 钩爪/宝石主题/拖尾，金币或内购解锁，公平不影响平衡 | `systems/Shop.ts` `data/skins.ts` |
| **消耗道具** | 时间/磁力/双倍金币/护盾，开局激活 | `data/boosters.ts` |
| **内购 IAP** | **沙盒模拟**打通购买→发货→存档 | `systems/IAP.ts`：把 `SandboxIAPProvider` 换成 Stripe/微信支付/StoreKit/Play Billing |
| **存档** | localStorage，节流落盘 | `systems/Save.ts`：实现 `SaveProvider` 接口即可切云存档 |
| **分析埋点** | provider 无关，DEV 下 console | `systems/Analytics.ts`：转发到 GA4/神策/Firebase |
| **每日奖励** | 每日一次 +300 金币 | `MenuScene.claimDaily` |

> 安全边界：前端不采集任何银行卡/密码；真实支付一律跳转渠道自有收银台，前端只接收回执发货。

## 待接后端（预留，非本期）

账号系统、云存档、在线排行榜、服务端支付校验、广告 SDK。各系统已按接口抽象，接后端时业务代码基本零改动。

## License

游戏代码：私有。程序化渲染核心源自自研 `render-kit`（MIT）。
