import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../db/store.js';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header with Bearer token',
        requestId: req.id,
      },
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.jti && db.isTokenRevoked(decoded.jti)) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Session has been invalidated or logged out',
          requestId: req.id,
        },
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        details: err.message,
        requestId: req.id,
      },
    });
  }
}
