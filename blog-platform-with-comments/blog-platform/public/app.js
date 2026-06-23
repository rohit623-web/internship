const API = '/api';
const app = document.getElementById('app');
const navActions = document.getElementById('nav-actions');

// ---------------- Auth helpers ----------------
function getToken() { return localStorage.getItem('token'); }
function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function timeAgo(dateStr) {
  const date = new Date(dateStr.includes('Z') ? dateStr : dateStr + 'Z');
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---------------- Nav rendering ----------------
function renderNav() {
  const user = getUser();
  if (user) {
    navActions.innerHTML = `
      <span class="username-pill">Hi, ${escapeHtml(user.username)}</span>
      <a href="#/new" class="btn btn-primary">New Post</a>
      <button id="logout-btn" class="btn btn-ghost">Logout</button>
    `;
    document.getElementById('logout-btn').onclick = () => {
      clearAuth();
      location.hash = '#/';
      renderNav();
    };
  } else {
    navActions.innerHTML = `
      <a href="#/login" class="btn btn-ghost">Login</a>
      <a href="#/register" class="btn btn-primary">Sign up</a>
    `;
  }
}

// ---------------- Router ----------------
async function router() {
  const hash = location.hash || '#/';
  renderNav();

  if (hash === '#/' || hash === '') return renderPostList();
  if (hash === '#/login') return renderLogin();
  if (hash === '#/register') return renderRegister();
  if (hash === '#/new') return renderPostForm();
  const editMatch = hash.match(/^#\/edit\/(\d+)$/);
  if (editMatch) return renderPostForm(editMatch[1]);
  const postMatch = hash.match(/^#\/post\/(\d+)$/);
  if (postMatch) return renderPostDetail(postMatch[1]);

  app.innerHTML = `<div class="empty-state">Page not found.</div>`;
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ---------------- Views ----------------

async function renderPostList() {
  app.innerHTML = `<div class="empty-state">Loading posts…</div>`;
  try {
    const { posts } = await api('/posts');
    if (!posts.length) {
      app.innerHTML = `<div class="empty-state">No posts yet. Be the first to <a class="link" href="#/new">write one</a>!</div>`;
      return;
    }
    app.innerHTML = posts.map(p => `
      <article class="card">
        <h2 class="post-title"><a class="link" href="#/post/${p.id}">${escapeHtml(p.title)}</a></h2>
        <div class="post-meta">by ${escapeHtml(p.author_username)} · ${timeAgo(p.created_at)} · 💬 ${p.comment_count}</div>
        <p class="post-excerpt">${escapeHtml(p.content.slice(0, 220))}${p.content.length > 220 ? '…' : ''}</p>
      </article>
    `).join('');
  } catch (err) {
    app.innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
  }
}

async function renderPostDetail(id) {
  app.innerHTML = `<div class="empty-state">Loading…</div>`;
  try {
    const { post, comments } = await api(`/posts/${id}`);
    const user = getUser();
    const isAuthor = user && user.id === post.author_id;

    app.innerHTML = `
      <article class="card">
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        <div class="post-meta">by ${escapeHtml(post.author_username)} · ${timeAgo(post.created_at)}</div>
        <p class="post-excerpt">${escapeHtml(post.content)}</p>
        ${isAuthor ? `
          <div class="post-actions">
            <a href="#/edit/${post.id}" class="btn btn-ghost btn-sm">Edit</a>
            <button id="delete-post" class="btn btn-danger btn-sm">Delete</button>
          </div>` : ''}
      </article>

      <div class="card">
        <h3>Comments (${comments.length})</h3>
        <div id="comments-list">
          ${comments.map(c => `
            <div class="comment" data-id="${c.id}">
              <div class="comment-meta">
                <span>${escapeHtml(c.author_username)} · ${timeAgo(c.created_at)}</span>
                ${user && user.id === c.author_id ? `<button class="btn-danger btn-sm delete-comment" data-id="${c.id}">Delete</button>` : ''}
              </div>
              <div>${escapeHtml(c.content)}</div>
            </div>
          `).join('') || '<p class="empty-state">No comments yet.</p>'}
        </div>

        ${user ? `
          <label for="comment-input">Add a comment</label>
          <textarea id="comment-input" placeholder="Share your thoughts…"></textarea>
          <div style="margin-top:10px;">
            <button id="submit-comment" class="btn btn-primary">Post Comment</button>
          </div>
          <div id="comment-error"></div>
        ` : `<p class="empty-state"><a class="link" href="#/login">Log in</a> to leave a comment.</p>`}
      </div>
    `;

    if (isAuthor) {
      document.getElementById('delete-post').onclick = async () => {
        if (!confirm('Delete this post?')) return;
        try {
          await api(`/posts/${id}`, { method: 'DELETE' });
          location.hash = '#/';
        } catch (err) { alert(err.message); }
      };
    }

    if (user) {
      document.getElementById('submit-comment').onclick = async () => {
        const content = document.getElementById('comment-input').value.trim();
        if (!content) return;
        try {
          await api(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
          renderPostDetail(id);
        } catch (err) {
          document.getElementById('comment-error').innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
        }
      };
    }

    document.querySelectorAll('.delete-comment').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Delete this comment?')) return;
        try {
          await api(`/posts/${id}/comments/${btn.dataset.id}`, { method: 'DELETE' });
          renderPostDetail(id);
        } catch (err) { alert(err.message); }
      };
    });
  } catch (err) {
    app.innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
  }
}

async function renderPostForm(editId) {
  let post = { title: '', content: '' };
  if (editId) {
    try {
      const data = await api(`/posts/${editId}`);
      post = data.post;
    } catch (err) {
      app.innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
      return;
    }
  }

  app.innerHTML = `
    <div class="card form-box">
      <h2>${editId ? 'Edit Post' : 'Write a New Post'}</h2>
      <div id="form-error"></div>
      <label for="title">Title</label>
      <input id="title" value="${escapeHtml(post.title)}" placeholder="Give your post a title" />
      <label for="content">Content</label>
      <textarea id="content" rows="10" placeholder="Write your story…">${escapeHtml(post.content)}</textarea>
      <div style="margin-top:16px;">
        <button id="save-post" class="btn btn-primary">${editId ? 'Update' : 'Publish'}</button>
      </div>
    </div>
  `;

  document.getElementById('save-post').onclick = async () => {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    if (!title || !content) {
      document.getElementById('form-error').innerHTML = `<div class="error-box">Title and content are required.</div>`;
      return;
    }
    try {
      if (editId) {
        await api(`/posts/${editId}`, { method: 'PUT', body: JSON.stringify({ title, content }) });
        location.hash = `#/post/${editId}`;
      } else {
        const { post: created } = await api('/posts', { method: 'POST', body: JSON.stringify({ title, content }) });
        location.hash = `#/post/${created.id}`;
      }
    } catch (err) {
      document.getElementById('form-error').innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
    }
  };
}

function renderLogin() {
  app.innerHTML = `
    <div class="card form-box">
      <h2>Welcome back</h2>
      <div id="form-error"></div>
      <label for="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" />
      <label for="password">Password</label>
      <input id="password" type="password" placeholder="••••••••" />
      <div style="margin-top:16px;">
        <button id="login-btn" class="btn btn-primary">Log In</button>
      </div>
      <p style="margin-top:14px;font-family:sans-serif;font-size:0.85rem;">
        No account? <a class="link" href="#/register">Sign up</a>
      </p>
    </div>
  `;

  document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setAuth(data.token, data.user);
      location.hash = '#/';
      renderNav();
    } catch (err) {
      document.getElementById('form-error').innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
    }
  };
}

function renderRegister() {
  app.innerHTML = `
    <div class="card form-box">
      <h2>Create your account</h2>
      <div id="form-error"></div>
      <label for="username">Username</label>
      <input id="username" placeholder="janedoe" />
      <label for="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" />
      <label for="password">Password</label>
      <input id="password" type="password" placeholder="At least 6 characters" />
      <div style="margin-top:16px;">
        <button id="register-btn" class="btn btn-primary">Sign Up</button>
      </div>
      <p style="margin-top:14px;font-family:sans-serif;font-size:0.85rem;">
        Already have an account? <a class="link" href="#/login">Log in</a>
      </p>
    </div>
  `;

  document.getElementById('register-btn').onclick = async () => {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
      setAuth(data.token, data.user);
      location.hash = '#/';
      renderNav();
    } catch (err) {
      document.getElementById('form-error').innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
    }
  };
}
