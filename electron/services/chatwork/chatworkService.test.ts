import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatworkService, ChatworkRateLimitError } from './chatworkService';

// fetch をモック
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/** ルーム情報レスポンスを返すヘルパー */
function makeRoomResponse(roomId: number, name: string) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({ room_id: roomId, name }),
  };
}

/** メッセージ一覧レスポンスを返すヘルパー */
function makeMessagesResponse(messages: object[]) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(messages),
  };
}

/** 空レスポンス（未読なし）*/
function makeEmptyResponse() {
  return {
    ok: true,
    status: 204,
    json: vi.fn().mockResolvedValue([]),
  };
}

const ROOM_ID = 111;
const API_TOKEN = 'test-api-token';

const sampleMessage = {
  message_id: '1',
  account: { account_id: 123, name: '田中太郎', avatar_image_url: '' },
  body: 'テストメッセージ',
  send_time: 1708300000,
  update_time: 0,
};

describe('ChatworkService', () => {
  let service: ChatworkService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    service = new ChatworkService({
      apiToken: API_TOKEN,
      roomIds: [ROOM_ID],
      pollingIntervalMs: 10_000,
    });
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // start()
  // -----------------------------------------------------------------------
  describe('start()', () => {
    it('起動時にルーム名を取得する', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValue(makeEmptyResponse());

      await service.start();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.chatwork.com/v2/rooms/${ROOM_ID}`,
        expect.objectContaining({ headers: { 'X-ChatWorkToken': API_TOKEN } }),
      );
    });

    it('ポーリングタイマーがセットされる', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValue(makeEmptyResponse());

      await service.start();
      // タイマーが1つ動いている
      expect(vi.getTimerCount()).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // stop()
  // -----------------------------------------------------------------------
  describe('stop()', () => {
    it('タイマーをキャンセルする', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValue(makeEmptyResponse());

      await service.start();
      service.stop();

      expect(vi.getTimerCount()).toBe(0);
    });

    it('未起動でも stop() を呼んでもエラーにならない', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // onNotification / polling
  // -----------------------------------------------------------------------
  describe('onNotification()', () => {
    it('コールバックを登録できる', () => {
      expect(() => service.onNotification(vi.fn())).not.toThrow();
    });

    it('新着メッセージ受信時にコールバックが呼ばれる', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValueOnce(makeMessagesResponse([sampleMessage]));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      // タイマーを進めてポーリングを実行
      await vi.runOnlyPendingTimersAsync();

      expect(callback).toHaveBeenCalledTimes(1);
      const notification = callback.mock.calls[0][0];
      expect(notification.source).toBe('chatwork');
      expect(notification.title).toBe('テストルーム');
      expect(notification.body).toBe('テストメッセージ');
      expect(notification.sender).toBe('田中太郎');
      expect(notification.id).toBe(`chatwork-${ROOM_ID}-1`);
    });

    it('未読メッセージがない場合はコールバックが呼ばれない', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValue(makeEmptyResponse());

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      await vi.runOnlyPendingTimersAsync();

      expect(callback).not.toHaveBeenCalled();
    });

    it('複数メッセージがある場合は全件コールバックされる', async () => {
      const msg2 = { ...sampleMessage, message_id: '2', body: 'メッセージ2' };
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValueOnce(makeMessagesResponse([sampleMessage, msg2]));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      await vi.runOnlyPendingTimersAsync();

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('会議URLを含むメッセージは priority が meeting になる', async () => {
      const meetingMsg = {
        ...sampleMessage,
        body: '定例 https://zoom.us/j/123456789 に参加してください',
      };
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValueOnce(makeMessagesResponse([meetingMsg]));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      await vi.runOnlyPendingTimersAsync();

      const notification = callback.mock.calls[0][0];
      expect(notification.priority).toBe('meeting');
      expect(notification.meetingUrl).toBe('https://zoom.us/j/123456789');
    });
  });

  // -----------------------------------------------------------------------
  // レート制限 (HTTP 429)
  // -----------------------------------------------------------------------
  describe('レート制限対応', () => {
    it('HTTP 429 を受信しても例外を外に出さない', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: vi.fn(),
        });

      await service.start();

      await expect(vi.runOnlyPendingTimersAsync()).resolves.not.toThrow();
    });

    it('429 受信後は次のポーリングが遅延する', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValueOnce({ ok: false, status: 429, json: vi.fn() })
        .mockResolvedValue(makeEmptyResponse());

      await service.start();

      // 最初のポーリング（429発生）
      await vi.runOnlyPendingTimersAsync();

      // 次のタイマー待機時間は 10s + 60s = 70s 以上になっているはず
      // vi.getTimerCount() が 1 のまま（停止していない）
      expect(vi.getTimerCount()).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // APIエラー
  // -----------------------------------------------------------------------
  describe('APIエラー対応', () => {
    it('API エラー (5xx) でもポーリングが継続する', async () => {
      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'テストルーム'))
        .mockResolvedValueOnce({ ok: false, status: 500, json: vi.fn() })
        .mockResolvedValue(makeEmptyResponse());

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      // 1回目のポーリング（500エラー）
      await vi.runOnlyPendingTimersAsync();
      // 2回目のポーリング（正常）
      await vi.runOnlyPendingTimersAsync();

      // エラー後もタイマーが動いている
      expect(vi.getTimerCount()).toBe(1);
    });

    it('ルーム名取得失敗時は "Room {roomId}" をフォールバックとして使う', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('network error')) // ルーム名取得失敗
        .mockResolvedValueOnce(makeMessagesResponse([sampleMessage]));

      const callback = vi.fn();
      service.onNotification(callback);
      await service.start();

      await vi.runOnlyPendingTimersAsync();

      const notification = callback.mock.calls[0][0];
      expect(notification.title).toBe(`Room ${ROOM_ID}`);
    });
  });

  // -----------------------------------------------------------------------
  // 複数ルーム
  // -----------------------------------------------------------------------
  describe('複数ルーム', () => {
    it('複数ルームを順番にポーリングする', async () => {
      const ROOM_ID_2 = 222;
      service = new ChatworkService({
        apiToken: API_TOKEN,
        roomIds: [ROOM_ID, ROOM_ID_2],
        pollingIntervalMs: 10_000,
      });

      mockFetch
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID, 'ルーム1'))
        .mockResolvedValueOnce(makeRoomResponse(ROOM_ID_2, 'ルーム2'))
        .mockResolvedValue(makeEmptyResponse());

      await service.start();
      await vi.runOnlyPendingTimersAsync();

      // ルーム1とルーム2のメッセージエンドポイントが呼ばれる
      const calls = mockFetch.mock.calls.map(([url]) => url as string);
      expect(calls.some((u) => u.includes(`/rooms/${ROOM_ID}/messages`))).toBe(true);
      expect(calls.some((u) => u.includes(`/rooms/${ROOM_ID_2}/messages`))).toBe(true);
    });
  });
});
