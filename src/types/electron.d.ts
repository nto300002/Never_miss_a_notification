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
    electron?: ElectronAPI;
  }
}

export {};
