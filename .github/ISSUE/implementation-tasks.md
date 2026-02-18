# NotifyForce 実装タスク一覧

このドキュメントは、NotifyForceの実装タスクをissue形式で管理します。

## 🎯 優先度の定義

- 🔴 **P0**: 最優先（MVP必須機能）
- 🟡 **P1**: 高優先度（v1.0リリース前に必要）
- 🟢 **P2**: 中優先度（v1.1以降で対応可）
- ⚪ **P3**: 低優先度（将来的に検討）

## 📊 ステータス

- ⬜ **TODO**: 未着手
- 🏗️ **In Progress**: 実装中
- ✅ **Done**: 完了
- ❌ **Blocked**: ブロック中

---

## 🚀 Phase 1: プロジェクトセットアップ (MVP)

### [TASK-001] 🔴 プロジェクト初期化
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- package.jsonの作成
- TypeScript + Vite + Electron の設定
- 開発環境のセットアップ

**Acceptance Criteria**:
- [ ] `pnpm install` が成功する
- [ ] `pnpm run dev` で開発サーバーが起動する
- [ ] TypeScriptのビルドが通る

**参考**:
- [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron)

---

### [TASK-002] 🔴 Electron Main Process 実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `electron/main.ts` の実装
- BrowserWindow の作成
- Trayアイコンの実装
- グローバルショートカット (`Ctrl+Shift+N`) の登録

**Acceptance Criteria**:
- [ ] アプリ起動時にウィンドウが表示される
- [ ] Trayアイコンがシステムトレイに表示される
- [ ] `Ctrl+Shift+N` で通知パネルが開閉する
- [ ] ウィンドウが常に最前面に表示される

**技術スタック**:
- `electron`
- `electron-store` (設定保存用)

---

### [TASK-003] 🔴 Preload Script 実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `electron/preload.ts` の実装
- Context Bridge でIPCチャネルを公開
- セキュアなAPI設計 (contextIsolation有効)

**Acceptance Criteria**:
- [ ] Renderer ProcessからMain Processの機能を呼び出せる
- [ ] `contextIsolation: true` が設定されている
- [ ] XSS対策が施されている

**公開するAPI**:
```typescript
window.electron = {
  onNotification: (callback) => void
  dismissNotification: (id: string) => void
  openMeetingUrl: (url: string) => void
  saveSettings: (config) => void
  loadSettings: () => Promise<Config>
}
```

---

### [TASK-004] 🔴 React UIセットアップ
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- React 18 + TypeScript のセットアップ
- Tailwind CSS の設定
- ルーティング (OverlayPage / SettingsPage)

**Acceptance Criteria**:
- [ ] React開発サーバーが起動する
- [ ] Tailwind CSSが適用される
- [ ] ページ遷移が動作する

**技術スタック**:
- `react` 18+
- `react-router-dom`
- `tailwindcss`

---

## 🔔 Phase 2: 通知UI実装

### [TASK-005] 🔴 通知パネルUI実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `src/pages/OverlayPage.tsx` の実装
- スマホ風通知パネルのデザイン
- アニメーション (fadeSlideIn, slideUp)

**Acceptance Criteria**:
- [ ] README.mdのプロトタイプUIと同等のデザイン
- [ ] 通知カードが上から順に表示される
- [ ] 開閉アニメーションが滑らか

**参考デザイン**:
- README.md 148-327行目のプロトタイプコード

---

### [TASK-006] 🔴 通知カードコンポーネント実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `src/components/NotificationCard.tsx` の実装
- 通知の展開/折りたたみ機能
- 個別削除ボタン

**Acceptance Criteria**:
- [ ] サービスごとに色分け表示される
- [ ] 展開/折りたたみボタンが動作する
- [ ] 削除ボタンで通知が消える
- [ ] 会議URL付き通知に「会議に参加」ボタンが表示される

---

### [TASK-007] 🔴 通知ソートロジック実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- 会議URL付き通知を先頭に表示
- タイムスタンプでソート

**Acceptance Criteria**:
- [ ] 会議URL付き通知が常に上位に表示される
- [ ] 同優先度内では新しい通知が上に来る
- [ ] ソートロジックのユニットテストが通る

