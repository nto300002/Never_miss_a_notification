import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Credentials } from 'google-auth-library';
import type { gmail_v1 } from 'googleapis';

// -----------------------------------------------------------------------
// googleapis モック（vi.hoisted で vi.mock ファクトリ内から参照可能にする）
// -----------------------------------------------------------------------

const mocks = vi.hoisted(() => {
  const credentials: Credentials = {};
  return {
    credentials,
    generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?mock'),
    getToken: vi.fn(),
    setCredentials: vi.fn().mockImplementation((token: Credentials) => {
      // setCredentials が呼ばれたら credentials オブジェクトに反映
      Object.assign(credentials, token);
    }),
    oauthOn: vi.fn(),
    messagesList: vi.fn(),
    messagesGet: vi.fn(),
  };
});

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        generateAuthUrl: mocks.generateAuthUrl,
        getToken: mocks.getToken,
        setCredentials: mocks.setCredentials,
        on: mocks.oauthOn,
        credentials: mocks.credentials,
      })),
    },
    gmail: vi.fn().mockImplementation(() => ({
      users: {
        messages: {
          list: mocks.messagesList,
          get: mocks.messagesGet,
        },
      },
    })),
  },
}));

// googleapis モック後にインポート
import { GmailService } from './gmailService';

// -----------------------------------------------------------------------
// テスト用フィクスチャ
// -----------------------------------------------------------------------

const TEST_CREDENTIALS = {
  installed: {
    client_id: '123.apps.googleusercontent.com',
    client_secret: 'secret',
    project_id: 'project-test',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    redirect_uris: ['http://localhost'],
  },
};

const TEST_TOKEN: Credentials = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
};

function makeListResponse(ids: string[]) {
  return {
    data: {
      messages: ids.map((id) => ({ id })),
    },
  };
}

function makeGetResponse(overrides: Partial<gmail_v1.Schema$Message> = {}) {
  return {
    data: {
      id: 'msg-001',
      snippet: 'メール本文プレビュー',
      payload: {
        headers: [
          { name: 'Subject', value: 'テスト件名' },
          { name: 'From', value: '田中太郎 <t@example.com>' },
          { name: 'Date', value: 'Mon, 19 Feb 2024 10:00:00 +0900' },
        ],
      },
      ...overrides,
    },
  };
}

// -----------------------------------------------------------------------
// テスト
// -----------------------------------------------------------------------

