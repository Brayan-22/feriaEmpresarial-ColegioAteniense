from typing import Optional
import boto3
import json
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Feria Empresarial Ateniense Backend"
    environment: str = "development"
    db_user: str = ""
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = ""
    secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    admin_email: Optional[str] = None
    admin_password: Optional[str] = None
    admin_full_name: Optional[str] = "Administrator"
    aws_region: str = "us-east-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_s3_bucket_name: Optional[str] = None
    aws_s3_presigned_expiry: int = 3600

    @property
    def database_url(self) -> str:
        return f"postgresql+psycopg2://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.environment == "production":
            self._load_from_secrets_manager()

    def _load_from_secrets_manager(self):
        try:
            client = boto3.client("secretsmanager", region_name=self.aws_region)
            response = client.get_secret_value(SecretId="feriaescolar/config")
            secrets = json.loads(response["SecretString"])
            for key, value in secrets.items():
                attr = key.lower()
                if hasattr(self, attr):
                    setattr(self, attr, value)
        except Exception as e:
            raise RuntimeError(f"Error cargando secrets: {e}")

    class Config:
        env_file = ".env"

settings = Settings()