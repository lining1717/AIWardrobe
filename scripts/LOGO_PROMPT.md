# AI 智能衣柜 Logo 生图 Prompt

## 使用步骤

1. 打开 ChatGPT / Midjourney / DALL-E / Google AI Studio / FLUX 等任一生图模型。
2. 复制下面的英文 Prompt（推荐）或中文 Prompt 粘贴生成。
3. **要求**：1024×1024 或更大尺寸、方形、PNG 格式、纯图标不要圆角（iOS 会自动圆角裁切）。
4. 下载生成的图，覆盖保存到：

   ```
   frontend/public/icons/logo-512.png
   ```

5. 告诉我「已替换」，我会运行 `python3 scripts/generate_icons_from_source.py`
   自动生成所有尺寸（apple-touch-icon 180 / pwa-192 / pwa-512 / favicon-32 / favicon.ico）。

---

## Prompt（英文，推荐用于 Midjourney / DALL-E / FLUX）

```
App icon logo design for AI wardrobe fashion application. Style: minimalist,
elegant, soft, warm, premium flat design. Main subject: a refined wooden
clothing hanger silhouette centered, clean modern lines, deep brown #5A412D.
Background: soft radial gradient from warm cream #F8F2E8 at center to
champagne gold #D4B896 at edges. Behind hanger: subtle delicate golden glow
halo symbolizing AI intelligence. Color palette: warm cream, champagne gold,
beige, deep brown. No text, no letters, no typography, no watermark. iOS app
icon style, centered composition, premium brand identity aesthetic, vector-like
quality, sophisticated, high quality.
```

### Midjourney 推荐参数

```
--ar 1:1 --style raw --v 6
```

### Stable Diffusion / FLUX Negative Prompt

```
text, watermark, signature, complex, busy, rainbow gradient, neon colors,
dark theme, multiple objects, photography, 3d render, photorealistic
```

---

## Prompt（中文，用于 ChatGPT / 豆包 / 通义千问等中文生图模型）

```
AI 智能衣柜 App 图标 logo。设计风格：极简、优雅、柔和、温暖的高级扁平化设计。
主体：一个精致的木质衣架轮廓居中，简洁现代的线条，深棕色 #5A412D。
背景：柔和径向渐变，从中心暖白色 #F8F2E8 渐变到边缘香槟金色 #D4B896。
衣架后方：细腻的金色光晕效果，象征 AI 智能感。
整体配色：暖白、香槟金、米色、深棕色。
不要文字、不要字母、不要水印、不要签名。
iOS App 图标风格，居中构图，高级品牌设计感，矢量级质感，正方形。
```

---

## 设计要点说明

| 元素 | 规格 |
|---|---|
| 主体 | 衣架（hanger）轮廓，居中 |
| 风格 | 极简扁平化，无阴影或柔和阴影 |
| 背景渐变 | 中心 `#F8F2E8` → 边缘 `#D4B896` |
| 衣架颜色 | `#5A412D` 深棕色 |
| 光晕 | 衣架后方柔和金色光晕 |
| 文字 | ❌ 不要任何文字/字母/水印 |
| 形状 | 正方形，不要圆角（iOS 自动裁圆角） |
| 安全区 | 主体居中，留 10% 边距 |

## 替代方案

如生图效果不理想，也可考虑：
- 让生图模型生成「衣架 + AI 光晕」但用不同视角（侧视、3D）
- 改用「字母 W + AI 光点」方案（W 代表 Wardrobe）
- 改用「连衣裙剪影 + 香槟金」方案

如更换设计方向，告诉我新方向，我会更新本 prompt 文档。
