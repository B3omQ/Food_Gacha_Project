'use client';

import React, { useEffect, useState } from 'react';
import { caseService } from '@/services/case-service';
import { recipeService } from '@/services/recipe-service';
import { CaseDetail, CaseSummary, CreateOrUpdateCaseDto } from '@/types/case';
import { CreateOrUpdateRecipeDto, RecipeDetail, RecipeSummary } from '@/types/recipe';
import ExcelImportModal from '@/components/ExcelImportModal';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'cases' | 'recipes'>('cases');

  // Cases state
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [editingCase, setEditingCase] = useState<{ id?: number; form: CreateOrUpdateCaseDto } | null>(null);
  const [selectedCaseIds, setSelectedCaseIds] = useState<number[]>([]);
  const [isBatchDeletingCases, setIsBatchDeletingCases] = useState(false);

  // Recipes state
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<{ id?: number; form: CreateOrUpdateRecipeDto } | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [isBatchDeletingRecipes, setIsBatchDeletingRecipes] = useState(false);

  // Toast / feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch Cases
  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const data = await caseService.getAllCases();
      setCases(data);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Không thể tải danh sách hòm.');
    } finally {
      setLoadingCases(false);
    }
  };

  // Fetch Recipes
  const loadRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const data = await recipeService.getAllRecipes();
      setRecipes(data);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Không thể tải danh sách món ăn.');
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    loadCases();
    loadRecipes();
  }, []);

  // ================= CASES HANDLERS =================
  const handleOpenCreateCase = () => {
    setEditingCase({
      form: {
        name: '',
        description: '',
        imageUrl: '',
        isActive: true,
        recipes: [],
      },
    });
  };

  const handleOpenEditCase = async (caseId: number) => {
    try {
      const detail: CaseDetail = await caseService.getCaseById(caseId);
      setEditingCase({
        id: detail.id,
        form: {
          name: detail.name,
          description: detail.description,
          imageUrl: detail.imageUrl || '',
          isActive: detail.isActive,
          recipes: detail.recipes.map((r) => ({
            recipeId: r.recipeId,
            weight: r.weight,
          })),
        },
      });
    } catch {
      showFeedback('error', 'Không thể nạp chi tiết hòm.');
    }
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;

    if (!editingCase.form.name.trim()) {
      showFeedback('error', 'Tên hòm không được để trống.');
      return;
    }

    try {
      if (editingCase.id) {
        await caseService.updateCase(editingCase.id, editingCase.form);
        showFeedback('success', `Đã cập nhật hòm "${editingCase.form.name}".`);
      } else {
        await caseService.createCase(editingCase.form);
        showFeedback('success', `Đã tạo mới hòm "${editingCase.form.name}".`);
      }
      setEditingCase(null);
      loadCases();
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Lỗi khi lưu hòm.');
    }
  };

  const handleDeleteCase = async (caseId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hòm "${name}" không?`)) return;
    try {
      await caseService.deleteCase(caseId);
      setSelectedCaseIds((prev) => prev.filter((id) => id !== caseId));
      showFeedback('success', `Đã xóa hòm "${name}".`);
      loadCases();
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Lỗi khi xóa hòm.');
    }
  };

  const handleToggleSelectCase = (id: number) => {
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCases = () => {
    if (selectedCaseIds.length === cases.length) {
      setSelectedCaseIds([]);
    } else {
      setSelectedCaseIds(cases.map((c) => c.id));
    }
  };

  const handleBatchDeleteCases = async () => {
    if (selectedCaseIds.length === 0) return;
    const count = selectedCaseIds.length;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${count} hòm đã chọn không? Thao tác này sẽ xóa vĩnh viễn các hòm này.`)) {
      return;
    }

    try {
      setIsBatchDeletingCases(true);
      const res = await caseService.batchDeleteCases(selectedCaseIds);
      showFeedback('success', res.message || `Đã xóa thành công ${count} hòm.`);
      setSelectedCaseIds([]);
      loadCases();
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Lỗi khi xóa danh sách hòm.');
    } finally {
      setIsBatchDeletingCases(false);
    }
  };

  const handleToggleCaseStatus = async (caseId: number) => {
    try {
      const res = await caseService.toggleCaseStatus(caseId);
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, isActive: res.isActive } : c))
      );
      showFeedback('success', `Đã ${res.isActive ? 'kích hoạt' : 'tạm dừng'} hòm.`);
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Lỗi khi đổi trạng thái.');
    }
  };

  // ================= RECIPES HANDLERS =================
  const handleOpenCreateRecipe = () => {
    setEditingRecipe({
      form: {
        name: '',
        description: '',
        imageUrl: '',
        cookingTimeMinutes: 20,
        estimatedCost: 30000,
        difficulty: 'Medium',
        instructions: '',
        ingredients: [{ name: '', quantity: 1, unit: 'g' }],
      },
    });
  };

  const handleOpenEditRecipe = async (recipeId: number) => {
    try {
      const detail: RecipeDetail = await recipeService.getRecipeById(recipeId);
      setEditingRecipe({
        id: detail.id,
        form: {
          name: detail.name,
          description: detail.description,
          imageUrl: detail.imageUrl || '',
          cookingTimeMinutes: detail.cookingTimeMinutes,
          estimatedCost: detail.estimatedCost,
          difficulty: detail.difficulty,
          instructions: detail.instructions,
          ingredients: detail.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        },
      });
    } catch {
      showFeedback('error', 'Không thể nạp chi tiết món ăn.');
    }
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe) return;

    if (!editingRecipe.form.name.trim()) {
      showFeedback('error', 'Tên món ăn không được để trống.');
      return;
    }

    try {
      if (editingRecipe.id) {
        await recipeService.updateRecipe(editingRecipe.id, editingRecipe.form);
        showFeedback('success', `Đã cập nhật món "${editingRecipe.form.name}".`);
      } else {
        await recipeService.createRecipe(editingRecipe.form);
        showFeedback('success', `Đã tạo món mới "${editingRecipe.form.name}".`);
      }
      setEditingRecipe(null);
      loadRecipes();
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Lỗi khi lưu món ăn.');
    }
  };

  const handleDeleteRecipe = async (recipeId: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa món "${name}" không?`)) return;
    try {
      await recipeService.deleteRecipe(recipeId);
      setSelectedRecipeIds((prev) => prev.filter((id) => id !== recipeId));
      showFeedback('success', `Đã xóa món "${name}".`);
      loadRecipes();
      loadCases();
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Lỗi khi xóa món ăn.');
    }
  };

  const handleToggleSelectRecipe = (id: number) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllRecipes = () => {
    if (selectedRecipeIds.length === recipes.length) {
      setSelectedRecipeIds([]);
    } else {
      setSelectedRecipeIds(recipes.map((r) => r.id));
    }
  };

  const handleBatchDeleteRecipes = async () => {
    if (selectedRecipeIds.length === 0) return;
    const count = selectedRecipeIds.length;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${count} món ăn đã chọn không? Thao tác này sẽ xóa các món này khỏi tất cả các hòm liên quan.`)) {
      return;
    }

    try {
      setIsBatchDeletingRecipes(true);
      const res = await recipeService.batchDeleteRecipes(selectedRecipeIds);
      showFeedback('success', res.message || `Đã xóa thành công ${count} món ăn.`);
      setSelectedRecipeIds([]);
      loadRecipes();
      loadCases();
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Lỗi khi xóa danh sách món ăn.');
    } finally {
      setIsBatchDeletingRecipes(false);
    }
  };

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[var(--radius)] border text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--gold)]'
              : 'bg-[var(--panel)] text-[var(--r4)] border-[var(--r4)]'
          }`}
        >
          <span>{feedback.type === 'success' ? '✓' : '!'}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)] tracking-tight">
            Quản lý hệ thống
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-[52ch]">
            Thêm, sửa, xóa danh mục hòm và món ăn trong cơ sở dữ liệu.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cases')}
            className={`px-3 py-1.5 text-sm rounded-[var(--radius)] border transition-colors cursor-pointer ${
              activeTab === 'cases'
                ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--muted)] font-medium'
                : 'bg-transparent text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]'
            }`}
          >
            Hòm ({cases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recipes')}
            className={`px-3 py-1.5 text-sm rounded-[var(--radius)] border transition-colors cursor-pointer ${
              activeTab === 'recipes'
                ? 'bg-[var(--panel)] text-[var(--text)] border-[var(--muted)] font-medium'
                : 'bg-transparent text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)]'
            }`}
          >
            Món ăn ({recipes.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: CASES MANAGEMENT ================= */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
              Danh sách hòm
            </h2>
            <div className="flex items-center gap-2">
              {selectedCaseIds.length > 0 && (
                <button
                  type="button"
                  disabled={isBatchDeletingCases}
                  onClick={handleBatchDeleteCases}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 rounded-[var(--radius)] cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <span>🗑️</span>
                  <span>{isBatchDeletingCases ? 'Đang xóa...' : `Xóa ${selectedCaseIds.length} hòm đã chọn`}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenCreateCase}
                className="btn-gold text-xs font-semibold py-1.5 px-3 cursor-pointer"
              >
                Thêm hòm mới
              </button>
            </div>
          </div>

          {/* Banner thông báo số lượng hòm được chọn */}
          {selectedCaseIds.length > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-red-950/30 border border-red-500/30 rounded-[var(--radius)] text-xs animate-fade-in">
              <span className="text-[var(--text)]">
                Đã chọn <strong className="text-[var(--gold)]">{selectedCaseIds.length}</strong> / {cases.length} hòm
              </span>
              <button
                type="button"
                onClick={() => setSelectedCaseIds([])}
                className="text-[var(--muted)] hover:text-[var(--text)] underline cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          )}

          {loadingCases ? (
            <div className="py-10 text-sm text-[var(--muted)]">Đang tải danh sách hòm...</div>
          ) : cases.length === 0 ? (
            <div className="py-10 text-sm text-[var(--muted)]">Chưa có hòm nào trong cơ sở dữ liệu.</div>
          ) : (
            <div className="border border-[var(--line)] rounded-[var(--radius)] bg-[var(--panel)] overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--line)] text-xs text-[var(--muted)] uppercase font-medium">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={cases.length > 0 && selectedCaseIds.length === cases.length}
                        ref={(el) => {
                          if (el) el.indeterminate = selectedCaseIds.length > 0 && selectedCaseIds.length < cases.length;
                        }}
                        onChange={handleSelectAllCases}
                        className="w-4 h-4 rounded-[var(--radius)] cursor-pointer accent-[var(--gold)]"
                        title="Chọn tất cả hòm"
                      />
                    </th>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Ảnh</th>
                    <th className="py-2.5 px-3">Tên hòm</th>
                    <th className="py-2.5 px-3">Số món</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {cases.map((item) => {
                    const isSelected = selectedCaseIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[var(--gold)]/10' : 'hover:bg-[var(--bg)]/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectCase(item.id)}
                            className="w-4 h-4 rounded-[var(--radius)] cursor-pointer accent-[var(--gold)]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[var(--muted)] font-mono">#{item.id}</td>
                        <td className="py-2.5 px-3">
                          <div className="w-10 h-10 rounded-[var(--radius)] overflow-hidden bg-[var(--bg)] border border-[var(--line)]">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                                đĩa
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[var(--text)]">{item.name}</div>
                          <div className="text-xs text-[var(--muted)] line-clamp-1">{item.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[var(--text)]">
                          {item.recipeCount} món
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleCaseStatus(item.id)}
                            className="text-xs underline text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                          >
                            {item.isActive ? 'Đang mở' : 'Tạm khóa'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCase(item.id)}
                            className="text-xs text-[var(--text)] hover:underline cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCase(item.id, item.name)}
                            className="text-xs text-[var(--r4)] hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: RECIPES MANAGEMENT ================= */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold font-['Barlow_Condensed',sans-serif] text-[var(--text)]">
              Danh sách món ăn
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedRecipeIds.length > 0 && (
                <button
                  type="button"
                  disabled={isBatchDeletingRecipes}
                  onClick={handleBatchDeleteRecipes}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 rounded-[var(--radius)] cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <span>🗑️</span>
                  <span>{isBatchDeletingRecipes ? 'Đang xóa...' : `Xóa ${selectedRecipeIds.length} món đã chọn`}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(true)}
                className="btn-secondary text-xs font-semibold py-1.5 px-3 cursor-pointer flex items-center gap-1.5"
              >
                <span>📊</span>
                <span>Nhập từ Excel</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateRecipe}
                className="btn-gold text-xs font-semibold py-1.5 px-3 cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Thêm món mới</span>
              </button>
            </div>
          </div>

          {/* Banner thông báo số lượng món ăn được chọn */}
          {selectedRecipeIds.length > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-red-950/30 border border-red-500/30 rounded-[var(--radius)] text-xs animate-fade-in">
              <span className="text-[var(--text)]">
                Đã chọn <strong className="text-[var(--gold)]">{selectedRecipeIds.length}</strong> / {recipes.length} món ăn
              </span>
              <button
                type="button"
                onClick={() => setSelectedRecipeIds([])}
                className="text-[var(--muted)] hover:text-[var(--text)] underline cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          )}

          {loadingRecipes ? (
            <div className="py-10 text-sm text-[var(--muted)]">Đang tải danh sách món ăn...</div>
          ) : recipes.length === 0 ? (
            <div className="py-10 text-sm text-[var(--muted)]">Chưa có món ăn nào trong cơ sở dữ liệu.</div>
          ) : (
            <div className="border border-[var(--line)] rounded-[var(--radius)] bg-[var(--panel)] overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--line)] text-xs text-[var(--muted)] uppercase font-medium">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={recipes.length > 0 && selectedRecipeIds.length === recipes.length}
                        ref={(el) => {
                          if (el) el.indeterminate = selectedRecipeIds.length > 0 && selectedRecipeIds.length < recipes.length;
                        }}
                        onChange={handleSelectAllRecipes}
                        className="w-4 h-4 rounded-[var(--radius)] cursor-pointer accent-[var(--gold)]"
                        title="Chọn tất cả món ăn"
                      />
                    </th>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Ảnh</th>
                    <th className="py-2.5 px-3">Tên món</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Chi phí</th>
                    <th className="py-2.5 px-3">Độ khó</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {recipes.map((r) => {
                    const isSelected = selectedRecipeIds.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[var(--gold)]/10' : 'hover:bg-[var(--bg)]/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRecipe(r.id)}
                            className="w-4 h-4 rounded-[var(--radius)] cursor-pointer accent-[var(--gold)]"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[var(--muted)] font-mono">#{r.id}</td>
                        <td className="py-2.5 px-3">
                          <div className="w-10 h-10 rounded-[var(--radius)] overflow-hidden bg-[var(--bg)] border border-[var(--line)]">
                            {r.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                                đĩa
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[var(--text)]">{r.name}</div>
                          <div className="text-xs text-[var(--muted)] line-clamp-1">{r.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[var(--muted)]">{r.cookingTimeMinutes} phút</td>
                        <td className="py-2.5 px-3 text-xs text-[var(--muted)]">
                          {r.estimatedCost ? `${Math.round(r.estimatedCost / 1000)}k` : 'Bình dân'}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[var(--text)]">{r.difficulty}</td>
                        <td className="py-2.5 px-3 text-right space-x-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRecipe(r.id)}
                            className="text-xs text-[var(--text)] hover:underline cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecipe(r.id, r.name)}
                            className="text-xs text-[var(--r4)] hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT CASE ================= */}
      {editingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-4 sm:p-6 my-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-bold font-['Barlow_Condensed',sans-serif] text-xl text-[var(--text)]">
                {editingCase.id ? 'Chỉnh sửa hòm' : 'Tạo hòm mới'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCase(null)}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCase} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Tên hòm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Món ngon cuối tuần"
                  value={editingCase.form.name}
                  onChange={(e) =>
                    setEditingCase({
                      ...editingCase,
                      form: { ...editingCase.form, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phong cách các món trong hòm..."
                  value={editingCase.form.description}
                  onChange={(e) =>
                    setEditingCase({
                      ...editingCase,
                      form: { ...editingCase.form, description: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Link ảnh hòm</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={editingCase.form.imageUrl || ''}
                    onChange={(e) =>
                      setEditingCase({
                        ...editingCase,
                        form: { ...editingCase.form, imageUrl: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="caseIsActive"
                    checked={editingCase.form.isActive}
                    onChange={(e) =>
                      setEditingCase({
                        ...editingCase,
                        form: { ...editingCase.form, isActive: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded-[var(--radius)]"
                  />
                  <label htmlFor="caseIsActive" className="text-xs text-[var(--text)] cursor-pointer">
                    Kích hoạt hòm (cho phép mở)
                  </label>
                </div>
              </div>

              {/* Danh sách món ăn trong hòm */}
              <div className="border-t border-[var(--line)] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--muted)]">
                    Món ăn trong hòm ({editingCase.form.recipes.length})
                  </label>
                  <span className="text-[11px] text-[var(--muted)]">Trọng số càng cao, tỷ lệ rơi càng lớn</span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {recipes.map((r) => {
                    const existing = editingCase.form.recipes.find((item) => item.recipeId === r.id);
                    const isSelected = !!existing;

                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-xs"
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingCase({
                                  ...editingCase,
                                  form: {
                                    ...editingCase.form,
                                    recipes: [...editingCase.form.recipes, { recipeId: r.id, weight: 3 }],
                                  },
                                });
                              } else {
                                setEditingCase({
                                  ...editingCase,
                                  form: {
                                    ...editingCase.form,
                                    recipes: editingCase.form.recipes.filter((item) => item.recipeId !== r.id),
                                  },
                                });
                              }
                            }}
                            className="w-3.5 h-3.5"
                          />
                          <span className="text-[var(--text)]">{r.name}</span>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[var(--muted)]">Trọng số:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={existing?.weight || 1}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setEditingCase({
                                  ...editingCase,
                                  form: {
                                    ...editingCase.form,
                                    recipes: editingCase.form.recipes.map((item) =>
                                      item.recipeId === r.id ? { ...item, weight: val } : item
                                    ),
                                  },
                                });
                              }}
                              className="w-14 px-1.5 py-0.5 rounded-[var(--radius)] bg-[var(--panel)] border border-[var(--line)] text-center text-[var(--text)]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="btn-secondary text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs font-semibold py-1.5 px-4 cursor-pointer"
                >
                  Lưu hòm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT RECIPE ================= */}
      {editingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-4 sm:p-6 my-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-bold font-['Barlow_Condensed',sans-serif] text-xl text-[var(--text)]">
                {editingRecipe.id ? 'Chỉnh sửa món ăn' : 'Tạo món ăn mới'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecipe(null)}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Tên món ăn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Bò kho tiêu xanh"
                    value={editingRecipe.form.name}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        form: { ...editingRecipe.form, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Link ảnh món</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={editingRecipe.form.imageUrl || ''}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        form: { ...editingRecipe.form, imageUrl: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả hương vị món ăn..."
                  value={editingRecipe.form.description}
                  onChange={(e) =>
                    setEditingRecipe({
                      ...editingRecipe,
                      form: { ...editingRecipe.form, description: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingRecipe.form.cookingTimeMinutes}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        form: {
                          ...editingRecipe.form,
                          cookingTimeMinutes: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Chi phí (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editingRecipe.form.estimatedCost || 0}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        form: {
                          ...editingRecipe.form,
                          estimatedCost: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Độ khó</label>
                  <select
                    value={editingRecipe.form.difficulty}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        form: { ...editingRecipe.form, difficulty: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                  >
                    <option value="Easy">Easy (Dễ)</option>
                    <option value="Medium">Medium (Vừa)</option>
                    <option value="Hard">Hard (Khó)</option>
                  </select>
                </div>
              </div>

              {/* Nguyên liệu */}
              <div className="border-t border-[var(--line)] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--muted)]">
                    Danh sách nguyên liệu ({editingRecipe.form.ingredients.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingRecipe({
                        ...editingRecipe,
                        form: {
                          ...editingRecipe.form,
                          ingredients: [
                            ...editingRecipe.form.ingredients,
                            { name: '', quantity: 1, unit: 'g' },
                          ],
                        },
                      })
                    }
                    className="text-xs text-[var(--gold)] hover:underline cursor-pointer"
                  >
                    + Thêm nguyên liệu
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {editingRecipe.form.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tên nguyên liệu"
                        value={ing.name}
                        onChange={(e) => {
                          const updated = [...editingRecipe.form.ingredients];
                          updated[idx].name = e.target.value;
                          setEditingRecipe({
                            ...editingRecipe,
                            form: { ...editingRecipe.form, ingredients: updated },
                          });
                        }}
                        className="flex-1 px-2.5 py-1 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--text)]"
                      />
                      <input
                        type="number"
                        step={0.1}
                        min={0.1}
                        placeholder="SL"
                        value={ing.quantity}
                        onChange={(e) => {
                          const updated = [...editingRecipe.form.ingredients];
                          updated[idx].quantity = parseFloat(e.target.value) || 1;
                          setEditingRecipe({
                            ...editingRecipe,
                            form: { ...editingRecipe.form, ingredients: updated },
                          });
                        }}
                        className="w-16 px-2 py-1 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--text)]"
                      />
                      <input
                        type="text"
                        placeholder="Đơn vị"
                        value={ing.unit}
                        onChange={(e) => {
                          const updated = [...editingRecipe.form.ingredients];
                          updated[idx].unit = e.target.value;
                          setEditingRecipe({
                            ...editingRecipe,
                            form: { ...editingRecipe.form, ingredients: updated },
                          });
                        }}
                        className="w-20 px-2 py-1 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-xs text-[var(--text)]"
                      />
                      {editingRecipe.form.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingRecipe.form.ingredients.filter((_, i) => i !== idx);
                            setEditingRecipe({
                              ...editingRecipe,
                              form: { ...editingRecipe.form, ingredients: updated },
                            });
                          }}
                          className="text-xs text-[var(--muted)] hover:text-[var(--r4)] px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hướng dẫn */}
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  Hướng dẫn nấu chi tiết
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Sơ chế...&#10;2. Ướp gia vị...&#10;3. Nấu..."
                  value={editingRecipe.form.instructions}
                  onChange={(e) =>
                    setEditingRecipe({
                      ...editingRecipe,
                      form: { ...editingRecipe.form, instructions: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] text-[var(--text)] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setEditingRecipe(null)}
                  className="btn-secondary text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs font-semibold py-1.5 px-4 cursor-pointer"
                >
                  Lưu món ăn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: IMPORT EXCEL RECIPES ================= */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={(result) => {
          showFeedback(
            'success',
            `Đã nhập thành công! Thêm ${result.importedCount} món mới, cập nhật ${result.updatedCount} món.`
          );
          loadRecipes();
        }}
      />
    </div>
  );
}
