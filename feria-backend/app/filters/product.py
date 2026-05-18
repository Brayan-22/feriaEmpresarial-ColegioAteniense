from fastapi_filter.contrib.sqlalchemy import Filter
from app.models.product import Product
class ProductFilter(Filter):
    """Define los campos filtrables en Products."""

    name__icontains: str | None = None
    company_id: int | None = None
    category_id: int | None = None
    active: bool | None = True

    class Config:
        model = Product
        fields = {
            "name": ["eq", "icontains"],
            "company_id": ["eq"],
            "category_id": ["eq"],
            "active": ["eq"],
            "price": ["gte", "lte"],
        }
