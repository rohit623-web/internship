"""
routes/auth_routes.py
----------------------
Handles user registration and login.
- POST /api/auth/register  -> create a new user (role defaults to 'user')
- POST /api/auth/login     -> verify credentials, return a JWT
- GET  /api/auth/me        -> return the currently logged-in user's info
"""

from flask import Blueprint, request, jsonify
from db import get_db_connection
from utils.auth import hash_password, verify_password, generate_token, login_required

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "An account with this email already exists"}), 409

        hashed_pw = hash_password(password)

        # Every public registration is a normal 'user'. Admins are created
        # separately (see database/seed.py) so random users can't self-promote.
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_pw, "user"),
        )
        conn.commit()

        new_user_id = cursor.lastrowid
        token = generate_token(new_user_id, "user")

        return jsonify({
            "message": "Registration successful",
            "token": token,
            "user": {"id": new_user_id, "name": name, "email": email, "role": "user"}
        }), 201

    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user or not verify_password(password, user["password"]):
            return jsonify({"error": "Invalid email or password"}), 401

        token = generate_token(user["id"], user["role"])

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            }
        }), 200

    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_current_user():
    from flask import request as flask_request
    user_id = flask_request.user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user), 200
    finally:
        cursor.close()
        conn.close()
