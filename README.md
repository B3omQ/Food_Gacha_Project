# 🍲 Food Case Opener — CS2-Style Gacha Cooking Assistant

Ứng dụng web giải quyết câu hỏi muôn thuở **"Hôm nay ăn gì?"** bằng trải nghiệm mở hòm roulette phong cách CS2 (Counter-Strike 2).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Web Audio API (âm thanh tick vòng quay procedural), Canvas Confetti.
- **Backend:** ASP.NET Core Web API (.NET), RESTful Architecture, CORS enabled.
- **Database & ORM:** PostgreSQL với Entity Framework Core (`Npgsql.EntityFrameworkCore.PostgreSQL`).
- **Cơ chế chọn ngẫu nhiên:** Thuật toán Weighted Random Selection tính toán hoàn toàn ở Backend dựa trên trọng số (`Weight`) của từng món ăn.

---

## 📁 Cấu Trúc Dự Án

```text
food-case-opener/
├── frontend/                       # Next.js App Router
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Trang chủ: Danh sách các hòm món ăn
│   │   │   ├── cases/[caseId]/
│   │   │   │   └── page.tsx        # Trang mở hòm Roulette CS2
│   │   │   ├── recipes/
│   │   │   │   ├── page.tsx        # Kho công thức món ăn + tìm kiếm
│   │   │   │   └── [recipeId]/
│   │   │   │       └── page.tsx    # Chi tiết món, nguyên liệu & hướng dẫn nấu
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── case-opening/
│   │   │   │   ├── CaseCard.tsx    # Thẻ hiển thị hòm
│   │   │   │   ├── Roulette.tsx    # Vòng quay Roulette CS2 & âm thanh tick
│   │   │   │   └── OpeningResult.tsx # Modal chúc mừng món trúng & pháo hoa
│   │   │   ├── recipes/
│   │   │   │   └── RecipeCard.tsx  # Thẻ món ăn
│   │   │   └── ui/
│   │   │       └── Navbar.tsx      # Thanh điều hướng glassmorphism
│   │   ├── lib/
│   │   │   └── api-client.ts       # HTTP Client kết nối Backend API
│   │   ├── services/
│   │   │   ├── case-service.ts     # API client service cho Hòm
│   │   │   └── recipe-service.ts   # API client service cho Món ăn
│   │   └── types/
│   │       ├── case.ts
│   │       └── recipe.ts
│   ├── .env.local
│   ├── .env.local.example
│   └── package.json
│
├── backend/
│   ├── FoodCaseOpener.sln
│   └── src/
│       └── FoodCaseOpener.Api/
│           ├── Controllers/
│           │   ├── CasesController.cs      # API danh sách, chi tiết, mở hòm
│           │   └── RecipesController.cs    # API món ăn & chi tiết nguyên liệu
│           ├── Data/
│           │   ├── AppDbContext.cs         # Cấu hình EF Core DbContext
│           │   └── SeedData.cs             # Dữ liệu mẫu (3 hòm + 8 món ăn chuẩn vị)
│           ├── Models/
│           │   ├── FoodCase.cs             # Thực thể Hòm
│           │   ├── Recipe.cs               # Thực thể Món ăn
│           │   ├── Ingredient.cs           # Thực thể Nguyên liệu
│           │   ├── RecipeIngredient.cs     # Quan hệ món ăn - nguyên liệu
│           │   └── CaseRecipe.cs           # Quan hệ hòm - món ăn + trọng số Weight
│           ├── DTOs/
│           │   ├── CaseDtos.cs
│           │   └── RecipeDtos.cs
│           ├── Services/
│           │   ├── ICaseOpeningService.cs
│           │   └── CaseOpeningService.cs   # Thuật toán Weighted Random Selection
│           ├── Migrations/                 # EF Core Migrations đã tạo sẵn
│           ├── Program.cs                  # Cấu hình DI, CORS, Auto-Migration/Seed
│           ├── appsettings.json
│           └── appsettings.Development.json
│
├── docs/
│   └── project-structure.md
├── docker-compose.yml              # Khởi động PostgreSQL nhanh chóng
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ Hướng Dẫn Chạy Dự Án

### Yêu Cầu Cần Có
- **.NET SDK 10** (hoặc 8.0+)
- **Node.js 20+** và **npm**
- **Docker Desktop** (hoặc PostgreSQL cài cục bộ)

### ⚡ Cách Nhanh Nhất (1-Click với file `.bat`)

Chỉ cần click đúp vào file **`start.bat`** (hoặc chạy trong terminal):
```cmd
.\start.bat
```
File này sẽ tự động:
1. Khởi động PostgreSQL qua Docker (nếu Docker Desktop đang bật).
2. Mở cửa sổ chạy Backend .NET Web API trên cổng `5000`.
3. Mở cửa sổ chạy Frontend Next.js trên cổng `3000`.
4. Tự động mở trình duyệt truy cập `http://localhost:3000`.

