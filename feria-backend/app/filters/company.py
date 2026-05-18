from fastapi_filter.contrib.sqlalchemy import Filter

from app.models import Companies


class CompanyFilter(Filter):
    name__icontains :str | None = None
    active: bool | None = None

    class Config:
        model = Companies
        fields = {
            "id": ["eq"],
            "name": ["eq", "icontains"],
            "active": ["eq"],
        }