# NotifyForce アーキテクチャ設計書

このドキュメントは、NotifyForceのシステムアーキテクチャを詳細に説明します。

## 📋 目次

1. [システム概要](#システム概要)
2. [アーキテクチャ図](#アーキテクチャ図)
3. [コンポーネント設計](#コンポーネント設計)
4. [データフロー](#データフロー)
5. [API連携設計](#api連携設計)
6. [セキュリティアーキテクチャ](#セキュリティアーキテクチャ)
7. [パフォーマンス設計](#パフォーマンス設計)

---

## 🎯 システム概要

### 目的

複数のコミュニケーションサービス（Slack, Chatwork, Gmail, Zoom, Meet, Teams）の通知を統合し、見逃しを防ぐデスクトップアプリケーション。

### 主要機能

1. **リアルタイム通知受信**: Slack (Socket Mode), Chatwork/Gmail (ポーリング)
2. **会議URL自動検出**: Zoom/Meet/Teams/Webex URLの優先表示
3. **スマホ風UI**: 画面中央の通知パネル、常に最前面表示
4. **ショートカットキー**: `Ctrl+Shift+N` で開閉
5. **設定管理**: APIトークンの暗号化保存

### 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Electron | 28.x |
| UIライブラリ | React | 18.x |
| ビルドツール | Vite | 5.x |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 3.x |
| パッケージマネージャー | pnpm | 8.x |
| テスト | Vitest, Playwright | - |

---

## 🏗️ アーキテクチャ図

### システム全体図

```
┌────────────────────────────────────────────────────────────┐
│                    NotifyForce Application                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Main Process    │◄────────┤  Renderer Process│        │
│  │  (Electron)      │  IPC    │  (React + Vite)  │        │
│  └────────┬─────────┘         └──────────────────┘        │
│           │                                                │
│  ┌────────▼──────────────────────────────────────┐        │
│  │         Service Layer                         │        │
│  ├───────────────────────────────────────────────┤        │
│  │ SlackService  ChatworkService  GmailService   │        │
│  │              MeetingDetector                  │        │
│  └────────┬──────────────────────────────────────┘        │
│           │                                                │
└───────────┼────────────────────────────────────────────────┘
            │
   ┌────────▼─────────┐
   │   External APIs  │
   ├──────────────────┤
   │ Slack Socket API │
   │ Chatwork REST API│
   │ Gmail API (OAuth)│
   └──────────────────┘
```

### プロセスアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Operating System                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼─────────┐ ┌───────▼────────┐ ┌───────▼─────────┐
│  Main Process   │ │ Renderer Process│ │ Preload Script  │
│  (Node.js)      │ │ (Chromium)      │ │ (Context Bridge)│
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ - Window管理    │ │ - React UI      │ │ - IPC API公開   │
│ - Tray管理      │ │ - 通知表示      │ │ - セキュリティ  │
│ - API連携       │ │ - 設定画面      │ │   分離          │
│ - データ保存    │ │ - ルーティング  │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 🧩 コンポーネント設計

### ディレクトリ構造

```
notify-force/
├── electron/                    # Main Process
│   ├── main.ts                  # エントリーポイント
│   ├── preload.ts               # Context Bridge
│   ├── window.ts                # ウィンドウ管理
│   ├── tray.ts                  # トレイアイコン
│   ├── ipc/                     # IPCハンドラー
│   │   ├── notification.ts
│   │   ├── settings.ts
│   │   └── meeting.ts
│   └── services/                # ビジネスロジック
│       ├── slack.ts             # Slack Socket Mode
│       ├── chatwork.ts          # Chatwork ポーリング
│       ├── gmail.ts             # Gmail OAuth2
│       ├── meetingDetector.ts   # URL検出
│       └── store.ts             # 設定保存
│
├── src/                         # Renderer Process
│   ├── main.tsx                 # Reactエントリー
│   ├── App.tsx                  # ルートコンポーネント
│   ├── pages/                   # ページコンポーネント
│   │   ├── OverlayPage.tsx      # 通知パネル
│   │   └── SettingsPage.tsx     # 設定画面
│   ├── components/              # 再利用コンポーネント
│   │   ├── NotificationCard.tsx # 通知カード
│   │   ├── MeetingButton.tsx    # 会議参加ボタン
│   │   └── SettingsForm.tsx     # 設定フォーム
│   ├── hooks/                   # カスタムフック
│   │   ├── useNotifications.ts  # 通知管理
│   │   └── useSettings.ts       # 設定管理
│   ├── types/                   # 型定義
│   │   └── index.ts
│   └── utils/                   # ユーティリティ
│       ├── timeFormat.ts
│       └── urlValidation.ts
│
├── tests/                       # テスト
│   ├── unit/                    # ユニットテスト
│   ├── integration/             # 統合テスト
│   └── e2e/                     # E2Eテスト
│
└── package.json
```

### Main Process コンポーネント

#### 1. Window Manager (`electron/window.ts`)

**責務**: ウィンドウのライフサイクル管理

```typescript
import { BrowserWindow } from 'electron';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createWindow(): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      width: 440,
      height: 560,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    return this.mainWindow;
  }

  toggleVisibility(): void {
    if (this.mainWindow?.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow?.show();
      this.mainWindow?.focus();
    }
  }
}
```

#### 2. Tray Manager (`electron/tray.ts`)

**責務**: システムトレイの管理

```typescript
import { Tray, Menu, nativeImage } from 'electron';

export class TrayManager {
  private tray: Tray | null = null;

  create(): void {
    const icon = nativeImage.createFromPath('assets/icon.png');
    this.tray = new Tray(icon);

    const menu = Menu.buildFromTemplate([
      { label: '通知を開く', click: () => this.onOpen() },
      { label: '設定', click: () => this.onSettings() },
      { type: 'separator' },
      { label: '終了', click: () => this.onQuit() },
    ]);

    this.tray.setContextMenu(menu);
  }
}
```

#### 3. IPC Handlers (`electron/ipc/`)

**責務**: Renderer Processとの通信

```typescript
// electron/ipc/notification.ts
import { ipcMain } from 'electron';

export function registerNotificationHandlers(): void {
  ipcMain.handle('notification:getAll', async () => {
    return notificationStore.getAll();
  });

  ipcMain.handle('notification:dismiss', async (_, id: string) => {
    return notificationStore.dismiss(id);
  });

  ipcMain.handle('notification:openMeetingUrl', async (_, url: string) => {
    if (isValidMeetingUrl(url)) {
      shell.openExternal(url);
    }
  });
}
```

### Service Layer コンポーネント

#### 1. Slack Service (`electron/services/slack.ts`)

**責務**: Slack Socket Mode 接続

```typescript
import { WebClient } from '@slack/web-api';
import { SocketModeClient } from '@slack/socket-mode';

export class SlackService {
  private socketClient: SocketModeClient;
  private webClient: WebClient;

  constructor(appToken: string, botToken: string) {
    this.socketClient = new SocketModeClient({ appToken });
    this.webClient = new WebClient(botToken);
  }

  async connect(): Promise<void> {
    this.socketClient.on('message', this.handleMessage.bind(this));
    await this.socketClient.start();
  }

  private async handleMessage(event: any): Promise<void> {
    const notification: Notification = {
      id: event.ts,
      source: 'slack',
      title: `#${event.channel}`,
      body: event.text,
      timestamp: Date.now(),
      priority: this.detectPriority(event.text),
      meetingUrl: MeetingDetector.extract(event.text),
    };

    notificationEmitter.emit('new', notification);
  }
}
```

#### 2. Meeting Detector (`electron/services/meetingDetector.ts`)

**責務**: 会議URL検出

```typescript
export class MeetingDetector {
  private static readonly PATTERNS = [
    /https:\/\/[\w-]+\.zoom\.us\/(j|w|my)\/[\w?&=]+/i,
    /https:\/\/meet\.google\.com\/[\w-]+/i,
    /https:\/\/teams\.microsoft\.com\/(l\/meetup-join|meet)\/[\w?&=%\-]+/i,
    /https:\/\/[\w-]+\.slack\.com\/huddle\/[\w-]+/i,
    /https:\/\/([\w-]+\.webex\.com\/meet\/[\w.]+|instant\.webex\.com\/[\w/?&=]+)/i,
  ];

  static extract(text: string): string | null {
    for (const pattern of this.PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return this.validateUrl(match[0]);
      }
    }
    return null;
  }

  private static validateUrl(url: string): string | null {
    try {
      const parsed = new URL(url);

      // XSS対策: javascript:, data: スキームを拒否
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        return null;
      }

      return url;
    } catch {
      return null;
    }
  }
}
```

### Renderer Process コンポーネント

#### 1. Overlay Page (`src/pages/OverlayPage.tsx`)

**責務**: 通知パネルUI

```typescript
export function OverlayPage() {
  const { notifications, dismiss, dismissAll } = useNotifications();
  const [visible, setVisible] = useState(true);

  // 会議URLで優先度ソート
  const sorted = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.priority === 'meeting' && b.priority !== 'meeting') return -1;
      if (a.priority !== 'meeting' && b.priority === 'meeting') return 1;
      return b.timestamp - a.timestamp;
    });
  }, [notifications]);

  return (
    <div className="notification-panel">
      {/* Header */}
      <NotificationHeader
        count={notifications.length}
        onClose={() => setVisible(false)}
      />

      {/* Notification List */}
      <div className="notification-list">
        {sorted.map((n, i) => (
          <NotificationCard
            key={n.id}
            notification={n}
            onDismiss={dismiss}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 データフロー

### 通知受信フロー

```
┌──────────┐      ┌───────────┐      ┌──────────┐      ┌──────────┐
│ External │─────▶│  Service  │─────▶│   IPC    │─────▶│ Renderer │
│   API    │      │   Layer   │      │  Bridge  │      │    UI    │
└──────────┘      └───────────┘      └──────────┘      └──────────┘
    │                   │                   │                 │
    │ 1. WebSocket/     │ 2. Parse &        │ 3. Emit         │ 4. Display
    │    Poll           │    Detect URL     │    Event        │    Notification
    │                   │                   │                 │
    ▼                   ▼                   ▼                 ▼
Slack API         meetingDetector    ipcRenderer      NotificationCard
Chatwork API      SlackService       .send()          React Component
Gmail API         ChatworkService
```

### 設定保存フロー

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│   UI     │─────▶│   IPC    │─────▶│  Store   │─────▶│   Disk   │
│  Form    │      │ Handler  │      │  Layer   │      │  (JSON)  │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
    │                   │                   │                 │
    │ 1. User Input     │ 2. Validate       │ 3. Encrypt      │ 4. Write
    │                   │                   │    (safeStorage)│
    ▼                   ▼                   ▼                 ▼
SettingsForm      settings.ts       electron-store    ~/.config/
```

---

## 🔌 API連携設計

### Slack Socket Mode

**接続方式**: WebSocket (双方向)

```typescript
// 接続シーケンス
1. App Token で Socket Mode接続
2. WebSocket確立
3. message イベント購読
4. 切断時: 自動再接続 (Exponential Backoff)
```

**イベント処理**:
```typescript
socketClient.on('message', async ({ event, ack }) => {
  await ack(); // イベント確認

  const notification = {
    source: 'slack',
    title: await getChannelName(event.channel),
    body: event.text,
    timestamp: Date.now(),
    meetingUrl: MeetingDetector.extract(event.text),
  };

  notificationStore.add(notification);
});
```

### Chatwork ポーリング

**接続方式**: REST API (10秒ポーリング)

```typescript
setInterval(async () => {
  const response = await axios.get(
    'https://api.chatwork.com/v2/rooms/{room_id}/messages',
    {
      headers: { 'X-ChatWorkToken': config.token },
      params: { force: 1 },
    }
  );

  const newMessages = response.data.filter((m) => m.message_id > lastMessageId);
  // ...
}, 10000);
```

### Gmail API

**接続方式**: OAuth2 + REST API (15秒ポーリング)

```typescript
// OAuth2フロー
1. credentials.json 読み込み
2. ブラウザで認証
3. token.json 保存
4. トークンリフレッシュ (自動)
```

---

## 🔒 セキュリティアーキテクチャ

### 脅威モデル

| 脅威 | 対策 |
|------|------|
| XSS攻撃 | DOMPurify, React自動エスケープ, CSP |
| Command Injection | URL検証, shell.openExternal制限 |
| トークン漏洩 | safeStorage暗号化, .gitignore |
| MITM攻撃 | HTTPS必須, 証明書検証 |

### セキュリティレイヤー

```
┌─────────────────────────────────────────┐
│        Application Layer                │
│  - Input Validation                     │
│  - XSS Protection (DOMPurify)           │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        IPC Layer                        │
│  - Context Isolation                    │
│  - Preload Script Only                  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        Storage Layer                    │
│  - safeStorage (OS Keychain)            │
│  - Encrypted Tokens                     │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        Network Layer                    │
│  - HTTPS Only                           │
│  - Certificate Validation               │
└─────────────────────────────────────────┘
```

---

## ⚡ パフォーマンス設計

### 最適化戦略

1. **通知の仮想スクロール**: 大量通知時のメモリ削減
2. **遅延読み込み**: アイコン画像のLazy Load
3. **デバウンス**: API呼び出しの間引き
4. **メモ化**: React.memo, useMemo でレンダリング最適化

### メモリ管理

```typescript
// 通知の自動削除 (最大100件)
if (notifications.length > 100) {
  notifications.splice(100);
}

// 古い通知の自動削除 (24時間経過)
const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
notifications = notifications.filter((n) => n.timestamp > oneDayAgo);
```

---

## 📚 参考資料

- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Slack Socket Mode](https://api.slack.com/apis/connections/socket)
- [Gmail API OAuth2](https://developers.google.com/gmail/api/auth/about-auth)
- [OWASP Electron Security](https://cheatsheetseries.owasp.org/cheatsheets/Electron_Cheat_Sheet.html)
