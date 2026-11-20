import { EventEmitter } from 'events';

class RealtimeEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
  }

  broadcast(orgId, eventType, data) {
    this.emit(`org:${orgId}`, { type: eventType, data, timestamp: new Date().toISOString() });
  }
}

export const realtimeBus = new RealtimeEventBus();

/**
 * Express SSE endpoint handler for real-time task and project updates.
 */
export function handleSSEStream(req, res) {
  const orgId = req.orgId;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Heartbeat to keep connection alive
  const heartbeatTimer = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  const listener = (event) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);
  };

  realtimeBus.on(`org:${orgId}`, listener);

  // Initial welcome event
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ status: 'connected', orgId })}\n\n`);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    realtimeBus.removeListener(`org:${orgId}`, listener);
  });
}
