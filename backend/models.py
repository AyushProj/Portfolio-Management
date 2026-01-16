from extensions import db
from datetime import datetime


class Portfolio(db.Model):
    __tablename__ = "portfolios"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    trades = db.relationship("Trade", backref="portfolio", lazy=True)


class Trade(db.Model):
    __tablename__ = "trades"

    id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(
        db.Integer,
        db.ForeignKey("portfolios.id"),
        nullable=False
    )

    symbol = db.Column(db.String(10), nullable=False)
    side = db.Column(db.String(4), nullable=False)  # BUY / SELL
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


# ✅ NEW: realized trades table (no dates, as you requested)
class RealizedTrade(db.Model):
    __tablename__ = "realized_trades"

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False)
    quantity_sold = db.Column(db.Integer, nullable=False)
    avg_buy_price = db.Column(db.Numeric(10, 2), nullable=False)
    sell_price = db.Column(db.Numeric(10, 2), nullable=False)
    realized_pnl = db.Column(db.Numeric(12, 2), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Stock(db.Model):
    __tablename__ = "stocks"

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100))
    exchange = db.Column(db.String(50))

    prices = db.relationship("Price", backref="stock", lazy=True)


class Price(db.Model):
    __tablename__ = "prices"

    id = db.Column(db.Integer, primary_key=True)
    stock_id = db.Column(
        db.Integer,
        db.ForeignKey("stocks.id"),
        nullable=False
    )

    date = db.Column(db.Date, nullable=False)
    open = db.Column(db.Numeric(10, 2))
    high = db.Column(db.Numeric(10, 2))
    low = db.Column(db.Numeric(10, 2))
    close = db.Column(db.Numeric(10, 2))
    volume = db.Column(db.BigInteger)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("stock_id", "date", name="uq_stock_date"),
    )
