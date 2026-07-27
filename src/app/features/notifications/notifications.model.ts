export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  type: NotificationType;
  message: string;
  sentAt: number;
}
