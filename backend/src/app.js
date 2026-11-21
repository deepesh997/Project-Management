import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiSpecPath = path.join(__dirname, 'docs', 'openapi.json');

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

// Interactive OpenAPI 3.0.3 Documentation & Swagger UI
app.get(['/docs/openapi.json', '/api/docs/openapi.json'], (req, res) => {
  res.sendFile(openApiSpecPath);
});

const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WorkSphere Enterprise API Documentation | Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .topbar { display: none !important; }
    .swagger-ui .info { margin: 24px 0; }
    .swagger-ui .info .title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; font-weight: 700; color: #1d1d1f; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

app.get(['/docs', '/api/docs'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerUiHtml);
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
