from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.core.init_categories import init_categories
from app.routers import (
    auth_router,
    users_router,
    companies_router,
    products_router,
    orders_router,
    balances_router,
    balance_txns_router,
    admin_router,
    categories_router,
    stats_router,
    filter_router
)
from app.core.exceptions import validation_exception_handler
from app.core.init_admin import init_admin_user
from app.core.init_roles import init_roles
from app.db.database import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manejador de ciclo de vida de la aplicación.
    El código antes de 'yield' se ejecuta al startup.
    El código después de 'yield' se ejecuta al shutdown.
    """
    # Startup
    db = SessionLocal()
    try:
        init_roles(db)
        init_admin_user(db)
        init_categories(db)
    finally:
        db.close()

    yield

    # Shutdown (si necesitas limpiar recursos aquí)
    pass


def create_app() -> FastAPI:
    app = FastAPI(
        title="Feria Empresarial Ateniense Backend",
        redirect_slashes=False,
        lifespan=lifespan,  # ← AGREGAR lifespan aquí
    )

    # Exception handlers
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers with API v1 prefix
    api_v1_prefix = "/api/v1"
    app.include_router(auth_router, prefix=api_v1_prefix)
    app.include_router(users_router, prefix=api_v1_prefix)
    app.include_router(companies_router, prefix=api_v1_prefix)
    app.include_router(products_router, prefix=api_v1_prefix)
    app.include_router(orders_router, prefix=api_v1_prefix)
    app.include_router(balances_router, prefix=api_v1_prefix)
    app.include_router(balance_txns_router, prefix=api_v1_prefix)
    app.include_router(admin_router, prefix=api_v1_prefix)
    app.include_router(categories_router, prefix=api_v1_prefix)
    app.include_router(stats_router, prefix=api_v1_prefix)
    app.include_router(filter_router, prefix=api_v1_prefix)

    @app.get("/")
    def read_root():
        return {"message": "Welcome to Feria Empresarial Ateniense Backend"}

    return app
