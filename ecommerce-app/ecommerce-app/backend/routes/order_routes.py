"""
routes/order_routes.py
------------------------
Order placement (checkout) and order tracking.

User:
  POST /api/orders            -> place an order (checkout) from a list of cart items
  GET  /api/orders/my-orders  -> view my own order history

Admin:
  GET  /api/orders            -> view ALL orders (order tracking / management)
  PUT  /api/orders/<id>/status -> update an order's status (pending -> shipped -> delivered, etc.)
"""

from flask import Blueprint, request, jsonify
from db import get_db_connection
from utils.auth import login_required, admin_required

order_bp = Blueprint("order_bp", __name__)

VALID_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled"}


@order_bp.route("", methods=["POST"])
@login_required
def place_order():
    """
    Expected JSON body:
    {
      "items": [{"product_id": 1, "quantity": 2}, {"product_id": 3, "quantity": 1}],
      "shipping_address": "123 Main St, City"
    }
    """
    data = request.get_json(silent=True) or {}
    items = data.get("items")
    shipping_address = data.get("shipping_address", "")

    if not items or not isinstance(items, list):
        return jsonify({"error": "items must be a non-empty list"}), 400

    user_id = request.user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        total_amount = 0
        validated_items = []

        # Validate each item: product must exist and have enough stock
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity")

            if not product_id or not quantity or quantity <= 0:
                return jsonify({"error": "Each item needs a valid product_id and quantity"}), 400

            cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = cursor.fetchone()

            if not product:
                return jsonify({"error": f"Product {product_id} not found"}), 404

            if product["stock"] < quantity:
                return jsonify({
                    "error": f"Not enough stock for '{product['name']}'. Available: {product['stock']}"
                }), 400

            line_total = float(product["price"]) * quantity
            total_amount += line_total
            validated_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "price": product["price"],
            })

        # Create the order
        cursor.execute(
            "INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES (%s, %s, %s, %s)",
            (user_id, total_amount, "pending", shipping_address),
        )
        order_id = cursor.lastrowid

        # Insert order items and decrement stock
        for item in validated_items:
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (order_id, item["product_id"], item["quantity"], item["price"]),
            )
            cursor.execute(
                "UPDATE products SET stock = stock - %s WHERE id = %s",
                (item["quantity"], item["product_id"]),
            )

        conn.commit()

        return jsonify({
            "message": "Order placed successfully",
            "order_id": order_id,
            "total_amount": total_amount,
            "status": "pending",
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Could not place order: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@order_bp.route("/my-orders", methods=["GET"])
@login_required
def get_my_orders():
    user_id = request.user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC", (user_id,)
        )
        orders = cursor.fetchall()

        # Attach line items to each order
        for order in orders:
            cursor.execute(
                """SELECT oi.*, p.name AS product_name, p.image_url
                   FROM order_items oi
                   JOIN products p ON oi.product_id = p.id
                   WHERE oi.order_id = %s""",
                (order["id"],),
            )
            order["items"] = cursor.fetchall()

        return jsonify(orders), 200
    finally:
        cursor.close()
        conn.close()


@order_bp.route("", methods=["GET"])
@admin_required
def get_all_orders():
    """Admin: view and track every order in the system."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT o.*, u.name AS customer_name, u.email AS customer_email
               FROM orders o
               JOIN users u ON o.user_id = u.id
               ORDER BY o.created_at DESC"""
        )
        orders = cursor.fetchall()

        for order in orders:
            cursor.execute(
                """SELECT oi.*, p.name AS product_name
                   FROM order_items oi
                   JOIN products p ON oi.product_id = p.id
                   WHERE oi.order_id = %s""",
                (order["id"],),
            )
            order["items"] = cursor.fetchall()

        return jsonify(orders), 200
    finally:
        cursor.close()
        conn.close()


@order_bp.route("/<int:order_id>/status", methods=["PUT"])
@admin_required
def update_order_status(order_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")

    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM orders WHERE id = %s", (order_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Order not found"}), 404

        cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
        conn.commit()
        return jsonify({"message": f"Order status updated to '{new_status}'"}), 200
    finally:
        cursor.close()
        conn.close()
