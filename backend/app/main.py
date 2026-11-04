"""
FastAPI приложение для FunPay Analytics
Главный файл со всеми маршрутами и конфигурацией
"""
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import logging.config

from app.core.config import settings
from app.database.session import engine
from app.models.db import Base
from app.api.routes import auth, sync, orders

# Логирование
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Создаем все таблицы в БД
logger.info("Инициализация базы данных...")
Base.metadata.create_all(bind=engine)
logger.info("✅ База данных инициализирована")

# Создаем FastAPI приложение
app = FastAPI(
    title="FunPay Analytics API",
    description="API для анализа заказов с FunPay",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============ MIDDLEWARE ============

# CORS - только разрешенные источники (безопасно!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],  # Только необходимые методы
    allow_headers=["Content-Type", "Authorization"],
)

# ============ ROUTES ============

# Подключаем роуты
app.include_router(auth.router)
app.include_router(sync.router)
app.include_router(orders.router)


# ============ HEALTH CHECK ============

@app.get("/", tags=["Health"])
async def root():
    """Проверка здоровья приложения"""
    return {
        "message": "FunPay Analytics API работает",
        "status": "ok",
        "version": "2.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check эндпоинт"""
    return {
        "status": "healthy",
        "version": "2.0.0"
    }


# ============ ERROR HANDLERS ============

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Глобальный обработчик ошибок"""
    logger.error(f"Необработанная ошибка: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# ============ STARTUP/SHUTDOWN ============

@app.on_event("startup")
async def startup_event():
    """При старте приложения"""
    logger.info("🚀 FunPay Analytics API запущен")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    logger.info(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'SQLite'}")


@app.on_event("shutdown")
async def shutdown_event():
    """При остановке приложения"""
    logger.info("🛑 FunPay Analytics API остановлен")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