---

### 🔧 Cách Chạy Thủ Công Từng Phần

#### Bước 1: Khởi động Database PostgreSQL

Nếu dùng Docker, mở terminal tại thư mục gốc của project:
```bash
docker compose up -d
```
Container PostgreSQL sẽ chạy tại cổng `5432` với cấu hình:
- User: `postgres`
- Password: `postgres`
- Database: `food_case_opener`

*(Nếu bạn dùng PostgreSQL có sẵn, hãy cập nhật ConnectionString trong `backend/src/FoodCaseOpener.Api/appsettings.json`)*.

---

### Bước 2: Chạy Backend (.NET Web API)

Di chuyển vào thư mục backend:
```bash
cd backend
dotnet run --project src/FoodCaseOpener.Api
```

- Backend sẽ lắng nghe tại: `http://localhost:5000`
- **Tự động kích hoạt:** Khi khởi động, Backend sẽ tự động áp dụng EF Core Migrations và tự động Seed dữ liệu mẫu (3 hòm món ăn: *Mâm Cơm Mẹ Nấu*, *Cấp Tốc Dưới 20 Phút*, *Sinh Viên Tiết Kiệm* kèm đầy đủ nguyên liệu, định lượng và hướng dẫn nấu).

#### Lệnh Migration thủ công (nếu cần):
```bash
dotnet ef database update --project src/FoodCaseOpener.Api --startup-project src/FoodCaseOpener.Api
```

---

### Bước 3: Chạy Frontend (Next.js)

Mở một cửa sổ terminal mới và di chuyển vào thư mục frontend:
```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

---

## 📡 Danh Sách API Endpoints

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/cases` | Lấy danh sách các hòm món ăn đang hoạt động |
| `GET` | `/api/cases/{caseId}` | Lấy chi tiết hòm và danh sách món ăn + trọng số |
| `POST` | `/api/cases/{caseId}/open` | Mở hòm ngẫu nhiên theo trọng số (Backend tính toán) |
| `GET` | `/api/recipes` | Lấy danh sách tất cả các món ăn |
| `GET` | `/api/recipes/{recipeId}` | Lấy chi tiết món ăn kèm bảng nguyên liệu & hướng dẫn |

### Ví dụ kết quả mở hòm (`POST /api/cases/1/open`):
```json
{
  "openingId": 1,
  "caseId": 1,
  "recipe": {
    "id": 1,
    "name": "Thịt kho tàu nước dừa",
    "description": "Món ăn quốc dân đậm đà...",
    "imageUrl": "https://images.unsplash.com/...",
    "cookingTimeMinutes": 45,
    "estimatedCost": 65000,
    "difficulty": "Medium"
  }
}
```

---

## ✨ Trải Nghiệm Mở Hòm CS2

1. Người dùng chọn một Hòm trên giao diện trang chủ.
2. Bấm nút **"Mở Hòm Ngay"**.
3. Frontend gọi `POST /api/cases/{id}/open` lên Backend.
4. Backend chọn món theo trọng số và gửi kết quả về.
5. Vòng quay Roulette CS2 bắt đầu xoay mượt mà với hiệu ứng âm thanh cơ học tick tick decelerating physics (`cubic-bezier(0.12, 0.8, 0.25, 1)`).
6. Kim chỉ giữa dừng chuẩn xác tại món mà Backend đã quyết định.
7. Hiệu ứng ăn mừng với pháo hoa Confetti và nút dẫn thẳng tới cách nấu chi tiết!
