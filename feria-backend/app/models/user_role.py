from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base

class UserRole(Base):
    __tablename__ = "user_role"
    # Table columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)

    # Relations
    users = relationship("User", back_populates="role")