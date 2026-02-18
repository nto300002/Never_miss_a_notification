export type NotificationSource = 'slack' | 'chatwork' | 'gmail' | 'zoom' | 'meet' | 'teams' | 'webex';

export type NotificationPriority = 'meeting' | 'normal';

export interface Notification {
  id: string;
  source: NotificationSource;
  title: string;
  body: string;
  sender?: string;
  timestamp: number;
  priority: NotificationPriority;
  meetingUrl?: string;
}

export interface SourceConfig {
  color: string;
  bg: string;
  border: string;
  label: string;
  emoji: string;
}

export interface AppConfig {
  slack?: {
    appToken: string;
    botToken: string;
    enabled: boolean;
  };
  chatwork?: {
    apiToken: string;
    roomId?: string;
    enabled: boolean;
  };
  gmail?: {
    credentialsPath: string;
    enabled: boolean;
  };
  shortcuts?: {
    togglePanel: string;
  };
}
