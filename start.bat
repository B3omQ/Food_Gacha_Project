@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo       FOOD CASE OPENER - STARTING SERVICES
echo ========================================================
echo.

REM 1. Docker check
echo [1/3] Kiem tra Docker PostgreSQL...
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo     - Docker dang chay. Khoi dong PostgreSQL...
    docker compose up -d
) else (
    echo     - Luu y: Docker chua bat. Bo qua buoc nay neu dung Postgres cai ngoai.
)
echo.

REM 2. Backend
echo [2/3] Khoi dong Backend ASP.NET Core tren cong 5000...
start "FoodCaseOpener-Backend" cmd /k "cd /d %~dp0backend && dotnet run --project src\FoodCaseOpener.Api"
echo     - Da mo cua so Backend tai: http://localhost:5000
echo.

REM 3. Frontend
echo [3/3] Khoi dong Frontend Next.js tren cong 3000...
start "FoodCaseOpener-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo     - Da mo cua so Frontend tai: http://localhost:3000
echo.

echo ========================================================
echo   Backend va Frontend dang chay tren 2 cua so rieng biet!
echo ========================================================
echo.
echo Dang mo trinh duyet http://localhost:3000 sau 4 giay...
ping 127.0.0.1 -n 5 >nul
start http://localhost:3000
