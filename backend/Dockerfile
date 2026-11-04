FROM python:3.11-slim

WORKDIR /app

# Установим зависимости системы
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Установим зависимости Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Скопируем приложение
COPY . .

# Создаем переменные окружения по умолчанию
ENV PYTHONUNBUFFERED=1
ENV DEBUG=True

# Миграция БД и запуск приложения
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
