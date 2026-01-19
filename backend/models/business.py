from pydantic import BaseModel, Field


class BusinessConfig(BaseModel):
    id: str
    name: str
    personality: str = "Helpful assistant"
    knowledge_base_urls: list[str] = Field(default_factory=list)
