import threading
import time
from datetime import datetime
from sqlalchemy import func

from extensions import db
from models import Trade, Stock, Price
from services.price_service import get_price


SIM_STATE = {
    "running": False,
    "interval_sec": 2,
    "calendar": [],          # list[date]
    "idx": 0,
    "start_date": None,      # iso str
    "current_date": None,    # iso str
    "prices": {},            # { "AAPL": 123.45, ... } (OPEN)
}


def _build_calendar(start_date):
    """
    Master calendar for simulation: all unique trading dates >= start_date across Price table.
    """
    dates = (
        db.session.query(Price.date)
        .filter(Price.date >= start_date)
        .distinct()
        .order_by(Price.date.asc())
        .all()
    )
    return [d[0] for d in dates]


def _latest_buy_date():
    """
    Start simulation from the MOST RECENT BUY trade date (your requirement).
    If no BUY exists, return None.
    """
    latest_buy_ts = (
        db.session.query(func.max(Trade.timestamp))
        .filter(Trade.side == "BUY")
        .scalar()
    )
    if not latest_buy_ts:
        return None
    return latest_buy_ts.date()


def start_or_restart_simulation(interval_sec=2) -> bool:
    """
    Rebuild calendar starting from latest BUY date and reset sim index.
    Returns True if simulation started, False if no BUY exists.
    """
    start_dt = _latest_buy_date()
    if not start_dt:
        SIM_STATE.update({
            "running": False,
            "interval_sec": interval_sec,
            "calendar": [],
            "idx": 0,
            "start_date": None,
            "current_date": None,
            "prices": {}
        })
        return False

    cal = _build_calendar(start_dt)

    SIM_STATE["interval_sec"] = interval_sec
    SIM_STATE["calendar"] = cal
    SIM_STATE["idx"] = 0
    SIM_STATE["start_date"] = start_dt.isoformat()
    SIM_STATE["current_date"] = cal[0].isoformat() if cal else start_dt.isoformat()
    SIM_STATE["prices"] = {}
    SIM_STATE["running"] = True
    return True


def advance_one_tick():
    """
    Move simulation forward by 1 trading day (one entry in calendar).
    Update current_date and per-symbol OPEN prices.
    """
    cal = SIM_STATE["calendar"]
    i = SIM_STATE["idx"]

    if not SIM_STATE["running"] or not cal:
        return

    if i >= len(cal):
        SIM_STATE["running"] = False
        return

    d = cal[i]
    SIM_STATE["current_date"] = d.isoformat()

    # Update OPEN prices for all stocks that exist in DB
    # (get_price already falls back to most recent <= date)
    prices = {}
    stocks = Stock.query.all()
    for s in stocks:
        try:
            prices[s.symbol] = float(get_price(s.symbol, d.isoformat(), price_type="open"))
        except Exception:
            # if no data, just skip
            pass

    SIM_STATE["prices"] = prices
    SIM_STATE["idx"] = i + 1


def _loop(app):
    """
    Background thread loop. Runs forever, but only advances while SIM_STATE['running'] == True.
    """
    while True:
        if SIM_STATE["running"]:
            with app.app_context():
                advance_one_tick()
            time.sleep(SIM_STATE["interval_sec"])
        else:
            time.sleep(1)


def start_background_thread(app):
    """
    Safe to call once at startup.
    """
    t = threading.Thread(target=_loop, args=(app,), daemon=True)
    t.start()
