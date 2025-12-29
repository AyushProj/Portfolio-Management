from flask import Flask, request, jsonify
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from extensions import db
from models import Trade, Portfolio
from services.price_service import get_price

app = Flask(__name__)

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
        price=price
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




if __name__ == "__main__":
    app.run(debug=True)
