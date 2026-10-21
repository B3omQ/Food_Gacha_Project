'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CreateOrUpdateRecipeDto, RecipeIngredientInput } from '@/types/recipe';
import { BatchImportResult, recipeService } from '@/services/recipe-service';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BatchImportResult) => void;
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRecipes, setParsedRecipes] = useState<CreateOrUpdateRecipeDto[]>([]);
  const [invalidCount, setInvalidCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Tải file Excel mẫu
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Tên món': 'Phở bò tái lăn',
        'Mô tả': 'Phở bò Hà Nội thơm lừng, thịt bò xào lăn đậm đà',
        'Thời gian (phút)': 45,
        'Chi phí (VNĐ)': 55000,
        'Độ khó': 'Trung bình',
        'Hướng dẫn': '1. Nấu nước dùng xương. 2. Xào thịt bò với tỏi và gừng. 3. Trụng bánh phở và chan nước dùng.',
        'Link ảnh': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500',
        'Nguyên liệu': 'Bánh phở: 300g, Thịt bò: 200g, Hành tây: 1 củ, Gừng: 20g, Rau thơm: 50g',
      },
      {
        'Tên món': 'Cơm sườn bì chả',
        'Mô tả': 'Cơm tấm sườn nướng mỡ hành đậm vị miền Nam',
        'Thời gian (phút)': 30,
        'Chi phí (VNĐ)': 45000,
        'Độ khó': 'Dễ',
        'Hướng dẫn': '1. Ướp sườn với sả mật ong rồi nướng. 2. Hấp chả trứng. 3. Ăn kèm dưa chua và nước mắm chua ngọt.',
        'Link ảnh': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        'Nguyên liệu': 'Sườn cốt lết: 250g, Cơm tấm: 200g, Bì heo: 50g, Trứng gà: 1 quả, Mỡ hành: 30g',
      },
      {
        'Tên món': 'Canh chua cá lóc',
        'Mô tả': 'Canh chua thanh ngọt, chuẩn vị gia đình Nam Bộ',
        'Thời gian (phút)': 25,
        'Chi phí (VNĐ)': 40000,
        'Độ khó': 'Dễ',
        'Hướng dẫn': '1. Đun sôi nước me. 2. Cho cá lóc vào nấu chín. 3. Thêm bạc hà, dứa, cà chua, giá đỗ và ngò gai.',
        'Link ảnh': '',
        'Nguyên liệu': 'Cá lóc: 300g, Bạc hà: 100g, Cà chua: 2 quả, Dứa: 0.25 quả, Me: 30g, Ngò gai: 20g',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Đặt độ rộng cột cho đẹp
    ws['!cols'] = [
      { wch: 20 }, // Tên món
      { wch: 35 }, // Mô tả
      { wch: 18 }, // Thời gian
      { wch: 15 }, // Chi phí
      { wch: 12 }, // Độ khó
      { wch: 40 }, // Hướng dẫn
      { wch: 35 }, // Link ảnh
      { wch: 45 }, // Nguyên liệu
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Mon_An');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Mon_An.xlsx');
  };

  // Helper tìm giá trị cell theo nhiều tên cột (hỗ trợ cả tiếng Việt và tiếng Anh)
  const getField = (row: Record<string, unknown>, keys: string[]): string => {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase();
      if (keys.some((k) => cleanKey === k || cleanKey.includes(k))) {
        const val = row[key];
        return val !== undefined && val !== null ? String(val).trim() : '';
      }
    }
    return '';
  };

  // Helper bóc tách nguyên liệu từ chuỗi (hỗ trợ nhiều format)
  // Ví dụ: "Thịt bò: 300g, Hành tây: 1 củ" hoặc "Thịt bò (300g); Hành tây: 1: củ"
  const parseIngredients = (raw: string): RecipeIngredientInput[] => {
    if (!raw || !raw.trim()) return [];

    const items = raw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    const result: RecipeIngredientInput[] = [];

    for (const item of items) {
      // Format 1: "Tên: Số: Đơn vị" (VD: "Thịt bò: 300: g")
      const tripleParts = item.split(':').map((s) => s.trim());
      if (tripleParts.length === 3) {
        const qty = parseFloat(tripleParts[1]) || 1;
        result.push({
          name: tripleParts[0],
          quantity: qty,
          unit: tripleParts[2] || 'phần',
        });
        continue;
      }

      // Format 2: "Tên: 300g" hoặc "Tên - 300g"
      let namePart = '';
      let qtyUnitPart = '';

      if (item.includes(':')) {
        const parts = item.split(':').map((s) => s.trim());
        namePart = parts[0];
        qtyUnitPart = parts.slice(1).join(':').trim();
      } else if (item.includes('(') && item.includes(')')) {
        // Format 3: "Tên (300g)"
        const match = item.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          namePart = match[1].trim();
          qtyUnitPart = match[2].trim();
        }
      } else {
        namePart = item;
      }

      if (qtyUnitPart) {
        // Tách số và đơn vị (VD: "300g" -> 300 & "g", "1.5 kg" -> 1.5 & "kg", "1 củ" -> 1 & "củ")
        const qtyMatch = qtyUnitPart.match(/^([\d.,]+)\s*(.*)$/);
        if (qtyMatch) {
          const qty = parseFloat(qtyMatch[1].replace(',', '.')) || 1;
          const unit = qtyMatch[2].trim() || 'phần';
          result.push({ name: namePart, quantity: qty, unit });
          continue;
        }
      }

      // Mặc định nếu không có số lượng
      result.push({
        name: namePart,
        quantity: 1,
        unit: 'phần',
      });
    }

    return result;
  };

  // Đọc file Excel / CSV khi người dùng chọn
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setErrorMsg('File Excel không có sheet nào hợp lệ.');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (!rows || rows.length === 0) {
          setErrorMsg('File Excel không có dữ liệu.');
          return;
        }

        const parsed: CreateOrUpdateRecipeDto[] = [];
        let invalid = 0;

        for (const row of rows) {
          const name = getField(row, ['tên món', 'tên món ăn', 'tên', 'name', 'recipe']);
          if (!name) {
            invalid++;
            continue;
          }

          const description = getField(row, ['mô tả', 'description', 'desc']);
          const timeRaw = getField(row, ['thời gian', 'time', 'cookingtime', 'phút']);
          const costRaw = getField(row, ['chi phí', 'giá', 'cost', 'price', 'vnđ']);
          const diffRaw = getField(row, ['độ khó', 'difficulty']);
          const instructions = getField(row, ['hướng dẫn', 'công thức', 'instructions', 'cách làm']);
          const imageUrl = getField(row, ['link ảnh', 'ảnh', 'hình ảnh', 'image', 'imageurl', 'photo']);
          const ingredientsRaw = getField(row, ['nguyên liệu', 'thành phần', 'ingredients']);

          // Chuẩn hóa độ khó
          let difficulty = 'Medium';
          const lowerDiff = diffRaw.toLowerCase();
          if (lowerDiff.includes('dễ') || lowerDiff.includes('easy')) difficulty = 'Easy';
          else if (lowerDiff.includes('khó') || lowerDiff.includes('hard')) difficulty = 'Hard';

          parsed.push({
            name,
            description,
            imageUrl: imageUrl || undefined,
            cookingTimeMinutes: parseInt(timeRaw) || 20,
            estimatedCost: parseFloat(costRaw) || 30000,
            difficulty,
            instructions: instructions || 'Đang cập nhật hướng dẫn nấu.',
            ingredients: parseIngredients(ingredientsRaw),
          });
        }

        setParsedRecipes(parsed);
        setInvalidCount(invalid);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi đọc file Excel.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Xác nhận nhập dữ liệu vào Backend
  const handleConfirmImport = async () => {
    if (parsedRecipes.length === 0) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await recipeService.batchImportRecipes(parsedRecipes);
      onSuccess(res);
      handleReset();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi nhập dữ liệu vào hệ thống.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFileName('');
    setParsedRecipes([]);
    setInvalidCount(0);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[var(--panel)] border border-[var(--line)] rounded-[var(--radius)] p-5 sm:p-6 my-8 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="font-bold font-['Barlow_Condensed',sans-serif] text-xl text-[var(--text)]">
              Nhập danh sách món ăn từ Excel
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Hướng dẫn & Tải mẫu */}
        <div className="p-3 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-[var(--muted)] space-y-1">
            <p>
              Hỗ trợ file định dạng <span className="text-[var(--text)] font-semibold">.xlsx, .xls, .csv</span>.
            </p>
            <p className="text-[11px]">
              Cột nguyên liệu viết theo dạng: <code className="text-[var(--gold)]">Thịt bò: 300g, Hành tây: 1 củ</code>
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="btn-secondary text-xs shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-3"
          >
            <span>📥</span>
            <span>Tải file Excel mẫu</span>
          </button>
        </div>

        {/* Khu vực chọn file */}
        {parsedRecipes.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--line)] hover:border-[var(--gold)] rounded-[var(--radius)] p-8 text-center cursor-pointer transition-colors bg-[var(--bg)]/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="text-3xl mb-2">📁</div>
            <p className="font-semibold text-sm text-[var(--text)]">Bấm vào đây để chọn file Excel hoặc CSV</p>
            <p className="text-xs text-[var(--muted)] mt-1">Kéo thả file vào đây hoặc tải file mẫu ở trên để xem định dạng</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Thanh trạng thái file đã đọc */}
            <div className="flex items-center justify-between bg-[var(--bg)] p-2.5 rounded-[var(--radius)] border border-[var(--line)] text-xs">
              <div className="flex items-center gap-2 text-[var(--text)]">
                <span>📄</span>
                <span className="font-semibold">{fileName}</span>
                <span className="text-[var(--muted)]">
                  (Đã đọc: <strong className="text-[var(--gold)]">{parsedRecipes.length}</strong> món hợp lệ
                  {invalidCount > 0 && <span className="text-[var(--r4)] ml-1">, {invalidCount} dòng lỗi bỏ qua</span>})
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] underline cursor-pointer"
              >
                Chọn file khác
              </button>
            </div>

            {/* Bảng xem trước dữ liệu */}
            <div className="border border-[var(--line)] rounded-[var(--radius)] bg-[var(--bg)] max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--line)] bg-[var(--panel)] text-[var(--muted)] sticky top-0 uppercase">
                  <tr>
                    <th className="py-2 px-3">STT</th>
                    <th className="py-2 px-3">Tên món ăn</th>
                    <th className="py-2 px-3">Thời gian</th>
                    <th className="py-2 px-3">Chi phí</th>
                    <th className="py-2 px-3">Độ khó</th>
                    <th className="py-2 px-3">Số nguyên liệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {parsedRecipes.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[var(--panel)]/50">
                      <td className="py-2 px-3 text-[var(--muted)]">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-[var(--text)]">{r.name}</td>
                      <td className="py-2 px-3 text-[var(--muted)]">{r.cookingTimeMinutes}p</td>
                      <td className="py-2 px-3 text-[var(--muted)]">
                        {r.estimatedCost ? `${r.estimatedCost.toLocaleString()} đ` : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            r.difficulty === 'Easy'
                              ? 'bg-green-500/10 text-green-400'
                              : r.difficulty === 'Hard'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}
                        >
                          {r.difficulty}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[var(--muted)]">
                        {r.ingredients && r.ingredients.length > 0 ? (
                          <span>
                            {r.ingredients.length} món (
                            {r.ingredients
                              .slice(0, 2)
                              .map((i) => i.name)
                              .join(', ')}
                            {r.ingredients.length > 2 && '...'})
                          </span>
                        ) : (
                          <span className="text-[var(--muted)] italic">Chưa có</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-2.5 rounded-[var(--radius)] bg-red-950/40 border border-red-500/40 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Đóng
          </button>
          {parsedRecipes.length > 0 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmImport}
              className="btn-gold text-xs font-semibold py-1.5 px-4 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Đang nhập dữ liệu...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Xác nhận nhập ({parsedRecipes.length} món)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
