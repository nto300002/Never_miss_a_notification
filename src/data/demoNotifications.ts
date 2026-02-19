import type { Notification } from '../types/notification';

// デモ用の通知データ（認証機能実装前のモックデータ）
export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    source: 'zoom',
    title: '🔴 Zoomミーティング招待',
    body: '鈴木マネージャー: 定例ミーティングが始まります',
    sender: '鈴木マネージャー',
    timestamp: Date.now() - 30000, // 30秒前
    priority: 'meeting',
    meetingUrl: 'https://zoom.us/j/123456789',
  },
  {
    id: '2',
    source: 'meet',
    title: '🔴 デザインレビュー会議',
    body: '高橋リーダー: Google Meetでレビュー会議を開始します',
    sender: '高橋リーダー',
    timestamp: Date.now() - 120000, // 2分前
    priority: 'meeting',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: '3',
    source: 'slack',
    title: '#general',
    body: '田中太郎: 明日のミーティングについて確認があります。資料を共有しました。',
    sender: '田中太郎',
    timestamp: Date.now() - 300000, // 5分前
    priority: 'normal',
  },
  {
    id: '4',
    source: 'chatwork',
    title: 'プロジェクトA',
    body: '佐藤花子: 仕様書のレビューをお願いします。今週中に確認いただけると助かります。',
    sender: '佐藤花子',
    timestamp: Date.now() - 600000, // 10分前
    priority: 'normal',
  },
  {
    id: '5',
    source: 'gmail',
    title: '週次レポート提出のお願い',
    body: '山田部長: 今週のレポートを金曜日までにご提出ください',
    sender: '山田部長',
    timestamp: Date.now() - 1800000, // 30分前
    priority: 'normal',
  },
  {
    id: '6',
    source: 'teams',
    title: '🔴 スプリントプランニング',
    body: 'PMチーム: Teamsでスプリントプランニングを行います',
    sender: 'PMチーム',
    timestamp: Date.now() - 2400000, // 40分前
    priority: 'meeting',
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/xyz',
  },
];
