import { describe, it, expect } from 'vitest';
import { mapChatworkMessageToNotification, type ChatworkMessage } from './chatworkNotificationMapper';

const baseMessage: ChatworkMessage = {
  message_id: '100',
  account: {
    account_id: 1234567,
    name: '田中太郎',
    avatar_image_url: 'https://example.com/avatar.jpg',
  },
  body: 'お疲れさまです',
  send_time: 1708300000,
  update_time: 0,
};

describe('mapChatworkMessageToNotification', () => {
  describe('基本変換', () => {
    it('source が chatwork になる', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.source).toBe('chatwork');
    });

    it('title がルーム名になる', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.title).toBe('テストルーム');
    });

    it('body がメッセージ本文になる', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.body).toBe('お疲れさまです');
    });

    it('sender がアカウント名になる', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.sender).toBe('田中太郎');
    });

    it('timestamp が send_time（秒）から ms に変換される', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.timestamp).toBe(1708300000000);
    });

    it('id が chatwork-{roomId}-{message_id} になる', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.id).toBe('chatwork-111-100');
    });
  });

  describe('priority', () => {
    it('会議URLがない場合は normal', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.priority).toBe('normal');
    });

    it('Zoom URLがある場合は meeting', () => {
      const msg = { ...baseMessage, body: '定例MTG https://zoom.us/j/987654321 参加ください' };
      const result = mapChatworkMessageToNotification(msg, 111, 'テストルーム');
      expect(result.priority).toBe('meeting');
    });

    it('Google Meet URLがある場合は meeting', () => {
      const msg = { ...baseMessage, body: 'https://meet.google.com/abc-defg-hij で話しましょう' };
      const result = mapChatworkMessageToNotification(msg, 111, 'テストルーム');
      expect(result.priority).toBe('meeting');
    });
  });

  describe('meetingUrl', () => {
    it('会議URLがない場合は meetingUrl が undefined', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 111, 'テストルーム');
      expect(result.meetingUrl).toBeUndefined();
    });

    it('Zoom URLを抽出して meetingUrl にセットする', () => {
      const msg = { ...baseMessage, body: 'https://zoom.us/j/987654321 に参加してください' };
      const result = mapChatworkMessageToNotification(msg, 111, 'テストルーム');
      expect(result.meetingUrl).toBe('https://zoom.us/j/987654321');
    });

    it('Teams URLを抽出する', () => {
      const teamsUrl =
        'https://teams.microsoft.com/l/meetup-join/19%3Ameeting_xxx/0?context=%7B%7D';
      const msg = { ...baseMessage, body: `会議: ${teamsUrl}` };
      const result = mapChatworkMessageToNotification(msg, 111, 'テストルーム');
      expect(result.meetingUrl).toBe(teamsUrl);
    });
  });

  describe('エッジケース', () => {
    it('body が空文字でも変換できる', () => {
      const msg = { ...baseMessage, body: '' };
      const result = mapChatworkMessageToNotification(msg, 111, 'テストルーム');
      expect(result.body).toBe('');
      expect(result.priority).toBe('normal');
      expect(result.meetingUrl).toBeUndefined();
    });

    it('ルーム名が空文字でも変換できる', () => {
      const result = mapChatworkMessageToNotification(baseMessage, 999, '');
      expect(result.title).toBe('');
    });
  });
});
