/* ==========================================
   api.js
   Central place for all backend API calls.
   Change API_BASE_URL if your Flask server runs elsewhere.
   ========================================== */

const API_BASE_URL = "http://127.0.0.1:5000/api";

/**
 * Generic fetch wrapper. Automatically attaches the JWT token
 * (if present) and parses JSON. Throws an Error with a readable
 * message on failure so callers can catch() and show it.
 */
async function apiRequest(endpoint, { method = "GET", body = null, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

/* ---------- Auth API ---------- */
const AuthAPI = {
  register: (name, email, password) =>
    apiRequest("/auth/register", { method: "POST", body: { name, email, password } }),

  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),

  me: () => apiRequest("/auth/me", { auth: true }),
};

/* ---------- Product API ---------- */
const ProductAPI = {
  getAll: (params = "") => apiRequest(`/products${params}`),
  getOne: (id) => apiRequest(`/products/${id}`),
  create: (product) => apiRequest("/products", { method: "POST", body: product, auth: true }),
  update: (id, product) => apiRequest(`/products/${id}`, { method: "PUT", body: product, auth: true }),
  remove: (id) => apiRequest(`/products/${id}`, { method: "DELETE", auth: true }),
};

/* ---------- Order API ---------- */
const OrderAPI = {
  place: (items, shipping_address) =>
    apiRequest("/orders", { method: "POST", body: { items, shipping_address }, auth: true }),

  myOrders: () => apiRequest("/orders/my-orders", { auth: true }),

  allOrders: () => apiRequest("/orders", { auth: true }),

  updateStatus: (id, status) =>
    apiRequest(`/orders/${id}/status`, { method: "PUT", body: { status }, auth: true }),
};
