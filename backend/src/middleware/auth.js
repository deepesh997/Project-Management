import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../db/store.js';

/**
 * Extracts and decodes token without throwing.
 * Returns { valid: boolean, user?: object, error?: string, reason?: string }
 */
export function verifyJWTToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'MISSING_TOKEN', error: 'No token provided' };
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded.jti && db.isTokenRevoked(decoded.jti)) {
      return {
        valid: false,
        reason: 'TOKEN_REVOKED',
        error: 'Session has been invalidated or logged out',
      };
    }

    return {
      valid: true,
      token,
      user: decoded,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresInSeconds: Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)),
    };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return {
        valid: false,
        reason: 'EXPIRED_TOKEN',
        error: 'Token has expired',
        expiredAt: err.expiredAt,
      };
    }
    return {
      valid: false,
      reason: 'INVALID_TOKEN',
      error: err.message || 'Token signature or format is invalid',
    };
  }
}

/**
 * Express Middleware to authenticate incoming requests via JWT.
 * Flexible token extraction: Authorization header (Bearer or raw), X-Access-Token, or query parameter.
 */
export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-access-token'];
  const queryToken = req.query?.token;

  const rawToken = authHeader || customHeader || queryToken;

  if (!rawToken) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing Authorization header with Bearer token',
        requestId: req.id,
      },
    });
  }

  const verification = verifyJWTToken(rawToken);

  if (!verification.valid) {
    return res.status(401).json({
      error: {
        code: verification.reason || 'INVALID_TOKEN',
        message: verification.error,
        requestId: req.id,
      },
    });
  }

  req.user = verification.user;
  req.token = verification.token;
  next();
}
