"""
AI 试穿服务
"""
from __future__ import annotations

import base64
from typing import Any

import httpx

from storage.config_store import load_config


class TryOnResult:
    def __init__(self, result_image_url: str | None = None, image_bytes: bytes | None = None, image_ext: str = "png"):
        self.result_image_url = result_image_url
        self.image_bytes = image_bytes
        self.image_ext = image_ext


def _guess_ext(content_type: str | None) -> str:
    if not content_type:
        return "png"
    if "jpeg" in content_type or "jpg" in content_type:
        return "jpg"
    if "webp" in content_type:
        return "webp"
    return "png"


async def run_tryon(person_image_bytes: bytes, garment_image_bytes: bytes, category: str) -> TryOnResult:
    config = load_config()

    if config.tryon_provider == "disabled":
        raise ValueError("试穿功能未启用，请先在设置中配置 Try-On Provider。")

    if not config.tryon_api_url:
        raise ValueError("未配置 Try-On API URL，请在设置中填写。")

    headers: dict[str, str] = {}
    if config.tryon_api_key:
        headers["Authorization"] = f"Bearer {config.tryon_api_key}"

    files = {
        "person_image": ("person.png", person_image_bytes, "image/png"),
        "garment_image": ("garment.png", garment_image_bytes, "image/png"),
    }

    data: dict[str, str] = {
        "category": category or "top",
    }
    if config.tryon_model:
        data["model"] = config.tryon_model

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(config.tryon_api_url, headers=headers, files=files, data=data)

    if response.status_code >= 400:
        detail = response.text.strip()
        raise ValueError(f"Try-On 调用失败（{response.status_code}）：{detail[:400]}")

    content_type = response.headers.get("content-type", "")
    if content_type.startswith("image/"):
        return TryOnResult(image_bytes=response.content, image_ext=_guess_ext(content_type))

    payload: dict[str, Any] = response.json()
    for key in ("result_image_url", "image_url", "result_url", "output_url"):
        value = payload.get(key)
        if isinstance(value, str) and value:
            return TryOnResult(result_image_url=value)

    for key in ("result_image_base64", "image_base64", "output_base64"):
        value = payload.get(key)
        if isinstance(value, str) and value:
            try:
                image_bytes = base64.b64decode(value)
                return TryOnResult(image_bytes=image_bytes, image_ext="png")
            except Exception as exc:
                raise ValueError(f"Try-On 返回的 base64 无法解析：{exc}")

    raise ValueError("Try-On 返回格式不支持：未找到结果图片字段。")
