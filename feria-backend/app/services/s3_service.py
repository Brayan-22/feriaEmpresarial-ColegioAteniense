import base64
import logging
import boto3
from uuid import uuid4
from app.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    _s3_client = None

    @staticmethod
    def _get_client():
        if S3Service._s3_client is None:
            S3Service._s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region,
            )
        return S3Service._s3_client

    @staticmethod
    def upload_image(product_id: int, image_data_uri: str) -> str:
        """
        Sube una imagen en formato data URI a S3 y retorna la key.

        Args:
            product_id: ID del producto
            image_data_uri: String en formato "data:image/png;base64,<base64_content>"

        Returns:
            Key del objeto S3 (ej: "products/2/abc123.png")

        Raises:
            ValueError: Si el formato del data URI es inválido
        """
        try:
            # Parsear data URI: "data:image/png;base64,<content>"
            if not image_data_uri.startswith("data:image/"):
                raise ValueError(
                    "Invalid image format. Expected 'data:image/<type>;base64,<content>'"
                )

            parts = image_data_uri.split(";base64,")
            if len(parts) != 2:
                raise ValueError("Invalid base64 encoding in data URI")

            # Extraer mime type (image/png -> png)
            mime_part = parts[0].replace("data:image/", "")
            mime_type = f"image/{mime_part}"

            # Extensión del archivo
            if mime_part == "jpeg":
                ext = "jpg"
            elif mime_part == "webp":
                ext = "webp"
            elif mime_part == "gif":
                ext = "gif"
            elif mime_part == "png":
                ext = "png"
            else:
                raise ValueError(
                    f"Unsupported image type: {mime_part}. Use png, jpeg, webp, or gif"
                )

            # Decodificar base64 a bytes
            base64_content = parts[1]
            try:
                image_bytes = base64.b64decode(base64_content)
            except Exception as e:
                raise ValueError(f"Invalid base64 content: {str(e)}")

            # Generar S3 key única
            file_id = str(uuid4())
            s3_key = f"products/{product_id}/{file_id}.{ext}"

            # Subir a S3
            s3_client = S3Service._get_client()
            s3_client.put_object(
                Bucket=settings.aws_s3_bucket_name,
                Key=s3_key,
                Body=image_bytes,
                ContentType=mime_type,
            )

            logger.info(f"✓ Image uploaded to S3: {s3_key} (size: {len(image_bytes)} bytes)")
            return s3_key

        except Exception as e:
            logger.error(f"✗ Error uploading image to S3: {str(e)}")
            raise

    @staticmethod
    def upload_company_logo(company_id: int, image_data_uri: str) -> str:
        """
        Sube un logo de compañía en formato data URI a S3 y retorna la key.

        Args:
            company_id: ID de la compañía
            image_data_uri: String en formato "data:image/png;base64,<base64_content>"

        Returns:
            Key del objeto S3 (ej: "companies/1/abc123.png")

        Raises:
            ValueError: Si el formato del data URI es inválido
        """
        try:
            # Parsear data URI: "data:image/png;base64,<content>"
            if not image_data_uri.startswith("data:image/"):
                raise ValueError(
                    "Invalid image format. Expected 'data:image/<type>;base64,<content>'"
                )

            parts = image_data_uri.split(";base64,")
            if len(parts) != 2:
                raise ValueError("Invalid base64 encoding in data URI")

            # Extraer mime type (image/png -> png)
            mime_part = parts[0].replace("data:image/", "")
            mime_type = f"image/{mime_part}"

            # Extensión del archivo
            if mime_part == "jpeg":
                ext = "jpg"
            elif mime_part == "webp":
                ext = "webp"
            elif mime_part == "gif":
                ext = "gif"
            elif mime_part == "png":
                ext = "png"
            else:
                raise ValueError(
                    f"Unsupported image type: {mime_part}. Use png, jpeg, webp, or gif"
                )

            # Decodificar base64 a bytes
            base64_content = parts[1]
            try:
                image_bytes = base64.b64decode(base64_content)
            except Exception as e:
                raise ValueError(f"Invalid base64 content: {str(e)}")

            # Generar S3 key única
            file_id = str(uuid4())
            s3_key = f"companies/{company_id}/{file_id}.{ext}"

            # Subir a S3
            s3_client = S3Service._get_client()
            s3_client.put_object(
                Bucket=settings.aws_s3_bucket_name,
                Key=s3_key,
                Body=image_bytes,
                ContentType=mime_type,
            )

            logger.info(f"✓ Company logo uploaded to S3: {s3_key} (size: {len(image_bytes)} bytes)")
            return s3_key

        except Exception as e:
            logger.error(f"✗ Error uploading company logo to S3: {str(e)}")
            raise

    @staticmethod
    def get_presigned_url(s3_key: str, expiry: int = None) -> str:
        """
        Genera una URL pre-signed para acceder a un objeto en S3.

        Args:
            s3_key: Key del objeto en S3 (ej: "products/2/abc123.png")
            expiry: Expiración en segundos (default: configurado en settings)

        Returns:
            URL pre-signed completamente válida
        """
        if expiry is None:
            expiry = settings.aws_s3_presigned_expiry

        try:
            s3_client = S3Service._get_client()
            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.aws_s3_bucket_name, "Key": s3_key},
                ExpiresIn=expiry,
            )

            logger.info(f"✓ Pre-signed URL generated for: {s3_key}")
            return presigned_url

        except Exception as e:
            logger.error(f"✗ Error generating pre-signed URL: {str(e)}")
            raise
