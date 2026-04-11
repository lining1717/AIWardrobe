"""
AI 试穿 API
"""
from pathlib import Path
import uuid

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.tryon import run_tryon
from storage.db import get_clothes_by_id

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
TRYON_DIR = UPLOAD_DIR / "tryon"
TRYON_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/tryon")
async def tryon(
    person_image: UploadFile = File(...),
    garment_id: int = Form(...),
    category: str = Form("top"),
):
    if not person_image.content_type or not person_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="person_image 必须是图片文件")

    garment = await get_clothes_by_id(garment_id)
    if not garment:
        raise HTTPException(status_code=404, detail="衣物不存在")

    garment_path = UPLOAD_DIR / Path(garment.image_url).name
    if not garment_path.exists() or not garment_path.is_file():
        raise HTTPException(status_code=404, detail="衣物图片文件不存在")

    try:
        person_bytes = await person_image.read()
        with open(garment_path, "rb") as f:
            garment_bytes = f.read()

        result = await run_tryon(
            person_image_bytes=person_bytes,
            garment_image_bytes=garment_bytes,
            category=category,
        )

        if result.result_image_url:
            return {
                "success": True,
                "result_image_url": result.result_image_url,
                "source": "remote_url",
            }

        ext = result.image_ext or "png"
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = TRYON_DIR / filename
        with open(filepath, "wb") as f:
            f.write(result.image_bytes or b"")

        return {
            "success": True,
            "result_image_url": f"/uploads/tryon/{filename}",
            "source": "local_file",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"试穿失败: {e}")
