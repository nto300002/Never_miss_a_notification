import type { Notification } from '../types/notification';

/**
 * 通知を優先度（会議 > 通常）→ タイムスタンプ降順でソート
 * - meeting 優先度の通知を先頭に集める
 * - 同じ優先度内では新しい通知（timestamp 大）が上
 */
export function sortNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    if (a.priority === 'meeting' && b.priority !== 'meeting') return -1;
    if (a.priority !== 'meeting' && b.priority === 'meeting') return 1;
    return b.timestamp - a.timestamp;
  });
}
