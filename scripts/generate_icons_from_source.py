"""
从用户提供的源图自动生成所有尺寸的图标。

使用方法：
1. 用 ChatGPT / Midjourney / DALL-E / Imagen 等生图模型，按 scripts/generate_logo.py
   顶部的 prompt 生成一张 1024×1024 或更大的方形 PNG。
2. 把生成的图覆盖到 frontend/public/icons/logo-512.png（文件名不必真实反映尺寸）。
3. 运行：python3 scripts/generate_icons_from_source.py
4. 脚本会自动检测源图尺寸，生成所有 PWA / iOS / favicon 所需的尺寸。

源图要求：
- PNG 格式
- 正方形（宽 == 高），否则会按短边居中裁剪
- 至少 512×512；推荐 1024×1024，缩放到小尺寸更清晰
- 内容居中，留出 ~10% 安全区（iOS 主屏会自动圆角裁切外圈）
"""

from pathlib import Path
import sys

from PIL import Image

ICONS_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "icons"
SOURCE_PATH = ICONS_DIR / "logo-512.png"
FAVICON_SVG_PATH = ICONS_DIR.parent / "favicon.svg"

# 所有需要生成的尺寸
TARGETS = [
    (180, "apple-touch-icon.png"),   # iOS 主屏
    (192, "pwa-192.png"),              # PWA 标准
    (512, "pwa-512.png"),              # PWA 标准 / maskable
    (32, "favicon-32.png"),            # 浏览器标签页
]

# favicon.ico 包含的多尺寸
ICO_SIZES = [(16, 16), (32, 32), (48, 48), (64, 64)]


def load_and_square_source(path: Path) -> Image.Image:
    """加载源图，如果不是正方形则按短边居中裁剪为正方形"""
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    if w != h:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        img = img.crop((left, top, left + side, top + side))
        print(f"⚠️ 源图非正方形 ({w}×{h})，已按短边居中裁剪为 {side}×{side}")
    return img


def composite_on_bg(img: Image.Image, bg_color=(248, 242, 232, 255)) -> Image.Image:
    """
    若源图有透明像素，合成到不透明背景上（iOS apple-touch-icon 不支持透明）。
    背景色用 #F8F2E8 与 manifest background_color 一致。
    """
    if img.mode != "RGBA":
        return img.convert("RGB")
    bg = Image.new("RGBA", img.size, bg_color)
    composited = Image.alpha_composite(bg, img)
    return composited.convert("RGB")


def resize_and_save(src: Image.Image, size: int, name: str) -> None:
    """缩放并保存为 PNG"""
    resized = src.resize((size, size), Image.LANCZOS)
    out_path = ICONS_DIR / name
    resized.save(out_path, format="PNG", optimize=True)
    print(f"  ✓ {name:<28} {size}×{size}  ({out_path.stat().st_size // 1024} KB)")


def save_ico(src: Image.Image) -> None:
    """保存多尺寸 favicon.ico"""
    images = [src.resize((s, s), Image.LANCZOS) for s, _ in ICO_SIZES]
    out_path = ICONS_DIR / "favicon.ico"
    images[0].save(
        out_path,
        format="ICO",
        sizes=[(s, s) for s, _ in ICO_SIZES],
        append_images=images[1:],
    )
    print(f"  ✓ favicon.ico                    multi   ({out_path.stat().st_size // 1024} KB)")


def main():
    if not SOURCE_PATH.exists():
        print(f"❌ 源图不存在: {SOURCE_PATH}")
        print("   请先用生图模型生成一张方图，覆盖到上述路径。")
        sys.exit(1)

    src_raw = Image.open(SOURCE_PATH)
    print(f"📥 源图: {SOURCE_PATH.name}  原始尺寸: {src_raw.size[0]}×{src_raw.size[1]}  模式: {src_raw.mode}")

    squared = load_and_square_source(SOURCE_PATH)
    final_src = composite_on_bg(squared)

    # 同步更新 pwa-512.png（即使源图非 512，也用最终方形版本覆盖）
    print("\n🎨 生成各尺寸 PNG...")
    for size, name in TARGETS:
        resize_and_save(final_src, size, name)

    # 同步 logo-512.png 用最终方形版本覆盖（确保源图也是处理后的方形版本）
    final_src.resize((min(final_src.size), min(final_src.size)), Image.LANCZOS).save(
        SOURCE_PATH, format="PNG", optimize=True
    )

    print("\n🎨 生成 favicon.ico (多尺寸打包)...")
    save_ico(final_src)

    print("\n✅ 完成。")
    print("   apple-touch-icon / pwa-192 / pwa-512 / favicon 已更新。")
    print("   下一步：在 iOS Safari 上「添加到主屏幕」即可看到新图标。")


if __name__ == "__main__":
    main()
