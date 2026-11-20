import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { db } from '../../db/store.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { validateBody } from '../../middleware/validation.js';

export const integrationsRouter = Router();

// 1. Mock S3 Signed Upload URL
integrationsRouter.post('/storage/presigned-url', authenticateJWT, enforceTenantIsolation, (req, res) => {
  const { fileName, mimeType } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: { code: 'INVALID_FILE', message: 'fileName is required' } });
  }

  const fileKey = `${req.orgId}/${Date.now()}-${encodeURIComponent(fileName)}`;
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  // Simulated HMAC signed URL
  const signature = crypto.createHmac('sha256', config.jwt.secret).update(fileKey).digest('hex');
  const uploadUrl = `https://storage.worksphere.internal/upload?key=${fileKey}&sig=${signature}&expires=${expiresAt}`;

  return res.json({
    data: {
      fileKey,
      uploadUrl,
      expiresAt,
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'x-amz-acl': 'private',
      },
    },
  });
});

// 2. Mock Email Sandbox
integrationsRouter.post('/email/sandbox-send', authenticateJWT, enforceTenantIsolation, (req, res) => {
  const { to, subject, htmlBody } = req.body;
  const deliveryId = `msg-${crypto.randomBytes(8).toString('hex')}`;

  db.logActivity({
    orgId: req.orgId,
    entityType: 'INTEGRATION',
    entityId: deliveryId,
    action: 'EMAIL_DISPATCHED',
    performedBy: req.user.id,
    payload: { to, subject, provider: 'Sandbox-SMTP' },
  });

  return res.json({
    data: {
      deliveryId,
      status: 'SENT',
      provider: 'Sandbox-SMTP',
      recipient: to,
      timestamp: new Date().toISOString(),
    },
  });
});

// 3. Webhook Receiver with HMAC-SHA256 Signature Verification & Duplicate Prevention
integrationsRouter.post('/webhooks/incoming', (req, res) => {
  const signature = req.headers['x-worksphere-signature'];
  const timestamp = req.headers['x-worksphere-timestamp'];
  const idempotencyKey = req.headers['idempotency-key'];

  if (!signature || !timestamp) {
    return res.status(401).json({
      error: { code: 'MISSING_SIGNATURE', message: 'Webhook signature or timestamp missing in request headers' },
    });
  }

  // Prevent Replay Attacks: Check timestamp is within 5 minutes (300 seconds)
  const reqTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(reqTime) || Math.abs(now - reqTime) > 300) {
    return res.status(400).json({
      error: { code: 'TIMESTAMP_EXPIRED', message: 'Webhook timestamp is outside tolerance window' },
    });
  }

  // Verify HMAC-SHA256 Signature
  const rawPayload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', config.webhook.secret)
    .update(`${timestamp}.${rawPayload}`)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return res.status(401).json({
      error: { code: 'INVALID_SIGNATURE', message: 'HMAC signature verification failed' },
    });
  }

  // Deduplication Check
  const effectiveKey = idempotencyKey || req.body.eventId || `${req.body.type}-${timestamp}`;
  const check = db.checkAndRecordIdempotency(effectiveKey, req.body.type || 'WEBHOOK', req.body);

  if (check.isDuplicate) {
    return res.status(200).json({
      status: 'DUPLICATE_IGNORED',
      message: 'Event was already processed and verified. Deduplication successful.',
      idempotencyKey: effectiveKey,
    });
  }

  return res.status(200).json({
    status: 'VERIFIED_AND_PROCESSED',
    eventId: req.body.eventId || 'evt-generated',
    idempotencyKey: effectiveKey,
    processedAt: new Date().toISOString(),
  });
});
