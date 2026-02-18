// 通知のソース（サービス）
export type NotificationSource =
  | 'slack'
  | 'chatwork'
  | 'gmail'
  | 'zoom'
  | 'meet'
  | 'teams';

// 通知の優先度
export type NotificationPriority = 'meeting' | 'normal';

// 通知データの型定義
export interface Notification {
  id: string;
  source: NotificationSource;
  title: string;
  body: string;
  sender: string;
  timestamp: number;
  priority: NotificationPriority;
  meetingUrl?: string; // 会議URLがある場合
}

// ソースごとの設定（色、アイコンなど）
export interface SourceConfig {
  color: string;
  bg: string;
  border: string;
  label: string;
  emoji: string;
}

// 全ソースの設定マップ
export const SOURCE_CONFIG: Record<NotificationSource, SourceConfig> = {
  slack: {
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.15)',
    border: 'rgba(139,92,246,0.3)',
    label: 'Slack',
    emoji: '#️⃣',
  },
  chatwork: {
    color: '#fca5a5',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.3)',
    label: 'Chatwork',
    emoji: '💬',
  },
  gmail: {
    color: '#f87171',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.25)',
    label: 'Gmail',
    emoji: '✉️',
  },
  zoom: {
    color: '#93c5fd',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.4)',
    label: 'Zoom',
    emoji: '📹',
  },
  meet: {
    color: '#5eead4',
    bg: 'rgba(20,184,166,0.15)',
    border: 'rgba(20,184,166,0.4)',
    label: 'Google Meet',
    emoji: '🖥️',
  },
  teams: {
    color: '#a5b4fc',
    bg: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.4)',
    label: 'Teams',
    emoji: '👥',
  },
};
