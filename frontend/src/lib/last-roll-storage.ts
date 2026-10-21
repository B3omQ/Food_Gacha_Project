import { OpenCaseResult } from '@/types/case';

export interface CachedRoll {
  mode: 'single' | 'multi'; // x1 hoặc x3
  timestamp: number;
  caseNames?: string[];
  results: OpenCaseResult[];
}

const LAST_ROLL_STORAGE_KEY = 'food_gacha_last_roll';

export const lastRollStorage = {
  getLastRoll(): CachedRoll | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(LAST_ROLL_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Chỉ lưu cache 1 lần duy nhất cho lượt mở mới nhất.
   * Khi mở lượt mới, tự động ghi đè (xóa lượt cũ thay bằng lượt mới).
   */
  saveLastRoll(roll: CachedRoll): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LAST_ROLL_STORAGE_KEY, JSON.stringify(roll));
      window.dispatchEvent(new Event('last-roll-updated'));
    } catch (e) {
      console.error('Failed to save last roll', e);
    }
  },

  clearLastRoll(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LAST_ROLL_STORAGE_KEY);
      window.dispatchEvent(new Event('last-roll-updated'));
    } catch (e) {
      console.error('Failed to clear last roll', e);
    }
  },
};
