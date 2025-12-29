import pandas as pd
from pathlib import Path
from decimal import Decimal

from app import app
from extensions import db
from models import Stock, Price


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


STOCK_METADATA = {
    "AAPL": {"name": "Apple Inc.", "exchange": "NASDAQ"},
    "MSFT": {"name": "Microsoft Corp.", "exchange": "NASDAQ"},
    "AMZN": {"name": "Amazon.com Inc.", "exchange": "NASDAQ"},
    "TSLA": {"name": "Tesla Inc.", "exchange": "NASDAQ"},
    "NFLX": {"name": "Netflix Inc.", "exchange": "NASDAQ"},
}

def clean_decimal(value):
    if pd.isna(value):
        return None
    return Decimal(str(value).replace(",", "").replace("$", ""))



def load_csv(symbol: str) -> pd.DataFrame:
    file_path = DATA_DIR / f"{symbol}.csv"

    if not file_path.exists():
        raise FileNotFoundError(f"CSV not found for {symbol}")

    df = pd.read_csv(file_path)

    # normalize column names
    df.columns = [c.lower() for c in df.columns]

    # parse date
    df["date"] = pd.to_datetime(df["date"]).dt.date

    # sort oldest → newest
    df = df.sort_values("date").reset_index(drop=True)

    return df


def get_or_create_stock(symbol: str) -> Stock:
    stock = Stock.query.filter_by(symbol=symbol).first()

    if stock:
        return stock

    meta = STOCK_METADATA.get(symbol, {})
    stock = Stock(
        symbol=symbol,
        name=meta.get("name"),
        exchange=meta.get("exchange"),
    )

    db.session.add(stock)
    db.session.commit()

    return stock


def import_prices_for_symbol(symbol: str):
    print(f"Importing {symbol}...")

    df = load_csv(symbol)
    stock = get_or_create_stock(symbol)

    existing_dates = {
        p.date for p in Price.query.filter_by(stock_id=stock.id).all()
    }

    new_prices = []

    for _, row in df.iterrows():
        if row["date"] in existing_dates:
            continue

        price = Price(
            stock_id=stock.id,
            date=row["date"],
            open=clean_decimal(row["open"]),
            high=clean_decimal(row["high"]),
            low=clean_decimal(row["low"]),
            close=clean_decimal(row["close"]),
            volume=int(str(row["volume"]).replace(",", "")),
        )

        new_prices.append(price)

    if new_prices:
        db.session.bulk_save_objects(new_prices)
        db.session.commit()

    print(f"{symbol}: {len(new_prices)} rows inserted")


def run_import():
    with app.app_context():
        for symbol in STOCK_METADATA.keys():
            import_prices_for_symbol(symbol)

        print("Import completed successfully.")


if __name__ == "__main__":
    run_import()
