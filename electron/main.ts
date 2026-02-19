import {
  app,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  shell,
} from 'electron';
import path from 'path';

// Disable GPU acceleration for better compatibility
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 560,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the Vite dev server or production build
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide window instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  // Create tray icon (you'll need to add an icon file later)
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '通知を開く',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: '設定',
      click: () => {
        // TODO: Open settings page
      },
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('NotifyForce');
  tray.setContextMenu(contextMenu);

  // Show/hide window on tray click
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function registerGlobalShortcut() {
  // Register Ctrl+Shift+Q (both macOS and Windows/Linux use Control)
  const shortcut = 'Ctrl+Shift+Q';

  const registered = globalShortcut.register(shortcut, () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });

  if (!registered) {
    console.error('Failed to register global shortcut:', shortcut);
  }
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcut();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// ========================================
// IPC Handlers
// ========================================

// 会議URLを開く
ipcMain.on('meeting:open', (_event, url: string) => {
  // URLのバリデーション（セキュリティ対策）
  try {
    const parsedUrl = new URL(url);
    const allowedProtocols = ['https:', 'http:'];
    const allowedDomains = [
      'zoom.us',
      'meet.google.com',
      'teams.microsoft.com',
      'webex.com',
    ];

    // プロトコルチェック
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      console.error('Invalid protocol:', parsedUrl.protocol);
      return;
    }

    // ドメインチェック
    const isAllowedDomain = allowedDomains.some(
      (domain) =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) {
      console.error('Invalid domain:', parsedUrl.hostname);
      return;
    }

    // 安全にURLを開く
    shell.openExternal(url);
  } catch (error) {
    console.error('Invalid URL:', error);
  }
});

// ウィンドウ制御
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:close', () => {
  mainWindow?.hide();
});

// 通知操作（将来の実装用）
ipcMain.on('notification:dismiss', (_event, id: string) => {
  console.log('Dismiss notification:', id);
  // TODO: 通知を削除する処理
});

ipcMain.on('notification:dismissAll', () => {
  console.log('Dismiss all notifications');
  // TODO: 全通知を削除する処理
});

// 設定の保存・読み込み（将来の実装用）
ipcMain.handle('settings:save', async (_event, config: any) => {
  console.log('Save settings:', config);
  // TODO: electron-storeを使用して設定を保存
});

ipcMain.handle('settings:load', async () => {
  console.log('Load settings');
  // TODO: electron-storeを使用して設定を読み込み
  return {};
});

// Add custom property to app
declare module 'electron' {
  interface App {
    isQuitting?: boolean;
  }
}
