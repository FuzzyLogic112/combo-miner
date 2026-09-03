import Phaser from 'phaser';

/**
 * 程序化纹理生成器 —— 由自研 render-kit 的画法移植而来。
 * 在 BootScene 里把宝石/金块/岩石/钩爪等一次性烘焙成 Phaser 纹理，
 * 之后按 sprite 渲染：既有手绘质感，又有 GPU 批渲染的性能。零位图资源。
 */

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
function hexToRgb(h: string): [number, number, number] {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (hex: string, a: number) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}
function register(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

/** 多切面宝石 */
export function makeGemTexture(scene: Phaser.Scene, key: string, color: string, r = 18) {
  const pad = 4, size = (r + pad) * 2, [c, ctx] = makeCanvas(size);
  ctx.translate(size / 2, size / 2);
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
  grad.addColorStop(0, shade(color, 0.55)); grad.addColorStop(0.5, color); grad.addColorStop(1, shade(color, -0.45));
  const s = r, pts: [number, number][] = [[0, -s], [s * 0.92, -s * 0.15], [s * 0.58, s], [-s * 0.58, s], [-s * 0.92, -s * 0.15]];
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = rgba('#000', 0.18); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 0.2);
  ctx.moveTo(-s * 0.92, -s * 0.15); ctx.lineTo(0, s * 0.2); ctx.moveTo(s * 0.92, -s * 0.15); ctx.lineTo(0, s * 0.2); ctx.stroke();
  ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.92, -s * 0.15); ctx.lineTo(s * 0.15, -s * 0.05); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.42, r * 0.12, 0, TAU); ctx.fill();
  register(scene, key, c);
}

/** 金属球体（金块 / 炸弹壳） */
export function makeOrbTexture(scene: Phaser.Scene, key: string, color: string, r = 20) {
  const pad = 3, size = (r + pad) * 2, [c, ctx] = makeCanvas(size), cx = size / 2, cy = size / 2;
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  g.addColorStop(0, shade(color, 0.7)); g.addColorStop(0.45, color); g.addColorStop(0.85, shade(color, -0.3)); g.addColorStop(1, shade(color, -0.55));
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.09); ctx.strokeStyle = rgba(shade(color, 0.6), 0.5);
  ctx.beginPath(); ctx.arc(cx, cy, r - ctx.lineWidth * 0.5, TAU * 0.55, TAU * 0.95); ctx.stroke();
  ctx.globalAlpha = 0.85; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.32, cy - r * 0.38, r * 0.22, r * 0.14, -0.6, 0, TAU); ctx.fill();
  register(scene, key, c);
}

/** 不规则岩石 */
export function makeRockTexture(scene: Phaser.Scene, key: string, r = 24, seed = 1) {
  const pad = 3, size = (r + pad) * 2, [c, ctx] = makeCanvas(size), cx = size / 2, cy = size / 2;
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
  g.addColorStop(0, '#9aa3ba'); g.addColorStop(0.6, '#6f7890'); g.addColorStop(1, '#454c63');
  ctx.beginPath();
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU, rr = r * (0.82 + 0.18 * Math.abs(Math.sin(seed + i * 2.3)));
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = rgba('#000', 0.25); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy - r * 0.1); ctx.lineTo(cx + r * 0.1, cy + r * 0.3);
  ctx.moveTo(cx + r * 0.15, cy - r * 0.25); ctx.lineTo(cx + r * 0.35, cy + r * 0.05); ctx.stroke();
  register(scene, key, c);
}

/** 柔光圆（加色混合用，可 tint 成任意色做辉光/粒子） */
export function makeGlowTexture(scene: Phaser.Scene, key = 'glow', size = 128) {
  const [c, ctx] = makeCanvas(size), cx = size / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cx, cx, 0, TAU); ctx.fill();
  register(scene, key, c);
}

/** 实心小圆点（粒子用，可 tint） */
export function makeDotTexture(scene: Phaser.Scene, key = 'dot', size = 16) {
  const [c, ctx] = makeCanvas(size), cx = size / 2;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cx, cx - 1, 0, TAU); ctx.fill();
  register(scene, key, c);
}

/** 钩爪（含金属高光），按皮肤颜色生成 */
export function makeHookTexture(scene: Phaser.Scene, key: string, color: string, accent: string) {
  const size = 40, [c, ctx] = makeCanvas(size), cx = size / 2, cy = size / 2 - 4;
  ctx.strokeStyle = color; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5);
  ctx.arc(cx, cy + 5, 8, Math.PI * 0.08, Math.PI * 0.92, false);
  ctx.moveTo(cx, cy + 5); ctx.arc(cx, cy + 5, 8, Math.PI * 0.08, Math.PI * 0.92, true);
  ctx.stroke();
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 1.4, cy - 4); ctx.lineTo(cx - 1.4, cy + 4); ctx.stroke();
  register(scene, key, c);
}
