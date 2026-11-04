"""
Pydantic схемы для валидации запросов и ответов
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ============ AUTH SCHEMAS ============

class UserRegisterRequest(BaseModel):
    """Запрос на регистрацию"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }


class UserLoginRequest(BaseModel):
    """Запрос на вход"""
    username: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "john_doe",
                "password": "securepassword123"
            }
        }


class UserResponse(BaseModel):
    """Ответ с информацией о пользователе"""
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Ответ с токеном доступа"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============ FUNPAY SCHEMAS ============

class GoldenKeyRequest(BaseModel):
    """Запрос с golden_key для синхронизации"""
    golden_key: str = Field(
        ..., 
        min_length=10,
        description="Golden key cookie из браузера FunPay"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "golden_key": "ваш_golden_key_здесь_минимум_10_символов"
            }
        }


class FunPayAccountRequest(BaseModel):
    """Запрос для добавления FunPay аккаунта"""
    golden_key: str = Field(..., min_length=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "golden_key": "ваш_golden_key"
            }
        }


class FunPayAccountResponse(BaseModel):
    """Ответ с информацией о FunPay аккаунте"""
    id: int
    user_id: int
    last_sync: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ ORDER SCHEMAS ============

class OrderResponse(BaseModel):
    """Ответ с информацией о заказе"""
    id: int
    date: Optional[datetime] = None
    order_id: str
    description: Optional[str] = None
    buyer: Optional[str] = None
    status: Optional[str] = None
    amount: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Ответ со списком заказов"""
    total: int
    skip: int
    limit: int
    orders: List[OrderResponse]


# ============ STATS SCHEMAS ============

class StatsResponse(BaseModel):
    """Ответ со статистикой"""
    total_revenue: float = Field(description="Общая выручка в рублях")
    total_orders: int = Field(description="Количество заказов")
    avg_order_value: float = Field(description="Средний размер заказа")
    last_sync: Optional[datetime] = Field(None, description="Дата последней синхронизации")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_revenue": 125450.50,
                "total_orders": 45,
                "avg_order_value": 2787.78,
                "last_sync": "2024-01-15T10:30:00"
            }
        }


# ============ SYNC SCHEMAS ============

class SyncResponse(BaseModel):
    """Ответ на синхронизацию"""
    message: str
    synced_count: int = Field(description="Количество добавленных новых заказов")
    total_found: int = Field(description="Всего найдено заказов")
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Синхронизация завершена. Добавлено новых заказов: 5",
                "synced_count": 5,
                "total_found": 10,
                "error": None
            }
        }


# ============ ERROR SCHEMAS ============

class ErrorResponse(BaseModel):
    """Ответ об ошибке"""
    detail: str
    error_code: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Invalid golden key",
                "error_code": "INVALID_GOLDEN_KEY"
            }
        }
