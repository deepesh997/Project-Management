import { app } from './app.js';
import { config } from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`[WorkSphere API] Server listening on port ${config.port} (${config.env})`);
  console.log(`[Health Endpoint] http://localhost:${config.port}/healthz`);
  console.log(`[Ready Endpoint]  http://localhost:${config.port}/readyz`);
});

// Graceful Shutdown Handler
function handleGracefulShutdown(signal) {
  console.log(`\n[WorkSphere API] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[WorkSphere API] HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    console.error('[WorkSphere API] Forced shutdown timed out.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
