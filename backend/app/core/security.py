from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from cryptography.fernet import Fernet
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()

try:
    cipher_suite = Fernet(settings.ENCRYPTION_KEY.encode())
except Exception as e:
    logger.warning(f"Шифрование отключено: {e}")
    cipher_suite = None


class SecurityService:

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("sub") is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            return payload
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    @staticmethod
    def encrypt_golden_key(golden_key: str) -> str:
        if not cipher_suite:
            return golden_key
        return cipher_suite.encrypt(golden_key.encode()).decode()

    @staticmethod
    def decrypt_golden_key(encrypted_key: str) -> str:
        if not cipher_suite:
            return encrypted_key
        return cipher_suite.decrypt(encrypted_key.encode()).decode()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = SecurityService.verify_token(token)
    return {
        "user_id": payload.get("sub"),
        "username": payload.get("username")
    }