# Food Case Opener — Project Structure

## 1. Mục tiêu

Web chọn món ăn ngẫu nhiên cho người không biết hôm nay nên nấu gì. Trải nghiệm chính là mở hòm/quay roulette giống cơ chế mở hòm trong CS2.

- **Frontend:** Next.js + TypeScript
- **Backend:** ASP.NET Core Web API (.NET)
- **Database:** PostgreSQL hoặc SQL Server; chọn một loại để bắt đầu
- **ORM:** Entity Framework Core
- **Mục tiêu hiện tại:** Tạo base project chạy được end-to-end, chưa cần triển khai quá phức tạp.
- **Chưa cần:** Microservices, Kafka, Redis, Kubernetes, hệ thống rarity/phần thưởng phức tạp.

## 2. Cấu trúc repository

```text
food-case-opener/
├── frontend/                       # Next.js App Router
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Trang chủ / danh sách hòm
│   │   │   ├── cases/
│   │   │   │   └── [caseId]/
│   │   │   │       └── page.tsx    # Trang mở hòm
│   │   │   ├── recipes/
│   │   │   │   └── [recipeId]/
│   │   │   │       └── page.tsx    # Chi tiết món ăn
│   │   │   ├── history/
│   │   │   │   └── page.tsx        # Lịch sử mở hòm (có thể làm sau)
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── case-opening/
│   │   │   │   ├── CaseCard.tsx
│   │   │   │   ├── Roulette.tsx
│   │   │   │   └── OpeningResult.tsx
│   │   │   ├── recipes/
│   │   │   │   └── RecipeCard.tsx
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   └── api-client.ts       # Cấu hình gọi Backend
│   │   ├── services/
│   │   │   ├── case-service.ts
│   │   │   └── recipe-service.ts
│   │   └── types/
│   │       ├── case.ts
│   │       └── recipe.ts
│   ├── .env.local.example
│   ├── package.json
│   └── Dockerfile                  # Có thể thêm sau
│
├── backend/
│   ├── FoodCaseOpener.sln
│   ├── src/
│   │   └── FoodCaseOpener.Api/
│   │       ├── Controllers/
│   │       │   ├── CasesController.cs
│   │       │   ├── RecipesController.cs
│   │       │   └── HistoryController.cs  # Có thể làm sau
│   │       ├── Data/
│   │       │   ├── AppDbContext.cs
│   │       │   └── SeedData.cs
│   │       ├── Models/
│   │       │   ├── Recipe.cs
│   │       │   ├── Ingredient.cs
│   │       │   ├── RecipeIngredient.cs
│   │       │   ├── FoodCase.cs
│   │       │   ├── CaseRecipe.cs
│   │       │   └── OpeningHistory.cs     # Có thể làm sau
│   │       ├── DTOs/
│   │       ├── Services/
│   │       │   ├── ICaseOpeningService.cs
│   │       │   └── CaseOpeningService.cs
│   │       ├── Program.cs
│   │       ├── appsettings.json
│   │       └── appsettings.Development.json
│   └── tests/                            # Có thể thêm sau
│
├── docs/
│   └── project-structure.md
├── .gitignore
├── .env.example
├── docker-compose.yml                    # Có thể thêm sau
└── README.md
```

Đây là cấu trúc gợi ý, không cần tạo các file/thư mục “có thể làm sau” nếu chưa sử dụng.

## 3. Các model ban đầu

### Recipe

Thông tin món ăn.

- `Id`
- `Name`
- `Description`
- `ImageUrl` (nullable)
- `Instructions`
- `EstimatedCost` (nullable)
- `CookingTimeMinutes`
- `Difficulty` (ví dụ: Easy, Medium, Hard)

### Ingredient

Nguyên liệu dùng chung giữa nhiều món.

- `Id`
- `Name`
- `Unit` (ví dụ: g, ml, quả, muỗng)

### RecipeIngredient

Bảng liên kết món ăn và nguyên liệu.

- `RecipeId`
- `IngredientId`
- `Quantity`

### FoodCase

Một loại hòm, ví dụ “Món Việt”, “Dưới 30 phút”, “Sinh viên tiết kiệm”.

- `Id`
- `Name`
- `Description`
- `ImageUrl` (nullable)
- `IsActive`

### CaseRecipe

Danh sách món thuộc một hòm, có thể cấu hình xác suất tương đối.

- `FoodCaseId`
- `RecipeId`
- `Weight` (số dương; mặc định `1`)

`Weight` là trọng số tương đối, không phải phần trăm. Ví dụ món A có weight 3 và món B có weight 1 thì xác suất tương ứng là 75% và 25%, nếu chỉ có hai món hợp lệ.

### OpeningHistory (giai đoạn sau)

- `Id`
- `FoodCaseId`
- `RecipeId`
- `OpenedAt`

Ở bản đầu tiên có thể chưa lưu lịch sử nếu chưa cần.

## 4. Luồng mở hòm

