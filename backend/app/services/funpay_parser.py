"""
Сервис для парсинга заказов с FunPay
"""
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Optional
import logging
import re

from app.core.config import settings

logger = logging.getLogger(__name__)

MONTHS_RU = {
    'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4,
    'мая': 5, 'июня': 6, 'июля': 7, 'августа': 8,
    'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12
}


class FunPayParsingError(Exception):
    pass


class FunPayParser:

    def __init__(self, golden_key: str):
        self.golden_key = golden_key
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ru-RU,ru;q=0.9',
        }

    async def fetch_orders(self) -> List[dict]:
        try:
            html = await self._fetch_page()
            orders = self._parse_orders(html)
            logger.info(f"✅ Спарсено {len(orders)} заказов")
            return orders
        except httpx.TimeoutException:
            raise FunPayParsingError("Таймаут запроса к FunPay")
        except Exception as e:
            raise FunPayParsingError(f"Ошибка парсинга: {e}")

    async def _fetch_page(self) -> str:
        cookies = {'golden_key': self.golden_key}
        async with httpx.AsyncClient(
            headers=self.headers,
            cookies=cookies,
            follow_redirects=True,
            timeout=float(settings.FUNPAY_TIMEOUT)
        ) as client:
            response = await client.get(f'{settings.FUNPAY_BASE_URL}/orders/trade')
            response.raise_for_status()
            if 'login' in str(response.url).lower():
                raise FunPayParsingError("Неверный golden_key")
            return response.text

    def _parse_orders(self, html: str) -> List[dict]:
        soup = BeautifulSoup(html, 'html.parser')
        orders = []

        # Каждый заказ — это ссылка с классом tc-item
        items = soup.select('a.tc-item')
        logger.info(f"Найдено элементов tc-item: {len(items)}")

        for item in items:
            try:
                order = self._parse_item(item)
                if order:
                    orders.append(order)
            except Exception as e:
                logger.warning(f"Ошибка парсинга строки: {e}")
                continue

        return orders

    def _parse_item(self, item) -> Optional[dict]:
        # Номер заказа из .tc-order (например "#ZDVUM11K")
        order_elem = item.select_one('.tc-order')
        if not order_elem:
            return None
        order_id = order_elem.get_text(strip=True).lstrip('#')

        # Дата из .tc-date-time (например "23 декабря 2025, 23:46")
        date_elem = item.select_one('.tc-date-time')
        date_text = date_elem.get_text(strip=True) if date_elem else ''
        order_date = self._parse_date(date_text)

        # Описание
        desc_elem = item.select_one('.order-desc')
        if desc_elem:
            # Берём только первый div (основное описание, без подзаголовка)
            first_div = desc_elem.find('div')
            description = first_div.get_text(strip=True) if first_div else desc_elem.get_text(strip=True)
        else:
            description = ''

        # Покупатель из .tc-user
        buyer_elem = item.select_one('.media-user-name')
        buyer = buyer_elem.get_text(strip=True) if buyer_elem else ''


        # Статус из .tc-status
        status_elem = item.select_one('.tc-status')
        status = status_elem.get_text(strip=True) if status_elem else 'Неизвестно'

        # Сумма из .tc-price.tc-seller-sum
        price_elem = item.select_one('.tc-price.tc-seller-sum')
        if not price_elem:
            # Запасной вариант
            price_elem = item.select_one('.tc-price')

        amount = self._parse_amount(price_elem.get_text(strip=True) if price_elem else '')
        if amount is None:
            logger.warning(f"Сумма не найдена для заказа {order_id}")
            return None

        return {
            'date': order_date,
            'order_id': order_id,
            'description': description,
            'buyer': buyer,
            'status': status,
            'amount': amount
        }

    def _parse_amount(self, text: str) -> Optional[float]:
        if not text:
            return None
        # Убираем ₽, пробелы, заменяем запятую на точку
        text = text.replace('₽', '').replace(' ', '').replace(',', '.').strip()
        # Оставляем только цифры и точку
        text = re.sub(r'[^\d.]', '', text)
        try:
            val = float(text)
            return round(val, 2) if val > 0 else None
        except ValueError:
            return None

    def _parse_date(self, text: str) -> Optional[datetime]:
        """
        Парсит дату вида "23 декабря 2025, 23:46"
        """
        if not text:
            return None
        try:
            # Паттерн: "23 декабря 2025, 23:46"
            match = re.match(
                r'(\d{1,2})\s+(\w+)\s+(\d{4}),\s+(\d{1,2}):(\d{2})',
                text.strip()
            )
            if match:
                day = int(match.group(1))
                month_name = match.group(2).lower()
                year = int(match.group(3))
                hour = int(match.group(4))
                minute = int(match.group(5))
                month = MONTHS_RU.get(month_name)
                if month:
                    return datetime(year, month, day, hour, minute)
        except Exception as e:
            logger.warning(f"Ошибка парсинга даты '{text}': {e}")
        return None