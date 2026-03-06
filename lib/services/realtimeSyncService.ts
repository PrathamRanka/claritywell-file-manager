type WebSocketMessage<T> = {
  type: string;
  data: T;
  timestamp?: number;
};

type WebSocketEventHandler<T> = (data: T) => void;

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

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          reject(error);
        };

        this.ws.onclose = () => {
          if (this.shouldReconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on<T>(type: string, handler: WebSocketEventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

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

  private handleMessage(rawData: string): void {
    try {
      const message: WebSocketMessage<any> = JSON.parse(rawData);
      const handlers = this.handlers.get(message.type);

      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.data);
          } catch (_error) {
            // Handler error, skip
          }
        });
      }
    } catch (_error) {
      // Invalid message format, skip
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch(() => {
        this.attemptReconnect();
      });
    }, delay);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

let realtimeSyncInstance: RealtimeSyncManager | null = null;

export function initializeGlobalRealtimeSync(wsUrl: string): RealtimeSyncManager {
  if (!realtimeSyncInstance) {
    realtimeSyncInstance = new RealtimeSyncManager(wsUrl);
    realtimeSyncInstance.connect().catch(() => {
      // Connection failed, will retry
    });
  }
  return realtimeSyncInstance;
}

export function getGlobalRealtimeSync(): RealtimeSyncManager | null {
  return realtimeSyncInstance;
}
