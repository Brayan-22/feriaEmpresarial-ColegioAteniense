"""
Inicialización de usuarios admin desde variables de entorno.
Se ejecuta automáticamente al startup de la app.
"""

from sqlalchemy.orm import Session

from app.core.init_roles import DEFAULT_ROLES
from app.models import UserRole
from app.models.user import User
from app.core.security import PasswordHasher
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def init_admin_user(db: Session):
    admin_email = settings.admin_email
    admin_password = settings.admin_password
    admin_full_name = settings.admin_full_name or "Administrator"

    # Si no están definidas, no hacer nada
    if not admin_email or not admin_password:
        logger.info("ADMIN_EMAIL o ADMIN_PASSWORD no están definidas en .env - skipping admin creation")
        return

    # Verificar que la contraseña tiene mínimo 8 caracteres
    if len(admin_password) < 8:
        logger.error("ADMIN_PASSWORD debe tener al menos 8 caracteres")
        return

    # Verificar si el admin ya existe
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        logger.info(f"Admin {admin_email} ya existe - skipping creation")
        return

    # Crear el usuario admin
    try:
        # Buscar el id del rol admin:
        user_role = db.query(UserRole).filter(
            UserRole.name == DEFAULT_ROLES[0]["name"]  # "admin"
        ).first()
        admin_user = User(
            email=admin_email,
            password=admin_password,  # Se hashea automáticamente por event listener
            full_name=admin_full_name,
            role_id= user_role.id
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        logger.info(f"✓ Admin user creado exitosamente: {admin_email}")
    except Exception as e:
        db.rollback()
        logger.error(f"✗ Error creando admin user: {str(e)}")
        raise
