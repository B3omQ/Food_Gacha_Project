import { FridgeItem } from '@/types/fridge';

const FRIDGE_STORAGE_KEY = 'food_gacha_fridge_items';

export function getSmartQuantityAndUnit(unit: string = 'phần'): { defaultQty: number; step: number } {
  const u = unit.toLowerCase().trim();
  if (u === 'g' || u === 'gram') {
    return { defaultQty: 200, step: 50 };
  }
  if (u === 'ml') {
    return { defaultQty: 300, step: 50 };
  }
  if (u === 'kg') {
    return { defaultQty: 1, step: 0.5 };
  }
  return { defaultQty: 1, step: 1 };
}

export const fridgeStorage = {
  getItems(): FridgeItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(FRIDGE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveItems(items: FridgeItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(FRIDGE_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('fridge-updated'));
    } catch (e) {
      console.error('Failed to save fridge items', e);
    }
  },

  addItem(item: FridgeItem): void {
    const items = this.getItems();
    const existingIndex = items.findIndex(
      (i) => i.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      items[existingIndex] = {
        ...items[existingIndex],
        ...item,
        quantity: (items[existingIndex].quantity || 1) + (item.quantity || 1),
      };
    } else {
      items.push({
        ...item,
        name: item.name.trim(),
        quantity: item.quantity || 1,
      });
    }

    this.saveItems(items);
  },

  updateItem(name: string, updated: Partial<FridgeItem>): void {
    const items = this.getItems();
    const index = items.findIndex(
      (i) => i.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...updated,
      };
      this.saveItems(items);
    }
  },

  removeItem(name: string): void {
    const items = this.getItems();
    const filtered = items.filter(
      (i) => i.name.trim().toLowerCase() !== name.trim().toLowerCase()
    );
    this.saveItems(filtered);
  },

  clearFridge(): void {
    this.saveItems([]);
  },
};
