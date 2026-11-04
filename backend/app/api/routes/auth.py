"""
API routes для аутентификации (регистрация, вход)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

from app.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse
)
from app.database.session import get_db
from app.core.security import SecurityService, get_current_user
from app.core.config import settings
from app.models.db import UserDB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Зарегистрировать нового пользователя
    
    Args:
        request: UserRegisterRequest с username, email, password
        db: БД сессия
    
    Returns:
        TokenResponse: JWT токен и информация о пользователе
    """
    
    logger.info(f"Попытка регистрации: {request.username}")
    
    # Проверяем что пользователь не существует
    existing_user = db.query(UserDB).filter(
        (UserDB.username == request.username) | (UserDB.email == request.email)
    ).first()
    
    if existing_user:
        logger.warning(f"Попытка регистрации существующего пользователя: {request.username}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username или email уже зарегистрирован"
        )
    
    # Хешируем пароль
    hashed_password = SecurityService.hash_password(request.password)
    
    # Создаем пользователя
    new_user = UserDB(
        username=request.username,
        email=request.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"✅ Пользователь зарегистрирован: {request.username} (ID: {new_user.id})")
    
    # Создаем токен
    access_token = SecurityService.create_access_token(
        data={"sub": new_user.id, "username": new_user.username}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Вход пользователя
    
    Args:
        request: UserLoginRequest с username и password
        db: БД сессия
    
    Returns:
        TokenResponse: JWT токен и информация о пользователе
    """
    
    logger.info(f"Попытка входа: {request.username}")
    
    # Ищем пользователя
    user = db.query(UserDB).filter(UserDB.username == request.username).first()
    
    if not user:
        logger.warning(f"Попытка входа с несуществующим username: {request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверные учетные данные"
        )
    
    # Проверяем пароль
    if not SecurityService.verify_password(request.password, user.hashed_password):
        logger.warning(f"Попытка входа с неверным паролем: {request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверные учетные данные"
        )
    
    if not user.is_active:
        logger.warning(f"Попытка входа неактивного пользователя: {request.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь отключен"
        )
    
    logger.info(f"✅ Пользователь вошел: {request.username}")
    
    # Создаем токен
    access_token = SecurityService.create_access_token(
        data={"sub": user.id, "username": user.username}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить информацию о текущем пользователе
    
    Требует аутентификации
    
    Returns:
        UserResponse: Информация о пользователе
    """
    
    user_id = current_user.get("user_id")
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    return UserResponse.model_validate(user)