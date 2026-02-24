import { describe, it, expect } from 'vitest';
import { mapGmailMessageToNotification, parseSenderName } from './gmailNotificationMapper';
import type { gmail_v1 } from 'googleapis';

// -----------------------------------------------------------------------
// テストフィクスチャ
// -----------------------------------------------------------------------

function makeMessage(overrides: Partial<gmail_v1.Schema$Message> = {}): gmail_v1.Schema$Message {
  return {
    id: 'msg-001',
    snippet: 'テストメールの本文プレビューです',
    payload: {
      headers: [
        { name: 'Subject', value: 'テスト件名' },
        { name: 'From', value: '田中太郎 <tanaka@example.com>' },
        { name: 'Date', value: 'Mon, 19 Feb 2024 10:00:00 +0900' },
      ],
    },
    ...overrides,
  };
}

// -----------------------------------------------------------------------
// parseSenderName
// -----------------------------------------------------------------------

describe('parseSenderName', () => {
  it('"Name <email>" 形式から表示名を返す', () => {
    expect(parseSenderName('田中太郎 <tanaka@example.com>')).toBe('田中太郎');
  });

  it('"<email>" 形式のみの場合はメールアドレスをそのまま返す', () => {
    expect(parseSenderName('<tanaka@example.com>')).toBe('<tanaka@example.com>');
  });

  it('表示名のみの場合はそのまま返す', () => {
    expect(parseSenderName('田中太郎')).toBe('田中太郎');
  });

  it('ダブルクォートを除去する', () => {
    expect(parseSenderName('"田中太郎" <tanaka@example.com>')).toBe('田中太郎');
  });
});

// -----------------------------------------------------------------------
// mapGmailMessageToNotification
// -----------------------------------------------------------------------

describe('mapGmailMessageToNotification', () => {
  describe('基本変換', () => {
    it('source が gmail になる', () => {
      const result = mapGmailMessageToNotification(makeMessage());
      expect(result.source).toBe('gmail');
    });

    it('title が Subject ヘッダーになる', () => {
      const result = mapGmailMessageToNotification(makeMessage());
      expect(result.title).toBe('テスト件名');
    });

    it('body が snippet になる', () => {
      const result = mapGmailMessageToNotification(makeMessage());
      expect(result.body).toBe('テストメールの本文プレビューです');
    });

    it('sender が From ヘッダーの表示名になる', () => {
      const result = mapGmailMessageToNotification(makeMessage());
      expect(result.sender).toBe('田中太郎');
    });

    it('timestamp が Date ヘッダーから変換される', () => {
      const result = mapGmailMessageToNotification(makeMessage());
      expect(result.timestamp).toBe(new Date('Mon, 19 Feb 2024 10:00:00 +0900').getTime());
    });

    it('id が gmail-{messageId} になる', () => {
      const result = mapGmailMessageToNotification(makeMessage());
      expect(result.id).toBe('gmail-msg-001');
    });
  });

  describe('priority と meetingUrl', () => {
    it('会議 URL がない場合は priority が normal', () => {
      const result = mapGmailMessageToNotification(makeMessage());
      expect(result.priority).toBe('normal');
    });

    it('Subject に Zoom URL がある場合は priority が meeting', () => {
      const msg = makeMessage({
        payload: {
          headers: [
            { name: 'Subject', value: '定例 https://zoom.us/j/123456789 参加ください' },
            { name: 'From', value: '田中太郎 <t@example.com>' },
            { name: 'Date', value: 'Mon, 19 Feb 2024 10:00:00 +0900' },
          ],
        },
      });
      const result = mapGmailMessageToNotification(msg);
      expect(result.priority).toBe('meeting');
      expect(result.meetingUrl).toBe('https://zoom.us/j/123456789');
    });

    it('snippet に Meet URL がある場合も priority が meeting になる', () => {
      const msg = makeMessage({ snippet: '招待 https://meet.google.com/abc-defg-hij' });
      const result = mapGmailMessageToNotification(msg);
      expect(result.priority).toBe('meeting');
      expect(result.meetingUrl).toBe('https://meet.google.com/abc-defg-hij');
    });
  });

  describe('エッジケース', () => {
    it('Subject ヘッダーが無い場合は title が "(件名なし)"', () => {
      const msg = makeMessage({
        payload: {
          headers: [
            { name: 'From', value: 'test@example.com' },
            { name: 'Date', value: 'Mon, 19 Feb 2024 10:00:00 +0900' },
          ],
        },
      });
      const result = mapGmailMessageToNotification(msg);
      expect(result.title).toBe('(件名なし)');
    });

    it('From ヘッダーが無い場合は sender が "(送信者不明)"', () => {
      const msg = makeMessage({
        payload: {
          headers: [
            { name: 'Subject', value: 'テスト' },
            { name: 'Date', value: 'Mon, 19 Feb 2024 10:00:00 +0900' },
          ],
        },
      });
      const result = mapGmailMessageToNotification(msg);
      expect(result.sender).toBe('(送信者不明)');
    });

    it('Date ヘッダーが無い場合は timestamp が現在時刻に近い値になる', () => {
      const before = Date.now();
      const msg = makeMessage({
        payload: {
          headers: [
            { name: 'Subject', value: 'テスト' },
            { name: 'From', value: 'a@example.com' },
          ],
        },
      });
      const result = mapGmailMessageToNotification(msg);
      const after = Date.now();
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });

    it('snippet が無い場合は body が空文字', () => {
      const msg = makeMessage({ snippet: undefined });
      const result = mapGmailMessageToNotification(msg);
      expect(result.body).toBe('');
    });

    it('payload が無い場合もクラッシュしない', () => {
      const msg: gmail_v1.Schema$Message = { id: 'x', snippet: 'test' };
      expect(() => mapGmailMessageToNotification(msg)).not.toThrow();
    });
  });
});
