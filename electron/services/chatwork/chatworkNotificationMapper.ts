import type { Notification } from '../../../src/types/notification';
import { extractMeetingUrl } from '../meetingDetector';

export interface ChatworkMessage {
  message_id: string;
  account: {
    account_id: number;
    name: string;
    avatar_image_url: string;
  };
  body: string;
  send_time: number;
  update_time: number;
}

/**
 * Chatwork のメッセージを Notification に変換する（純粋関数）
 */
export function mapChatworkMessageToNotification(
  message: ChatworkMessage,
  roomId: number,
  roomName: string,
): Notification {
  const meetingUrl = extractMeetingUrl(message.body);

  return {
    id: `chatwork-${roomId}-${message.message_id}`,
    source: 'chatwork',
    title: roomName,
    body: message.body,
    sender: message.account.name,
    timestamp: message.send_time * 1000,
    priority: meetingUrl ? 'meeting' : 'normal',
    meetingUrl,
  };
}
