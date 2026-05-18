from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str

    model_config = {"from_attributes": True}
