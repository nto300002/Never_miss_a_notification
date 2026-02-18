import { useState } from 'react';
import { Notification, SOURCE_CONFIG } from '../types/notification';
import { getTimeAgo } from '../utils/timeUtils';

interface NotificationCardProps {
  notification: Notification;
  onDismiss: () => void;
  index: number;
}

export function NotificationCard({ notification, onDismiss, index }: NotificationCardProps) {
  const [expanded, setExpanded] = useState(notification.priority === 'meeting');
  const config = SOURCE_CONFIG[notification.source];
  const isMeeting = notification.priority === 'meeting';

  const handleJoinMeeting = () => {
    if (notification.meetingUrl) {
      // Electron APIを使用してURLを開く
      if (window.electron?.openMeetingUrl) {
        window.electron.openMeetingUrl(notification.meetingUrl);
      } else {
        // ブラウザモードの場合
        window.open(notification.meetingUrl, '_blank');
      }
    }
  };

  return (
    <div
      style={{
        margin: '0 8px 6px',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${isMeeting ? config.border : 'rgba(255,255,255,0.05)'}`,
        background: isMeeting ? config.bg : 'rgba(255,255,255,0.03)',
        animation: `fadeSlideIn 0.3s ease-out ${index * 60}ms both`,
        boxShadow: isMeeting ? `0 0 20px ${config.bg}` : 'none',
      }}
    >
      <div style={{ padding: '12px 14px' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {/* アイコン */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: config.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {config.emoji}
          </div>

          {/* ソース名・タイムスタンプ */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ color: config.color, fontSize: 12, fontWeight: 600 }}>
              {config.label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>・</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              {getTimeAgo(notification.timestamp)}
            </span>
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: 4,
                borderRadius: 6,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                fontSize: 12,
              }}
              aria-label={expanded ? '折りたたむ' : '展開する'}
            >
              {expanded ? '▲' : '▼'}
            </button>
            <button
              onClick={onDismiss}
              style={{
                padding: 4,
                borderRadius: 6,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
                fontSize: 12,
              }}
              aria-label="削除"
            >
              ✕
            </button>
          </div>
        </div>

        {/* タイトル */}
        <h3
          style={{
            color: 'rgba(255,255,255,0.88)',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            paddingLeft: 36,
          }}
        >
          {notification.title}
        </h3>

        {/* 本文 */}
        <p
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 12,
            lineHeight: 1.6,
            marginTop: 4,
            paddingLeft: 36,
            maxHeight: expanded ? 72 : 20,
            overflow: 'hidden',
            transition: 'max-height 0.2s',
          }}
        >
          {notification.body}
        </p>

        {/* 会議参加ボタン */}
        {isMeeting && notification.meetingUrl && (
          <div style={{ marginTop: 10, paddingLeft: 36 }}>
            <button
              onClick={handleJoinMeeting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: config.color,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔗 会議に参加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
