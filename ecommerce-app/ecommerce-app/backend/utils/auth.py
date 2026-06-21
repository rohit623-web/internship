"""
utils/auth.py
--------------
Helper functions for:
- Hashing & verifying passwords (bcrypt)
- Creating & decoding JWT tokens
- Decorators to protect routes (login_required, admin_required)
"""

import os
import jwt
import bcrypt
from functools import wraps
from datetime import datetime, timedelta, timezone
from flask import request, jsonify

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "fallback_secret_change_me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


# ---------- Password Hashing ----------

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt. Returns a string to store in DB."""
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against the bcrypt hash stored in DB."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


# ---------- JWT Tokens ----------

def generate_token(user_id: int, role: str) -> str:
    """Create a JWT containing the user's id and role, valid for JWT_EXPIRY_HOURS."""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str):
    """Decode a JWT. Returns the payload dict, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ---------- Route Decorators ----------

def get_token_from_header():
    """Extract the Bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def login_required(f):
    """Decorator: requires a valid JWT. Attaches request.user = {user_id, role}."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        request.user = {"user_id": payload["user_id"], "role": payload["role"]}
        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator: requires a valid JWT AND role == 'admin'."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        if payload["role"] != "admin":
            return jsonify({"error": "Admin access required"}), 403

        request.user = {"user_id": payload["user_id"], "role": payload["role"]}
        return f(*args, **kwargs)

    return decorated
