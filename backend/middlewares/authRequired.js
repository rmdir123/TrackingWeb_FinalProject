// middlewares/authRequired.js
const jwt = require('jsonwebtoken');

module.exports = function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    // ควรมี user_id, role ใน payload ตอนออก token
    req.user = { user_id: payload.user_id, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
