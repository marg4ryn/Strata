export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  type: NotificationType;
  messageKey: string;
  sentAt: number;
  params?: Record<string, string>;
}
