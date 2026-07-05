"""
AI 智能衣柜 Logo 生成器

设计意图：
- 主体：极简衣架轮廓（正视图，扁平化）
- 背景：径向渐变（中心暖白 → 边缘香槟金）
- 主体后方：柔和金色光晕，象征 AI 智能
- 风格：优雅、柔和、简约、温暖，符合用户偏好与现有 UI 调性
- 不含文字

输出：
- logo-512.png（512×512，源图）
- apple-touch-icon.png（180×180，iOS 主屏）
- pwa-192.png（192×192，PWA）
- pwa-512.png（512×512，PWA）
- favicon-32.png（32×32，浏览器标签）
- favicon.ico（多尺寸 ICO，兼容老浏览器）
- favicon.svg（矢量版，现代浏览器优先使用）
"""

from pathlib import Path
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# 输出目录：frontend/public/icons
OUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "icons"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 颜色调色板（与现有 UI 一致：champagne + 暖米色）
COLOR_BG_CENTER = (248, 242, 232)   # 中心暖白 #F8F2E8
COLOR_BG_EDGE = (212, 184, 150)    # 边缘香槟金 #D4B896
COLOR_GLOW = (228, 200, 158)       # 光晕金 #E4C89E
COLOR_GLOW_CORE = (245, 230, 205)  # 光晕核心 #F5E6CD
COLOR_HANGER = (90, 65, 45)        # 衣架深棕 #5A412D
COLOR_HANGER_DARK = (60, 42, 28)   # 衣架阴影 #3C2A1C
COLOR_HOOK = (110, 80, 55)          # 钩子中棕 #6E5037


def make_radial_gradient(size: int, center_color, edge_color) -> Image.Image:
    """生成径向渐变背景：中心 center_color → 边缘 edge_color"""
    # 用 numpy 计算每个像素到中心的距离，归一化后做线性插值
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    cx = cy = (size - 1) / 2.0
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    # 距离归一化到 [0, 1]，最远到角落
    max_dist = math.sqrt(2) * (size / 2.0)
    t = np.clip(dist / max_dist, 0, 1)
    # 用 ease-in-out 缓和过渡
    t = t * t * (3 - 2 * t)

    c0 = np.array(center_color, dtype=np.float32)
    c1 = np.array(edge_color, dtype=np.float32)
    rgb = c0 * (1 - t[..., None]) + c1 * t[..., None]
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)

    img = Image.fromarray(rgb, mode="RGB")
    return img


def make_glow(size: int, radius_ratio: float, color) -> Image.Image:
    """生成一个柔和的金色光晕圆（径向渐变 + 高斯模糊）"""
    radius = size * radius_ratio
    # 在透明图层上画一个实心圆，再径向羽化
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # 用 numpy 生成径向 alpha 通道：中心不透明，边缘透明
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    cx = cy = (size - 1) / 2.0
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    # 中心实心 → 外围渐隐
    alpha = np.clip(1 - (dist / radius), 0, 1)
    # 平滑过渡（平滑曲线）
    alpha = alpha ** 1.5
    alpha = (alpha * 255).astype(np.uint8)

    rgb = np.zeros((size, size, 3), dtype=np.uint8)
    rgb[:] = color
    rgba = np.dstack([rgb, alpha])
    glow_img = Image.fromarray(rgba, mode="RGBA")
    # 高斯模糊增加柔和感
    return glow_img.filter(ImageFilter.GaussianBlur(radius=size * 0.04))


def draw_hanger(canvas: ImageDraw.ImageDraw, size: int):
    """
    在画布中心绘制极简衣架轮廓。
    衣架正视图：顶部钩子 + 倒 V 形主体 + 底部横杆
    """
    cx = size / 2.0
    top_y = size * 0.18       # 钩子顶部
    hook_bottom_y = size * 0.28  # 钩子底部 / 主杆起点
    side_y = size * 0.42       # V 形左右端点 Y
    bottom_y = size * 0.74    # 底部横杆 Y

    half_w = size * 0.30      # 底部横杆半宽
    hook_r = size * 0.028     # 钩子环半径
    line_w = max(3, int(size * 0.020))

    # === 钩子（顶部圆环 + 短直线） ===
    hook_cx = cx
    hook_cy = top_y + hook_r
    # 顶部小圆环（带开口）
    canvas.ellipse(
        [
            hook_cx - hook_r, hook_cy - hook_r,
            hook_cx + hook_r, hook_cy + hook_r
        ],
        outline=COLOR_HOOK, width=line_w
    )
    # 钩子下方短直线（连接到 V 形顶点）
    canvas.line(
        [(cx, hook_cy + hook_r), (cx, hook_bottom_y)],
        fill=COLOR_HANGER, width=line_w
    )

    # === 主杆：倒 V 形（从 cx,hook_bottom_y 分别到左右端点） ===
    left_pt = (cx - half_w * 0.95, side_y)
    right_pt = (cx + half_w * 0.95, side_y)
    canvas.line(
        [(cx, hook_bottom_y), left_pt],
        fill=COLOR_HANGER, width=line_w
    )
    canvas.line(
        [(cx, hook_bottom_y), right_pt],
        fill=COLOR_HANGER, width=line_w
    )

    # === 底部横杆 ===
    # 主横杆：粗实线 + 圆头端点
    bar_left = (cx - half_w, bottom_y)
    bar_right = (cx + half_w, bottom_y)
    canvas.line([bar_left, bar_right], fill=COLOR_HANGER, width=line_w + 1)

    # 横杆两端的小圆球（端点装饰）
    end_r = line_w * 0.7
    canvas.ellipse(
        [bar_left[0] - end_r, bar_left[1] - end_r,
         bar_left[0] + end_r, bar_left[1] + end_r],
        fill=COLOR_HANGER
    )
    canvas.ellipse(
        [bar_right[0] - end_r, bar_right[1] - end_r,
         bar_right[0] + end_r, bar_right[1] + end_r],
        fill=COLOR_HANGER
    )

    # === 连接 V 形端点和横杆端点的两条向下斜线（形成衣架三角形主体） ===
    canvas.line(
        [left_pt, (cx - half_w, bottom_y)],
        fill=COLOR_HANGER_DARK, width=line_w
    )
    canvas.line(
        [right_pt, (cx + half_w, bottom_y)],
        fill=COLOR_HANGER_DARK, width=line_w
    )


