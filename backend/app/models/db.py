"""
SQLAlchemy модели базы данных
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class UserDB(Base):
    """Модель пользователя"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.username}>"


class FunPayAccountDB(Base):
    """Модель аккаунта FunPay пользователя"""
    __tablename__ = "funpay_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    encrypted_golden_key = Column(String(255), nullable=False)  # Зашифрованный ключ!
    last_sync = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<FunPayAccount user_id={self.user_id}>"


class OrderDB(Base):
    """Модель заказа с привязкой к пользователю"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    funpay_account_id = Column(Integer, ForeignKey("funpay_accounts.id"), nullable=False)
    
    date = Column(DateTime, nullable=True, index=True)
    order_id = Column(String(50), index=True, nullable=False)  # Уникальный в рамках пользователя
    description = Column(String(255), nullable=True)
    buyer = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True)
    amount = Column(Float, nullable=False)  # НИКОГДА не null!
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Индекс для быстрого поиска заказов пользователя
    __table_args__ = (
        # UNIQUE constraint на (user_id, order_id) - один заказ на пользователя
        # Но в реальности один заказ может быть в одном аккаунте
    )
    
    def __repr__(self):
        return f"<Order {self.order_id} - {self.amount}₽>"
