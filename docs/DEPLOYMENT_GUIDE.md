# Hướng dẫn Deploy: Neon (DB) + Render (Backend) + Vercel (Frontend)

Mô hình triển khai chuẩn cho Food Gacha Project:
1. **Database:** [Neon PostgreSQL](https://neon.tech) (Serverless Postgres miễn phí vĩnh viễn, không hết hạn 30 ngày)
2. **Backend API:** [Render](https://render.com) (Docker Web Service miễn phí, cấu hình cực kỳ dễ dàng qua `render.yaml` hoặc Dashboard)
3. **Frontend:** [Vercel](https://vercel.com) (Next.js 16 SSR/Static hosting tốt nhất)

---

## BƯỚC 1: Tạo Database trên Neon

1. Truy cập [neon.tech](https://console.neon.tech/) và đăng nhập (bằng GitHub hoặc Google).
2. Nhấn **Create Project**:
   - **Project name:** `food-gacha-db`
   - **Postgres version:** 16 hoặc 17
   - **Region:** Chọn `AWS / Singapore (ap-southeast-1)` (gần Việt Nam nhất).
3. Sau khi tạo xong, ở màn hình Dashboard, bạn sẽ thấy mục **Connection Details**:
   - Chọn dropdown: **Connection string**
   - Đảm bảo chọn chế độ **Direct connection** (bỏ tích hoặc không chọn pgBouncer pooler để EF Core Migration chạy mượt mà).
   - Chuỗi kết nối có dạng:
     ```text
     postgresql://neondb_owner:npg_xxxxxx@ep-xxxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - 📌 **Copy và lưu lại chuỗi này**, ta sẽ dùng ở Bước 2.

---

## BƯỚC 2: Deploy Backend (.NET 10) lên Render

### 1. Đẩy code lên GitHub
Mở Terminal tại thư mục dự án và chạy:
```bash
git add .
git commit -m "Configure Dockerfile and render.yaml for Render and Neon deployment"
git push origin main
```

### 2. Deploy trên Render
Bạn có thể chọn 1 trong 2 cách sau:

#### 👉 Cách A: Dùng Blueprint (Nhanh nhất - khuyến nghị)
1. Đăng nhập [dashboard.render.com](https://dashboard.render.com/) bằng GitHub.
2. Bấm nút **New +** -> Chọn **Blueprint**.
3. Chọn repository `Food_Gacha_Project`.
4. Render sẽ đọc file `render.yaml` và hiển thị service `food-case-opener-api`.
5. Ở ô nhập biến `DATABASE_URL`: Dán chuỗi kết nối Neon ở Bước 1 vào.
6. Bấm **Apply**.

#### 👉 Cách B: Tạo Web Service thủ công (Nếu không dùng Blueprint)
1. Bấm **New +** -> Chọn **Web Service**.
2. Chọn **Build and deploy from a Git repository** -> Chọn `Food_Gacha_Project`.
3. Điền thông tin:
   - **Name:** `food-case-opener-api`
   - **Region:** `Singapore`
   - **Language / Runtime:** `Docker`
   - **Dockerfile Path:** `./backend/Dockerfile`
   - **Docker Context:** `./backend`
   - **Instance Type:** `Free`
4. Cuộn xuống phần **Environment Variables**, bấm **Add Environment Variable**:
   - `DATABASE_URL`: Dán chuỗi kết nối Neon ở Bước 1 vào.
   - `ALLOWED_ORIGINS`: `*`
   - `ASPNETCORE_ENVIRONMENT`: `Production`
5. Bấm **Create Web Service**.

### 3. Kiểm tra Backend
- Render sẽ tự động build Docker và khởi động trong khoảng 2-4 phút.
- Xem tab **Logs**, bạn sẽ thấy thông báo:
  ```text
  Database migrated and seeded successfully.
  ```
  *(Backend tự động tạo các bảng và nạp dữ liệu hòm/món ăn vào database Neon)*.
- Copy URL của backend trên Render (dạng `https://food-case-opener-api-xxxx.onrender.com`).
- Thử kiểm tra trên trình duyệt:
  `https://food-case-opener-api-xxxx.onrender.com/api/cases`
  -> Nếu trả về danh sách JSON các hòm là backend đã hoạt động hoàn hảo!

> [!NOTE]
> Gói Free của Render sẽ tự động "ngủ" (spin down) sau 15 phút không có lượt truy cập. Khi có request mới, server sẽ mất khoảng 30-50 giây để khởi động lại (cold start).

---

## BƯỚC 3: Deploy Frontend (Next.js) lên Vercel

1. Truy cập [vercel.com](https://vercel.com/) và đăng nhập bằng GitHub.
2. Nhấn **Add New...** -> **Project**.
3. Chọn repository `Food_Gacha_Project` và nhấn **Import**.
4. Ở màn hình cấu hình project (**Configure Project**):
   - **Root Directory:** Bấm **Edit** và chọn thư mục `frontend` (bắt buộc, vì Next.js nằm trong thư mục `frontend`).
   - **Framework Preset:** Vercel tự nhận diện là **Next.js**.
   - **Build and Output Settings:** Giữ mặc định (`npm run build`).
5. Ở mục **Environment Variables**, mở rộng và thêm biến:
   - **Key:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** Điền URL backend Render từ Bước 2 (lưu ý: **không** có dấu `/` ở cuối):
     ```text
     https://food-case-opener-api-xxxx.onrender.com
     ```
6. Nhấn **Deploy**.
7. Vercel sẽ build chỉ trong 1-2 phút và cấp cho bạn URL chính thức:
   ```text
   https://food-gacha-project.vercel.app
   ```

---

## BƯỚC 4: (Tùy chọn) Khóa CORS trên Render

Sau khi đã có URL Frontend từ Vercel, bạn có thể khóa bảo mật CORS:
1. Vào Dashboard Render -> chọn service `food-case-opener-api` -> tab **Environment**.
2. Đổi giá trị của biến `ALLOWED_ORIGINS` từ `*` thành:
   ```text
   https://food-gacha-project.vercel.app
   ```
3. Bấm **Save Changes**.

---

## Bảng tổng hợp biến môi trường

| Nơi cấu hình | Tên biến | Giá trị mẫu |
|---|---|---|
| **Render (Backend)** | `DATABASE_URL` | `postgresql://neondb_owner:pass@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| **Render (Backend)** | `ALLOWED_ORIGINS` | `*` hoặc `https://food-gacha.vercel.app` |
| **Render (Backend)** | `ASPNETCORE_ENVIRONMENT` | `Production` |
| **Vercel (Frontend)** | `NEXT_PUBLIC_API_BASE_URL` | `https://food-case-opener-api-xxxx.onrender.com` |
