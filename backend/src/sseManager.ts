import { Response } from 'express';

/**
 * SSE Manager — manages all connected SSE clients and broadcasts events.
 *
 * Usage in routes:
 *   import { sseManager } from '../sseManager';
 *   sseManager.broadcast('projects', 'updated');
 */

export type SSEEventType =
  | 'projects'
  | 'clients'
  | 'transactions'
  | 'cards'
  | 'pockets'
  | 'galleries'
  | 'portfolios'
  | 'team-members'
  | 'calendar-events'
  | 'notifications'
  | 'packages'
  | 'contracts'
  | 'team-payment-records'
  | 'team-project-payments'
  | 'add-ons'
  | 'promo-codes'
  | 'suggestions'
  | 'leads'
  | 'client-feedback'
  | 'profiles';

export type SSEAction = 'created' | 'updated' | 'deleted';

interface SSEClient {
  id: string;
  userId: number | null;
  res: Response;
}

export class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  /**
   * Register a new SSE client connection.
   */
  addClient(id: string, res: Response, userId?: number | null): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId: id })}\n\n`);

    // Keep-alive ping every 25 seconds to prevent proxy timeouts
    const keepAlive = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(keepAlive);
        return;
      }
      res.write(': ping\n\n');
    }, 25000);

    this.clients.set(id, { id, userId: userId ?? null, res });

    // Clean up on disconnect
    res.on('close', () => {
      clearInterval(keepAlive);
      this.clients.delete(id);
      console.log(`[SSE] Client disconnected: ${id}. Active clients: ${this.clients.size}`);
    });

    console.log(`[SSE] Client connected: ${id}. Active clients: ${this.clients.size}`);
  }

  /**
   * Broadcast an event to all connected clients.
   */
  broadcast(resource: SSEEventType, action: SSEAction, data?: Record<string, unknown>, userId?: number): void {
    if (this.clients.size === 0) return;

    const payload = JSON.stringify({ resource, action, data, timestamp: Date.now() });
    const message = `data: ${payload}\n\n`;

    const deadClients: string[] = [];

    this.clients.forEach((client) => {
      if (userId != null && client.userId !== userId) {
        return;
      }
      if (client.res.writableEnded) {
        deadClients.push(client.id);
        return;
      }
      try {
        client.res.write(message);
      } catch {
        deadClients.push(client.id);
      }
    });

    // Clean up dead connections
    deadClients.forEach((id) => this.clients.delete(id));

    if (deadClients.length > 0) {
      console.log(`[SSE] Cleaned up ${deadClients.length} dead client(s).`);
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

// Singleton instance shared across all routes
export const sseManager = new SSEManager();
