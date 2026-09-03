import { STORAGE_KEY } from '../../config';

/** 存档数据结构（带版本号，方便未来迁移）。 */
export interface SaveData {
  v: number;
  coins: number;
  bestScore: number;
  bestLevel: number;
  runs: number;
  totalScore: number;
  ownedSkins: string[];
  equipped: { hook: string; gemTheme: string; trail: string };
  boosters: Record<string, number>; // 道具库存
  settings: { sfx: boolean; music: boolean };
  lastDailyBonus: string | null; // YYYY-MM-DD
  removeAds: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  v: 1,
  coins: 0,
  bestScore: 0,
  bestLevel: 1,
  runs: 0,
  totalScore: 0,
  ownedSkins: ['hook_classic', 'gem_classic', 'trail_none'],
  equipped: { hook: 'hook_classic', gemTheme: 'gem_classic', trail: 'trail_none' },
  boosters: {},
  settings: { sfx: true, music: true },
  lastDailyBonus: null,
  removeAds: false,
};

/**
 * 存档提供者接口——本地实现现在就能用；将来接后端云存档时，
 * 只需实现同一接口（load/save 返回 Promise），业务代码零改动。
 */
export interface SaveProvider {
  load(): Promise<SaveData>;
  save(data: SaveData): Promise<void>;
}

export class LocalSaveProvider implements SaveProvider {
  async load(): Promise<SaveData> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SAVE, ...parsed, equipped: { ...DEFAULT_SAVE.equipped, ...parsed.equipped } };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }
  async save(data: SaveData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* 隐私模式 / 存储被禁用时静默失败，不影响单局体验 */
    }
  }
}

/** 全局单例存档管理器：内存持有当前存档，写操作节流落盘。 */
class SaveManager {
  private provider: SaveProvider = new LocalSaveProvider();
  data: SaveData = { ...DEFAULT_SAVE };
  private dirty = false;
  private timer: number | null = null;

  async init() {
    this.data = await this.provider.load();
  }

  /** 修改存档后调用，节流 400ms 落盘 */
  markDirty() {
    this.dirty = true;
    if (this.timer != null) return;
    this.timer = window.setTimeout(() => this.flush(), 400);
  }

  async flush() {
    if (this.timer != null) { clearTimeout(this.timer); this.timer = null; }
    if (!this.dirty) return;
    this.dirty = false;
    await this.provider.save(this.data);
  }

  /** 切换到其它存档实现（如云存档）时调用 */
  setProvider(p: SaveProvider) { this.provider = p; }
}

export const Save = new SaveManager();
