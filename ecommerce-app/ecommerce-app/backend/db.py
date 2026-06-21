"""
db.py
------
Handles the MySQL database connection for the whole app.
We use mysql-connector-python and a simple get_db_connection() helper
that every route file can import and call.
"""

import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    """
    Creates and returns a new MySQL database connection
    using credentials from the .env file.
    """
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "ecommerce_db"),
            port=int(os.getenv("DB_PORT", 3306)),
        )
        return connection
    except Error as e:
        print(f"[DB ERROR] Could not connect to MySQL: {e}")
        raise
