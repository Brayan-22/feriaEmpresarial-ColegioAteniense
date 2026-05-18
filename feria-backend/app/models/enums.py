from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    COMPANY = "company"

class OrderStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REJECTED = "rejected"
    CANCELED = "canceled"

class BalanceType(str, Enum):
    PERSONAL = "personal"
    COMPANY = "company"