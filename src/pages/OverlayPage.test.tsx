import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OverlayPage } from './OverlayPage';
import type { Notification } from '../types/notification';

// demoNotifications をモック（テストで通知データを完全コントロール）
vi.mock('../data/demoNotifications', () => ({
  DEMO_NOTIFICATIONS: [
    {
      id: 'n1',
      source: 'slack',
      title: 'Slack 通知',
      body: 'Slack メッセージです',
      sender: '田中',
      timestamp: 1000,
      priority: 'normal',
    },
    {
      id: 'm1',
      source: 'zoom',
      title: 'Zoom 会議',
      body: 'ミーティングが始まります',
      sender: '鈴木',
      timestamp: 2000,
      priority: 'meeting',
      meetingUrl: 'https://zoom.us/j/123456789',
    },
    {
      id: 'n2',
      source: 'gmail',
      title: 'Gmail 通知',
      body: 'メールが届きました',
      sender: '山田',
      timestamp: 3000,
      priority: 'normal',
    },
  ] as Notification[],
}));

describe('OverlayPage', () => {
  beforeEach(() => {
    vi.mocked(window.electron!.onNotification).mockClear();
    vi.mocked(window.electron!.closeWindow).mockClear();
  });

  describe('初期表示', () => {
    it('すべての通知を表示する', () => {
      render(<OverlayPage />);
      expect(screen.getByText('Slack 通知')).toBeInTheDocument();
      expect(screen.getByText('Zoom 会議')).toBeInTheDocument();
      expect(screen.getByText('Gmail 通知')).toBeInTheDocument();
    });

    it('通知件数をフッターに表示する', () => {
      render(<OverlayPage />);
      expect(screen.getByText('3 件の通知')).toBeInTheDocument();
    });

    it('「NotifyForce」ヘッダーを表示する', () => {
      render(<OverlayPage />);
      expect(screen.getByText('NotifyForce')).toBeInTheDocument();
    });
  });

  describe('ソート', () => {
    it('会議通知（m1）が通常通知より前に表示される', () => {
      render(<OverlayPage />);
      const headings = screen
        .getAllByRole('heading', { level: 3 })
        .map((el) => el.textContent ?? '');
      const meetingIndex = headings.findIndex((t) => t.includes('Zoom 会議'));
      const slackIndex = headings.findIndex((t) => t.includes('Slack 通知'));
      const gmailIndex = headings.findIndex((t) => t.includes('Gmail 通知'));
      expect(meetingIndex).toBeLessThan(slackIndex);
      expect(meetingIndex).toBeLessThan(gmailIndex);
    });
  });

  describe('会議カウントバッジ', () => {
    it('会議通知がある場合にバッジを表示する', () => {
      render(<OverlayPage />);
      expect(screen.getByText(/会議 1件/)).toBeInTheDocument();
    });

    it('全消去後はバッジが消える', () => {
      render(<OverlayPage />);
      fireEvent.click(screen.getByTitle('すべて消去'));
      expect(screen.queryByText(/会議.*件/)).not.toBeInTheDocument();
    });
  });

  describe('通知の削除', () => {
    it('削除ボタンをクリックすると対象の通知が消える', () => {
      render(<OverlayPage />);
      const dismissButtons = screen.getAllByRole('button', { name: '削除' });
      // 最初に表示されるのは meeting 通知（ソート後）
      fireEvent.click(dismissButtons[0]);
      expect(screen.queryByText('Zoom 会議')).not.toBeInTheDocument();
      expect(screen.getByText('2 件の通知')).toBeInTheDocument();
    });
  });

  describe('全削除', () => {
    it('全消去ボタン（🔕）をクリックすると通知が全て消える', () => {
      render(<OverlayPage />);
      fireEvent.click(screen.getByTitle('すべて消去'));
      expect(screen.getByText('通知はありません')).toBeInTheDocument();
    });

    it('通知が0件の場合にフッターに「サービス監視中...」を表示する', () => {
      render(<OverlayPage />);
      fireEvent.click(screen.getByTitle('すべて消去'));
      expect(screen.getByText('サービス監視中...')).toBeInTheDocument();
    });
  });

  describe('パネルの開閉', () => {
    it('閉じるボタン（✕）クリック時に Electron の closeWindow を呼ぶ', () => {
      render(<OverlayPage />);
      fireEvent.click(screen.getByTitle(/閉じる/));
      expect(window.electron?.closeWindow).toHaveBeenCalledTimes(1);
    });

    it('window.electron が無い場合、閉じるボタンでパネルが非表示になる', () => {
      const originalElectron = window.electron;
      // @ts-ignore
      window.electron = undefined;

      render(<OverlayPage />);
      fireEvent.click(screen.getByTitle(/閉じる/));

      expect(screen.queryByText('NotifyForce')).not.toBeInTheDocument();
      expect(screen.getByText('パネルを開く')).toBeInTheDocument();

      window.electron = originalElectron;
    });

    it('Ctrl+Shift+Q でパネルが閉じる（window.electron 無し）', () => {
      const originalElectron = window.electron;
      // @ts-ignore
      window.electron = undefined;

      render(<OverlayPage />);
      fireEvent.keyDown(window, { key: 'Q', ctrlKey: true, shiftKey: true });

      expect(screen.queryByText('NotifyForce')).not.toBeInTheDocument();

      window.electron = originalElectron;
    });

    it('非表示状態で「パネルを開く」をクリックすると再表示される', () => {
      const originalElectron = window.electron;
      // @ts-ignore
      window.electron = undefined;

      render(<OverlayPage />);
      fireEvent.click(screen.getByTitle(/閉じる/));
      expect(screen.getByText('パネルを開く')).toBeInTheDocument();

      fireEvent.click(screen.getByText('パネルを開く'));
      expect(screen.getByText('NotifyForce')).toBeInTheDocument();

      window.electron = originalElectron;
    });
  });

  describe('Electron API 連携', () => {
    it('マウント時に window.electron.onNotification にコールバックを登録する', () => {
      render(<OverlayPage />);
      expect(window.electron?.onNotification).toHaveBeenCalledTimes(1);
    });

    it('onNotification 経由で受信した通知を一覧に追加する', () => {
      render(<OverlayPage />);

      // 登録されたコールバックを取得
      const registeredCallback = vi.mocked(window.electron!.onNotification).mock.calls[0][0];
      const newNotification: Notification = {
        id: 'new-99',
        source: 'chatwork',
        title: 'リアルタイム通知',
        body: 'Electron から届いた通知',
        sender: '佐藤',
        timestamp: Date.now(),
        priority: 'normal',
      };

      act(() => {
        registeredCallback(newNotification);
      });

      expect(screen.getByText('リアルタイム通知')).toBeInTheDocument();
      expect(screen.getByText('4 件の通知')).toBeInTheDocument();
    });
  });
});
