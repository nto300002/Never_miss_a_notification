/**
 * 会議URL のセキュリティ検証
 * main.ts のインラインロジックを抽出してテスト可能にした (TASK-018)
 */

export const ALLOWED_PROTOCOLS = ['https:', 'http:'];

export const ALLOWED_DOMAINS = [
  'zoom.us',
  'meet.google.com',
  'teams.microsoft.com',
  'webex.com',
];

/**
 * URL が許可された会議サービスのものかどうかを検証する
 * - プロトコルが http/https であること
 * - ドメインが許可リストに含まれていること（サブドメイン含む）
 * - javascript: / file: などの危険なスキームをブロック
 */
export function isAllowedMeetingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false;
    }

    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
