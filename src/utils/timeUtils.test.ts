import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTimeAgo } from './timeUtils';

describe('getTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const now = new Date('2026-02-19T12:00:00.000Z').getTime();

  describe('たった今', () => {
    it('0秒前は「たった今」を返す', () => {
      expect(getTimeAgo(now)).toBe('たった今');
    });

    it('30秒前は「たった今」を返す', () => {
      expect(getTimeAgo(now - 30_000)).toBe('たった今');
    });

    it('59秒前は「たった今」を返す', () => {
      expect(getTimeAgo(now - 59_999)).toBe('たった今');
    });
  });

  describe('分前', () => {
    it('ちょうど1分前は「1 分前」を返す', () => {
      expect(getTimeAgo(now - 60_000)).toBe('1 分前');
    });

    it('5分前は「5 分前」を返す', () => {
      expect(getTimeAgo(now - 5 * 60_000)).toBe('5 分前');
    });

    it('59分前は「59 分前」を返す', () => {
      expect(getTimeAgo(now - 59 * 60_000)).toBe('59 分前');
    });
  });

  describe('時間前', () => {
    it('ちょうど1時間前は「1 時間前」を返す', () => {
      expect(getTimeAgo(now - 60 * 60_000)).toBe('1 時間前');
    });

    it('2時間前は「2 時間前」を返す', () => {
      expect(getTimeAgo(now - 2 * 60 * 60_000)).toBe('2 時間前');
    });

    it('23時間前は「23 時間前」を返す', () => {
      expect(getTimeAgo(now - 23 * 60 * 60_000)).toBe('23 時間前');
    });
  });

  describe('日前', () => {
    it('ちょうど1日前は「1 日前」を返す', () => {
      expect(getTimeAgo(now - 24 * 60 * 60_000)).toBe('1 日前');
    });

    it('3日前は「3 日前」を返す', () => {
      expect(getTimeAgo(now - 3 * 24 * 60 * 60_000)).toBe('3 日前');
    });
  });
});