def render_logo(size: int = 512) -> Image.Image:
    """渲染指定尺寸的 logo"""
    # 1. 径向渐变背景
    bg = make_radial_gradient(size, COLOR_BG_CENTER, COLOR_BG_EDGE).convert("RGBA")

    # 2. 金色光晕（在衣架后方）
    glow = make_glow(size, radius_ratio=0.42, color=COLOR_GLOW)
    glow_core = make_glow(size, radius_ratio=0.22, color=COLOR_GLOW_CORE)
    bg.alpha_composite(glow)
    bg.alpha_composite(glow_core)

    # 3. 衣架主体
    draw = ImageDraw.Draw(bg)
    draw_hanger(draw, size)

    # 4. 轻微整体高斯模糊让边缘更柔和（仅光晕区域，不影响衣架清晰度）
    # 这里不做整体模糊，保持衣架锐利
    return bg.convert("RGB")


def export_pngs(src: Image.Image, sizes):
    """从源图缩放输出多个尺寸 PNG"""
    for size, name in sizes:
        resized = src.resize((size, size), Image.LANCZOS)
        path = OUT_DIR / name
        resized.save(path, format="PNG", optimize=True)
        print(f"  ✓ {name} ({size}×{size}) -> {path}")


def export_ico(src: Image.Image):
    """输出 favicon.ico（多尺寸打包）"""
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    images = [src.resize((s, s), Image.LANCZOS) for s, _ in ico_sizes]
    path = OUT_DIR / "favicon.ico"
    images[0].save(
        path,
        format="ICO",
        sizes=[(s, s) for s, _ in ico_sizes],
        append_images=images[1:]
    )
    print(f"  ✓ favicon.ico (multi-size) -> {path}")


def write_favicon_svg():
    """
    生成矢量版 favicon.svg。
    现代浏览器（包括 Safari 9+）优先使用 SVG favicon，缩放无失真。
    设计与 PNG 版本保持一致：径向渐变 + 光晕 + 极简衣架。
    """
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="AI Wardrobe logo">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#F8F2E8"/>
      <stop offset="100%" stop-color="#D4B896"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F5E6CD" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="#E4C89E" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#E4C89E" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="12" fill="url(#bg)"/>
  <circle cx="32" cy="34" r="22" fill="url(#glow)"/>
  <!-- 衣架钩子 -->
  <circle cx="32" cy="12.5" r="1.8" fill="none" stroke="#6E5037" stroke-width="1.4"/>
  <line x1="32" y1="14.3" x2="32" y2="18" stroke="#5A412D" stroke-width="1.6" stroke-linecap="round"/>
  <!-- 主杆倒 V 形 -->
  <line x1="32" y1="18" x2="20" y2="27" stroke="#5A412D" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="32" y1="18" x2="44" y2="27" stroke="#5A412D" stroke-width="1.6" stroke-linecap="round"/>
  <!-- 底部横杆 -->
  <line x1="19" y1="46" x2="45" y2="46" stroke="#5A412D" stroke-width="2" stroke-linecap="round"/>
  <!-- 三角形主体斜线 -->
  <line x1="20" y1="27" x2="19" y2="46" stroke="#3C2A1C" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="44" y1="27" x2="45" y2="46" stroke="#3C2A1C" stroke-width="1.4" stroke-linecap="round"/>
</svg>
"""
    path = OUT_DIR.parent / "favicon.svg"
    path.write_text(svg, encoding="utf-8")
    print(f"  ✓ favicon.svg -> {path}")


def main():
    print(f"Output dir: {OUT_DIR}")
    print("Rendering 512×512 source logo...")
    src = render_logo(512)
    src_path = OUT_DIR / "logo-512.png"
    src.save(src_path, format="PNG", optimize=True)
    print(f"  ✓ logo-512.png -> {src_path}")

    print("Exporting multi-size PNGs...")
    export_pngs(src, [
        (180, "apple-touch-icon.png"),
        (192, "pwa-192.png"),
        (512, "pwa-512.png"),
        (32, "favicon-32.png"),
    ])

    print("Exporting ICO favicon...")
    export_ico(src)

    print("Writing favicon.svg...")
    write_favicon_svg()

    print("Done.")
    print(f"\nNext: add <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/icons/apple-touch-icon.png\"> to index.html")


if __name__ == "__main__":
    main()
