@echo off
chcp 65001 >nul
echo 🚀 启动 AI 智能衣柜...

echo ℹ️  首次使用可在前端设置页可视化填写 API 配置（无需先复制 .env）

REM 启动后端
echo 📦 正在启动后端服务 (FastAPI)...
start "AI Wardrobe Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --reload --port 8000"

REM 等待几秒
timeout /t 3 /nobreak >nul

REM 启动前端
echo 🎨 正在启动前端服务 (React)...
start "AI Wardrobe Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ 服务已在很多新窗口中启动：
echo    - 后端 API: http://localhost:8000
echo    - 前端界面: http://localhost:5173
echo.
