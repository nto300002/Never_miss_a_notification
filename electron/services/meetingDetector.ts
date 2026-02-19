/**
 * テキスト中から会議URL を検出する (TASK-011)
 * Slack / Chatwork / Gmail のメッセージ本文から Zoom / Meet / Teams / Webex URL を抽出
 */

const MEETING_PATTERNS: RegExp[] = [
  // Zoom: /j/, /w/, /my/
  /https?:\/\/(?:[\w-]+\.)?zoom\.us\/(?:j|w|my)\/[\w?=&#%-]+/,
  // Google Meet: meet.google.com/xxx-xxxx-xxx
  /https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/,
  // Microsoft Teams (新形式)
  /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"']+/,
  // Microsoft Teams (Live)
  /https?:\/\/teams\.live\.com\/meet\/[^\s<>"']+/,
  // Webex
  /https?:\/\/(?:[\w-]+\.)?webex\.com\/(?:meet|j)\/[^\s<>"']+/,
];

/**
 * テキストから最初に見つかった会議URLを返す
 * XSS 防止: javascript: スキームは除外済み（https?:// パターンのみマッチ）
 */
export function extractMeetingUrl(text: string): string | undefined {
  for (const pattern of MEETING_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return undefined;
}

export function hasMeetingUrl(text: string): boolean {
  return extractMeetingUrl(text) !== undefined;
}
