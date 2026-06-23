const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// ---------- Get comments for a post ----------
router.get('/', (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = db.prepare(`
    SELECT comments.id, comments.content, comments.created_at,
           users.id AS author_id, users.username AS author_username
    FROM comments
    JOIN users ON comments.author_id = users.id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC
  `).all(req.params.postId);

  res.json({ comments });
});

// ---------- Add a comment ----------
router.post('/', authenticateToken, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const result = db.prepare(
    'INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)'
  ).run(content, req.params.postId, req.user.id);

  const comment = db.prepare(`
    SELECT comments.id, comments.content, comments.created_at,
           users.id AS author_id, users.username AS author_username
    FROM comments JOIN users ON comments.author_id = users.id
    WHERE comments.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ message: 'Comment added', comment });
});

// ---------- Delete a comment (only author) ----------
router.delete('/:commentId', authenticateToken, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND post_id = ?')
    .get(req.params.commentId, req.params.postId);

  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
  res.json({ message: 'Comment deleted' });
});

module.exports = router;
