/**
 * WebSocket utilities for future real-time sync implementation
 * Currently provides structure and helpers for WebSocket connections
 */

type WebSocketMessage<T> = {
  type: string;
  data: T;
  timestamp?: number;
};

type WebSocketEventHandler<T> = (data: T) => void;

/**
 * Real-time sync manager using WebSockets (for future use)
 * This provides the foundation for real-time updates when ready to implement
 */
export class RealtimeSyncManager {
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<WebSocketEventHandler<any>>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private shouldReconnect = true;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (this.shouldReconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to a message type
   */
  on<T>(type: string, handler: WebSocketEventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Send a message
   */
  send<T>(type: string, data: T): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage<T> = {
        type,
        data,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(rawData: string): void {
    try {
      const message: WebSocketMessage<any> = JSON.parse(rawData);
      const handlers = this.handlers.get(message.type);

      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.data);
          } catch (error) {
            console.error('Error in WebSocket handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((err) => {
        console.error('Reconnection failed:', err);
        this.attemptReconnect();
      });
    }, delay);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Singleton instance for global real-time sync (optional use)
 */
let realtimeSyncInstance: RealtimeSyncManager | null = null;

export function initializeGlobalRealtimeSync(wsUrl: string): RealtimeSyncManager {
  if (!realtimeSyncInstance) {
    realtimeSyncInstance = new RealtimeSyncManager(wsUrl);
    realtimeSyncInstance.connect().catch((err) => {
      console.error('Failed to initialize WebSocket:', err);
    });
  }
  return realtimeSyncInstance;
}

export function getGlobalRealtimeSync(): RealtimeSyncManager | null {
  return realtimeSyncInstance;
}
