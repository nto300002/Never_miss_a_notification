import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCard } from './NotificationCard';
import type { Notification } from '../types/notification';
import { SOURCE_CONFIG } from '../types/notification';

// テスト用通知ファクトリ
const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'test-1',
  source: 'slack',
  title: 'テスト通知',
  body: 'テスト本文です。長いテキストの場合は折りたたまれます。',
  sender: 'テストユーザー',
  timestamp: Date.now() - 5 * 60_000, // 5分前
  priority: 'normal',
  ...overrides,
});

const meetingNotification = makeNotification({
  id: 'meeting-1',
  source: 'zoom',
  title: 'Zoom ミーティング',
  body: '定例が始まります',
  priority: 'meeting',
  meetingUrl: 'https://zoom.us/j/123456789',
});

describe('NotificationCard', () => {
  const onDismiss = vi.fn();

  beforeEach(() => {
    onDismiss.mockClear();
  });

  describe('表示', () => {
    it('通知タイトルを表示する', () => {
      render(<NotificationCard notification={makeNotification()} onDismiss={onDismiss} index={0} />);
      expect(screen.getByText('テスト通知')).toBeInTheDocument();
    });

    it('ソースのラベルを SOURCE_CONFIG から表示する', () => {
      render(<NotificationCard notification={makeNotification({ source: 'slack' })} onDismiss={onDismiss} index={0} />);
      expect(screen.getByText(SOURCE_CONFIG.slack.label)).toBeInTheDocument();
    });

    it('各サービスのラベルを正しく表示する', () => {
      const sources = ['slack', 'chatwork', 'gmail', 'zoom', 'meet', 'teams'] as const;
      sources.forEach((source) => {
        const { unmount } = render(
          <NotificationCard
            notification={makeNotification({ source })}
            onDismiss={onDismiss}
            index={0}
          />
        );
        expect(screen.getByText(SOURCE_CONFIG[source].label)).toBeInTheDocument();
        unmount();
      });
    });

    it('削除ボタン（✕）が存在する', () => {
      render(<NotificationCard notification={makeNotification()} onDismiss={onDismiss} index={0} />);
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });
  });

  describe('展開・折りたたみ', () => {
    it('通常通知は初期状態で折りたたまれている（▼ ボタン表示）', () => {
      render(<NotificationCard notification={makeNotification()} onDismiss={onDismiss} index={0} />);
      expect(screen.getByRole('button', { name: '展開する' })).toBeInTheDocument();
    });

    it('会議通知は初期状態で展開されている（▲ ボタン表示）', () => {
      render(<NotificationCard notification={meetingNotification} onDismiss={onDismiss} index={0} />);
      expect(screen.getByRole('button', { name: '折りたたむ' })).toBeInTheDocument();
    });

    it('展開ボタンをクリックすると展開状態になる', () => {
      render(<NotificationCard notification={makeNotification()} onDismiss={onDismiss} index={0} />);
      const expandButton = screen.getByRole('button', { name: '展開する' });
      fireEvent.click(expandButton);
      expect(screen.getByRole('button', { name: '折りたたむ' })).toBeInTheDocument();
    });

    it('折りたたみボタンをクリックすると折りたたまれる', () => {
      render(<NotificationCard notification={meetingNotification} onDismiss={onDismiss} index={0} />);
      const collapseButton = screen.getByRole('button', { name: '折りたたむ' });
      fireEvent.click(collapseButton);
      expect(screen.getByRole('button', { name: '展開する' })).toBeInTheDocument();
    });
  });

  describe('削除', () => {
    it('削除ボタンをクリックすると onDismiss が呼ばれる', () => {
      render(<NotificationCard notification={makeNotification()} onDismiss={onDismiss} index={0} />);
      fireEvent.click(screen.getByRole('button', { name: '削除' }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('会議参加ボタン', () => {
    it('priority=meeting かつ meetingUrl がある場合、「会議に参加」ボタンが表示される', () => {
      render(<NotificationCard notification={meetingNotification} onDismiss={onDismiss} index={0} />);
      expect(screen.getByRole('button', { name: /会議に参加/ })).toBeInTheDocument();
    });

    it('priority=normal の場合、「会議に参加」ボタンが表示されない', () => {
      render(<NotificationCard notification={makeNotification()} onDismiss={onDismiss} index={0} />);
      expect(screen.queryByRole('button', { name: /会議に参加/ })).not.toBeInTheDocument();
    });

    it('priority=meeting でも meetingUrl が無ければボタンが表示されない', () => {
      const noUrl = makeNotification({ priority: 'meeting', meetingUrl: undefined });
      render(<NotificationCard notification={noUrl} onDismiss={onDismiss} index={0} />);
      expect(screen.queryByRole('button', { name: /会議に参加/ })).not.toBeInTheDocument();
    });

    it('「会議に参加」クリック時に window.electron.openMeetingUrl を呼ぶ', () => {
      render(<NotificationCard notification={meetingNotification} onDismiss={onDismiss} index={0} />);
      fireEvent.click(screen.getByRole('button', { name: /会議に参加/ }));
      expect(window.electron?.openMeetingUrl).toHaveBeenCalledWith(
        'https://zoom.us/j/123456789'
      );
    });

    it('window.electron が無い場合は window.open を呼ぶ（ブラウザ動作）', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const originalElectron = window.electron;
      // @ts-ignore
      window.electron = undefined;

      render(<NotificationCard notification={meetingNotification} onDismiss={onDismiss} index={0} />);
      fireEvent.click(screen.getByRole('button', { name: /会議に参加/ }));

      expect(windowOpenSpy).toHaveBeenCalledWith('https://zoom.us/j/123456789', '_blank');

      window.electron = originalElectron;
      windowOpenSpy.mockRestore();
    });
  });
});
