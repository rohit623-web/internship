"""
routes/product_routes.py
--------------------------
Product catalog management.

Public:
  GET    /api/products          -> list all products (supports ?category= & ?search=)
  GET    /api/products/<id>     -> get one product

Admin only:
  POST   /api/products          -> create a product
  PUT    /api/products/<id>     -> update a product
  DELETE /api/products/<id>     -> delete a product
"""

from flask import Blueprint, request, jsonify
from db import get_db_connection
from utils.auth import admin_required

product_bp = Blueprint("product_bp", __name__)


@product_bp.route("", methods=["GET"])
def get_products():
    category = request.args.get("category")
    search = request.args.get("search")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM products WHERE 1=1"
        params = []

        if category:
            query += " AND category = %s"
            params.append(category)

        if search:
            query += " AND (name LIKE %s OR description LIKE %s)"
            like_term = f"%{search}%"
            params.extend([like_term, like_term])

        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        products = cursor.fetchall()
        return jsonify(products), 200
    finally:
        cursor.close()
        conn.close()


@product_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        return jsonify(product), 200
    finally:
        cursor.close()
        conn.close()


@product_bp.route("", methods=["POST"])
@admin_required
def create_product():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    price = data.get("price")
    stock = data.get("stock", 0)

    if not name or price is None:
        return jsonify({"error": "name and price are required"}), 400

    try:
        price = float(price)
        stock = int(stock)
    except (ValueError, TypeError):
        return jsonify({"error": "price must be a number and stock must be an integer"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO products (name, description, price, stock, category, image_url)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                name,
                data.get("description", ""),
                price,
                stock,
                data.get("category", ""),
                data.get("image_url", ""),
            ),
        )
        conn.commit()
        return jsonify({"message": "Product created", "id": cursor.lastrowid}), 201
    finally:
        cursor.close()
        conn.close()


@product_bp.route("/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    data = request.get_json(silent=True) or {}

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Product not found"}), 404

        # Use existing values as fallback if a field isn't provided
        name = data.get("name", existing["name"])
        description = data.get("description", existing["description"])
        price = data.get("price", existing["price"])
        stock = data.get("stock", existing["stock"])
        category = data.get("category", existing["category"])
        image_url = data.get("image_url", existing["image_url"])

        cursor.execute(
            """UPDATE products
               SET name=%s, description=%s, price=%s, stock=%s, category=%s, image_url=%s
               WHERE id=%s""",
            (name, description, price, stock, category, image_url, product_id),
        )
        conn.commit()
        return jsonify({"message": "Product updated"}), 200
    finally:
        cursor.close()
        conn.close()


@product_bp.route("/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Product not found"}), 404

        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.commit()
        return jsonify({"message": "Product deleted"}), 200
    finally:
        cursor.close()
        conn.close()
