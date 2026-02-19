import { describe, it, expect } from 'vitest';
import { sortNotifications } from './notificationSort';
import type { Notification } from '../types/notification';

// テスト用ファクトリ
const makeNotification = (overrides: Partial<Notification>): Notification => ({
  id: 'test-id',
  source: 'slack',
  title: 'Test',
  body: 'Body',
  sender: 'user',
  timestamp: Date.now(),
  priority: 'normal',
  ...overrides,
});

describe('sortNotifications', () => {
  it('空配列はそのまま返す', () => {
    expect(sortNotifications([])).toEqual([]);
  });

  it('元の配列を破壊しない（イミュータブル）', () => {
    const original = [
      makeNotification({ id: '1', priority: 'normal' }),
      makeNotification({ id: '2', priority: 'meeting' }),
    ];
    const copy = [...original];
    sortNotifications(original);
    expect(original).toEqual(copy);
  });

  describe('優先度ソート', () => {
    it('meeting は normal より前に来る', () => {
      const notifications = [
        makeNotification({ id: 'n1', priority: 'normal', timestamp: 2000 }),
        makeNotification({ id: 'm1', priority: 'meeting', timestamp: 1000 }),
      ];
      const result = sortNotifications(notifications);
      expect(result[0].id).toBe('m1');
      expect(result[1].id).toBe('n1');
    });

    it('複数の meeting が normal より前に来る', () => {
      const notifications = [
        makeNotification({ id: 'n1', priority: 'normal', timestamp: 5000 }),
        makeNotification({ id: 'm1', priority: 'meeting', timestamp: 1000 }),
        makeNotification({ id: 'n2', priority: 'normal', timestamp: 3000 }),
        makeNotification({ id: 'm2', priority: 'meeting', timestamp: 2000 }),
      ];
      const result = sortNotifications(notifications);
      expect(result[0].priority).toBe('meeting');
      expect(result[1].priority).toBe('meeting');
      expect(result[2].priority).toBe('normal');
      expect(result[3].priority).toBe('normal');
    });
  });

  describe('タイムスタンプソート（降順 = 新しい順）', () => {
    it('meeting 同士は新しい順に並ぶ', () => {
      const notifications = [
        makeNotification({ id: 'm_old', priority: 'meeting', timestamp: 1000 }),
        makeNotification({ id: 'm_new', priority: 'meeting', timestamp: 3000 }),
      ];
      const result = sortNotifications(notifications);
      expect(result[0].id).toBe('m_new');
      expect(result[1].id).toBe('m_old');
    });

    it('normal 同士は新しい順に並ぶ', () => {
      const notifications = [
        makeNotification({ id: 'n_old', priority: 'normal', timestamp: 1000 }),
        makeNotification({ id: 'n_new', priority: 'normal', timestamp: 5000 }),
      ];
      const result = sortNotifications(notifications);
      expect(result[0].id).toBe('n_new');
      expect(result[1].id).toBe('n_old');
    });
  });

  describe('複合ソート', () => {
    it('meeting(新) > meeting(旧) > normal(新) > normal(旧) の順になる', () => {
      const notifications = [
        makeNotification({ id: 'n_old', priority: 'normal', timestamp: 1000 }),
        makeNotification({ id: 'm_old', priority: 'meeting', timestamp: 2000 }),
        makeNotification({ id: 'n_new', priority: 'normal', timestamp: 3000 }),
        makeNotification({ id: 'm_new', priority: 'meeting', timestamp: 4000 }),
      ];
      const result = sortNotifications(notifications);
      expect(result.map((n) => n.id)).toEqual(['m_new', 'm_old', 'n_new', 'n_old']);
    });
  });
});
