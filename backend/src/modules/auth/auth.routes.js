import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { db } from '../../db/store.js';
import { validateBody } from '../../middleware/validation.js';
import { authenticateJWT, verifyJWTToken } from '../../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).optional(),
  role: z.enum(['org_owner', 'project_manager', 'team_member', 'auditor']).optional(),
  orgId: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const validateSchema = z.object({
  token: z.string().min(1),
});

// Helper to issue tokens
function issueTokens(user, membership) {
  const jti = uuidv4();
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: membership?.role || 'team_member',
    orgId: membership?.orgId || 'org-acme-101',
    jti,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
  const refreshToken = jwt.sign({ id: user.id, jti: uuidv4() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  return { accessToken, refreshToken, jti, payload };
}

/**
 * Register / Create New Account & Token
 * POST /api/v1/auth/register
 */
authRouter.post('/register', validateBody(registerSchema), (req, res) => {
  const { email, password, fullName, role = 'team_member', orgId = 'org-acme-101' } = req.body;

  const result = db.createUser({ email, password, fullName, role, orgId });
  if (!result.success) {
    return res.status(409).json({
      error: {
        code: result.reason || 'USER_ALREADY_EXISTS',
        message: result.message || 'Email already registered',
        requestId: req.id,
      },
    });
  }

  const { accessToken, refreshToken, payload } = issueTokens(result.user, result.membership);

  return res.status(201).json({
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: config.jwt.accessExpiry,
    user: {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: payload.role,
      orgId: payload.orgId,
    },
  });
});

/**
 * Standard User Login & Token Generation
 * POST /api/v1/auth/login
 */
authRouter.post('/login', validateBody(loginSchema), (req, res) => {
  const { email, password } = req.body;
  const user = db.getUserByEmail(email);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password combination',
        requestId: req.id,
      },
    });
  }

  const membership = db.getUserMembership(user.id);
  const { accessToken, refreshToken, payload } = issueTokens(user, membership);

  db.logActivity({
    orgId: payload.orgId || 'system',
    entityType: 'AUTH',
    entityId: user.id,
    action: 'LOGGED_IN',
    performedBy: user.id,
    payload: { email: user.email, role: payload.role },
  });

  return res.json({
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: config.jwt.accessExpiry,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: payload.role,
      orgId: payload.orgId,
    },
  });
});

/**
 * Standard Token Creation / OAuth2 Token endpoint
 * POST /api/v1/auth/token
 */
authRouter.post('/token', (req, res) => {
  const email = req.body.email || req.body.username;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Both email (or username) and password are required',
      },
    });
  }

  const user = db.getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password combination',
      },
    });
  }

  const membership = db.getUserMembership(user.id);
  const { accessToken, refreshToken, payload } = issueTokens(user, membership);

  return res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 900,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: payload.role,
      orgId: payload.orgId,
    },
  });
});

/**
 * Token Validation & Diagnostics Endpoint
 * POST /api/v1/auth/validate
 * GET /api/v1/auth/validate
 */
const handleTokenValidation = (req, res) => {
  const tokenCandidate =
    req.body?.token ||
    req.query?.token ||
    req.headers.authorization ||
    req.headers['x-access-token'];

  if (!tokenCandidate) {
    return res.status(400).json({
      valid: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'No token provided in Authorization header, body, or query',
      },
    });
  }

  const result = verifyJWTToken(tokenCandidate);
  if (!result.valid) {
    return res.status(200).json({
      valid: false,
      error: {
        code: result.reason,
        message: result.error,
      },
    });
  }

  return res.json({
    valid: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      orgId: result.user.orgId,
    },
    claims: {
      jti: result.user.jti,
      iat: result.user.iat,
      exp: result.user.exp,
    },
    issuedAt: result.issuedAt,
    expiresAt: result.expiresAt,
    expiresInSeconds: result.expiresInSeconds,
    serverTime: new Date().toISOString(),
  });
};

authRouter.post('/validate', handleTokenValidation);
authRouter.get('/validate', handleTokenValidation);

/**
 * Refresh Access Token
 * POST /api/v1/auth/refresh
 */
authRouter.post('/refresh', validateBody(refreshSchema), (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = db.users.get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' } });
    }

    const membership = db.getUserMembership(user.id);
    const { accessToken, refreshToken: newRefreshToken, payload } = issueTokens(user, membership);

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: config.jwt.accessExpiry,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: payload.role,
        orgId: payload.orgId,
      },
    });
  } catch (err) {
    return res.status(401).json({
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired or invalid' },
    });
  }
});

/**
 * Logout & Revoke Token
 * POST /api/v1/auth/logout
 */
authRouter.post('/logout', authenticateJWT, (req, res) => {
  if (req.user?.jti) {
    db.revokeToken(req.user.jti);
  }
  return res.json({ success: true, message: 'Logged out successfully, token revoked.' });
});

/**
 * Current Authenticated User Profile
 * GET /api/v1/auth/me
 */
authRouter.get('/me', authenticateJWT, (req, res) => {
  return res.json({
    user: req.user,
    token: req.token,
    valid: true,
  });
});
