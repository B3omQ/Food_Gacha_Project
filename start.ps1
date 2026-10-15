$rootDir = $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      FOOD CASE OPENER - STARTING SERVICES" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Docker check
Write-Host "[1/3] Kiểm tra Docker PostgreSQL..." -ForegroundColor Yellow
try {
    $dockerCheck = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    - Docker đang chạy. Khởi động PostgreSQL..." -ForegroundColor Green
        docker compose up -d
    } else {
        Write-Host "    - Lưu ý: Docker chưa bật. Bỏ qua nếu dùng PostgreSQL cài ngoài." -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "    - Không tìm thấy Docker CLI." -ForegroundColor DarkYellow
}
Write-Host ""

# 2. Start Backend
Write-Host "[2/3] Khởi động Backend (.NET Web API trên cổng 5000)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$rootDir\backend`" && dotnet run --project src\FoodCaseOpener.Api"
Write-Host "    - Đã mở cửa sổ Backend tại: http://localhost:5000" -ForegroundColor Green
Write-Host ""

# 3. Start Frontend
Write-Host "[3/3] Khởi động Frontend (Next.js trên cổng 3000)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$rootDir\frontend`" && npm run dev"
Write-Host "    - Đã mở cửa sổ Frontend tại: http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Backend và Frontend đang chạy trên 2 cửa sổ riêng biệt!" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Đang mở trình duyệt http://localhost:3000 sau 4 giây..." -ForegroundColor DarkGray
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"
