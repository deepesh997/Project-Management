import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { db } from '../../db/store.js';
import { validateBody } from '../../middleware/validation.js';
import { authenticateJWT } from '../../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

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

  // Find user membership
  const membership = db.getUserMembership(user.id);
  const jti = uuidv4();

  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: membership?.role || 'team_member',
    orgId: membership?.orgId || null,
    jti,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
  const refreshToken = jwt.sign({ id: user.id, jti: uuidv4() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  db.logActivity({
    orgId: membership?.orgId || 'system',
    entityType: 'AUTH',
    entityId: user.id,
    action: 'LOGGED_IN',
    performedBy: user.id,
    payload: { email: user.email, role: payload.role },
  });

  return res.json({
    accessToken,
    refreshToken,
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

authRouter.post('/refresh', validateBody(refreshSchema), (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = db.users.get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' } });
    }

    const membership = db.getUserMembership(user.id);
    const newJti = uuidv4();
    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: membership?.role || 'team_member',
      orgId: membership?.orgId || null,
      jti: newJti,
    };

    const newAccessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
    const newRefreshToken = jwt.sign({ id: user.id, jti: uuidv4() }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
    });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: config.jwt.accessExpiry,
    });
  } catch (err) {
    return res.status(401).json({
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired or invalid' },
    });
  }
});

authRouter.post('/logout', authenticateJWT, (req, res) => {
  if (req.user?.jti) {
    db.revokeToken(req.user.jti);
  }
  return res.json({ success: true, message: 'Logged out successfully, token revoked.' });
});

authRouter.get('/me', authenticateJWT, (req, res) => {
  return res.json({ user: req.user });
});
