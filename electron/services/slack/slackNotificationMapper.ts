import type { Notification } from '../../../src/types/notification';
import { extractMeetingUrl } from '../../services/meetingDetector';

export interface SlackMessageEvent {
  type: string;
  channel: string;
  channel_name?: string;
  user: string;
  username?: string;
  text: string;
  ts: string;
}

/**
 * Slack の message イベントを Notification に変換する（純粋関数）
 */
export function mapSlackEventToNotification(event: SlackMessageEvent): Notification {
  const meetingUrl = extractMeetingUrl(event.text);

  return {
    id: `slack-${event.channel}-${event.ts}`,
    source: 'slack',
    title: `#${event.channel_name ?? event.channel}`,
    body: event.text,
    sender: event.username ?? event.user,
    timestamp: Math.round(parseFloat(event.ts) * 1000),
    priority: meetingUrl ? 'meeting' : 'normal',
    meetingUrl,
  };
}