describe('GmailService', () => {
  let service: GmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // credentials をリセット
    Object.keys(mocks.credentials).forEach((k) => delete (mocks.credentials as Record<string, unknown>)[k]);

    // デフォルト: トークンあり（授権済み）
    Object.assign(mocks.credentials, TEST_TOKEN);

    service = new GmailService({
      credentials: TEST_CREDENTIALS,
      token: TEST_TOKEN,
    });
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // constructor
  // -----------------------------------------------------------------------
  describe('constructor', () => {
    it('OAuth2Client に credentials を渡して初期化する', async () => {
      const { google } = await import('googleapis');
      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        TEST_CREDENTIALS.installed.client_id,
        TEST_CREDENTIALS.installed.client_secret,
        TEST_CREDENTIALS.installed.redirect_uris[0],
      );
    });

    it('token が設定されている場合は setCredentials を呼ぶ', () => {
      expect(mocks.setCredentials).toHaveBeenCalledWith(TEST_TOKEN);
    });

    it('tokens イベントリスナーを登録する', () => {
      expect(mocks.oauthOn).toHaveBeenCalledWith('tokens', expect.any(Function));
    });

    it('onTokenChange が設定されていればトークンリフレッシュ時に呼ばれる', () => {
      const onTokenChange = vi.fn();
      new GmailService({ credentials: TEST_CREDENTIALS, onTokenChange });

      // oauthOn の最後の呼び出しから 'tokens' ハンドラを取得
      const calls = mocks.oauthOn.mock.calls;
      const [, handler] = calls[calls.length - 1];
      const newToken = { access_token: 'new-token' };
      handler(newToken);

      expect(onTokenChange).toHaveBeenCalledWith(newToken);
    });
  });

  // -----------------------------------------------------------------------
  // getAuthUrl
  // -----------------------------------------------------------------------
  describe('getAuthUrl()', () => {
    it('認証 URL を返す', () => {
      const url = service.getAuthUrl();
      expect(url).toBe('https://accounts.google.com/o/oauth2/auth?mock');
    });

    it('offline access_type と gmail.readonly scope で呼ばれる', () => {
      service.getAuthUrl();
      expect(mocks.generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          access_type: 'offline',
          scope: expect.arrayContaining(['https://www.googleapis.com/auth/gmail.readonly']),
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // authorize
  // -----------------------------------------------------------------------
  describe('authorize()', () => {
    it('getToken に code を渡す', async () => {
      mocks.getToken.mockResolvedValue({ tokens: TEST_TOKEN });
      await service.authorize('auth-code-123');
      expect(mocks.getToken).toHaveBeenCalledWith('auth-code-123');
    });

    it('取得したトークンを setCredentials にセットする', async () => {
      mocks.getToken.mockResolvedValue({ tokens: TEST_TOKEN });
      await service.authorize('auth-code-123');
      expect(mocks.setCredentials).toHaveBeenCalledWith(TEST_TOKEN);
    });

    it('取得したトークンを返す', async () => {
      mocks.getToken.mockResolvedValue({ tokens: TEST_TOKEN });
      const result = await service.authorize('auth-code-123');
      expect(result).toEqual(TEST_TOKEN);
    });
  });

  // -----------------------------------------------------------------------
  // isAuthorized
  // -----------------------------------------------------------------------
  describe('isAuthorized()', () => {
    it('access_token がある場合は true', () => {
      Object.assign(mocks.credentials, { access_token: 'token' });
      expect(service.isAuthorized()).toBe(true);
    });

    it('refresh_token のみある場合は true', () => {
      Object.keys(mocks.credentials).forEach((k) => delete (mocks.credentials as Record<string, unknown>)[k]);
      Object.assign(mocks.credentials, { refresh_token: 'refresh' });
      expect(service.isAuthorized()).toBe(true);
    });

    it('credentials が空の場合は false', () => {
      Object.keys(mocks.credentials).forEach((k) => delete (mocks.credentials as Record<string, unknown>)[k]);
      const unauthedService = new GmailService({ credentials: TEST_CREDENTIALS });
      expect(unauthedService.isAuthorized()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // start
  // -----------------------------------------------------------------------
  describe('start()', () => {
    it('未認証の場合は例外をスロー', async () => {
      Object.keys(mocks.credentials).forEach((k) => delete (mocks.credentials as Record<string, unknown>)[k]);
      const unauthed = new GmailService({ credentials: TEST_CREDENTIALS });
      await expect(unauthed.start()).rejects.toThrow('未認証');
    });

    it('起動時に既存の未読 ID を seenMessageIds に追加する', async () => {
      mocks.messagesList.mockResolvedValueOnce(makeListResponse(['id-A', 'id-B']));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      // タイマーを進めてポーリング実行 → 同じ ID は通知されない
      mocks.messagesList.mockResolvedValueOnce(makeListResponse(['id-A', 'id-B']));
      await vi.runOnlyPendingTimersAsync();

      expect(callback).not.toHaveBeenCalled();
    });

    it('ポーリングタイマーがセットされる', async () => {
      mocks.messagesList.mockResolvedValue(makeListResponse([]));
      await service.start();
      expect(vi.getTimerCount()).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // stop
  // -----------------------------------------------------------------------
  describe('stop()', () => {
    it('タイマーをキャンセルする', async () => {
      mocks.messagesList.mockResolvedValue(makeListResponse([]));
      await service.start();
      service.stop();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('未起動でも stop() を呼んでもエラーにならない', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // ポーリング・通知
  // -----------------------------------------------------------------------
  describe('ポーリング', () => {
    it('新着メールがある場合にコールバックが呼ばれる', async () => {
      // 起動時: 未読なし
      mocks.messagesList.mockResolvedValueOnce(makeListResponse([]));
      // ポーリング: 新着 1 件
      mocks.messagesList.mockResolvedValueOnce(makeListResponse(['new-id']));
      mocks.messagesGet.mockResolvedValueOnce(makeGetResponse({ id: 'new-id' }));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();
      await vi.runOnlyPendingTimersAsync();

      expect(callback).toHaveBeenCalledTimes(1);
      const notification = callback.mock.calls[0][0];
      expect(notification.source).toBe('gmail');
      expect(notification.id).toBe('gmail-new-id');
      expect(notification.title).toBe('テスト件名');
      expect(notification.sender).toBe('田中太郎');
    });

    it('同じ ID は 2 回通知されない', async () => {
      mocks.messagesList.mockResolvedValueOnce(makeListResponse([]));
      mocks.messagesList.mockResolvedValue(makeListResponse(['dup-id']));
      mocks.messagesGet.mockResolvedValue(makeGetResponse({ id: 'dup-id' }));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      // 2 回ポーリング
      await vi.runOnlyPendingTimersAsync();
      await vi.runOnlyPendingTimersAsync();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('件名に Zoom URL があれば priority が meeting になる', async () => {
      mocks.messagesList.mockResolvedValueOnce(makeListResponse([]));
      mocks.messagesList.mockResolvedValueOnce(makeListResponse(['meet-id']));
      mocks.messagesGet.mockResolvedValueOnce(
        makeGetResponse({
          id: 'meet-id',
          payload: {
            headers: [
              { name: 'Subject', value: '定例 https://zoom.us/j/987654321 参加ください' },
              { name: 'From', value: 'boss@example.com' },
              { name: 'Date', value: 'Mon, 19 Feb 2024 10:00:00 +0900' },
            ],
          },
        }),
      );

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();
      await vi.runOnlyPendingTimersAsync();

      const notification = callback.mock.calls[0][0];
      expect(notification.priority).toBe('meeting');
      expect(notification.meetingUrl).toBe('https://zoom.us/j/987654321');
    });

    it('API エラーが発生してもポーリングが継続する', async () => {
      mocks.messagesList
        .mockResolvedValueOnce(makeListResponse([])) // 初期化
        .mockRejectedValueOnce(new Error('network error')) // 1回目のポーリング失敗
        .mockResolvedValueOnce(makeListResponse([])); // 2回目は成功

      await service.start();

      await expect(vi.runOnlyPendingTimersAsync()).resolves.not.toThrow();
      await expect(vi.runOnlyPendingTimersAsync()).resolves.not.toThrow();

      expect(vi.getTimerCount()).toBe(1);
    });

    it('複数の新着メールを全件通知する', async () => {
      mocks.messagesList.mockResolvedValueOnce(makeListResponse([]));
      mocks.messagesList.mockResolvedValueOnce(makeListResponse(['id-1', 'id-2', 'id-3']));
      mocks.messagesGet
        .mockResolvedValueOnce(makeGetResponse({ id: 'id-1' }))
        .mockResolvedValueOnce(makeGetResponse({ id: 'id-2' }))
        .mockResolvedValueOnce(makeGetResponse({ id: 'id-3' }));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();
      await vi.runOnlyPendingTimersAsync();

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });
});