1. Frontend tải danh sách hòm từ Backend.
2. Người dùng chọn một hòm và bấm **Mở hòm**.
3. Frontend gọi API `POST /api/cases/{caseId}/open`.
4. Backend kiểm tra hòm tồn tại, đang hoạt động và có món hợp lệ.
5. Backend chọn một món ngẫu nhiên theo `Weight` của các món trong hòm.
6. Backend trả về thông tin món đã chọn.
7. Frontend chạy animation roulette và kết thúc tại đúng món Backend trả về.
8. Hiển thị tên món, ảnh, thời gian nấu, chi phí ước tính và nút xem công thức.

**Lưu ý:** Animation chỉ để trình bày. Backend phải là nơi quyết định kết quả cuối cùng; không chọn món độc lập ở Frontend rồi gửi lên Backend.

## 5. API tối thiểu

### Cases

- `GET /api/cases` — lấy danh sách hòm đang hoạt động.
- `GET /api/cases/{caseId}` — lấy chi tiết hòm và danh sách món có thể xuất hiện.
- `POST /api/cases/{caseId}/open` — mở hòm và trả về món đã chọn.

### Recipes

- `GET /api/recipes` — lấy danh sách món.
- `GET /api/recipes/{recipeId}` — lấy chi tiết món, bao gồm nguyên liệu và hướng dẫn nấu.

### History (chỉ khi triển khai lịch sử)

- `GET /api/history` — lấy lịch sử mở hòm.

Ví dụ response của `POST /api/cases/{caseId}/open`:

```json
{
  "openingId": 1,
  "caseId": 1,
  "recipe": {
    "id": 12,
    "name": "Thịt rang cháy cạnh",
    "imageUrl": null,
    "cookingTimeMinutes": 25,
    "estimatedCost": 35000
  }
}
```

Điều chỉnh kiểu dữ liệu/response theo code thực tế, nhưng nên giữ response ổn định để Frontend dễ tích hợp.

## 6. Yêu cầu UI/UX ban đầu

- Trang chủ hiển thị các hòm dạng card.
- Trang hòm có nút mở hòm nổi bật.
- Animation roulette chạy mượt, có trạng thái loading và ngăn bấm mở nhiều lần khi request đang xử lý.
- Kết quả cuối cùng phải dừng đúng món do API trả về.
- Có nút “Xem cách nấu” dẫn tới trang chi tiết món.
- Responsive cho desktop và mobile.
- Có trạng thái lỗi khi API không phản hồi hoặc hòm không có món.
- Chưa cần đăng nhập ở MVP.

Có thể dùng Tailwind CSS cho styling và Framer Motion cho animation, nhưng không cần thêm thư viện nếu CSS đáp ứng được.

## 7. Cấu hình và quy ước

- Không commit secret, mật khẩu hoặc connection string dùng thật.
- Frontend đọc URL Backend từ biến môi trường, ví dụ `NEXT_PUBLIC_API_BASE_URL`.
- Backend dùng cấu hình môi trường cho connection string.
- Bật CORS cho origin Frontend trong môi trường development.
- Dùng EF Core migrations để tạo/cập nhật database.
- Có seed data gồm vài hòm và món ăn mẫu để kiểm tra toàn bộ luồng.
- Giữ code đơn giản, dễ đọc; tránh tạo abstraction hoặc design pattern khi chưa có nhu cầu.
- Không thêm authentication, admin dashboard, Redis hay Docker nếu chưa cần cho MVP.

## 8. Hướng dẫn cho coding agent

Hãy thực hiện theo thứ tự sau:

1. Kiểm tra repository hiện tại trước khi thay đổi; nếu đã có code thì giữ lại phần đang hoạt động.
2. Tạo solution ASP.NET Core Web API và ứng dụng Next.js TypeScript theo cấu trúc ở trên.
3. Cấu hình EF Core và một database provider duy nhất. Nếu chưa có lựa chọn, hỏi người dùng; không tự cấu hình đồng thời nhiều provider.
4. Tạo model, quan hệ database, migration và seed data mẫu.
5. Implement các API tối thiểu cho danh sách hòm, chi tiết hòm, mở hòm và chi tiết món.
6. Implement thuật toán chọn ngẫu nhiên theo trọng số ở Backend, kiểm tra trường hợp hòm rỗng hoặc toàn bộ món không hợp lệ.
7. Tạo giao diện trang chủ, trang mở hòm, roulette animation và trang chi tiết món; nối API thật thay vì hard-code kết quả.
8. Viết README với lệnh chạy Frontend/Backend, cách cấu hình database và cách chạy migration.
9. Chạy build/lint/test phù hợp với project, sửa lỗi do thay đổi gây ra và báo cáo chính xác những gì đã chạy thành công.

### Tiêu chí hoàn thành base project

- Frontend và Backend chạy local được.
- Database tạo được và có dữ liệu mẫu.
- Người dùng xem được danh sách hòm.
- Bấm mở hòm sẽ nhận một kết quả do Backend chọn.
- Animation kết thúc đúng món đã nhận từ API.
- Xem được thông tin và hướng dẫn nấu món.
- README hướng dẫn chạy lại từ đầu.
