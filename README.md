# NotifyForce 🔔💥

**絶対に見逃さない通知デスクトップアプリ**

Slack / Chatwork / Gmail / Zoom / Meet / Teams の通知を
画面中央にドーンと表示。スマホ通知画面のようなUIで一切見逃しません。

---

## 機能

| 機能 | 説明 |
|------|------|
| 📱 スマホ風通知UI | 画面中央に通知パネルがポップアップ |
| 🔴 会議URL優先表示 | Zoom / Meet / Teams / Huddle のURLを自動検出、先頭表示 |
| ⚡ リアルタイム通知 | Slack (Socket Mode), Chatwork (10秒ポーリング), Gmail (15秒ポーリング) |
| ⌨️ ショートカットキー | `Ctrl+Shift+N` で通知パネルを開閉 |
| 🎯 常に最前面表示 | 全ウィンドウの上に表示、作業中でも必ず目に入る |
| 🔧 Tray常駐 | バックグラウンドで動作、トレイアイコンからアクセス |

---

## セットアップ

### 1. インストール

```bash
pnpm install
```

### 2. 開発モード

```bash
pnpm run electron:dev
```

### 3. ビルド

```bash
pnpm run build
```

---

## API設定

### Slack (Socket Mode)

#### 1. Slack Appの作成
1. [Slack API](https://api.slack.com/apps) にアクセスし「Create New App」をクリック
2. 「From scratch」を選択し、App名とワークスペースを指定

#### 2. Socket Modeの有効化
1. **Settings > Socket Mode** で「Enable Socket Mode」をONにする
2. Socket Modeは2019年12月以降作成のアプリで利用可能（granular permissions必須）

#### 3. App-Level Tokenの生成
1. **Settings > Basic Information > App-Level Tokens** へ移動
2. 「Generate Token and Scopes」をクリック
3. Token名を入力し、**`connections:write`** スコープを追加
4. 生成されたトークン（`xapp-...`）を保存

#### 4. Bot Token Scopesの設定

**Features > OAuth & Permissions > Scopes** へ移動し、以下のスコープを追加します。

##### 📌 Bot Token Scopes vs User Token Scopes の違い

| トークンタイプ | 説明 | 使用場面 |
|--------------|------|---------|
| **Bot Token Scopes** | ボットとして独立して動作（ユーザーに紐づかない） | **通知アプリはこちらを使用** - インストールユーザーが退職してもアプリが動作し続ける |
| **User Token Scopes** | 特定ユーザーの代わりに操作（ユーザーとして投稿など） | ユーザーなりすまし投稿が必要な場合のみ |

⚠️ **重要**: NotifyForceでは**Bot Token Scopesのみ**を使用します。User Token Scopesは不要です。

##### 🔧 追加するBot Token Scopes

**Features > OAuth & Permissions > Bot Token Scopes** セクションで以下を追加:

| スコープ | 説明 | 必要性 |
|---------|------|--------|
| `channels:history` | 公開チャンネルのメッセージ履歴を読み取り | **必須** - message.channels イベント受信に必要 |
| `channels:read` | 公開チャンネルの基本情報を取得 | **必須** - チャンネル名・ID取得 |
| `groups:history` | プライベートチャンネルのメッセージ履歴を読み取り | 任意 - プライベートチャンネル監視時 |
| `im:history` | DMのメッセージ履歴を読み取り | 任意 - DM監視時 |
| `users:read` | ユーザー情報（名前・アイコン）を取得 | 推奨 - 送信者情報表示 |
| `chat:write` | メッセージ送信 | 任意 - 自動応答機能用 |

⚠️ **セキュリティのベストプラクティス**: 必要最小限のスコープのみ追加してください

#### 5. Event Subscriptionsの設定
1. **Features > Event Subscriptions** で「Enable Events」をONにする
2. **Subscribe to bot events** で以下のイベントタイプを追加:

| イベントタイプ | 説明 | 必要スコープ |
|--------------|------|-------------|
| `message.channels` | 公開チャンネルの新規メッセージ | `channels:history` |
| `message.groups` | プライベートチャンネルの新規メッセージ | `groups:history` |
| `message.im` | DMの新規メッセージ | `im:history` |
| `app_mention` | @mention通知 | `app_mentions:read` |

3. 「Save Changes」をクリック

#### 6. Appのインストール
1. **Settings > Install App** で「Install to Workspace」をクリック
2. 権限を確認して「許可する」
3. 生成された **Bot User OAuth Token** (`xoxb-...`) を保存

#### 7. アプリへの設定入力
- **Bot Token**: `xoxb-...` （OAuth & Permissionsで取得）
- **App Token**: `xapp-...` （App-Level Tokensで取得）

#### 参考情報
- 📚 [公式ドキュメント: Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode/)
- 🔧 [Bolt フレームワーク](https://slack.dev/bolt-js/)（推奨: 実装を簡素化）
- 🔍 [スコープリファレンス](https://api.slack.com/scopes)
- 📡 [Events API](https://api.slack.com/events/message.channels)

### Chatwork

1. [Chatwork API](https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php) でトークンを取得
2. 設定画面で API Token を入力
3. 必要に応じて Room ID を指定（空で全ルーム監視）

### Gmail

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. Gmail API を有効化
3. OAuth 2.0 クライアントを作成（デスクトップアプリ）
4. `credentials.json` をダウンロード
5. 設定画面でファイルパスを指定
6. 初回起動時にブラウザで認証

---

## 会議URL自動検出

以下のURLパターンをメッセージ・メール本文から自動検出します：

| サービス | URLパターン | 備考 |
|----------|-------------|------|
| Zoom | `https://*.zoom.us/j/*`<br>`https://*.zoom.us/w/*`<br>`https://*.zoom.us/my/*` | 標準会議 (`/j/`)、ウェビナー (`/w/`)、パーソナルルーム (`/my/`) |
| Google Meet | `https://meet.google.com/*` | 10文字コード形式 (`abc-defg-hij`) またはカスタム名 |
| Microsoft Teams | `https://teams.microsoft.com/l/meetup-join/*`<br>`https://teams.microsoft.com/meet/*` | 従来形式 + 新短縮形式 (2025~) |
| Slack Huddle | `https://*.slack.com/huddle/*` | ワークスペース内ハドル (URL形式は非公開) |
| Webex | `https://*.webex.com/meet/*`<br>`https://instant.webex.com/*` | パーソナルルーム + Instant Connect |

### 正規表現パターン（実装参考用）

```javascript
const MEETING_URL_PATTERNS = [
  // Zoom: 標準会議・ウェビナー・パーソナルルーム
  /https:\/\/[\w-]+\.zoom\.us\/(j|w|my)\/[\w?&=]+/i,

  // Google Meet: 全形式対応
  /https:\/\/meet\.google\.com\/[\w-]+/i,

  // Microsoft Teams: 従来形式 + 新形式
  /https:\/\/teams\.microsoft\.com\/(l\/meetup-join|meet)\/[\w?&=%\-]+/i,

  // Slack Huddle
  /https:\/\/[\w-]+\.slack\.com\/huddle\/[\w-]+/i,

  // Webex
  /https:\/\/([\w-]+\.webex\.com\/meet\/[\w.]+|instant\.webex\.com\/[\w/?&=]+)/i,
];
```

会議URLが含まれる通知は🔴マーク付きで先頭に表示され、
「会議に参加」ボタンからワンクリックで参加できます。

---

## ショートカットキー

| キー | 動作 |
|------|------|
| `Ctrl+Shift+N` | 通知パネル開閉（カスタマイズ可） |
| `Escape` | 通知パネルを閉じる |

---

## アーキテクチャ

```
notify-force/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts            # Context bridge
│   └── services/
│       ├── slack.ts          # Slack Socket Mode client
│       ├── chatwork.ts       # Chatwork polling client
│       ├── gmail.ts          # Gmail API client
│       └── meetingDetector.ts # Zoom/Meet/Teams URL検出
├── src/
│   ├── main.tsx              # React entry + router
│   ├── pages/
│   │   ├── OverlayPage.tsx   # 通知ポップアップUI
│   │   └── SettingsPage.tsx  # 設定画面
│   ├── components/
│   │   └── NotificationCard.tsx # 通知カード
│   └── types/
│       └── index.ts          # 型定義
└── package.json
```

### 技術スタック

- **Framework**: Electron + React 18
- **Build**: Vite + vite-plugin-electron
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Slack**: @slack/web-api + @slack/socket-mode
- **Chatwork**: REST API (axios)
- **Gmail**: googleapis (OAuth2)
- **Storage**: electron-store

---

## テスティング

### テスティングライブラリ

| ツール | 用途 | 選定理由 |
|--------|------|----------|
| **Vitest** | ユニットテスト | Viteネイティブ、高速、TypeScript完全サポート |
| **Playwright** | E2Eテスト | Electronサポート、クロスプラットフォーム、信頼性高 |
| **React Testing Library** | コンポーネントテスト | React推奨、ユーザー視点のテスト |
| **MSW (Mock Service Worker)** | API Mocking | Slack/Chatwork/Gmail API モック |

### テストセットアップ

```bash
# テスト依存関係のインストール
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test msw
```

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## テスト要件

### 1. ユニットテスト (カバレッジ目標: 80%以上)

#### 会議URL検出ロジック
- [ ] Zoom URL（`/j/`, `/w/`, `/my/`）の検出
- [ ] Google Meet URL（コード形式・カスタム名）の検出
- [ ] Teams URL（従来形式・新形式）の検出
- [ ] Webex URL の検出
- [ ] 不正なURLの除外（XSS対策）

#### 通知処理ロジック
- [ ] 通知の優先度ソート（会議URLが先頭）
- [ ] タイムスタンプのフォーマット
- [ ] 通知の削除・既読処理

#### API クライアント
- [ ] Slack Socket Mode 接続・切断
- [ ] Chatwork ポーリング処理
- [ ] Gmail OAuth2 認証フロー
- [ ] エラーハンドリング（API障害、タイムアウト）

### 2. 統合テスト

#### サービス連携
- [ ] Slack メッセージ受信 → 通知表示
- [ ] Chatwork 新着 → 通知表示
- [ ] Gmail 新着メール → 通知表示
- [ ] 複数サービス同時受信時の動作

#### 設定の永続化
- [ ] `electron-store` への設定保存・読み込み
- [ ] 不正な設定値のバリデーション

### 3. E2Eテスト (Playwright + Electron)

#### 通知パネル操作
- [ ] `Ctrl+Shift+N` で開閉
- [ ] 通知カードの展開・折りたたみ
- [ ] 通知の個別削除・一括削除
- [ ] 会議URLボタンのクリック → ブラウザ起動

#### 設定画面
- [ ] Slack Token 入力・保存
- [ ] Chatwork Token 入力・保存
- [ ] Gmail 認証フロー
- [ ] 不正な入力値の拒否

### 4. セキュリティテスト要件

#### XSS (Cross-Site Scripting) 対策
- [ ] メッセージ本文に `<script>alert('XSS')</script>` を含む通知の安全な表示
- [ ] 送信者名に HTML タグを含む場合のエスケープ
- [ ] 会議URLの検証（`javascript:` スキームの除外）

#### 認証情報の保護
- [ ] Slack/Chatwork トークンの暗号化保存 (`safeStorage` API)
- [ ] Gmail `credentials.json` のパーミッション確認 (600)
- [ ] トークンがログ・エラーメッセージに含まれないこと

#### Command Injection 対策
- [ ] 会議URL開く際の引数サニタイゼーション
- [ ] `shell.openExternal()` の安全な使用

#### 依存関係の脆弱性スキャン
```bash
pnpm audit
pnpm dlx snyk test
```

---

## CI/CD フロー

### GitHub Actions ワークフロー

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 1. Lint & Type Check
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run type-check

  # 2. Unit & Integration Tests
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  # 3. E2E Tests (Playwright)
  e2e:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm run test:e2e

  # 4. Security Scan
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm audit --audit-level=high
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # 5. Build Electron App
  build:
    needs: [lint, test, e2e, security]
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.os }}
          path: dist/

  # 6. Release (タグプッシュ時のみ)
  release:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            dist-ubuntu-latest/**/*
            dist-macos-latest/**/*
            dist-windows-latest/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### リリースフロー

1. **開発**: `develop` ブランチで作業
2. **PR作成**: `develop` → `main` のプルリクエスト
3. **自動テスト**: CI/CD パイプライン実行（全テスト + セキュリティスキャン）
4. **マージ**: レビュー承認後マージ
5. **タグ作成**: `git tag v1.0.0 && git push --tags`
6. **自動リリース**: GitHub Releases にバイナリを自動アップロード

---

## 今後の拡張案

- [ ] Discord Webhook 対応
- [ ] LINE Notify 対応
- [ ] 通知フィルタリング（キーワード、送信者）
- [ ] 通知音カスタマイズ
- [ ] 通知ログ（履歴画面）
- [ ] 自動応答テンプレート
- [ ] カレンダー連携（会議10分前リマインド）

# プロトタイプ
```tsx
import { useState, useEffect } from "react";

const SOURCE_CONFIG = {
  slack: { color: "#a78bfa", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)", label: "Slack", emoji: "#️⃣" },
  chatwork: { color: "#fca5a5", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", label: "Chatwork", emoji: "💬" },
  gmail: { color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", label: "Gmail", emoji: "✉️" },
  zoom: { color: "#93c5fd", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", label: "Zoom", emoji: "📹" },
  meet: { color: "#5eead4", bg: "rgba(20,184,166,0.15)", border: "rgba(20,184,166,0.4)", label: "Google Meet", emoji: "🖥️" },
  teams: { color: "#a5b4fc", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.4)", label: "Teams", emoji: "👥" },
};

const DEMO_NOTIFICATIONS = [
  { id: "1", source: "zoom", title: "🔴 Zoomミーティング招待", body: "鈴木マネージャー: 定例ミーティングが始まります", sender: "鈴木マネージャー", timestamp: Date.now() - 30000, priority: "meeting", meetingUrl: "https://zoom.us/j/123" },
  { id: "2", source: "meet", title: "🔴 デザインレビュー会議", body: "高橋リーダー: Google Meetでレビュー会議を開始します", sender: "高橋リーダー", timestamp: Date.now() - 120000, priority: "meeting", meetingUrl: "https://meet.google.com/abc" },
  { id: "3", source: "slack", title: "#general", body: "田中太郎: 明日のミーティングについて確認があります。資料を共有しました。", sender: "田中太郎", timestamp: Date.now() - 300000, priority: "normal" },
  { id: "4", source: "chatwork", title: "プロジェクトA", body: "佐藤花子: 仕様書のレビューをお願いします。今週中に確認いただけると助かります。", sender: "佐藤花子", timestamp: Date.now() - 600000, priority: "normal" },
  { id: "5", source: "gmail", title: "週次レポート提出のお願い", body: "山田部長: 今週のレポートを金曜日までにご提出ください", sender: "山田部長", timestamp: Date.now() - 1800000, priority: "normal" },
  { id: "6", source: "teams", title: "🔴 スプリントプランニング", body: "PMチーム: Teamsでスプリントプランニングを行います", sender: "PMチーム", timestamp: Date.now() - 2400000, priority: "meeting", meetingUrl: "https://teams.microsoft.com/l/meetup" },
];

function getTimeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (m < 1) return "たった今";
  if (m < 60) return `${m} 分前`;
  return `${h} 時間前`;
}

function NotificationCard({ n, onDismiss, index }) {
  const [expanded, setExpanded] = useState(n.priority === "meeting");
  const cfg = SOURCE_CONFIG[n.source] || SOURCE_CONFIG.slack;
  const isMeeting = n.priority === "meeting";

  return (
    <div
      style={{
        margin: "0 8px 6px",
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${isMeeting ? cfg.border : "rgba(255,255,255,0.05)"}`,
        background: isMeeting ? cfg.bg : "rgba(255,255,255,0.03)",
        animation: `fadeSlideIn 0.3s ease-out ${index * 60}ms both`,
        boxShadow: isMeeting ? `0 0 20px ${cfg.bg}` : "none",
      }}
    >
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
            {cfg.emoji}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ color: cfg.color, fontSize: 12, fontWeight: 600 }}>{cfg.label}</span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>・</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{getTimeAgo(n.timestamp)}</span>
          </div>
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button onClick={() => setExpanded(!expanded)} style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 12 }}>
              {expanded ? "▲" : "▼"}
            </button>
            <button onClick={onDismiss} style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 12 }}>
              ✕
            </button>
          </div>
        </div>
        <h3 style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600, lineHeight: 1.4, paddingLeft: 36 }}>
          {n.title}
        </h3>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.6, marginTop: 4, paddingLeft: 36, maxHeight: expanded ? 72 : 20, overflow: "hidden", transition: "max-height 0.2s" }}>
          {n.body}
        </p>
        {isMeeting && n.meetingUrl && (
          <div style={{ marginTop: 10, paddingLeft: 36 }}>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              🔗 会議に参加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotifyForcePreview() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [visible, setVisible] = useState(true);

  const meetingCount = notifications.filter(n => n.priority === "meeting").length;
  const sorted = [...notifications].sort((a, b) => {
    if (a.priority === "meeting" && b.priority !== "meeting") return -1;
    if (a.priority !== "meeting" && b.priority === "meeting") return 1;
    return b.timestamp - a.timestamp;
  });

  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  const reset = () => setNotifications(DEMO_NOTIFICATIONS);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP', sans-serif", position: "relative" }}>
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

      {/* Header hint */}
      <div style={{ position: "absolute", top: 16, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          ⌨️ Ctrl+Shift+N で開閉 ｜ NotifyForce UI プレビュー
        </span>
      </div>

      {/* Toggle + Reset buttons */}
      <div style={{ position: "absolute", top: 48, display: "flex", gap: 8 }}>
        <button onClick={() => setVisible(!visible)} style={{ padding: "6px 16px", borderRadius: 8, background: visible ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
          {visible ? "パネルを閉じる" : "パネルを開く"}
        </button>
        <button onClick={reset} style={{ padding: "6px 16px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>
          リセット
        </button>
      </div>

      {/* Overlay panel */}
      {visible && (
        <div style={{ width: 440, maxHeight: 560, display: "flex", flexDirection: "column", animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)", borderRadius: 16, overflow: "hidden", boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(26,26,26,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", animation: "pulseGlow 2s ease-in-out infinite" }} />
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600 }}>NotifyForce</span>
              {meetingCount > 0 && (
                <span style={{ padding: "2px 8px", borderRadius: 10, background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 11, fontWeight: 700 }}>
                  🔴 会議 {meetingCount}件
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setNotifications([])} style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13 }} title="すべて消去">🔕</button>
              <button style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13 }} title="設定">⚙️</button>
              <button onClick={() => setVisible(false)} style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 13 }} title="閉じる">✕</button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ flex: 1, overflowY: "auto", background: "rgba(26,26,26,0.97)", paddingTop: 4, paddingBottom: 4 }}>
            {sorted.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "rgba(255,255,255,0.2)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔕</div>
                <p style={{ fontSize: 13 }}>通知はありません</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Ctrl+Shift+N で開閉</p>
              </div>
            ) : (
              sorted.map((n, i) => (
                <NotificationCard key={n.id} n={n} onDismiss={() => dismiss(n.id)} index={i} />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(26,26,26,0.97)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
              {notifications.length > 0 ? `${notifications.length} 件の通知` : "サービス監視中..."}
            </span>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>Esc で閉じる</span>
          </div>
        </div>
      )}
    </div>
  );
}
```# Never_miss_a_notification
