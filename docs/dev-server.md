# 開発サーバー起動手順

## 概要

`pnpm dev` を実行すると **Vite dev server** と **Electron アプリ** が同時に起動する。
これは `vite-plugin-electron` によって実現されており、Vite がビルドを完了した後に Electron が自動起動する仕組み。

```
pnpm dev
  └─ Vite dev server (port 5173)
       └─ vite-plugin-electron → Electron 自動起動
            ├─ electron/main.ts   (メインプロセス)
            └─ electron/preload.ts (プリロードスクリプト)
```

---

## 起動手順

### 1. 多重起動チェック（必須）

`pnpm dev` を実行する前に、すでに起動していないか確認する。
多重起動すると複数の Electron ウィンドウが生成される。

```bash
pgrep -f "vite/bin/vite.js"
```

| 出力 | 状態 | 対応 |
|------|------|------|
| PID が表示される | すでに起動中 | **何もしない** |
| 出力なし | 未起動 | 次のステップへ |

### 2. 環境変数の設定（Slack 連携する場合）

プロジェクトルートに `.env` ファイルを作成し、Slack のトークンを設定する。

```bash
# .env
APP_TOKEN=xapp-...   # Slack App-Level Token (Socket Mode 用)
BOT_TOKEN=xoxb-...   # Slack Bot Token
```

未設定でも起動は可能。その場合、Slack 連携がスキップされる（コンソールに警告が出る）。

### 3. 開発サーバーの起動

```bash
pnpm dev
```

起動完了の目安:
- ターミナルに `VITE vX.X.X  ready in ...ms` が表示される
- Electron ウィンドウが起動する（初期状態では非表示）

---

## 停止手順

### 通常停止

ターミナルで `Ctrl+C` を押す。Vite と Electron の両プロセスが終了する。

### 強制停止（プロセスが残留している場合）

```bash
pkill -f "vite/bin/vite.js"; pkill -f "Electron.app/Contents/MacOS/Electron"
```

---

## ウィンドウ操作

Electron ウィンドウは `close` しても終了せず、**非表示（hide）** になる。
完全に終了するにはシステムトレイアイコンから「終了」を選択する。

| 操作 | 動作 |
|------|------|
| `Ctrl+Shift+Q` | パネルの表示 / 非表示トグル（グローバルショートカット） |
| ウィンドウの × ボタン | ウィンドウを非表示（アプリは継続稼働） |
| トレイアイコン クリック | ウィンドウの表示 / 非表示トグル |
| トレイ → 「終了」 | アプリを完全終了 |

---

## 利用可能なスクリプト

```bash
pnpm dev            # 開発サーバー起動（Vite + Electron）
pnpm build          # プロダクションビルド（tsc + vite build + electron-builder）
pnpm electron:build # Electron 向けビルドのみ（electron-builder なし）
pnpm lint           # ESLint 実行
pnpm type-check     # TypeScript 型チェックのみ
pnpm test           # Vitest でユニットテスト実行
pnpm test:ui        # Vitest UI モードで起動
pnpm test:coverage  # カバレッジレポート生成
pnpm test:e2e       # Playwright で E2E テスト実行
```

---

## プロダクションビルド

```bash
pnpm build
```

出力先:
- `dist/` — React フロントエンドのビルド成果物
- `dist-electron/` — Electron メインプロセスのビルド成果物
- `release/{version}/` — electron-builder によるインストーラー

---

## トラブルシューティング

### Electron が起動しない

1. `pgrep -f "vite/bin/vite.js"` で Vite が起動しているか確認
2. `assets/icon.png` が存在するか確認（トレイアイコンが見つからないとクラッシュする場合がある）
3. `pnpm install` で依存関係を再インストール

### ポート 5173 が使用中のエラー

```bash
lsof -ti:5173 | xargs kill -9
```

### 型エラーでビルドが失敗する

```bash
pnpm type-check
```

で型エラーの詳細を確認してから修正する。
