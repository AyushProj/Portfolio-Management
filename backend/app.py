from flask import Flask, request, jsonify
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from extensions import db
from models import Trade, Portfolio
from services.price_service import get_price
from datetime import date as date_type
from flask_cors import CORS
from models import Trade, Portfolio, Stock, Price
from datetime import datetime



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

    try:
        price = get_price(symbol, date_str)
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

    return jsonify({
        "message": "Trade executed successfully"
    }), 201


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


@app.route("/positions", methods=["GET"])
def get_positions():
    trades = Trade.query.all()

    positions = {}

    for trade in trades:
        qty = trade.quantity if trade.side == "BUY" else -trade.quantity

        if trade.symbol not in positions:
            positions[trade.symbol] = 0

        positions[trade.symbol] += qty

    return jsonify(positions)

@app.route("/pnl", methods=["GET"])
def get_pnl():
    trades = Trade.query.all()

    positions = {}

    # Aggregate trades
    for trade in trades:
        symbol = trade.symbol
        qty = trade.quantity if trade.side == "BUY" else -trade.quantity
        cost = float(trade.price) * qty

        if symbol not in positions:
            positions[symbol] = {
                "quantity": 0,
                "total_cost": 0.0
            }

        positions[symbol]["quantity"] += qty
        positions[symbol]["total_cost"] += cost

    result = {}
    today = date_type.today().isoformat()

    for symbol, data in positions.items():
        quantity = data["quantity"]

        # Ignore closed positions
        if quantity == 0:
            continue

        avg_cost = data["total_cost"] / quantity

        # Current market price (weekend-safe)
        try:
            current_price = float(get_price(symbol, today))
        except ValueError:
            continue

        market_value = current_price * quantity
        cost_basis = avg_cost * quantity
        unrealized_pnl = market_value - cost_basis

        result[symbol] = {
            "quantity": quantity,
            "avg_cost": round(avg_cost, 2),
            "current_price": round(current_price, 2),
            "market_value": round(market_value, 2),
            "cost_basis": round(cost_basis, 2),
            "unrealized_pnl": round(unrealized_pnl, 2)
        }

    return jsonify(result)

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
        {
            "date": p.date.isoformat(),
            "open": float(p.open)
        }
        for p in prices
        if p.open is not None
    ])



if __name__ == "__main__":
    app.run(debug=True)
