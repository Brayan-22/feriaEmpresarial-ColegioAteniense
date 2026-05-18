from sqlalchemy.orm import Session
from app.models.product_category import ProductCategory
import logging

logger = logging.getLogger(__name__)
DEFAULT_CATEGORIES = [
    {
        "name": "Reciclado",
        "description": "Producto hecho a base de reciclaje",
    }
]

def init_categories(db: Session):
    try:
        for category in DEFAULT_CATEGORIES:
            existing_category = db.query(ProductCategory).filter(
                ProductCategory.name == category["name"]
            ).first()
            if existing_category:
                logger.info(f"Categoría '{category['name']}' ya existe, omitiendo creación.")
                continue
            # Crear nueva categoría
            new_category = ProductCategory(
                name=category["name"],
                description=category["description"],
            )
            db.add(new_category)
        db.commit()
        logger.info("Categorías iniciales creadas o verificadas exitosamente.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error inicializando categorías: {str(e)}")
        raise