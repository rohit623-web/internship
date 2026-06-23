const express = require('express');
const db = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- Get all posts ----------
router.get('/', optionalAuth, (req, res) => {
  const posts = db.prepare(`
    SELECT posts.id, posts.title, posts.content, posts.created_at, posts.updated_at,
           users.id AS author_id, users.username AS author_username,
           (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count
    FROM posts
    JOIN users ON posts.author_id = users.id
    ORDER BY posts.created_at DESC
  `).all();

  res.json({ posts });
});

// ---------- Get single post with comments ----------
router.get('/:id', (req, res) => {
  const post = db.prepare(`
    SELECT posts.id, posts.title, posts.content, posts.created_at, posts.updated_at,
           users.id AS author_id, users.username AS author_username
    FROM posts
    JOIN users ON posts.author_id = users.id
    WHERE posts.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = db.prepare(`
    SELECT comments.id, comments.content, comments.created_at,
           users.id AS author_id, users.username AS author_username
    FROM comments
    JOIN users ON comments.author_id = users.id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC
  `).all(req.params.id);

  res.json({ post, comments });
});

// ---------- Create post ----------
router.post('/', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const result = db.prepare(
    'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)'
  ).run(title, content, req.user.id);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Post created', post });
});

// ---------- Update post (only author) ----------
router.put('/:id', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own posts' });
  }

  db.prepare(
    'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(title ?? post.title, content ?? post.content, req.params.id);

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json({ message: 'Post updated', post: updated });
});

// ---------- Delete post (only author) ----------
router.delete('/:id', authenticateToken, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own posts' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post deleted' });
});

module.exports = router;
