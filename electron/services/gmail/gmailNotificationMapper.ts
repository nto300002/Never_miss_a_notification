import type { gmail_v1 } from 'googleapis';
import type { Notification } from '../../../src/types/notification';
import { extractMeetingUrl } from '../meetingDetector';

/** Gmail メッセージヘッダーから指定ヘッダーの値を取得する */
function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string | undefined {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? undefined;
}

/**
 * "田中太郎 <tanaka@example.com>" 形式から表示名を抽出する
 * 表示名がなければメールアドレスをそのまま返す
 */
export function parseSenderName(from: string): string {
  // "Name <email>" または "Name" 形式
  const match = from.match(/^"?([^"<]+?)"?\s*(?:<[^>]+>)?$/);
  return match ? match[1].trim() : from;
}

/**
 * Gmail の Message オブジェクトを Notification に変換する（純粋関数）
 */
export function mapGmailMessageToNotification(message: gmail_v1.Schema$Message): Notification {
  const headers = message.payload?.headers;
  const subject = getHeader(headers, 'Subject') ?? '(件名なし)';
  const from = getHeader(headers, 'From') ?? '(送信者不明)';
  const dateStr = getHeader(headers, 'Date');
  const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();
  const snippet = message.snippet ?? '';

  // 件名とスニペット両方から会議 URL を検出
  const meetingUrl = extractMeetingUrl(`${subject} ${snippet}`);

  return {
    id: `gmail-${message.id ?? Date.now()}`,
    source: 'gmail',
    title: subject,
    body: snippet,
    sender: parseSenderName(from),
    timestamp,
    priority: meetingUrl ? 'meeting' : 'normal',
    meetingUrl,
  };
}
