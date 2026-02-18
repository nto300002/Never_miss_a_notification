# NotifyForce 開発ガイドライン

このドキュメントは、NotifyForceの開発に参加する際のガイドラインをまとめたものです。

## 📋 目次

1. [開発環境セットアップ](#開発環境セットアップ)
2. [コーディング規約](#コーディング規約)
3. [コミットルール](#コミットルール)
4. [ブランチ戦略](#ブランチ戦略)
5. [プルリクエスト](#プルリクエスト)
6. [テスト戦略](#テスト戦略)
7. [セキュリティガイドライン](#セキュリティガイドライン)

---

## 🛠️ 開発環境セットアップ

### 必須ツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Node.js | 20.x以上 | JavaScript実行環境 |
| pnpm | 8.x以上 | パッケージマネージャー |
| Git | 2.x以上 | バージョン管理 |
| VSCode | 最新版 | 推奨エディタ |

### セットアップ手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/nto300002/Never_miss_a_notification.git
cd Never_miss_a_notification

# 2. 依存関係をインストール
pnpm install

# 3. 開発サーバー起動
pnpm run electron:dev

# 4. テスト実行
pnpm test
```

### VSCode 推奨拡張機能

以下の拡張機能をインストールしてください：

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

`.vscode/extensions.json` に保存されています。

---

## 📝 コーディング規約

### TypeScript

#### 基本ルール

```typescript
// ✅ Good: 明示的な型定義
interface Notification {
  id: string;
  source: 'slack' | 'chatwork' | 'gmail';
  title: string;
  body: string;
  timestamp: number;
  priority: 'meeting' | 'normal';
  meetingUrl?: string;
}

// ❌ Bad: any型の使用
function processNotification(data: any) {
  // ...
}

// ✅ Good: 適切な型定義
function processNotification(data: Notification): void {
  // ...
}
```

#### 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| 変数 | camelCase | `notificationList` |
| 定数 | UPPER_SNAKE_CASE | `API_TIMEOUT` |
| 関数 | camelCase | `detectMeetingUrl()` |
| クラス | PascalCase | `SlackClient` |
| インターフェース | PascalCase | `NotificationConfig` |
| 型エイリアス | PascalCase | `NotificationSource` |

#### 非同期処理

```typescript
// ✅ Good: async/await
async function fetchNotifications(): Promise<Notification[]> {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch notifications', error);
    throw error;
  }
}

// ❌ Bad: コールバック地獄
function fetchNotifications(callback: (err, data) => void) {
  api.get('/notifications', (err, response) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, response.data);
    }
  });
}
```

### React

#### コンポーネント設計

```tsx
// ✅ Good: 関数コンポーネント + TypeScript
interface NotificationCardProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="notification-card">
      {/* ... */}
    </div>
  );
}

// ❌ Bad: クラスコンポーネント
export class NotificationCard extends React.Component {
  // ...
}
```

#### Hooks のルール

```typescript
// ✅ Good: カスタムフックの活用
function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = api.onNotification((n) => {
      setNotifications((prev) => [...prev, n]);
    });

    return unsubscribe;
  }, []);

  return { notifications, setNotifications };
}

// ❌ Bad: コンポーネント内に複雑なロジック
function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // 100行以上のロジック...
  }, []);
}
```

### CSS / Tailwind CSS

```tsx
// ✅ Good: Tailwind utility classes
<div className="flex items-center gap-2 rounded-lg bg-gray-800 p-4">
  <span className="text-sm font-semibold text-white">Notification</span>
</div>

// ❌ Bad: インラインスタイル
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span style={{ fontSize: '14px', fontWeight: 600 }}>Notification</span>
</div>
```

---

## 🔄 コミットルール

### Conventional Commits

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type

| Type | 用途 | 例 |
|------|------|-----|
| `feat` | 新機能 | `feat(slack): add Socket Mode support` |
| `fix` | バグ修正 | `fix(ui): fix notification sorting logic` |
| `docs` | ドキュメント | `docs(readme): update setup instructions` |
| `style` | コードスタイル | `style: format with prettier` |
| `refactor` | リファクタリング | `refactor(api): simplify error handling` |
| `test` | テスト追加 | `test(meeting): add URL detection tests` |
| `chore` | その他 | `chore: update dependencies` |
| `security` | セキュリティ | `security: fix XSS vulnerability` |

#### Scope

- `slack` - Slack関連
- `chatwork` - Chatwork関連
- `gmail` - Gmail関連
- `ui` - UI/UX
- `api` - API連携
- `config` - 設定
- `build` - ビルド
- `ci` - CI/CD

#### コミットメッセージ例

```bash
# ✅ Good
feat(slack): add Socket Mode connection with auto-reconnect

