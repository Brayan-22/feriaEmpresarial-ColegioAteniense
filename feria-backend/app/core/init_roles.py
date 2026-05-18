from sqlalchemy.orm import Session
from app.models.user_role import UserRole
import logging

logger = logging.getLogger(__name__)
DEFAULT_ROLES = [
    {
        "name": "admin",
        "description": "Administrador del sistema con acceso completo"
    },
    {
        "name": "company",
        "description": "Representante de empresa que vende productos"
    },
    {
        "name": "user",
        "description": "Estudiante/padre que compra en la feria"
    }
]

def init_roles(db: Session):
    try:
        for role_data in DEFAULT_ROLES:
            existing_role = db.query(UserRole).filter(
                UserRole.name == role_data["name"]
            ).first()
            if existing_role:
                logger.info(f"Rol '{role_data['name']}' ya existe, omitiendo creación.")
                continue
            # Crear nuevo rol
            new_role = UserRole(
                name=role_data["name"],
                description = role_data["description"],
            )
            db.add(new_role)
        db.commit()
        logger.info("Roles iniciales creados o verificados exitosamente.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error inicializando roles: {str(e)}")
        raise