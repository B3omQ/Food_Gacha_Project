'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fridgeStorage, getSmartQuantityAndUnit } from '@/lib/fridge-storage';
import { recipeService, IngredientOption } from '@/services/recipe-service';
import { caseService } from '@/services/case-service';
import { FridgeItem } from '@/types/fridge';

const COMMON_UNITS = ['g', 'kg', 'ml', 'quả', 'bó', 'chén', 'muỗng canh', 'muỗng cà phê', 'lát', 'miếng', 'cây', 'gói', 'phần'];

export default function FridgePage() {
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [systemIngredients, setSystemIngredients] = useState<IngredientOption[]>([]);
  const [customName, setCustomName] = useState('');
  const [customQuantity, setCustomQuantity] = useState<number>(300);
  const [customUnit, setCustomUnit] = useState('g');
  const [, setLoading] = useState(true);

  // Inline editing state for a fridge item
  const [editingItemName, setEditingItemName] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<string>('g');

  // Quick configure modal for system ingredients
  const [configuringIng, setConfiguringIng] = useState<IngredientOption | null>(null);
  const [configQty, setConfigQty] = useState<number>(200);
  const [configUnit, setConfigUnit] = useState<string>('g');

  // Cookable recipes scan
  const [cookableDishes, setCookableDishes] = useState<
    Array<{
      caseId: number;
      caseName: string;
      recipeId: number;
      recipeName: string;
      imageUrl: string | null;
      cookingTimeMinutes: number;
    }>
  >([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const items = fridgeStorage.getItems();
      setFridgeItems(items);

      const [ingredients, cases] = await Promise.all([
        recipeService.getAllIngredients(),
        caseService.getActiveCases(),
      ]);
      setSystemIngredients(ingredients);

      // Scan all cases to find cookable dishes
      const fridgeNames = new Set(items.map((i) => i.name.trim().toLowerCase()));
      const caseDetails = await Promise.all(
        cases.map((c) => caseService.getCaseById(c.id).catch(() => null))
      );

      const cookable: typeof cookableDishes = [];
      const seenRecipeIds = new Set<number>();

      for (const cd of caseDetails) {
        if (!cd) continue;
        for (const r of cd.recipes) {
          if (seenRecipeIds.has(r.recipeId)) continue;

          const reqs = r.ingredients || [];
          if (reqs.length > 0) {
            const hasAll = reqs.every((ri) =>
              fridgeNames.has(ri.name.trim().toLowerCase())
            );
            if (hasAll) {
              seenRecipeIds.add(r.recipeId);
              cookable.push({
                caseId: cd.id,
                caseName: cd.name,
                recipeId: r.recipeId,
                recipeName: r.name,
                imageUrl: r.imageUrl,
                cookingTimeMinutes: r.cookingTimeMinutes,
              });
            }
          }
        }
      }
      setCookableDishes(cookable);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      setFridgeItems(fridgeStorage.getItems());
    };
    window.addEventListener('fridge-updated', handleUpdate);
    return () => window.removeEventListener('fridge-updated', handleUpdate);
  }, []);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    fridgeStorage.addItem({
      name: customName.trim(),
      quantity: customQuantity > 0 ? customQuantity : 1,
      unit: customUnit.trim() || 'phần',
    });

    setCustomName('');
    const { defaultQty } = getSmartQuantityAndUnit(customUnit);
    setCustomQuantity(defaultQty);
    loadData();
  };

  const handleQuickAddClick = (ing: IngredientOption) => {
    const existing = fridgeItems.find(
      (i) => i.name.toLowerCase() === ing.name.toLowerCase()
    );

    if (existing) {
      const { step } = getSmartQuantityAndUnit(existing.unit || ing.unit);
      fridgeStorage.updateItem(existing.name, {
        quantity: Math.round(((existing.quantity || 0) + step) * 10) / 10,
      });
    } else {
      const { defaultQty } = getSmartQuantityAndUnit(ing.unit);
      fridgeStorage.addItem({
        id: ing.id,
        name: ing.name,
        quantity: defaultQty,
        unit: ing.unit,
      });
    }
    loadData();
  };

  const handleOpenConfigIng = (ing: IngredientOption, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = fridgeItems.find(
      (i) => i.name.toLowerCase() === ing.name.toLowerCase()
    );
    const { defaultQty } = getSmartQuantityAndUnit(ing.unit);
    setConfiguringIng(ing);
    setConfigQty(existing?.quantity || defaultQty);
    setConfigUnit(existing?.unit || ing.unit || 'g');
  };

  const handleSaveConfigIng = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringIng) return;

    const existing = fridgeItems.find(
      (i) => i.name.toLowerCase() === configuringIng.name.toLowerCase()
    );

    if (existing) {
      fridgeStorage.updateItem(existing.name, {
        quantity: configQty > 0 ? configQty : 1,
        unit: configUnit.trim() || 'phần',
      });
    } else {
      fridgeStorage.addItem({
        id: configuringIng.id,
        name: configuringIng.name,
        quantity: configQty > 0 ? configQty : 1,
        unit: configUnit.trim() || 'phần',
      });
    }

    setConfiguringIng(null);
    loadData();
  };

  const handleAdjustStep = (item: FridgeItem, deltaFactor: number) => {
    const { step } = getSmartQuantityAndUnit(item.unit);
    const newQty = Math.max(step, Math.round(((item.quantity || 0) + step * deltaFactor) * 10) / 10);
    fridgeStorage.updateItem(item.name, { quantity: newQty });
    loadData();
  };

  const handleStartEdit = (item: FridgeItem) => {
    setEditingItemName(item.name);
    setEditQty(item.quantity || 1);
    setEditUnit(item.unit || 'g');
  };

  const handleSaveEdit = (name: string) => {
    fridgeStorage.updateItem(name, {
      quantity: editQty > 0 ? editQty : 1,
      unit: editUnit.trim() || 'phần',
    });
    setEditingItemName(null);
    loadData();
  };

  const handleRemove = (name: string) => {
    fridgeStorage.removeItem(name);
    loadData();
  };

  const handleClearAll = () => {
    if (confirm('Bạn có chắc chắn muốn dọn sạch tủ lạnh không?')) {
      fridgeStorage.clearFridge();
      loadData();
    }
  };

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Header with Title and Count beside it */}
      <div className="space-y-1 border-b border-[var(--line)] pb-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] tracking-tight">
            Tủ lạnh của bạn
          </h1>
          <span className="text-lg font-bold font-['Barlow_Condensed',sans-serif] text-[var(--gold)]">
            ({fridgeItems.length} nguyên liệu)
          </span>
        </div>
        <p className="text-sm text-[var(--muted)] max-w-[52ch]">
          Quản lý đồ có sẵn trong tủ để hệ thống lọc các món nấu được ngay hoặc lên danh sách đồ cần mua thêm khi mở hòm.
        </p>
      </div>

      {/* Two Columns: Left Form (1 col), Right Quick Pick (2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: Thêm đồ vào tủ */}
        <div className="md:col-span-1 bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Thêm đồ vào tủ
          </h2>

          <form onSubmit={handleAddCustom} className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">
                Tên nguyên liệu
              </label>
              <input
                type="text"
                required
                placeholder="vd: Thịt bò, Trứng gà..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 text-sm rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  Đơn vị
                </label>
                <input
                  type="text"
                  list="common-units"
                  placeholder="g, ml, quả..."
                  value={customUnit}
                  onChange={(e) => {
                    const u = e.target.value;
                    setCustomUnit(u);
                    const { defaultQty } = getSmartQuantityAndUnit(u);
                    setCustomQuantity(defaultQty);
                  }}
                  className="w-full px-3 py-1.5 text-sm rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                />
                <datalist id="common-units">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>

            <button
              type="submit"
              className="btn-gold w-full text-sm font-semibold py-2 cursor-pointer"
            >
              Cất vào tủ
            </button>
          </form>
        </div>

        {/* Right: Chọn nhanh nguyên liệu */}
        <div className="md:col-span-2 bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Chọn nhanh nguyên liệu
            </h2>
            <span className="text-xs text-[var(--muted)]">
              Nhấn để thêm hoặc nhấn ⚙ để chỉnh
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
            {systemIngredients.map((ing) => {
              const inFridge = fridgeItems.find(
                (i) => i.name.toLowerCase() === ing.name.toLowerCase()
              );

              return (
                <div
                  key={ing.id}
                  className={`inline-flex items-center rounded-[var(--radius)] text-xs border transition-colors ${
                    inFridge
                      ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--muted)] font-medium'
                      : 'bg-transparent text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleQuickAddClick(ing)}
                    className="px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                    title={
                      inFridge
                        ? `Đang có ${inFridge.quantity} ${inFridge.unit}. Nhấn để thêm tiếp.`
                        : `Thêm ${ing.name} vào tủ.`
                    }
                  >
                    <span>{inFridge ? '✓' : '+'}</span>
                    <span>{ing.name}</span>
                    {inFridge && (
                      <span className="text-[var(--muted)] font-normal">
                        {inFridge.quantity} {inFridge.unit}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenConfigIng(ing, e)}
                    className="px-1.5 py-1 border-l border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                    title="Chỉnh sửa định lượng"
                  >
                    ⚙
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Danh sách Nguyên liệu đang có */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h2 className="text-lg font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
            Nguyên liệu đang có ({fridgeItems.length})
          </h2>

          {fridgeItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-[var(--r4)] hover:underline cursor-pointer"
            >
              Dọn sạch tủ lạnh
            </button>
          )}
        </div>

        {fridgeItems.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--muted)] border border-dashed border-[var(--line)] rounded-[var(--radius)]">
            Tủ lạnh của bạn đang trống. Hãy thêm nguyên liệu từ danh sách phía trên.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {fridgeItems.map((item, idx) => {
              const isEditing = editingItemName === item.name;

              return (
                <div
                  key={`${item.name}-${idx}`}
                  className="p-2 sm:p-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
                    <span
                      className="font-medium text-xs sm:text-sm text-[var(--text)] truncate"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.name)}
                      className="text-[var(--muted)] hover:text-[var(--r4)] text-xs cursor-pointer shrink-0"
                      title="Bỏ khỏi tủ"
                    >
                      ✕
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={0.1}
                          min={0.1}
                          value={editQty}
                          onChange={(e) => setEditQty(parseFloat(e.target.value) || 1)}
                          className="w-16 px-1.5 py-1 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--text)]"
                        />
                        <input
                          type="text"
                          list="common-units-edit"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-20 px-1.5 py-1 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--text)]"
                        />
                        <datalist id="common-units-edit">
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u} />
                          ))}
                        </datalist>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItemName(null)}
                          className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.name)}
                          className="text-xs font-semibold text-[var(--gold)] hover:underline cursor-pointer"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                        title="Bấm để chỉnh số lượng"
                      >
                        {item.quantity} {item.unit || 'phần'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustStep(item, -1)}
                          className="w-6 h-6 rounded-[var(--radius)] bg-transparent hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] flex items-center justify-center text-xs cursor-pointer"
                          title="Giảm"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustStep(item, 1)}
                          className="w-6 h-6 rounded-[var(--radius)] bg-transparent hover:bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] flex items-center justify-center text-xs cursor-pointer"
                          title="Tăng"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Món nấu được ngay từ tủ lạnh */}
      {fridgeItems.length > 0 && cookableDishes.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-[var(--line)]">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
              Món nấu được ngay từ tủ lạnh ({cookableDishes.length})
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Bạn có đủ nguyên liệu để nấu các món này ngay bây giờ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cookableDishes.map((dish) => (
              <div
                key={`${dish.caseId}-${dish.recipeId}`}
                className="p-3 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--line)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-[var(--radius)] overflow-hidden bg-[var(--bg)] border border-[var(--line)] flex-shrink-0">
                    {dish.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dish.imageUrl}
                        alt={dish.recipeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                        đĩa
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm text-[var(--text)] truncate">
                      {dish.recipeName}
                    </h4>
                    <p className="text-xs text-[var(--muted)]">
                      {dish.cookingTimeMinutes} phút
                    </p>
                  </div>
                </div>

                <Link
                  href={`/recipes/${dish.recipeId}`}
                  className="text-xs text-[var(--text)] underline hover:text-[var(--gold)] flex-shrink-0"
                >
                  Xem công thức
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Quick Configure */}
      {configuringIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-semibold text-sm text-[var(--text)]">
                Chỉnh định lượng: {configuringIng.name}
              </h3>
              <button
                type="button"
                onClick={() => setConfiguringIng(null)}
                className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfigIng} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={configQty}
                    onChange={(e) => setConfigQty(parseFloat(e.target.value) || 1)}
                    className="w-full px-2 py-1 text-sm rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">
                    Đơn vị
                  </label>
                  <input
                    type="text"
                    list="common-units-modal"
                    value={configUnit}
                    onChange={(e) => setConfigUnit(e.target.value)}
                    className="w-full px-2 py-1 text-sm rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  />
                  <datalist id="common-units-modal">
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfiguringIng(null)}
                  className="btn-secondary text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs font-semibold py-1.5 px-4 cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
