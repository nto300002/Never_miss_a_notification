import { SocketModeClient } from '@slack/socket-mode';
import { WebClient } from '@slack/web-api';
import type { Notification } from '../../../src/types/notification';
import { mapSlackEventToNotification } from './slackNotificationMapper';

interface SlackServiceConfig {
  appToken: string;
  botToken: string;
}

type NotificationCallback = (notification: Notification) => void;

export class SlackService {
  private socketClient: SocketModeClient;
  private webClient: WebClient;
  private callback: NotificationCallback | null = null;

  // API 解決結果をキャッシュ（起動中は同じチャンネル/ユーザーを何度も叩かない）
  private channelCache = new Map<string, string>();
  private userCache = new Map<string, string>();

  constructor(config: SlackServiceConfig) {
    this.socketClient = new SocketModeClient({ appToken: config.appToken });
    this.webClient = new WebClient(config.botToken);
  }

  onNotification(callback: NotificationCallback): void {
    this.callback = callback;
  }

  /** チャンネルIDを人間が読める名前に解決する（キャッシュ付き） */
  private async resolveChannelName(channelId: string): Promise<string> {
    if (this.channelCache.has(channelId)) {
      return this.channelCache.get(channelId)!;
    }
    try {
      const res = await this.webClient.conversations.info({ channel: channelId });
      const name = (res.channel as { name?: string } | undefined)?.name ?? channelId;
      this.channelCache.set(channelId, name);
      return name;
    } catch {
      return channelId;
    }
  }

  /** ユーザーIDを表示名に解決する（キャッシュ付き） */
  private async resolveUserName(userId: string): Promise<string> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }
    try {
      const res = await this.webClient.users.info({ user: userId });
      const user = res.user as { real_name?: string; name?: string } | undefined;
      const name = user?.real_name ?? user?.name ?? userId;
      this.userCache.set(userId, name);
      return name;
    } catch {
      return userId;
    }
  }

  async start(): Promise<void> {
    this.socketClient.on('message', async ({ event }: { event: Record<string, unknown> }) => {
      // bot_message や text なしは無視
      if (event.subtype === 'bot_message') return;
      if (!event.text) return;

      const channelId = String(event.channel ?? '');
      const userId = String(event.user ?? '');

      // チャンネル名・ユーザー名を API で解決（イベントに含まれていれば優先）
      const [channel_name, username] = await Promise.all([
        event.channel_name ? String(event.channel_name) : this.resolveChannelName(channelId),
        event.username ? String(event.username) : this.resolveUserName(userId),
      ]);

      const notification = mapSlackEventToNotification({
        type: String(event.type ?? 'message'),
        channel: channelId,
        channel_name,
        user: userId,
        username,
        text: String(event.text),
        ts: String(event.ts ?? '0'),
      });

      this.callback?.(notification);
    });

    await this.socketClient.start();
  }

  async stop(): Promise<void> {
    await this.socketClient.disconnect();
  }
}
