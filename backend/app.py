from flask import Flask, request, jsonify
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from extensions import db
from models import Trade, Portfolio, Stock, Price
from services.price_service import get_price
from flask_cors import CORS
from datetime import datetime

from services.sim_engine import (
    SIM_STATE,
    start_background_thread,
    start_or_restart_simulation
)

app = Flask(__name__)

CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True
)

app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
db.init_app(app)


@app.route("/")
def home():
    return {"status": "ok", "message": "Backend running with DB"}


# -----------------------------
# Simulation endpoints (NEW)
# -----------------------------
@app.route("/sim/state", methods=["GET"])
def sim_state():
    return jsonify({
        "running": SIM_STATE["running"],
        "interval_sec": SIM_STATE["interval_sec"],
        "start_date": SIM_STATE["start_date"],
        "current_date": SIM_STATE["current_date"],
        "prices": SIM_STATE["prices"],  # OPEN prices
        "idx": SIM_STATE["idx"],
        "calendar_len": len(SIM_STATE["calendar"]),
    })


@app.route("/sim/restart", methods=["POST"])
def sim_restart():
    started = start_or_restart_simulation(interval_sec=2)
    return jsonify({
        "started": started,
        "start_date": SIM_STATE["start_date"],
        "current_date": SIM_STATE["current_date"],
    })


# -----------------------------
# Trades
# -----------------------------
@app.route("/trades", methods=["POST"])
def create_trade():
    data = request.get_json()

    required_fields = {"symbol", "side", "quantity", "date"}
    if not data or not required_fields.issubset(data):
        return jsonify({"error": "Missing required fields"}), 400

    symbol = data["symbol"].upper()
    side = data["side"].upper()
    quantity = data["quantity"]
    date_str = data["date"]

    try:
        # expects YYYY-MM-DD
        trade_timestamp = datetime.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if side not in {"BUY", "SELL"}:
        return jsonify({"error": "side must be BUY or SELL"}), 400

    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify({"error": "quantity must be a positive integer"}), 400

    portfolio = Portfolio.query.first()
    if not portfolio:
        return jsonify({"error": "No portfolio found"}), 500

    # Use OPEN or CLOSE? You previously used default close in get_price().
    # Your charts use OPEN, so we align trades to OPEN too:
    try:
        price = get_price(symbol, date_str, price_type="open")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    trade = Trade(
        portfolio_id=portfolio.id,
        symbol=symbol,
        side=side,
        quantity=quantity,
        price=price,
        timestamp=trade_timestamp
    )

    db.session.add(trade)
    db.session.commit()

    # Optional: restart sim so it aligns to latest BUY immediately
    # (your requirement: start from most recent buy date)
    start_or_restart_simulation(interval_sec=2)

    return jsonify({"message": "Trade executed successfully"}), 201


@app.route("/trades", methods=["GET"])
def get_trades():
    trades = Trade.query.order_by(Trade.timestamp.desc()).all()
    return jsonify([
        {
            "id": t.id,
            "portfolio_id": t.portfolio_id,
            "symbol": t.symbol,
            "side": t.side,
            "quantity": t.quantity,
            "price": float(t.price),
            "timestamp": t.timestamp.isoformat()
        }
        for t in trades
    ])


# -----------------------------
# Positions
# -----------------------------
@app.route("/positions", methods=["GET"])
def get_positions():
    trades = Trade.query.all()
    positions = {}

    for trade in trades:
        qty = trade.quantity if trade.side == "BUY" else -trade.quantity
        positions.setdefault(trade.symbol, 0)
        positions[trade.symbol] += qty

    return jsonify(positions)


# -----------------------------
# Unrealized PnL (UPDATED)
# Now uses SIM_STATE["current_date"] so it changes as sim advances.
# -----------------------------
@app.route("/pnl", methods=["GET"])
def get_pnl():
    trades = Trade.query.all()

    # Aggregate into net quantity + total_cost
    positions = {}
    for trade in trades:
        symbol = trade.symbol
        qty = trade.quantity if trade.side == "BUY" else -trade.quantity
        cost = float(trade.price) * qty

        if symbol not in positions:
            positions[symbol] = {"quantity": 0, "total_cost": 0.0}

        positions[symbol]["quantity"] += qty
        positions[symbol]["total_cost"] += cost

    # Use simulated date if running, else fallback to latest BUY align or today
    sim_date = SIM_STATE["current_date"]

    result = {}
    for symbol, data in positions.items():
        quantity = data["quantity"]
        if quantity == 0:
            continue

        avg_cost = data["total_cost"] / quantity

        # Current price = simulated OPEN price at sim_date
        # If sim not running, fallback to get_price for today (or last available)
        try:
            if sim_date:
                current_price = float(get_price(symbol, sim_date, price_type="open"))
            else:
                current_price = float(get_price(symbol, datetime.utcnow().date().isoformat(), price_type="open"))
        except Exception:
            continue

        market_value = current_price * quantity
        cost_basis = avg_cost * quantity
        unrealized_pnl = market_value - cost_basis

        result[symbol] = {
            "quantity": quantity,
            "avg_cost": round(avg_cost, 2),
            "current_price": round(current_price, 2),
            "cost_basis": round(cost_basis, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "sim_date": sim_date
        }

    return jsonify(result)


# -----------------------------
# Prices (unchanged)
# -----------------------------
@app.route("/prices/<symbol>", methods=["GET"])
def get_prices(symbol):
    stock = Stock.query.filter_by(symbol=symbol.upper()).first()
    if not stock:
        return jsonify({"error": "Unknown symbol"}), 404

    prices = (
        Price.query
        .filter_by(stock_id=stock.id)
        .order_by(Price.date.asc())
        .all()
    )

    return jsonify([
        {"date": p.date.isoformat(), "open": float(p.open)}
        for p in prices
        if p.open is not None
    ])


if __name__ == "__main__":
    # Start simulation thread + initialize simulation once at startup
    with app.app_context():
        start_background_thread(app)
        start_or_restart_simulation(interval_sec=2)

    app.run(debug=True)
