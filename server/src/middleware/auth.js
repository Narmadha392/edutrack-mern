import jwt from 'jsonwebtoken';

export const authRequired = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Auth token missing' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = decoded; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles = []) => (req, res, next) => {
  if (!roles.length) return next();
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};
