"""
app.py
-------
Main Flask application entry point.
Registers blueprints (routes) and starts the server.

Run with:  python app.py
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from routes.auth_routes import auth_bp
from routes.product_routes import product_bp
from routes.order_routes import order_bp

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret")

# Allow the frontend (served separately, e.g. Live Server on a different port)
# to call this API from the browser.
CORS(app)

# Register route blueprints under /api/...
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(product_bp, url_prefix="/api/products")
app.register_blueprint(order_bp, url_prefix="/api/orders")


@app.route("/")
def index():
    return jsonify({
        "message": "E-Commerce API is running",
        "endpoints": {
            "auth": "/api/auth/register, /api/auth/login, /api/auth/me",
            "products": "/api/products",
            "orders": "/api/orders, /api/orders/my-orders"
        }
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