**実装例**:
```typescript
notifications.sort((a, b) => {
  if (a.priority === 'meeting' && b.priority !== 'meeting') return -1;
  if (a.priority !== 'meeting' && b.priority === 'meeting') return 1;
  return b.timestamp - a.timestamp;
});
```

---

## 🔌 Phase 3: API連携実装

### [TASK-008] 🔴 Slack Socket Mode クライアント実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `electron/services/slack.ts` の実装
- Socket Mode でリアルタイム受信
- メッセージイベントの処理

**Acceptance Criteria**:
- [ ] Socket Mode接続が確立される
- [ ] `message.channels` イベントを受信できる
- [ ] エラー時に自動再接続する
- [ ] トークンがsafeStorageで暗号化保存される

**技術スタック**:
- `@slack/web-api`
- `@slack/socket-mode`

**参考**:
- README.md 46-102行目の設定手順

---

### [TASK-009] 🔴 Chatwork ポーリングクライアント実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `electron/services/chatwork.ts` の実装
- 10秒間隔でポーリング
- 新着メッセージの検出

**Acceptance Criteria**:
- [ ] 10秒ごとにAPIをポーリングする
- [ ] 新着メッセージのみを通知する
- [ ] レート制限に対応する (HTTP 429)
- [ ] APIトークンが暗号化保存される

**API仕様**:
- エンドポイント: `GET /v2/rooms/{room_id}/messages`
- レート制限: 5リクエスト/分

---

### [TASK-010] 🔴 Gmail API クライアント実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `electron/services/gmail.ts` の実装
- OAuth2 認証フロー
- 15秒間隔でポーリング

**Acceptance Criteria**:
- [ ] OAuth2認証フローが動作する
- [ ] `credentials.json` からクライアント情報を読み込む
- [ ] 新着メールを検出できる
- [ ] トークンリフレッシュが自動で行われる

**技術スタック**:
- `googleapis`

