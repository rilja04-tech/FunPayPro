"""
Сервис для работы с заказами
Содержит бизнес-логику, отделен от API
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Tuple
import logging

from app.models.db import OrderDB, FunPayAccountDB
from app.schemas import StatsResponse

logger = logging.getLogger(__name__)


class OrderService:
    """Сервис для работы с заказами"""
    
    @staticmethod
    def get_orders(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[OrderDB], int]:
        """
        Получить заказы пользователя
        
        Args:
            db: БД сессия
            user_id: ID пользователя
            skip: Пропустить первые N заказов
            limit: Максимум заказов вернуть
        
        Returns:
            Tuple[List[OrderDB], int]: (список заказов, общее количество)
        """
        # Общее количество
        total = db.query(func.count(OrderDB.id)).filter(
            OrderDB.user_id == user_id
        ).scalar()
        
        # Получаем заказы, отсортированные по дате (новые сверху)
        orders = db.query(OrderDB).filter(
            OrderDB.user_id == user_id
        ).order_by(
            OrderDB.date.desc()
        ).offset(skip).limit(limit).all()
        
        logger.info(f"Получены {len(orders)} заказов для пользователя {user_id}")
        
        return orders, total
    
    @staticmethod
    def get_stats(db: Session, user_id: int) -> StatsResponse:
        """
        Получить статистику по заказам пользователя
        
        Args:
            db: БД сессия
            user_id: ID пользователя
        
        Returns:
            StatsResponse: Статистика
        """
        # Получаем все заказы пользователя
        orders = db.query(OrderDB).filter(
            OrderDB.user_id == user_id
        ).all()
        
        if not orders:
            return StatsResponse(
                total_revenue=0.0,
                total_orders=0,
                avg_order_value=0.0,
                last_sync=None
            )
        
        # Вычисляем статистику
        total_revenue = sum(order.amount for order in orders if order.amount)
        total_orders = len(orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
        
        # Получаем дату последней синхронизации
        last_sync = db.query(func.max(OrderDB.created_at)).filter(
            OrderDB.user_id == user_id
        ).scalar()
        
        return StatsResponse(
            total_revenue=round(total_revenue, 2),
            total_orders=total_orders,
            avg_order_value=round(avg_order_value, 2),
            last_sync=last_sync
        )
    
    @staticmethod
    def add_orders(
        db: Session,
        user_id: int,
        funpay_account_id: int,
        orders_data: List[dict]
    ) -> int:
        """
        Добавить новые заказы в БД
        Автоматически пропускает дубликаты
        
        Args:
            db: БД сессия
            user_id: ID пользователя
            funpay_account_id: ID FunPay аккаунта
            orders_data: Список словарей с данными заказов
        
        Returns:
            int: Количество добавленных новых заказов
        """
        synced_count = 0
        
        for order_data in orders_data:
            order_id = order_data.get('order_id')
            
            if not order_id:
                logger.warning(f"Пропуск заказа без ID")
                continue
            
            # Проверяем что заказ с таким ID не существует
            existing_order = db.query(OrderDB).filter(
                OrderDB.user_id == user_id,
                OrderDB.order_id == order_id
            ).first()
            
            if existing_order:
                logger.debug(f"Заказ {order_id} уже существует, пропускаем")
                continue
            
            # Создаем новый заказ
            new_order = OrderDB(
                user_id=user_id,
                funpay_account_id=funpay_account_id,
                date=order_data.get('date'),
                order_id=order_id,
                description=order_data.get('description', 'Нет описания'),
                buyer=order_data.get('buyer', 'Неизвестно'),
                status=order_data.get('status', 'Завершен'),
                amount=order_data.get('amount', 0.0)
            )
            
            db.add(new_order)
            synced_count += 1
            logger.debug(f"Добавлен заказ {order_id}: {new_order.amount} ₽")
        
        try:
            db.commit()
            logger.info(f"Успешно добавлено {synced_count} новых заказов для пользователя {user_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Ошибка при сохранении заказов: {e}")
            raise
        
        return synced_count
    
    @staticmethod
    def clean_duplicates(db: Session, user_id: int) -> int:
        """
        Очистить дубликаты заказов пользователя
        Оставляет первый (по дате создания) и удаляет остальные
        
        Args:
            db: БД сессия
            user_id: ID пользователя
        
        Returns:
            int: Количество удаленных дубликатов
        """
        from sqlalchemy import and_
        from sqlalchemy.orm import aliased
        
        # Находим дубликаты (одинаковые order_id для пользователя)
        duplicates = db.query(OrderDB).filter(
            OrderDB.user_id == user_id
        ).group_by(OrderDB.order_id).having(
            func.count(OrderDB.id) > 1
        ).all()
        
        deleted_count = 0
        
        for duplicate_group in duplicates:
            # Находим все заказы с таким order_id
            orders = db.query(OrderDB).filter(
                OrderDB.user_id == user_id,
                OrderDB.order_id == duplicate_group.order_id
            ).order_by(OrderDB.created_at.asc()).all()
            
            # Удаляем все кроме первого
            for order in orders[1:]:
                db.delete(order)
                deleted_count += 1
                logger.debug(f"Удален дубликат заказа {order.order_id}")
        
        try:
            db.commit()
            logger.info(f"Удалено {deleted_count} дубликатов для пользователя {user_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Ошибка при удалении дубликатов: {e}")
            raise
        
        return deleted_count
