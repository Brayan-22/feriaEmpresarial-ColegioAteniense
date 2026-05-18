from fastapi_filter.contrib.sqlalchemy import Filter

from app.models import ProductCategory


class CategoryFilter(Filter):
    """Define los campos filtrables en ProductCategory."""

    name__icontains: str | None = None

    class Config:
        model = ProductCategory
        fields = {
            "name": ["eq", "icontains"],
        }