- Implement @slack/socket-mode client
- Add exponential backoff for reconnection
- Store tokens in safeStorage

Closes #8

# ❌ Bad
fix bug

# ❌ Bad
add slack support and fix some bugs and update readme
```

### Co-Authored-By

Claude Code が生成したコードをコミットする場合：

```bash
git commit -m "feat(ui): implement notification panel

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 🌿 ブランチ戦略

### Git Flow (簡易版)

```
main (本番)
  ├── develop (開発)
  │     ├── feature/slack-integration
  │     ├── feature/notification-ui
  │     └── fix/meeting-url-detection
  └── hotfix/security-patch
```

### ブランチ命名規則

| 種類 | プレフィックス | 例 |
|------|--------------|-----|
| 新機能 | `feature/` | `feature/slack-socket-mode` |
| バグ修正 | `fix/` | `fix/notification-sorting` |
| ホットフィックス | `hotfix/` | `hotfix/xss-vulnerability` |
| リファクタリング | `refactor/` | `refactor/api-client` |
| ドキュメント | `docs/` | `docs/update-readme` |

### ブランチ運用

```bash
# 1. developから新ブランチ作成
git checkout develop
git pull origin develop
git checkout -b feature/slack-integration

# 2. 作業・コミット
git add .
git commit -m "feat(slack): implement Socket Mode client"

# 3. リモートにプッシュ
git push -u origin feature/slack-integration

# 4. プルリクエスト作成 (GitHub UI)

# 5. マージ後、ブランチ削除
git checkout develop
git pull origin develop
git branch -d feature/slack-integration
```

---

## 🔀 プルリクエスト

### PRテンプレート

```markdown
## 概要
<!-- このPRで何を実装したか、簡潔に説明 -->

## 変更内容
- [ ] Slack Socket Mode クライアント実装
- [ ] 自動再接続ロジック追加
- [ ] ユニットテスト追加

## 関連Issue
Closes #8

## テスト
- [ ] ユニットテスト: `pnpm test`
- [ ] E2Eテスト: `pnpm test:e2e`
- [ ] 手動テスト: Slack接続確認

## スクリーンショット
<!-- UIの変更がある場合、スクリーンショットを添付 -->

## チェックリスト
- [ ] TypeScriptのビルドが通る
- [ ] ESLintエラーがない
- [ ] テストが全て通る
- [ ] セキュリティチェック (XSS, Command Injection)
- [ ] ドキュメント更新 (必要な場合)
```

### レビュー基準

#### ✅ 承認条件

- [ ] コードが規約に従っている
- [ ] テストが十分に書かれている (カバレッジ80%以上)
- [ ] セキュリティ脆弱性がない
- [ ] パフォーマンス問題がない
- [ ] ドキュメントが更新されている

#### ❌ 却下条件

- APIトークンがハードコードされている
- `any` 型が多用されている
- テストがない
- セキュリティ脆弱性がある

---

## 🧪 テスト戦略

### カバレッジ目標

| レイヤー | カバレッジ目標 |
|---------|--------------|
| ユニットテスト | 80%以上 |
| 統合テスト | 主要フロー100% |
| E2Eテスト | クリティカルパス100% |

### テスト例

#### ユニットテスト (Vitest)

```typescript
// electron/services/meetingDetector.test.ts
import { describe, it, expect } from 'vitest';
import { detectMeetingUrl } from './meetingDetector';

describe('detectMeetingUrl', () => {
  it('should detect Zoom meeting URL', () => {
    const text = 'Join us: https://zoom.us/j/123456789';
    const result = detectMeetingUrl(text);

    expect(result).toEqual({
      url: 'https://zoom.us/j/123456789',
      service: 'zoom',
    });
  });

  it('should reject javascript: scheme (XSS)', () => {
    const text = 'Click: javascript:alert("XSS")';
    const result = detectMeetingUrl(text);

    expect(result).toBeNull();
  });
});
```

