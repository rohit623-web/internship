# 🛍️ ShopEasy — E-Commerce Web Application

A basic online store built for an internship project. Includes a product catalog, cart, checkout, user authentication with role-based access (Admin/User), and order tracking — backed by a Flask REST API and MySQL database.

## Tech Stack

- **Backend:** Python (Flask), Flask-CORS, PyJWT, bcrypt
- **Database:** MySQL
- **Frontend:** Plain HTML, CSS, JavaScript (no framework)
- **Auth:** JWT tokens + bcrypt password hashing, role-based access control (admin/user)

## Features

- 🛒 Product catalog with search, add to cart, and checkout
- 🔐 User registration/login with JWT auth
- 👑 Role-based access — Admin can manage products & orders, Users can shop & track their orders
- 📦 Order placement with automatic stock deduction
- 📊 Admin dashboard: create/edit/delete products, view & update order status
- 🧾 Order tracking page for customers (pending → processing → shipped → delivered)

## Project Structure

```
ecommerce-app/
├── backend/
│   ├── app.py                 # Flask app entry point
│   ├── db.py                  # MySQL connection helper
│   ├── seed_admin.py          # One-time script to set admin password
│   ├── requirements.txt
│   ├── .env.example           # Copy to .env and fill in your values
│   ├── routes/
│   │   ├── auth_routes.py     # /api/auth/*
│   │   ├── product_routes.py  # /api/products/*
│   │   └── order_routes.py    # /api/orders/*
│   └── utils/
│       └── auth.py            # JWT + bcrypt helpers, route decorators
├── frontend/
│   ├── index.html             # Product catalog (home page)
│   ├── login.html
│   ├── register.html
│   ├── cart.html
│   ├── checkout.html
│   ├── order-success.html
│   ├── orders.html            # Customer order tracking
│   ├── admin-dashboard.html   # Admin: manage products & orders
│   ├── css/style.css
│   └── js/
│       ├── api.js             # All fetch() calls to the backend
│       └── auth.js            # Login state + cart (localStorage)
├── database/
│   └── schema.sql             # MySQL tables + sample seed data
└── .gitignore
```

## Setup Instructions (VS Code)

### 1. Prerequisites
- Python 3.10+
- MySQL Server installed and running
- VS Code with the Python extension

### 2. Database Setup
Open MySQL (e.g. via MySQL Workbench or the `mysql` CLI) and run:
```bash
mysql -u root -p < database/schema.sql
```
This creates the `ecommerce_db` database with all tables and sample products.

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Copy the environment file and fill in your real MySQL credentials:
```bash
cp .env.example .env
```
Edit `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=ecommerce_db
DB_PORT=3306
SECRET_KEY=some_random_string
JWT_SECRET_KEY=another_random_string
```

Set up the admin account password (the SQL seed inserts a placeholder hash):
```bash
python seed_admin.py
```
This prints the admin login: `admin@example.com` / `admin123`

Run the Flask server:
```bash
python app.py
```
The API will be running at **http://127.0.0.1:5000**

### 4. Frontend Setup
The frontend is plain HTML/CSS/JS — no build step needed.

In VS Code, install the **Live Server** extension, then right-click `frontend/index.html` → **Open with Live Server**.

> The frontend calls the API at `http://127.0.0.1:5000/api` (see `frontend/js/api.js`). If your Flask server runs on a different port, update `API_BASE_URL` there.

### 5. Try It Out
- Visit the home page → browse products → add to cart → checkout (requires login)
- Register a new account to shop as a normal user
- Log in as `admin@example.com` / `admin123` to access the Admin Dashboard and manage products/orders

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | User | Get current user info |
| GET | `/api/products` | — | List all products (`?search=`, `?category=`) |
| GET | `/api/products/<id>` | — | Get one product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/<id>` | Admin | Update product |
| DELETE | `/api/products/<id>` | Admin | Delete product |
| POST | `/api/orders` | User | Place an order (checkout) |
| GET | `/api/orders/my-orders` | User | View my order history |
| GET | `/api/orders` | Admin | View all orders |
| PUT | `/api/orders/<id>/status` | Admin | Update order status |

## Notes / Possible Improvements
- Add pagination for large product catalogs
- Add product image upload instead of URL-only
- Add email notifications on order status change
- Add unit tests (pytest) for the API routes
- Deploy backend (Render/Railway) + frontend (Netlify/Vercel/GitHub Pages)