**参考**:
- [Gmail API Node.js Quickstart](https://developers.google.com/gmail/api/quickstart/nodejs)

---

### [TASK-011] 🔴 会議URL検出ロジック実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `electron/services/meetingDetector.ts` の実装
- 正規表現パターンマッチング
- 会議URLの優先度判定

**Acceptance Criteria**:
- [ ] Zoom/Meet/Teams/Webex URLを検出できる
- [ ] `javascript:` スキームを除外する (XSS対策)
- [ ] 検出ロジックのユニットテストが通る

**正規表現パターン**:
- README.md 87-106行目参照

---

## ⚙️ Phase 4: 設定画面実装

### [TASK-012] 🟡 設定画面UI実装
**優先度**: P1 | **ステータス**: ⬜ TODO

**説明**:
- `src/pages/SettingsPage.tsx` の実装
- API設定フォーム
- ショートカットキー設定

**Acceptance Criteria**:
- [ ] Slack/Chatwork/Gmail の設定フォームが表示される
- [ ] 入力値のバリデーションが動作する
- [ ] 保存ボタンで設定が永続化される

---

### [TASK-013] 🟡 設定の暗号化保存
**優先度**: P1 | **ステータス**: ⬜ TODO

**説明**:
- `electron.safeStorage` API を使用
- APIトークンの暗号化

**Acceptance Criteria**:
- [ ] トークンが平文で保存されない
- [ ] OS標準の暗号化機能を使用する
- [ ] 復号化が正常に動作する

**セキュリティ要件**:
- macOS: Keychain
- Windows: DPAPI
- Linux: Secret Service API / libsecret

---

## 🧪 Phase 5: テスト実装

### [TASK-014] 🟡 ユニットテストのセットアップ
**優先度**: P1 | **ステータス**: ⬜ TODO

**説明**:
- Vitest の設定
- テストユーティリティの作成

**Acceptance Criteria**:
- [ ] `pnpm test` でテストが実行される
- [ ] カバレッジレポートが生成される
- [ ] CI環境でテストが通る

---

### [TASK-015] 🟡 会議URL検出のテスト
**優先度**: P1 | **ステータス**: ⬜ TODO

**説明**:
- `meetingDetector.test.ts` の実装
- 正常系・異常系のテストケース

**テストケース**:
- [ ] Zoom URL (`/j/`, `/w/`, `/my/`) の検出
- [ ] Google Meet URL の検出
- [ ] Teams URL (新旧形式) の検出
- [ ] `javascript:alert()` の除外 (XSS対策)
- [ ] 不正なURLの除外

---

### [TASK-016] 🟢 E2Eテストの実装
**優先度**: P2 | **ステータス**: ⬜ TODO

**説明**:
- Playwright + Electron の設定
- 通知パネル操作のテスト

**テストシナリオ**:
- [ ] `Ctrl+Shift+N` で開閉
- [ ] 通知カードの展開/折りたたみ
- [ ] 会議URLボタンのクリック

---

## 🔒 Phase 6: セキュリティ対策

### [TASK-017] 🔴 XSS対策の実装
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- HTML エスケープ処理
- CSP (Content Security Policy) の設定

**Acceptance Criteria**:
- [ ] メッセージ本文に `<script>` タグが含まれても実行されない
- [ ] CSPヘッダーが設定されている
- [ ] `dangerouslySetInnerHTML` を使用していない

---

### [TASK-018] 🔴 Command Injection 対策
**優先度**: P0 | **ステータス**: ⬜ TODO

**説明**:
- `shell.openExternal()` の安全な使用
- URL検証の強化

**Acceptance Criteria**:
- [ ] 会議URL以外のスキーム (`file://`, `javascript:`) をブロック
- [ ] URL引数のサニタイゼーション
- [ ] セキュリティテストが通る

---

## 📦 Phase 7: ビルド・リリース

### [TASK-019] 🟡 electron-builder 設定
**優先度**: P1 | **ステータス**: ⬜ TODO

**説明**:
- `electron-builder.yml` の作成
- macOS/Windows/Linux ビルド設定

**Acceptance Criteria**:
- [ ] `pnpm run build` で実行ファイルが生成される
- [ ] 署名・公証が設定されている (macOS)
- [ ] 自動更新機能が動作する

---

### [TASK-020] 🟡 CI/CD パイプライン構築
**優先度**: P1 | **ステータス**: ⬜ TODO

**説明**:
- GitHub Actions ワークフローの作成
- README.md 264-341行目の設計に基づく実装

**Acceptance Criteria**:
- [ ] PR作成時に自動テストが実行される
- [ ] タグプッシュ時に自動ビルド・リリースされる
- [ ] Snykセキュリティスキャンが動作する

---

## 🎨 Phase 8: 追加機能 (v1.1以降)

### [TASK-021] 🟢 通知フィルタリング
**優先度**: P2 | **ステータス**: ⬜ TODO

**説明**:
- キーワードフィルター
- 送信者フィルター

---

### [TASK-022] 🟢 通知音カスタマイズ
**優先度**: P2 | **ステータス**: ⬜ TODO

**説明**:
- カスタム音声ファイル対応
- 音量調整

---

### [TASK-023] 🟢 Discord Webhook 対応
**優先度**: P2 | **ステータス**: ⬜ TODO

**説明**:
- Discord Webhook クライアント実装

---

### [TASK-024] ⚪ カレンダー連携
**優先度**: P3 | **ステータス**: ⬜ TODO

**説明**:
- Google Calendar API 連携
- 会議10分前リマインド

---

## 📊 進捗サマリー

| Phase | タスク数 | 完了 | 進行中 | 未着手 |
|-------|---------|------|--------|--------|
| Phase 1 | 4 | 0 | 0 | 4 |
| Phase 2 | 3 | 0 | 0 | 3 |
| Phase 3 | 4 | 0 | 0 | 4 |
| Phase 4 | 2 | 0 | 0 | 2 |
| Phase 5 | 3 | 0 | 0 | 3 |
| Phase 6 | 2 | 0 | 0 | 2 |
| Phase 7 | 2 | 0 | 0 | 2 |
| Phase 8 | 4 | 0 | 0 | 4 |
| **合計** | **24** | **0** | **0** | **24** |

---

## 🔗 関連ドキュメント

- [README.md](../../README.md) - プロジェクト概要
- [architecture.md](./architecture.md) - アーキテクチャ設計
- [development-guide.md](./development-guide.md) - 開発ガイドライン
