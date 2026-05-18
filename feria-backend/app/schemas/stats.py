from typing import Optional

from pydantic import BaseModel

class StatsResponse(BaseModel):
    companies_count: Optional[int] = None
    products_count: Optional[int] = None