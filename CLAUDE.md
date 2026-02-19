# NotifyForce — Claude Code プロジェクト指示書

## プロジェクト概要
Slack / Chatwork / Gmail / Zoom / Meet / Teams の通知を画面中央に表示する Electron + React デスクトップアプリ。

## 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **デスクトップ**: Electron 28
- **スタイル**: インラインスタイル（Tailwind は設定済みだが未使用）
- **パッケージマネージャ**: pnpm

## 開発サーバーの起動

### ⚠️ 重要: 多重起動禁止
`pnpm dev` は **Vite dev server と Electron アプリを同時に起動する**。
すでに起動している場合は絶対に再実行しないこと。多重起動すると複数の Electron ウィンドウが生成される。

### 起動前に必ず確認
```bash
pgrep -f "vite/bin/vite.js"
```
- 出力あり → すでに起動中。**何もしない**
- 出力なし → `pnpm dev` で起動してよい

### 起動コマンド（未起動の場合のみ）
```bash
pnpm dev
```

### 全停止コマンド
```bash
pkill -f "vite/bin/vite.js"; pkill -f "Electron.app/Contents/MacOS/Electron"
```

## ショートカット
- **Ctrl+Shift+Q**: パネルの表示 / 非表示トグル（グローバルショートカット）

## ディレクトリ構成
```
src/
  components/   # NotificationCard など UI コンポーネント
  pages/        # OverlayPage（メイン画面）
  types/        # notification.ts, electron.d.ts
  data/         # demoNotifications.ts（デモデータ）
  utils/        # timeUtils.ts
electron/
  main.ts       # Electron メインプロセス（グローバルショートカット・IPC）
  preload.ts    # コンテキストブリッジ
```

## 注意事項
- `vite.config.ts` に `vite-plugin-electron` が設定されており、`pnpm dev` 実行で Electron が自動起動する
- ブラウザのみで確認したい場合も Electron が起動するため、不要なら事前にプロセスを確認すること
- `electron/main.ts` の `window:close` IPC → `mainWindow.hide()` でウィンドウを隠す（終了ではない）
