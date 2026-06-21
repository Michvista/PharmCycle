const { verifyToken } = require('../utils/jwt');

/**
 * Protects pharmacy-side routes. Expects "Authorization: Bearer <token>"
 * where token payload = { userId, pharmacyId, role, type: 'user' }
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.type !== 'user') {
      return res.status(403).json({ error: 'Pharmacy account required for this route' });
    }

    req.user = decoded; // { userId, pharmacyId, role, type }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Protects consumer-side routes. Token payload = { consumerId, type: 'consumer' }
 */
function requireConsumerAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.type !== 'consumer') {
      return res.status(403).json({ error: 'Consumer account required for this route' });
    }

    req.consumer = decoded; // { consumerId, type }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Restrict to specific pharmacy roles, e.g. requireRole('ADMIN') */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Optional auth - decodes the token if present (so routes can personalize/exclude
 * the requester's own pharmacy) but never blocks the request if absent.
 * Used by routes that serve BOTH pharmacy users and anonymous consumers,
 * e.g. GET /pharmacies/nearby.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded.type === 'user') req.user = decoded;
    if (decoded.type === 'consumer') req.consumer = decoded;
  } catch {
    // invalid/expired token on an optional route - just proceed unauthenticated
  }
  next();
}

module.exports = { requireAuth, requireConsumerAuth, requireRole, optionalAuth };
