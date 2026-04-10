#!/bin/bash

# AI 智能衣柜 - 启动脚本

echo "🚀 启动 AI 智能衣柜..."

echo "ℹ️  首次使用可在前端设置页可视化填写 API 配置（无需先复制 .env）"

# 启动后端
echo "📦 启动后端服务 (FastAPI)..."
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端服务 (React)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务已启动："
echo "   - 后端 API: http://localhost:8000"
echo "   - 后端文档: http://localhost:8000/docs"
echo "   - 前端界面: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
