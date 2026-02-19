// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isAllowedMeetingUrl } from './urlValidator';

describe('isAllowedMeetingUrl', () => {
  describe('許可ドメイン（正常系）', () => {
    it('zoom.us は許可', () => {
      expect(isAllowedMeetingUrl('https://zoom.us/j/123456789')).toBe(true);
    });

    it('meet.google.com は許可', () => {
      expect(isAllowedMeetingUrl('https://meet.google.com/abc-defg-hij')).toBe(true);
    });

    it('teams.microsoft.com は許可', () => {
      expect(
        isAllowedMeetingUrl('https://teams.microsoft.com/l/meetup-join/xyz')
      ).toBe(true);
    });

    it('webex.com は許可', () => {
      expect(isAllowedMeetingUrl('https://company.webex.com/meet/room')).toBe(true);
    });

    it('zoom.us のサブドメインは許可', () => {
      expect(isAllowedMeetingUrl('https://us02web.zoom.us/j/987654321')).toBe(true);
    });

    it('http:// プロトコルも許可', () => {
      expect(isAllowedMeetingUrl('http://zoom.us/j/123')).toBe(true);
    });
  });

  describe('ブロック（異常系）', () => {
    it('javascript: スキームはブロック', () => {
      expect(isAllowedMeetingUrl('javascript:alert("xss")')).toBe(false);
    });

    it('file:// スキームはブロック', () => {
      expect(isAllowedMeetingUrl('file:///etc/passwd')).toBe(false);
    });

    it('未知のドメインはブロック', () => {
      expect(isAllowedMeetingUrl('https://evil.com/meet/123')).toBe(false);
    });

    it('zoom.us を含む悪意あるドメインはブロック（サフィックス偽装）', () => {
      expect(isAllowedMeetingUrl('https://evil-zoom.us/j/123')).toBe(false);
    });

    it('zoom.us をサブドメインに含む攻撃はブロック（プレフィックス偽装）', () => {
      // zoom.us.evil.com のようなケース
      expect(isAllowedMeetingUrl('https://zoom.us.evil.com/j/123')).toBe(false);
    });

    it('不正なURL文字列はブロック', () => {
      expect(isAllowedMeetingUrl('not a url')).toBe(false);
    });

    it('空文字はブロック', () => {
      expect(isAllowedMeetingUrl('')).toBe(false);
    });

    it('ftp:// スキームはブロック', () => {
      expect(isAllowedMeetingUrl('ftp://zoom.us/j/123')).toBe(false);
    });
  });
});
