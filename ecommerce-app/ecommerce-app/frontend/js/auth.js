/* ==========================================
   auth.js
   Manages logged-in user state (stored in localStorage)
   and the navbar rendering used on every page.
   ========================================== */

const Auth = {
  getToken: () => localStorage.getItem("token"),

  getUser: () => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn: () => !!localStorage.getItem("token"),

  isAdmin: () => {
    const user = Auth.getUser();
    return !!user && user.role === "admin";
  },

  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  },
};

/**
 * Renders the navbar's right-hand links based on login state.
 * Call this on every page inside an element with id="navLinks".
 */
function renderNavLinks() {
  const el = document.getElementById("navLinks");
  if (!el) return;

  const user = Auth.getUser();
  const cartCount = Cart.getItemCount();

  let links = `<a href="index.html">Shop</a>`;
  links += `<a href="cart.html">Cart <span class="cart-badge">${cartCount}</span></a>`;

  if (user) {
    links += `<a href="orders.html">My Orders</a>`;
    if (user.role === "admin") {
      links += `<a href="admin-dashboard.html">Admin</a>`;
    }
    links += `<span style="color:var(--text-light); font-size:0.85rem;">Hi, ${user.name}</span>`;
    links += `<button onclick="Auth.logout()">Logout</button>`;
  } else {
    links += `<a href="login.html">Login</a>`;
    links += `<a href="register.html">Register</a>`;
  }

  el.innerHTML = links;
}

/* ==========================================
   Cart.js
   Simple cart stored in localStorage as an array of
   { product_id, name, price, image_url, quantity }
   ========================================== */

const Cart = {
  KEY: "cart_items",

  getItems: () => {
    const raw = localStorage.getItem(Cart.KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveItems: (items) => {
    localStorage.setItem(Cart.KEY, JSON.stringify(items));
  },

  addItem: (product, quantity = 1) => {
    const items = Cart.getItems();
    const existing = items.find((i) => i.product_id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        stock: product.stock,
        quantity,
      });
    }
    Cart.saveItems(items);
  },

  updateQuantity: (productId, quantity) => {
    let items = Cart.getItems();
    if (quantity <= 0) {
      items = items.filter((i) => i.product_id !== productId);
    } else {
      const item = items.find((i) => i.product_id === productId);
      if (item) item.quantity = quantity;
    }
    Cart.saveItems(items);
  },

  removeItem: (productId) => {
    const items = Cart.getItems().filter((i) => i.product_id !== productId);
    Cart.saveItems(items);
  },

  clear: () => {
    localStorage.removeItem(Cart.KEY);
  },

  getItemCount: () => Cart.getItems().reduce((sum, i) => sum + i.quantity, 0),

  getTotal: () => Cart.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0),
};

/* ---------- Small UI helper: toast notifications ---------- */
function showToast(message) {
  let toast = document.getElementById("globalToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "globalToast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}
