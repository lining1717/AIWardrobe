"""
API 配置模型
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class ModeBonusWeights(BaseModel):
    goal_bonus: int = 4
    color_bonus: int = 4
    style_bonus: int = 3


class RecommendationModeWeights(BaseModel):
    balanced: ModeBonusWeights = Field(default_factory=ModeBonusWeights)
    goal_first: ModeBonusWeights = Field(
        default_factory=lambda: ModeBonusWeights(goal_bonus=7, color_bonus=3, style_bonus=2)
    )
    wardrobe_first: ModeBonusWeights = Field(
        default_factory=lambda: ModeBonusWeights(goal_bonus=2, color_bonus=5, style_bonus=4)
    )


class LLMConfig(BaseModel):
    """LLM API 配置"""
    api_base: str = "https://x666.me/v1"
    api_key: str = "sk-F8oPcW8b5pgRtrmnR0ymh6yxCG6yCW3Gft7H3x792r3kn4Fi"
    model: str = "gemini-flash-latest"
    # remove.bg 配置
    removebg_api_key: str = "mcigdPJZy9oU6c2SMiEwj9VA"
    bg_removal_method: Literal["local", "removebg"] = "removebg"  # 本地 rembg 或 remove.bg API
    # 默认天气城市（用于首页与推荐页）
    weather_location: str = "上海, 上海市, 中国"
    # 用户星座配置（用于首页运势）
    zodiac_sign: str = ""
    # 推荐模式权重
    recommendation_mode_weights: RecommendationModeWeights = Field(default_factory=RecommendationModeWeights)


class LLMConfigUpdate(BaseModel):
    """更新 LLM 配置的请求体"""
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    removebg_api_key: Optional[str] = None
    bg_removal_method: Optional[Literal["local", "removebg"]] = None
    weather_location: Optional[str] = None
    zodiac_sign: Optional[str] = None
    recommendation_mode_weights: Optional[RecommendationModeWeights] = None


class AvailableModel(BaseModel):
    """可用模型"""
    id: str
    name: str


class ModelListResponse(BaseModel):
    """模型列表响应"""
    models: List[AvailableModel]
