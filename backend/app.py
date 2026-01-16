from flask import Flask, request, jsonify
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from extensions import db
from models import Trade, Portfolio, Stock, Price, RealizedTrade
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
# Helpers (avg-cost accounting)
# -----------------------------
def compute_symbol_position_avg_cost(symbol: str):
    """
    Rolling average-cost method.
    Returns (qty, avg_cost) for the CURRENT open position for `symbol`.
    """
    trades = (
        Trade.query
        .filter_by(symbol=symbol)
        .order_by(Trade.timestamp.asc(), Trade.id.asc())
        .all()
    )

    qty = 0
    avg_cost = 0.0  # average cost of remaining open shares

    for t in trades:
        t_qty = int(t.quantity)
        t_price = float(t.price)

        if t.side == "BUY":
            # new avg = (old_cost + buy_cost) / new_qty
            new_qty = qty + t_qty
            if new_qty > 0:
                avg_cost = ((avg_cost * qty) + (t_price * t_qty)) / new_qty
            qty = new_qty

        elif t.side == "SELL":
            # reduce qty using current avg_cost (realized handled separately)
            sell_qty = min(t_qty, qty)
            qty -= sell_qty
            if qty == 0:
                avg_cost = 0.0

    return qty, avg_cost


# -----------------------------
# Simulation endpoints
# -----------------------------
@app.route("/sim/state", methods=["GET"])
def sim_state():
    return jsonify({
        "running": SIM_STATE["running"],
        "interval_sec": SIM_STATE["interval_sec"],
        "start_date": SIM_STATE["start_date"],
        "current_date": SIM_STATE["current_date"],
        "prices": SIM_STATE["prices"],
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
# Trades (BUY/SELL)
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

    if side not in {"BUY", "SELL"}:
        return jsonify({"error": "side must be BUY or SELL"}), 400

    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify({"error": "quantity must be a positive integer"}), 400

    try:
        trade_timestamp = datetime.fromisoformat(date_str)  # expects YYYY-MM-DD
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    portfolio = Portfolio.query.first()
    if not portfolio:
        return jsonify({"error": "No portfolio found"}), 500

    # execution price from dataset OPEN
    try:
        exec_price = float(get_price(symbol, date_str, price_type="open"))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # ✅ SELL validation + realized trade write
    if side == "SELL":
        owned_qty, avg_cost = compute_symbol_position_avg_cost(symbol)

        if quantity > owned_qty:
            return jsonify({
                "error": f"Cannot sell {quantity}. You only own {owned_qty} shares."
            }), 400

        realized_pnl = (exec_price - avg_cost) * quantity

        realized_row = RealizedTrade(
            symbol=symbol,
            quantity_sold=quantity,
            avg_buy_price=round(avg_cost, 2),
            sell_price=round(exec_price, 2),
            realized_pnl=round(realized_pnl, 2),
        )
        db.session.add(realized_row)

    # record trade in immutable ledger
    trade = Trade(
        portfolio_id=portfolio.id,
        symbol=symbol,
        side=side,
        quantity=quantity,
        price=exec_price,
        timestamp=trade_timestamp
    )

    db.session.add(trade)
    db.session.commit()

    # keep your sim alignment behavior
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


# ✅ NEW: realized trades endpoint
@app.route("/realized-trades", methods=["GET"])
def get_realized_trades():
    rows = RealizedTrade.query.order_by(RealizedTrade.id.desc()).all()
    return jsonify([
        {
            "id": r.id,
            "symbol": r.symbol,
            "quantity_sold": int(r.quantity_sold),
            "avg_buy_price": float(r.avg_buy_price),
            "sell_price": float(r.sell_price),
            "realized_pnl": float(r.realized_pnl),
        }
        for r in rows
    ])


# -----------------------------
# Positions (net shares)
# -----------------------------
@app.route("/positions", methods=["GET"])
def get_positions():
    symbols = [s[0] for s in db.session.query(Trade.symbol).distinct().all()]
    positions = {}

    for symbol in symbols:
        qty, _avg = compute_symbol_position_avg_cost(symbol)
        if qty != 0:
            positions[symbol] = qty

    return jsonify(positions)


# -----------------------------
# Unrealized PnL (dynamic via sim date)
# -----------------------------
@app.route("/pnl", methods=["GET"])
def get_pnl():
    sim_date = SIM_STATE["current_date"]

    symbols = [s[0] for s in db.session.query(Trade.symbol).distinct().all()]
    result = {}

    for symbol in symbols:
        qty, avg_cost = compute_symbol_position_avg_cost(symbol)
        if qty == 0:
            continue

        try:
            if sim_date:
                current_price = float(get_price(symbol, sim_date, price_type="open"))
            else:
                current_price = float(get_price(symbol, datetime.utcnow().date().isoformat(), price_type="open"))
        except Exception:
            continue

        cost_basis = avg_cost * qty
        market_value = current_price * qty
        unrealized_pnl = market_value - cost_basis

        result[symbol] = {
            "quantity": qty,
            "avg_cost": round(avg_cost, 2),
            "current_price": round(current_price, 2),
            "cost_basis": round(cost_basis, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "sim_date": sim_date
        }

    return jsonify(result)


# -----------------------------
# Prices
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
    with app.app_context():
        # ✅ ensure new table exists
        db.create_all()

        start_background_thread(app)
        start_or_restart_simulation(interval_sec=2)

    app.run(debug=True)
