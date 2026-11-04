"""
API routes для получения заказов и статистики
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import logging

from app.schemas import OrderResponse, OrderListResponse, StatsResponse
from app.database.session import get_db
from app.core.security import get_current_user
from app.services.order_service import OrderService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["orders"])


@router.get("/orders", response_model=OrderListResponse)
def get_orders(
    skip: int = Query(0, ge=0, description="Пропустить первые N заказов"),
    limit: int = Query(100, ge=1, le=1000, description="Максимум заказов вернуть"),
    db: Session = Depends(get_db)
):
    """
    Получить заказы пользователя
    
    Параметры:
        skip: Пропустить первые N заказов (для пагинации)
        limit: Максимум заказов вернуть (макс 1000)
    
    Returns:
        OrderListResponse: Список заказов с общим количеством
    """
    
    user_id = 1
    
    try:
        orders, total = OrderService.get_orders(
            db=db,
            user_id=user_id,
            skip=skip,
            limit=limit
        )
        
        logger.info(f"Получены {len(orders)} заказов для пользователя {user_id}")
        
        return OrderListResponse(
            total=total,
            skip=skip,
            limit=limit,
            orders=orders
        )
    
    except Exception as e:
        logger.error(f"Ошибка при получении заказов: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при получении заказов"
        )


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db)
):
    """
    Получить статистику по заказам пользователя
    
    Returns:
        StatsResponse: Статистика (общая выручка, количество заказов, средний размер)
    """
    
    user_id = 1
    
    try:
        stats = OrderService.get_stats(db=db, user_id=user_id)
        logger.info(f"Статистика для пользователя {user_id}: {stats.total_orders} заказов, {stats.total_revenue}₽")
        return stats
    
    except Exception as e:
        logger.error(f"Ошибка при получении статистики: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при получении статистики"
        )


@router.delete("/orders/clean-duplicates")
def clean_duplicates(
    db: Session = Depends(get_db)
):
    """
    Очистить дубликаты заказов пользователя
    
    Оставляет первый (по дате создания) и удаляет остальные копии
    
    Returns:
        dict: Количество удаленных дубликатов
    """
    
    user_id = 1
    
    try:
        deleted_count = OrderService.clean_duplicates(db=db, user_id=user_id)
        
        logger.info(f"Удалено {deleted_count} дубликатов для пользователя {user_id}")
        
        return {
            "message": f"Удалено дубликатов: {deleted_count}",
            "deleted_count": deleted_count
        }
    
    except Exception as e:
        logger.error(f"Ошибка при очистке дубликатов: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при очистке дубликатов"
        )
