import { describe, it, expect } from 'vitest';
import { mapSlackEventToNotification } from './slackNotificationMapper';

// Slack Socket Mode の message イベントの最小形
const baseEvent = {
  type: 'message',
  channel: 'C12345678',
  channel_name: 'general',
  user: 'U12345678',
  username: '田中太郎',
  text: 'おはようございます',
  ts: '1708300000.123456',
};

describe('mapSlackEventToNotification', () => {
  describe('基本変換', () => {
    it('source が slack になる', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.source).toBe('slack');
    });

    it('title がチャンネル名になる', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.title).toBe('#general');
    });

    it('body がメッセージテキストになる', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.body).toBe('おはようございます');
    });

    it('sender がユーザー名になる', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.sender).toBe('田中太郎');
    });

    it('timestamp が Slack ts（秒）から ms に変換される', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.timestamp).toBe(1708300000123);
    });

    it('id が channel + ts から生成される', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.id).toBe('slack-C12345678-1708300000.123456');
    });
  });

  describe('priority', () => {
    it('会議URLが無い場合は normal', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.priority).toBe('normal');
    });

    it('会議URLがある場合は meeting', () => {
      const event = { ...baseEvent, text: '定例MTG https://zoom.us/j/987654321 参加してください' };
      const result = mapSlackEventToNotification(event);
      expect(result.priority).toBe('meeting');
    });
  });

  describe('meetingUrl', () => {
    it('会議URLが無い場合は meetingUrl が undefined', () => {
      const result = mapSlackEventToNotification(baseEvent);
      expect(result.meetingUrl).toBeUndefined();
    });

    it('Zoom URLを抽出して meetingUrl にセットする', () => {
      const event = { ...baseEvent, text: 'https://zoom.us/j/987654321 に参加してください' };
      const result = mapSlackEventToNotification(event);
      expect(result.meetingUrl).toBe('https://zoom.us/j/987654321');
    });

    it('Google Meet URLを抽出する', () => {
      const event = { ...baseEvent, text: 'https://meet.google.com/abc-defg-hij で話しましょう' };
      const result = mapSlackEventToNotification(event);
      expect(result.meetingUrl).toBe('https://meet.google.com/abc-defg-hij');
    });
  });

  describe('エッジケース', () => {
    it('channel_name が無い場合は channel ID をタイトルに使う', () => {
      const event = { ...baseEvent, channel_name: undefined };
      const result = mapSlackEventToNotification(event);
      expect(result.title).toBe('#C12345678');
    });

    it('username が無い場合は user ID を sender に使う', () => {
      const event = { ...baseEvent, username: undefined };
      const result = mapSlackEventToNotification(event);
      expect(result.sender).toBe('U12345678');
    });

    it('text が空の場合は body が空文字', () => {
      const event = { ...baseEvent, text: '' };
      const result = mapSlackEventToNotification(event);
      expect(result.body).toBe('');
    });
  });
});
