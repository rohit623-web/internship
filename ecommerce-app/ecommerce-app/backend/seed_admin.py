"""
seed_admin.py
--------------
Run this ONCE after creating the database from database/schema.sql.
It properly bcrypt-hashes the admin password and updates the admin
user row (schema.sql inserts a placeholder password that isn't usable).

Run with:  python seed_admin.py
"""

from db import get_db_connection
from utils.auth import hash_password

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"  # change this after first login in a real deployment


def seed_admin():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        hashed = hash_password(ADMIN_PASSWORD)
        cursor.execute(
            "UPDATE users SET password = %s WHERE email = %s",
            (hashed, ADMIN_EMAIL),
        )
        conn.commit()

        if cursor.rowcount == 0:
            print(f"No user found with email {ADMIN_EMAIL}. "
                  f"Make sure you ran database/schema.sql first.")
        else:
            print(f"Admin password set successfully.")
            print(f"Login with -> email: {ADMIN_EMAIL} | password: {ADMIN_PASSWORD}")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    seed_admin()
