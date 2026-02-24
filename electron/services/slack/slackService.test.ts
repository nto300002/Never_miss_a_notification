import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlackService } from './slackService';

// @slack/socket-mode をモック
vi.mock('@slack/socket-mode', () => {
  const mockClient = {
    on: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return {
    SocketModeClient: vi.fn(() => mockClient),
  };
});

// @slack/web-api をモック
vi.mock('@slack/web-api', () => {
  const mockWebClient = {
    users: {
      info: vi.fn().mockResolvedValue({
        ok: true,
        user: { real_name: '田中太郎', name: 'tanaka' },
      }),
    },
    conversations: {
      info: vi.fn().mockResolvedValue({
        ok: true,
        channel: { name: 'general' },
      }),
    },
  };
  return {
    WebClient: vi.fn(() => mockWebClient),
  };
});

import { SocketModeClient } from '@slack/socket-mode';
import { WebClient } from '@slack/web-api';

describe('SlackService', () => {
  let service: SlackService;
  let mockSocketClient: ReturnType<typeof SocketModeClient['prototype']['constructor']>;
  let mockWebClient: ReturnType<typeof WebClient['prototype']['constructor']>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SlackService({
      appToken: 'xapp-test-token',
      botToken: 'xoxb-test-token',
    });
    mockSocketClient = vi.mocked(SocketModeClient).mock.results[0].value;
    mockWebClient = vi.mocked(WebClient).mock.results[0].value;
  });

  afterEach(async () => {
    await service.stop();
  });

  describe('constructor', () => {
    it('SocketModeClient を appToken で初期化する', () => {
      expect(SocketModeClient).toHaveBeenCalledWith({ appToken: 'xapp-test-token' });
    });

    it('WebClient を botToken で初期化する', () => {
      expect(WebClient).toHaveBeenCalledWith('xoxb-test-token');
    });
  });

  describe('start()', () => {
    it('SocketModeClient.start() を呼ぶ', async () => {
      await service.start();
      expect(mockSocketClient.start).toHaveBeenCalledTimes(1);
    });

    it('message イベントのリスナーを登録する', async () => {
      await service.start();
      expect(mockSocketClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('stop()', () => {
    it('SocketModeClient.disconnect() を呼ぶ', async () => {
      await service.start();
      await service.stop();
      expect(mockSocketClient.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onNotification()', () => {
    it('コールバックを登録できる', () => {
      const callback = vi.fn();
      expect(() => service.onNotification(callback)).not.toThrow();
    });

    it('message イベント受信時にコールバックが呼ばれる', async () => {
      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      await handler({
        event: {
          type: 'message',
          channel: 'C12345678',
          channel_name: 'general',
          user: 'U12345678',
          username: '田中太郎',
          text: 'テストメッセージ',
          ts: '1708300000.000000',
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      const notification = callback.mock.calls[0][0];
      expect(notification.source).toBe('slack');
      expect(notification.title).toBe('#general');
      expect(notification.body).toBe('テストメッセージ');
    });

    it('channel_name がない場合は conversations.info で解決する', async () => {
      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      await handler({
        event: {
          type: 'message',
          channel: 'C12345678',
          user: 'U12345678',
          username: '田中太郎',
          text: 'テストメッセージ',
          ts: '1708300000.000000',
        },
      });

      expect(mockWebClient.conversations.info).toHaveBeenCalledWith({ channel: 'C12345678' });
      const notification = callback.mock.calls[0][0];
      expect(notification.title).toBe('#general');
    });

    it('username がない場合は users.info で解決する', async () => {
      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      await handler({
        event: {
          type: 'message',
          channel: 'C12345678',
          channel_name: 'general',
          user: 'U12345678',
          text: 'テストメッセージ',
          ts: '1708300000.000000',
        },
      });

      expect(mockWebClient.users.info).toHaveBeenCalledWith({ user: 'U12345678' });
      const notification = callback.mock.calls[0][0];
      expect(notification.sender).toBe('田中太郎');
    });

    it('同じチャンネルIDは2回目以降 API を呼ばない（キャッシュ）', async () => {
      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      const baseEvent = {
        type: 'message',
        channel: 'C12345678',
        user: 'U12345678',
        username: '田中太郎',
        text: 'メッセージ',
        ts: '1708300000.000000',
      };

      await handler({ event: { ...baseEvent, ts: '1708300000.000001' } });
      await handler({ event: { ...baseEvent, ts: '1708300000.000002' } });

      // 2回のメッセージでも conversations.info は1回だけ呼ばれる
      expect(mockWebClient.conversations.info).toHaveBeenCalledTimes(1);
    });

    it('同じユーザーIDは2回目以降 API を呼ばない（キャッシュ）', async () => {
      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      const baseEvent = {
        type: 'message',
        channel: 'C12345678',
        channel_name: 'general',
        user: 'U12345678',
        text: 'メッセージ',
        ts: '1708300000.000000',
      };

      await handler({ event: { ...baseEvent, ts: '1708300000.000001' } });
      await handler({ event: { ...baseEvent, ts: '1708300000.000002' } });

      // 2回のメッセージでも users.info は1回だけ呼ばれる
      expect(mockWebClient.users.info).toHaveBeenCalledTimes(1);
    });

    it('API エラー時はチャンネルIDをそのまま使う', async () => {
      mockWebClient.conversations.info.mockRejectedValueOnce(new Error('API Error'));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      await handler({
        event: {
          type: 'message',
          channel: 'C12345678',
          user: 'U12345678',
          username: '田中太郎',
          text: 'テストメッセージ',
          ts: '1708300000.000000',
        },
      });

      const notification = callback.mock.calls[0][0];
      expect(notification.title).toBe('#C12345678');
    });

    it('API エラー時はユーザーIDをそのまま使う', async () => {
      mockWebClient.users.info.mockRejectedValueOnce(new Error('API Error'));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      await handler({
        event: {
          type: 'message',
          channel: 'C12345678',
          channel_name: 'general',
          user: 'U12345678',
          text: 'テストメッセージ',
          ts: '1708300000.000000',
        },
      });

      const notification = callback.mock.calls[0][0];
      expect(notification.sender).toBe('U12345678');
    });

    it('subtype が bot_message のイベントは無視する', async () => {
      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      await handler({
        event: {
          type: 'message',
          subtype: 'bot_message',
          channel: 'C12345678',
          text: 'ボットのメッセージ',
          ts: '1708300000.000000',
        },
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('text が空のイベントは無視する', async () => {
      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      const [, handler] = vi.mocked(mockSocketClient.on).mock.calls.find(
        ([event]) => event === 'message'
      )!;

      await handler({
        event: {
          type: 'message',
          channel: 'C12345678',
          user: 'U12345678',
          text: '',
          ts: '1708300000.000000',
        },
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
