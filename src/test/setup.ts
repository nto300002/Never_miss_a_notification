import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// window.electron のグローバルモック（jsdom 環境のみ有効）
if (typeof window !== 'undefined') {
  const electronMock = {
    onNotification: vi.fn(),
    dismissNotification: vi.fn(),
    dismissAllNotifications: vi.fn(),
    openMeetingUrl: vi.fn(),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    loadSettings: vi.fn().mockResolvedValue({}),
    minimizeWindow: vi.fn(),
    closeWindow: vi.fn(),
  };

  Object.defineProperty(window, 'electron', {
    value: electronMock,
    writable: true,
    configurable: true,
  });
}

// 各テスト前にモックの呼び出し履歴をリセット
beforeEach(() => {
  if (typeof window !== 'undefined' && window.electron) {
    vi.mocked(window.electron.onNotification).mockClear();
    vi.mocked(window.electron.openMeetingUrl).mockClear();
    vi.mocked(window.electron.dismissNotification).mockClear();
  }
});
