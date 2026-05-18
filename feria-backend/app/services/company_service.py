from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from sqlalchemy import func, and_, or_

from app.models.companies import Companies
from app.models.product import Product
from app.models.product_category import ProductCategory
from app.schemas.company import CompanyCreate, CompanyUpdate, SearchCompanyRequest
from app.services.s3_service import S3Service

class CompanyService:
    @staticmethod
    def _get_company_orm(db: Session, company_id: int) -> Companies:
        """Obtiene el objeto Companies ORM sin campos calculados."""
        company = db.query(Companies).filter(Companies.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        return company

    @staticmethod
    def _get_categories(db: Session, company_id: int) -> list:
        """Obtiene categorías únicas de productos activos de una compañía."""
        return (
            db.query(ProductCategory)
            .join(Product, Product.category_id == ProductCategory.id)
            .filter(Product.company_id == company_id, Product.active == True)
            .distinct()
            .all()
        )

    @staticmethod
    def _build_response(company: Companies, product_count: int = None, min_price = None, categories: list = None) -> dict:
        """Construye un dict de respuesta con metadata de productos."""
        from decimal import Decimal

        # Convertir Decimal a string para serialización
        if min_price is not None and isinstance(min_price, Decimal):
            min_price = str(min_price)

        return {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "logo_url": company.logo_url,
            "active": company.active,
            "product_count": product_count or 0,
            "min_price": min_price,
            "categories": [{"id": c.id, "name": c.name, "description": c.description} for c in (categories or [])],
        }

    @staticmethod
    def create(db: Session, company: CompanyCreate) -> dict:
        data = company.dict()
        logo_url = data.get("logo_url", "")

        # Si logo_url es un data URI, subir a S3
        if logo_url.startswith("data:image/"):
            data.pop("logo_url")
            data["logo_url"] = ""
            db_company = Companies(**data)
            db.add(db_company)
            db.flush()  # obtener ID sin commit
            data["logo_url"] = S3Service.upload_company_logo(db_company.id, logo_url)
            db_company.logo_url = data["logo_url"]
        else:
            db_company = Companies(**data)
            db.add(db_company)

        db.commit()
        db.refresh(db_company)
        # Nueva empresa sin productos
        return CompanyService._build_response(db_company, product_count=0, min_price=None, categories=[])

    @staticmethod
    def get_by_id(db: Session, company_id: int) -> dict:
        result = (
            db.query(
                Companies,
                func.count(Product.id).label("product_count"),
                func.min(Product.price).label("min_price"),
            )
            .outerjoin(
                Product,
                (Product.company_id == Companies.id) & (Product.active == True)
            )
            .filter(Companies.id == company_id)
            .group_by(Companies.id)
            .first()
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        company, product_count, min_price = result
        categories = CompanyService._get_categories(db, company_id)
        return CompanyService._build_response(company, product_count, min_price, categories)

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> list[dict]:
        results = (
            db.query(
                Companies,
                func.count(Product.id).label("product_count"),
                func.min(Product.price).label("min_price"),
            )
            .outerjoin(
                Product,
                (Product.company_id == Companies.id) & (Product.active == True)
            )
            .group_by(Companies.id)
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [
            CompanyService._build_response(c, cnt, mp, CompanyService._get_categories(db, c.id))
            for c, cnt, mp in results
        ]

    @staticmethod
    def update(db: Session, company_id: int, company: CompanyUpdate) -> dict:
        db_company = CompanyService._get_company_orm(db, company_id)

        update_data = company.dict(exclude_unset=True)

        # Si logo_url es un data URI, subir a S3
        if update_data.get("logo_url", "").startswith("data:image/"):
            update_data["logo_url"] = S3Service.upload_company_logo(company_id, update_data["logo_url"])

        for field, value in update_data.items():
            setattr(db_company, field, value)

        db.add(db_company)
        db.commit()
        db.refresh(db_company)

        # Retornar con campos calculados (misma query que get_by_id)
        result = (
            db.query(
                func.count(Product.id).label("product_count"),
                func.min(Product.price).label("min_price"),
            )
            .filter(Product.company_id == db_company.id)
            .filter(Product.active == True)
            .first()
        )
        product_count = result[0] if result else 0
        min_price = result[1] if result else None
        categories = CompanyService._get_categories(db, company_id)
        return CompanyService._build_response(db_company, product_count, min_price, categories)

    @staticmethod
    def delete(db: Session, company_id: int) -> dict:
        db_company = CompanyService._get_company_orm(db, company_id)
        db.delete(db_company)
        db.commit()
        return {"message": "Company deleted successfully"}

    @staticmethod
    def get_count(db: Session):
        return db.query(func.count(Companies.id)).scalar()

    @staticmethod
    def get_companies_by_filter(db: Session,
                                filter_request: SearchCompanyRequest,
                                skip : int = 0,
                                limit: int = 100) -> list[dict]:
        query = (
            db.query(
                Companies,
                func.count(Product.id).label("product_count"),
                func.min(Product.price).label("min_price"),
            )
            .outerjoin(
                Product,
                (Product.company_id == Companies.id) & (Product.active == True)
            )
        )
        # ========== FILTRO: Compañía y/o producto (OR) ==========
        text_conditions = []
        if filter_request.company:
            text_conditions.append(Companies.name.ilike(f"%{filter_request.company}%"))
            text_conditions.append(Companies.description.ilike(f"%{filter_request.company}%"))
        if filter_request.product:
            text_conditions.append(Product.name.ilike(f"%{filter_request.product}%"))
        if text_conditions:
            query = query.filter(or_(*text_conditions))
        # ========== FILTRO: Categoría ==========
        if filter_request.category:
            query = query.join(
                ProductCategory,
                Product.category_id == ProductCategory.id
            ).filter(
                ProductCategory.name.ilike(f"%{filter_request.category}%")
            )
        # ========== FILTRO: En stock ==========
        if filter_request.in_stock:
            query = query.filter(Product.stock > 0)

        query = query.group_by(Companies.id)

        # ========== ORDENAMIENTO ==========
        if filter_request.sort_by:
            sort_field = filter_request.sort_by.lower()
            if sort_field in ("name", "name_asc"):
                query = query.order_by(Companies.name.asc())
            elif sort_field == "name_desc":
                query = query.order_by(Companies.name.desc())
            elif sort_field in ("price", "price_asc"):
                query = query.order_by(func.min(Product.price).asc())
            elif sort_field == "price_desc":
                query = query.order_by(func.min(Product.price).desc())
            else:
                query = query.order_by(Companies.id.asc())
        else:
            query = query.order_by(Companies.id.asc())

        # Paginar
        results = query.offset(skip).limit(limit).all()

        return [
            CompanyService._build_response(c, cnt, mp, CompanyService._get_categories(db, c.id))
            for c, cnt, mp in results
        ]