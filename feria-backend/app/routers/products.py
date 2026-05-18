from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status

from app.db.database import get_session
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ImageUpload, ImageUrlResponse
from app.services.product_service import ProductService
from app.services.s3_service import S3Service
from app.core.auth import get_current_company

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, current_user = Depends(get_current_company), db: Session = Depends(get_session)):
    return ProductService.create(db, product)


@router.get("/", response_model=list[ProductResponse])
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_session)):
    return ProductService.get_all(db, skip, limit)


@router.get("/company/{company_id}", response_model=list[ProductResponse])
def list_company_products(
    company_id: int,
    is_active: bool | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    return ProductService.get_by_company(db, company_id,is_active, skip, limit)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_session)):
    return ProductService.get_by_id(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, current_user = Depends(get_current_company), db: Session = Depends(get_session)):
    return ProductService.update(db, product_id, product)


@router.delete("/{product_id}")
def delete_product(product_id: int, current_user = Depends(get_current_company), db: Session = Depends(get_session)):
    return ProductService.delete(db, product_id)


@router.post("/{product_id}/image", response_model=ProductResponse)
def upload_product_image(
    product_id: int,
    image: ImageUpload,
    current_user = Depends(get_current_company),
    db: Session = Depends(get_session)
):
    """
    Sube una imagen de producto en formato base64 a S3 y actualiza el producto.

    Body:
    {
      "image_data": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    }
    """
    # Verificar que el producto existe
    product = ProductService.get_by_id(db, product_id)

    # Subir a S3 y obtener la key
    s3_key = S3Service.upload_image(product_id, image.image_data)

    # Actualizar el producto con la nueva key
    updated_product = ProductService.update(
        db, product_id, ProductUpdate(image_url=s3_key)
    )

    # Retornar el producto con la URL pre-signed en image_url
    response = ProductResponse.model_validate(updated_product)
    response.image_url = S3Service.get_presigned_url(s3_key)

    return response


@router.get("/{product_id}/image-url", response_model=ImageUrlResponse)
def get_product_image_url(
    product_id: int,
    db: Session = Depends(get_session)
):
    """
    Obtiene una URL pre-signed para acceder a la imagen del producto.
    La URL es válida por 1 hora.
    """
    # Verificar que el producto existe
    product = ProductService.get_by_id(db, product_id)

    # Verificar que tiene imagen
    if not product.image_url:
        return {"error": "Product has no image"}

    # Generar y retornar URL pre-signed
    presigned_url = S3Service.get_presigned_url(product.image_url)

    return ImageUrlResponse(
        image_url=presigned_url,
        expires_in=3600
    )
