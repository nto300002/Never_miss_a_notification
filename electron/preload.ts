import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Notification API
  onNotification: (callback: (notification: any) => void) => {
    ipcRenderer.on('notification:new', (_event, notification) => callback(notification));
  },

  dismissNotification: (id: string) => {
    ipcRenderer.send('notification:dismiss', id);
  },

  dismissAllNotifications: () => {
    ipcRenderer.send('notification:dismissAll');
  },

  openMeetingUrl: (url: string) => {
    ipcRenderer.send('meeting:open', url);
  },

  // Settings API
  saveSettings: (config: any) => {
    return ipcRenderer.invoke('settings:save', config);
  },

  loadSettings: () => {
    return ipcRenderer.invoke('settings:load');
  },

  // Window control
  minimizeWindow: () => {
    ipcRenderer.send('window:minimize');
  },

  closeWindow: () => {
    ipcRenderer.send('window:close');
  },
});

// TypeScript type definitions for window.electron
export interface ElectronAPI {
  onNotification: (callback: (notification: any) => void) => void;
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
  openMeetingUrl: (url: string) => void;
  saveSettings: (config: any) => Promise<void>;
  loadSettings: () => Promise<any>;
  minimizeWindow: () => void;
  closeWindow: () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