#### E2Eテスト (Playwright)

```typescript
// e2e/notification-panel.spec.ts
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test('should open notification panel with Ctrl+Shift+N', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();

  // ショートカット実行
  await window.keyboard.press('Control+Shift+N');

  // パネルが表示されることを確認
  const panel = await window.locator('.notification-panel');
  await expect(panel).toBeVisible();

  await app.close();
});
```

---

## 🔒 セキュリティガイドライン

### 必須チェック項目

#### 1. XSS (Cross-Site Scripting) 対策

```typescript
// ❌ Bad: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: notification.body }} />

// ✅ Good: エスケープ済み表示
<div>{notification.body}</div>

// ✅ Good: DOMPurifyでサニタイズ
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notification.body) }} />
```

#### 2. Command Injection 対策

```typescript
// ❌ Bad: shell.openExternal に未検証のURL
shell.openExternal(url);

// ✅ Good: URLスキーム検証
function openMeetingUrl(url: string): void {
  const allowedSchemes = ['https:', 'http:'];
  const parsed = new URL(url);

  if (!allowedSchemes.includes(parsed.protocol)) {
    throw new Error('Invalid URL scheme');
  }

  shell.openExternal(url);
}
```

#### 3. 認証情報の保護

```typescript
// ❌ Bad: 平文保存
fs.writeFileSync('config.json', JSON.stringify({ token: 'xoxb-...' }));

// ✅ Good: safeStorage API使用
import { safeStorage } from 'electron';

function saveToken(token: string): void {
  const encrypted = safeStorage.encryptString(token);
  store.set('slack.token', encrypted.toString('base64'));
}

function loadToken(): string {
  const encrypted = Buffer.from(store.get('slack.token'), 'base64');
  return safeStorage.decryptString(encrypted);
}
```

#### 4. ログ出力

```typescript
// ❌ Bad: トークンをログ出力
console.log('Slack token:', config.slackToken);

// ✅ Good: マスキング
console.log('Slack token:', maskToken(config.slackToken));

function maskToken(token: string): string {
  return token.slice(0, 8) + '****';
}
```

### セキュリティチェックリスト

- [ ] APIトークンが平文保存されていない
- [ ] ログにセンシティブ情報が含まれていない
- [ ] `dangerouslySetInnerHTML` を使用していない
- [ ] `shell.openExternal()` でURL検証している
- [ ] `contextIsolation: true` が設定されている
- [ ] `nodeIntegration: false` が設定されている
- [ ] CSPヘッダーが設定されている

---

## 📦 依存関係管理

### パッケージ更新

```bash
# 脆弱性スキャン
pnpm audit

# 脆弱性修正
pnpm audit --fix

# 依存関係更新
pnpm update

# Snykスキャン (推奨)
pnpm dlx snyk test
```

### 新規パッケージ追加時

```bash
# 1. インストール前にセキュリティチェック
pnpm dlx snyk test <package-name>

# 2. インストール
pnpm add <package-name>

# 3. package.json確認
git diff package.json
```

---

## 🚀 リリースフロー

### バージョニング (Semantic Versioning)

```
MAJOR.MINOR.PATCH

例: 1.2.3
  │  │  └─ PATCH: バグ修正
  │  └──── MINOR: 機能追加 (後方互換)
  └─────── MAJOR: 破壊的変更
```

### リリース手順

```bash
# 1. developをmainにマージ
git checkout main
git merge develop

# 2. バージョンタグ作成
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub ActionsがCIを実行
# 4. 自動でGitHub Releasesにバイナリアップロード
```

---

## 📚 参考資料

- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)
- [React公式ドキュメント](https://react.dev/)
- [Electron公式ドキュメント](https://www.electronjs.org/docs/latest/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🤝 コントリビューション

質問や提案がある場合は、以下の方法でお気軽にご連絡ください：

- GitHub Issue: [新規Issue作成](https://github.com/nto300002/Never_miss_a_notification/issues/new/choose)
- GitHub Discussions: [ディスカッション参加](https://github.com/nto300002/Never_miss_a_notification/discussions)
