// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { extractMeetingUrl, hasMeetingUrl } from './meetingDetector';

describe('extractMeetingUrl', () => {
  describe('Zoom', () => {
    it('/j/ パターンを検出', () => {
      const url = 'https://zoom.us/j/123456789';
      expect(extractMeetingUrl(url)).toBe(url);
    });

    it('/w/ パターンを検出', () => {
      const url = 'https://zoom.us/w/987654321';
      expect(extractMeetingUrl(url)).toBe(url);
    });

    it('/my/ パターンを検出', () => {
      const url = 'https://zoom.us/my/myroom';
      expect(extractMeetingUrl(url)).toBe(url);
    });

    it('サブドメイン付きの Zoom URL を検出', () => {
      const url = 'https://us02web.zoom.us/j/123456789';
      expect(extractMeetingUrl(url)).toBe(url);
    });

    it('テキストに埋め込まれた Zoom URL を抽出', () => {
      const text = '定例ミーティングが始まります https://zoom.us/j/123456789 よろしく';
      expect(extractMeetingUrl(text)).toBe('https://zoom.us/j/123456789');
    });
  });

  describe('Google Meet', () => {
    it('meet.google.com URL を検出', () => {
      const url = 'https://meet.google.com/abc-defg-hij';
      expect(extractMeetingUrl(url)).toBe(url);
    });

    it('テキストに埋め込まれた Meet URL を抽出', () => {
      const text = 'レビュー会議を開始します https://meet.google.com/xyz-abcd-efg 参加してください';
      expect(extractMeetingUrl(text)).toBe('https://meet.google.com/xyz-abcd-efg');
    });
  });

  describe('Microsoft Teams', () => {
    it('teams.microsoft.com meetup-join URL を検出', () => {
      const url = 'https://teams.microsoft.com/l/meetup-join/19%3Ameeting_id/0';
      expect(extractMeetingUrl(url)).toBe(url);
    });

    it('teams.live.com URL を検出', () => {
      const url = 'https://teams.live.com/meet/9876543210';
      expect(extractMeetingUrl(url)).toBe(url);
    });
  });

  describe('Webex', () => {
    it('webex.com meet URL を検出', () => {
      const url = 'https://company.webex.com/meet/roomname';
      expect(extractMeetingUrl(url)).toBe(url);
    });
  });

  describe('検出なし', () => {
    it('会議URLが無いテキストは undefined を返す', () => {
      expect(extractMeetingUrl('明日のミーティングについて確認があります')).toBeUndefined();
    });

    it('空文字は undefined を返す', () => {
      expect(extractMeetingUrl('')).toBeUndefined();
    });

    it('通常の URL（会議でない）は検出しない', () => {
      expect(extractMeetingUrl('https://example.com/page')).toBeUndefined();
    });

    it('github.com URL は検出しない', () => {
      expect(extractMeetingUrl('https://github.com/user/repo')).toBeUndefined();
    });
  });

  describe('XSS 対策', () => {
    it('javascript: スキームは検出しない', () => {
      // MEETING_PATTERNS は https?:// のみマッチするため、javascript: はヒットしない
      expect(extractMeetingUrl('javascript:alert("xss")')).toBeUndefined();
    });

    it('javascript: が埋め込まれたテキストでも会議URLは正しく検出', () => {
      const text = 'javascript:void(0) https://zoom.us/j/123456789';
      expect(extractMeetingUrl(text)).toBe('https://zoom.us/j/123456789');
    });
  });
});

describe('hasMeetingUrl', () => {
  it('会議URLがあれば true を返す', () => {
    expect(hasMeetingUrl('会議 https://zoom.us/j/123 に参加してください')).toBe(true);
  });

  it('会議URLが無ければ false を返す', () => {
    expect(hasMeetingUrl('普通のメッセージです')).toBe(false);
  });
});
