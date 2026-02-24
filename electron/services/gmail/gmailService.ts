import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import type { Notification } from '../../../src/types/notification';
import type { GoogleCredentials } from '../credentialsValidator';
import { mapGmailMessageToNotification } from './gmailNotificationMapper';

export type { Credentials as OAuth2Token };

export interface GmailServiceConfig {
  credentials: GoogleCredentials;
  /** 保存済みトークン（アプリ再起動時の復元用） */
  token?: Credentials;
  /** ポーリング間隔(ms)。デフォルト 15000ms */
  pollingIntervalMs?: number;
  /** トークンが自動リフレッシュされたときに呼ばれるコールバック */
  onTokenChange?: (token: Credentials) => void;
}

type NotificationCallback = (notification: Notification) => void;

const DEFAULT_POLLING_INTERVAL_MS = 15_000;
const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export class GmailService {
  private readonly oauth2Client: InstanceType<typeof google.auth.OAuth2>;
  private readonly gmail: gmail_v1.Gmail;
  private readonly pollingIntervalMs: number;
  /** 通知済みメッセージ ID のセット（スタートアップスパム防止 + 重複排除） */
  private seenMessageIds = new Set<string>();
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private callback: NotificationCallback | null = null;

  constructor(config: GmailServiceConfig) {
    const { client_id, client_secret, redirect_uris } = config.credentials.installed;
    const redirectUri = redirect_uris[0] ?? 'http://localhost';

    this.oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);
    this.pollingIntervalMs = config.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS;

    if (config.token) {
      this.oauth2Client.setCredentials(config.token);
    }

    // トークン自動リフレッシュ時にコールバックへ通知
    this.oauth2Client.on('tokens', (tokens: Credentials) => {
      config.onTokenChange?.(tokens);
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // -----------------------------------------------------------------------
  // 認証
  // -----------------------------------------------------------------------

  /** OAuth2 同意画面の URL を生成する */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      prompt: 'consent', // refresh_token を確実に取得する
    });
  }

  /**
   * 認証コードをトークンと交換してセットする
   * ブラウザからリダイレクトされた code を渡す
   */
  async authorize(code: string): Promise<Credentials> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /** 保存済みトークンをセットする（アプリ起動時の復元用） */
  setToken(token: Credentials): void {
    this.oauth2Client.setCredentials(token);
  }

  /** 認証済みかどうか（access_token または refresh_token があれば true） */
  isAuthorized(): boolean {
    const creds = this.oauth2Client.credentials;
    return !!(creds.access_token || creds.refresh_token);
  }

  // -----------------------------------------------------------------------
  // 通知
  // -----------------------------------------------------------------------

  onNotification(callback: NotificationCallback): void {
    this.callback = callback;
  }

  // -----------------------------------------------------------------------
  // ライフサイクル
  // -----------------------------------------------------------------------

  /**
   * ポーリングを開始する
   * @throws 未認証の場合エラー
   */
  async start(): Promise<void> {
    if (!this.isAuthorized()) {
      throw new Error('GmailService: 未認証です。先に authorize() または setToken() を呼んでください');
    }
    // 起動時点の未読を既知としてマーク（通知スパム防止）
    await this.initializeSeenMessages();
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

  private async initializeSeenMessages(): Promise<void> {
    try {
      const ids = await this.fetchUnreadMessageIds();
      for (const id of ids) {
        this.seenMessageIds.add(id);
      }
    } catch (err) {
      console.error('GmailService: 既読初期化中にエラー', err);
    }
  }

  private schedulePoll(): void {
    this.timerId = setTimeout(() => this.poll(), this.pollingIntervalMs);
  }

  private async poll(): Promise<void> {
    try {
      const ids = await this.fetchUnreadMessageIds();
      const newIds = ids.filter((id) => !this.seenMessageIds.has(id));

      for (const id of newIds) {
        const message = await this.fetchMessage(id);
        const notification = mapGmailMessageToNotification(message);
        this.callback?.(notification);
        this.seenMessageIds.add(id);
      }
    } catch (err) {
      console.error('GmailService: ポーリング中にエラー', err);
    }
    this.schedulePoll();
  }

  private async fetchUnreadMessageIds(): Promise<string[]> {
    const res = await this.gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread in:inbox',
      maxResults: 20,
    });
    return (res.data.messages ?? []).map((m) => m.id ?? '').filter(Boolean);
  }

  private async fetchMessage(id: string): Promise<gmail_v1.Schema$Message> {
    const res = await this.gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });
    return res.data;
  }
}
