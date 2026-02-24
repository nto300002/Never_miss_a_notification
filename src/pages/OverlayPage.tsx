import { useState, useEffect } from 'react';
import { NotificationCard } from '../components/NotificationCard';
import type { Notification } from '../types/notification';
import { DEMO_NOTIFICATIONS } from '../data/demoNotifications';
import { sortNotifications } from '../utils/notificationSort';

export function OverlayPage() {
  // Electron 内では空スタート（実通知のみ表示）、ブラウザ preview ではデモデータを表示
  const isElectron = navigator.userAgent.includes('Electron');
  const [notifications, setNotifications] = useState<Notification[]>(
    isElectron ? [] : DEMO_NOTIFICATIONS
  );
  const [visible, setVisible] = useState(true);

  // 会議通知の数をカウント
  const meetingCount = notifications.filter((n) => n.priority === 'meeting').length;

  // 通知をソート（会議優先 → タイムスタンプ降順）
  const sortedNotifications = sortNotifications(notifications);

  // 個別通知の削除
  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 全通知の削除
  const clearAll = () => {
    setNotifications([]);
  };

  // パネルを閉じる（Electron ではウィンドウを隠す、ブラウザでは非表示）
  const handleClose = () => {
    if (window.electron?.closeWindow) {
      window.electron.closeWindow();
    } else {
      setVisible(false);
    }
  };

  // Electron APIから通知を受信
  useEffect(() => {
    if (!window.electron?.onNotification) return;
    const cleanup = window.electron.onNotification((notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    return cleanup;
  }, []);

  // Ctrl+Shift+Q でトグル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q')) {
        if (visible) {
          handleClose();
        } else {
          setVisible(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  if (!visible) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP', sans-serif",
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          ⌨️ Ctrl+Shift+Q で開く
        </p>
        <button
          onClick={() => setVisible(true)}
          style={{
            marginTop: 16,
            padding: '6px 16px',
            borderRadius: 8,
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          パネルを開く
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP', sans-serif",
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.2); }
          50% { box-shadow: 0 0 40px rgba(99,102,241,0.4); }
        }
      `}</style>

      {/* Notification panel */}
      <div
        style={{
          width: 440,
          maxHeight: 560,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(26,26,26,0.97)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#818cf8',
                animation: 'pulseGlow 2s ease-in-out infinite',
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>
              NotifyForce
            </span>
            {meetingCount > 0 && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.15)',
                  color: '#f87171',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                🔴 会議 {meetingCount}件
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={clearAll}
              style={{
                padding: 4,
                borderRadius: 6,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                fontSize: 13,
              }}
              title="すべて消去"
            >
              🔕
            </button>
            <button
              style={{
                padding: 4,
                borderRadius: 6,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                fontSize: 13,
              }}
              title="設定"
            >
              ⚙️
            </button>
            <button
              onClick={handleClose}
              style={{
                padding: 4,
                borderRadius: 6,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                fontSize: 15,
                lineHeight: 1,
              }}
              title="閉じる (Ctrl+Shift+Q)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'rgba(26,26,26,0.97)',
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          {sortedNotifications.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 0',
                color: 'rgba(255,255,255,0.2)',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔕</div>
              <p style={{ fontSize: 13 }}>通知はありません</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Ctrl+Shift+N で開閉</p>
            </div>
          ) : (
            sortedNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={() => dismissNotification(notification.id)}
                index={index}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'rgba(26,26,26,0.97)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
            {notifications.length > 0
              ? `${notifications.length} 件の通知`
              : 'サービス監視中...'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
            ⌨️ Ctrl+Shift+Q で開閉 ｜ NotifyForce プレビュー
          </span>
        </div>
      </div>
    </div>
  );
}
