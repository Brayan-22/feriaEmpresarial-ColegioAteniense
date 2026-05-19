from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from decimal import Decimal


class ProductCreate(BaseModel):
    company_id: int
    category_id: Optional[int] = None
    name: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1, max_length=500)
    price: Decimal = Field(..., gt=0)
    stock: int = Field(..., ge=0)
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    price: Optional[Decimal] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    active: Optional[bool] = None
    category_id: Optional[int] = None


class ProductResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: str
    price: Decimal
    stock: int
    image_url: Optional[str] = None
    active: bool
    category: Optional["CategoryResponse"] = None

    model_config = {"from_attributes": True}

    @model_validator(mode='after')
    def resolve_image_url(self):
        if self.image_url and not self.image_url.startswith('http'):
            from app.services.s3_service import S3Service
            try:
                self.image_url = S3Service.get_presigned_url(self.image_url)
            except Exception:
                pass
        return self


class ImageUpload(BaseModel):
    image_data: str = Field(
        ...,
        description="Image in data URI format: data:image/png;base64,<base64_content>",
    )

    @field_validator("image_data")
    @classmethod
    def validate_image_data(cls, v: str) -> str:
        if not v.startswith("data:image/"):
            raise ValueError(
                "Invalid image format. Expected 'data:image/<type>;base64,<content>'"
            )

        if ";base64," not in v:
            raise ValueError("Invalid base64 encoding. Expected format with ';base64,'")

        mime_type = v.split(";")[0].replace("data:image/", "")
        if mime_type not in ["png", "jpeg", "webp", "gif"]:
            raise ValueError(
                f"Unsupported image type: {mime_type}. Use png, jpeg, webp, or gif"
            )

        return v


class ImageUrlResponse(BaseModel):
    image_url: str
    expires_in: int


from app.schemas.product_category import CategoryResponse

ProductResponse.model_rebuild()
