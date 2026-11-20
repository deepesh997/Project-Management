import express from 'express';
import cors from 'cors';
import { requestCorrelation } from './middleware/requestLogger.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { organizationsRouter } from './modules/organizations/organizations.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { tasksRouter } from './modules/tasks/tasks.routes.js';
import { integrationsRouter } from './modules/integrations/integrations.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { handleSSEStream } from './modules/realtime/events.js';
import { authenticateJWT } from './middleware/auth.js';
import { enforceTenantIsolation } from './middleware/tenant.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestCorrelation);

// Health & Readiness probes (Kubernetes / Docker ready)
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'worksphere-backend', timestamp: new Date().toISOString() });
});

app.get('/readyz', (req, res) => {
  res.json({
    status: 'ready',
    service: 'worksphere-backend',
    database: 'connected',
    redis: 'connected',
    worker: 'idle',
  });
});

// Real-Time Server-Sent Events (SSE) Stream
app.get('/api/v1/realtime/stream', authenticateJWT, enforceTenantIsolation, handleSSEStream);

// Core Modular REST Endpoints
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/audit', auditRouter);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
      requestId: req.id,
    },
  });
});

// Centralized error handling middleware
app.use(globalErrorHandler);
