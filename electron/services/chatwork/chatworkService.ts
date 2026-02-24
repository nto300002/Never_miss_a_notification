import type { Notification } from '../../../src/types/notification';
import { mapChatworkMessageToNotification, type ChatworkMessage } from './chatworkNotificationMapper';

export interface ChatworkServiceConfig {
  apiToken: string;
  roomIds: number[];
  /** ポーリング間隔(ms)。デフォルト 10000ms */
  pollingIntervalMs?: number;
}

type NotificationCallback = (notification: Notification) => void;

const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';
const DEFAULT_POLLING_INTERVAL_MS = 10_000;
/** HTTP 429 受信後に待機する時間(ms) */
const RATE_LIMIT_BACKOFF_MS = 60_000;

export class ChatworkRateLimitError extends Error {
  constructor() {
    super('Chatwork API rate limit exceeded (HTTP 429)');
    this.name = 'ChatworkRateLimitError';
  }
}

export class ChatworkService {
  private readonly apiToken: string;
  private readonly roomIds: number[];
  private readonly pollingIntervalMs: number;
  private roomNames: Map<number, string> = new Map();
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private callback: NotificationCallback | null = null;
  /** 429 受信時に次回ポーリングまで追加で待機する時間(ms) */
  private rateLimitDelay = 0;

  constructor(config: ChatworkServiceConfig) {
    this.apiToken = config.apiToken;
    this.roomIds = config.roomIds;
    this.pollingIntervalMs = config.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS;
  }

  onNotification(callback: NotificationCallback): void {
    this.callback = callback;
  }

  async start(): Promise<void> {
    await this.fetchRoomNames();
    this.schedulePoll();
  }

  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  // -----------------------------------------------------------------------
  // private
  // -----------------------------------------------------------------------

  private schedulePoll(): void {
    const delay = this.pollingIntervalMs + this.rateLimitDelay;
    this.timerId = setTimeout(() => this.poll(), delay);
  }

  private async poll(): Promise<void> {
    for (const roomId of this.roomIds) {
      await this.pollRoom(roomId);
    }
    this.schedulePoll();
  }

  private async pollRoom(roomId: number): Promise<void> {
    try {
      const messages = await this.fetchMessages(roomId);
      const roomName = this.roomNames.get(roomId) ?? `Room ${roomId}`;

      for (const message of messages) {
        const notification = mapChatworkMessageToNotification(message, roomId, roomName);
        this.callback?.(notification);
      }

      // 正常応答が返ったのでバックオフをリセット
      this.rateLimitDelay = 0;
    } catch (err) {
      if (err instanceof ChatworkRateLimitError) {
        this.rateLimitDelay = RATE_LIMIT_BACKOFF_MS;
      }
      console.error(`ChatworkService: room ${roomId} のポーリング中にエラー`, err);
    }
  }

  private async fetchMessages(roomId: number): Promise<ChatworkMessage[]> {
    const res = await fetch(`${CHATWORK_API_BASE}/rooms/${roomId}/messages?force=0`, {
      headers: { 'X-ChatWorkToken': this.apiToken },
    });

    if (res.status === 429) {
      throw new ChatworkRateLimitError();
    }

    if (!res.ok) {
      throw new Error(`Chatwork API エラー: HTTP ${res.status}`);
    }

    // 未読メッセージ無し → 204 No Content または空配列
    if (res.status === 204) {
      return [];
    }

    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as ChatworkMessage[]) : [];
  }

  private async fetchRoomNames(): Promise<void> {
    for (const roomId of this.roomIds) {
      try {
        const res = await fetch(`${CHATWORK_API_BASE}/rooms/${roomId}`, {
          headers: { 'X-ChatWorkToken': this.apiToken },
        });
        if (res.ok) {
          const room = (await res.json()) as { name: string };
          this.roomNames.set(roomId, room.name);
        }
      } catch {
        // 取得失敗時は room ID をフォールバックとして使用
      }
    }
  }
}
