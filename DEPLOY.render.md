# Render 部署指南

把 AIWardrobe 部署到 Render，获得公网可访问的 HTTPS 地址。

## 前置准备

- [GitHub 账号](https://github.com)
- [Render 账号](https://render.com)（已注册）
- Gemini API Key
- remove.bg API Key

---

## 步骤 1：提交本地改动并推到 GitHub

### 1.1 在 GitHub 创建新仓库

1. 打开 https://github.com/new
2. Repository name 填 `AIWardrobe`（或任意名）
3. **不要**勾选 "Add a README" / "Add .gitignore" / "Add license"（保持空仓库）
4. 点击 **Create repository**

### 1.2 本地提交改动 + 推送

项目根目录执行（注意替换 `YOUR_USERNAME` 和 `YOUR_REPO`）：

```bash
cd "/Users/neallee/Documents/vibe coding/aigithub/AIWardrobe"

# 把原仓库地址改名为 upstream（保留可拉上游更新）
git remote rename origin upstream

# 添加你自己的仓库为 origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 提交本地改动（环境变量支持 + render.yaml + max_tokens 修复）
git add -A
git commit -m "配置 Render 部署：环境变量初始化 + render.yaml + max_tokens 修复"

# 推送到你的仓库
git branch -M main
git push -u origin main
```

---

## 步骤 2：在 Render 创建服务

### 2.1 用 Blueprint 方式部署（推荐）

1. 打开 https://dashboard.render.com
2. 点击右上角 **New** → **Blueprint**
3. 选择你刚推送的 GitHub 仓库 `AIWardrobe`
4. Render 自动识别仓库里的 `render.yaml`，会创建一个名为 `ai-wardrobe` 的 Web Service

### 2.2 配置敏感环境变量

在 Blueprint 创建页面，会看到 `render.yaml` 里标记 `sync: false` 的两个变量需要手动填值：

| Key | Value |
|:---|:---|
| `LLM_API_KEY` | 你的 Gemini API Key |
| `REMOVEBG_API_KEY` | 你的 remove.bg API Key |

> 其他变量（`LLM_API_BASE`、`LLM_MODEL`、`BG_REMOVAL_METHOD`、`DB_FILE_PATH`）已被 `render.yaml` 自动填好。

### 2.3 启动部署

点击 **Apply** / **Create**，Render 开始：

1. 拉取代码
2. 构建 Docker 镜像（前端 build + 后端依赖安装，约 5–10 分钟，免费层较慢）
3. 启动容器
4. 健康检查 `/health` 通过后，服务变为 Live

部署完成后，Render 会给你一个地址，类似：
```
https://ai-wardrobe-xxxx.onrender.com
```

---

## 步骤 3：验证部署

| 验证项 | URL | 期望结果 |
|:---|:---|:---|
| 前端首页 | `https://ai-wardrobe-xxxx.onrender.com/` | 显示 AI 衣橱界面 |
| 健康检查 | `https://ai-wardrobe-xxxx.onrender.com/health` | `{"status":"healthy"}` |
| API 文档 | `https://ai-wardrobe-xxxx.onrender.com/docs` | Swagger UI |
| 上传测试 | 在前端上传衣物图片 | 自动去背景 + AI 识别 |

---

## 常见问题

### Q: 免费层会休眠吗？
A: 会。15 分钟无访问自动休眠，下次访问时唤醒（约 30–60 秒）。升级到 **Starter（$7/月）** 可常驻。

### Q: 数据会丢失吗？
A: 免费层没有持久化磁盘，容器重启后 SQLite 数据库和上传图片会丢失。**API Key 配置不会丢**（从环境变量重新初始化）。
要持久化数据：升级到 Starter plan，并取消 `render.yaml` 里 `disks` 段的注释。

### Q: rembg 内存不足 / 容器崩溃？
A: `render.yaml` 默认用 `removebg`（云端 API），不跑本地 ONNX 推理，内存压力小。如果想用本地 rembg，把环境变量 `BG_REMOVAL_METHOD` 改成 `local`，但建议至少用 Starter plan（1GB+ 内存）。

### Q: Gemini API 访问不通？
A: Render 的 singapore / oregon 节点都能正常访问 Google API。如果部署在国内平台才需要考虑代理。

### Q: 部署失败怎么排查？
A: Render 后台 → 你的服务 → **Logs** 标签查看日志。常见原因：
- 环境变量 `LLM_API_KEY` / `REMOVEBG_API_KEY` 没填
- 构建超时（免费层构建慢，耐心等或多试一次）
- 健康检查失败（启动慢，render.yaml 里 `start_period` 可调大）

### Q: 如何更新代码后重新部署？
A: 只需 `git push` 到你的 GitHub 仓库，Render 会自动触发重新部署（`autoDeploy: true`）。

---

## 升级到持久化部署（可选）

升级到 Starter plan（$7/月）后，取消 `render.yaml` 里 `disks` 注释：

```yaml
disks:
  - name: data
    mountPath: /app/backend/data
    sizeGB: 1
```

这样 SQLite 数据库 + `llm_config.json` 配置都会持久化，容器重启不丢失。

> 注：上传的图片在 `/app/backend/uploads`，如需持久化图片，需额外改代码把 uploads 也存到 data 目录，或接对象存储（如 Cloudflare R2 / AWS S3）。
