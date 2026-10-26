import { Notification, NotificationType } from "@/modules/Dashboard/Models/Notification";

export interface IRawNotificationDto {
  alertId: string;
  headline: string;
  severity: NotificationType;
  bodyText: string;
  relativeTime: string;
  viewed: boolean;
}

export class NotificationService {
  /**
   * Rehydrates raw alert transport payloads back into encapsulated domain models.
   */
  public static rehydrateAlertCollection(rawAlerts: IRawNotificationDto[]): Notification[] {
    if (!rawAlerts || !Array.isArray(rawAlerts)) return [];

    return rawAlerts.map(
      (dto) =>
        new Notification({
          id: dto.alertId,
          title: dto.headline,
          type: dto.severity,
          text: dto.bodyText,
          timeLabel: dto.relativeTime,
          isRead: dto.viewed
        })
    );
  }

  /**
   * Filters out unread notifications, prioritizing urgent structural network crashes.
   */
  public static segregateHighPriorityAlerts(notifications: Notification[]): Notification[] {
    return notifications
      .filter((notif) => !notif.isRead())
      .sort((a, b) => {
        const score = (n: Notification) => (n.getType() === "Error" ? 3 : n.getType() === "Warning" ? 2 : 1);
        return score(b) - score(a);
      });
  }
}
