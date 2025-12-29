from datetime import date as date_type
from sqlalchemy import and_

from extensions import db
from models import Stock, Price


def get_price(symbol: str, date: str, price_type: str = "close") -> float:
    """
    Get stock price for a given symbol and date.
    Falls back to the most recent previous trading day.
    """
    if price_type not in {"open", "high", "low", "close"}:
        raise ValueError(f"Invalid price type: {price_type}")

    # Convert string -> date
    target_date = date_type.fromisoformat(date)

    # Find the stock
    stock = Stock.query.filter_by(symbol=symbol.upper()).first()
    if not stock:
        raise ValueError(f"Unknown stock symbol: {symbol}")

    # Find latest price ON or BEFORE the target date
    price_row = (
        Price.query
        .filter(
            and_(
                Price.stock_id == stock.id,
                Price.date <= target_date
            )
        )
        .order_by(Price.date.desc())
        .first()
    )

    if not price_row:
        raise ValueError(
            f"No price data for {symbol} on or before {date}"
        )

    return float(getattr(price_row, price_type))
