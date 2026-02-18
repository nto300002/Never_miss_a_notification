/**
 * タイムスタンプから相対時間を計算して日本語で返す
 * @param timestamp - Unixタイムスタンプ（ミリ秒）
 * @returns 相対時間の文字列（例: "たった今", "5 分前", "2 時間前"）
 */
export function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes} 分前`;
  if (hours < 24) return `${hours} 時間前`;
  return `${days} 日前`;
}
