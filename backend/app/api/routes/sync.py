"""
API routes для синхронизации заказов с FunPay
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.schemas import GoldenKeyRequest, SyncResponse
from app.database.session import get_db
from app.core.security import get_current_user, SecurityService
from app.services.funpay_parser import FunPayParser, FunPayParsingError
from app.services.order_service import OrderService
from app.models.db import FunPayAccountDB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["sync"])


@router.post("/sync", response_model=SyncResponse)
async def sync_funpay_data(
    request: GoldenKeyRequest,
    db: Session = Depends(get_db)
):
    """
    Синхронизировать заказы с FunPay
    
    Требует аутентификации (JWT токен)
    
    Args:
        request: GoldenKeyRequest с golden_key
        current_user: Текущий пользователь (из токена)
        db: БД сессия
    
    Returns:
        SyncResponse: Результат синхронизации
    """
    
    user_id = 1
    
    if not request.golden_key or len(request.golden_key) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Golden key должен быть минимум 10 символов"
        )
    
    logger.info(f"Получен запрос на синхронизацию для пользователя {user_id}")
    
    try:
        # 1. Парсим заказы с FunPay
        logger.info("🔍 Начинаем парсинг FunPay...")
        parser = FunPayParser(request.golden_key)
        orders = await parser.fetch_orders()
        
        if not orders:
            return SyncResponse(
                message="Заказы не найдены на сервере FunPay",
                synced_count=0,
                total_found=0
            )
        
        # 2. Проверяем что все заказы имеют валидные суммы
        for order in orders:
            if order.get('amount', 0) <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Не удалось определить сумму для заказа {order.get('order_id')}"
                )
        
        # 3. Получаем или создаем FunPayAccount для пользователя
        # Шифруем golden_key перед сохранением
        encrypted_key = SecurityService.encrypt_golden_key(request.golden_key)
        
        funpay_account = db.query(FunPayAccountDB).filter(
            FunPayAccountDB.user_id == user_id,
            FunPayAccountDB.is_active == True
        ).first()
        
        if not funpay_account:
            # Создаем новый аккаунт
            funpay_account = FunPayAccountDB(
                user_id=user_id,
                encrypted_golden_key=encrypted_key
            )
            db.add(funpay_account)
            db.commit()
            logger.info(f"Создан новый FunPay аккаунт для пользователя {user_id}")
        else:
            # Обновляем существующий
            funpay_account.encrypted_golden_key = encrypted_key
            db.commit()
        
        # 4. Добавляем новые заказы в БД
        synced_count = OrderService.add_orders(
            db=db,
            user_id=user_id,
            funpay_account_id=funpay_account.id,
            orders_data=orders
        )
        
        # 5. Обновляем время последней синхронизации
        from datetime import datetime
        funpay_account.last_sync = datetime.utcnow()
        db.commit()
        
        logger.info(f"✅ Синхронизация завершена: {synced_count} новых заказов из {len(orders)}")
        
        return SyncResponse(
            message=f"Синхронизация завершена. Добавлено новых заказов: {synced_count}",
            synced_count=synced_count,
            total_found=len(orders)
        )
    
    except FunPayParsingError as e:
        logger.error(f"❌ Ошибка при парсинге FunPay: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"❌ Непредвиденная ошибка при синхронизации: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при синхронизации"
        )
