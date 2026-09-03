import { Save } from './Save';

/**
 * 程序化音效（WebAudio 合成，零音频资源，保持包体小 & 离线可用）。
 * 首次用户交互后才允许 resume（浏览器自动播放策略）。
 */
class AudioManager {
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    if (!Save.data.settings.sfx) return null;
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
      catch { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain = 0.15, slideTo?: number) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  shoot() { this.blip(520, 0.12, 'square', 0.08, 180); }
  grab(comboMult = 1) { this.blip(400 + comboMult * 80, 0.14, 'triangle', 0.16, 700 + comboMult * 90); }
  coin() { this.blip(880, 0.08, 'square', 0.1); setTimeout(() => this.blip(1180, 0.09, 'square', 0.1), 60); }
  bomb() { this.blip(140, 0.3, 'sawtooth', 0.2, 40); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.16, 'triangle', 0.14), i * 90)); }
  lose() { [400, 300, 200].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'sawtooth', 0.15), i * 130)); }
  ui() { this.blip(660, 0.06, 'sine', 0.08); }
}

export const Audio = new AudioManager();
