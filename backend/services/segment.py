"""
rembg 背景移除服务
"""
from PIL import Image
import io


def remove_background(image_bytes: bytes) -> bytes:
    """
    使用 rembg 移除图片背景

    Args:
        image_bytes: 原始图片的字节数据

    Returns:
        去除背景后的 PNG 图片字节数据
    """
    # 延迟加载 rembg：避免启动时立即加载 onnxruntime（启动慢 + GPU 探测警告）
    # 仅在实际需要本地去背景时才加载
    try:
        from rembg import remove as rembg_remove
    except ImportError:
        raise ValueError(
            "本地背景移除依赖未安装：请安装 rembg 与 onnxruntime，"
            "或在设置中切换到 remove.bg API。"
        )

    input_img = Image.open(io.BytesIO(image_bytes))
    output = rembg_remove(input_img)

    buf = io.BytesIO()
    output.save(buf, format="PNG")
    return buf.getvalue()
