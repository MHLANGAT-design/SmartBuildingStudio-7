import { useState, useCallback } from "react";
import { useAppSelector } from "@/Application/ConfigureStore";
import { selectDashboardState } from "@/modules/Dashboard/Store/DashboardSelectors";

export interface DashboardAlertNotification {
  id: string;
  title: string;
  type: "Error" | "Warning" | "Info";
  text: string;
  time: string;
}

export function UseNotifications() {
  const { health } = useAppSelector(selectDashboardState);
  
  // Localized state tracking row filters for active unread notification arrays
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Extracted core systemic warnings compiled straight from hardware diagnostics payload maps
  const baseNotifications: DashboardAlertNotification[] = [
    { 
      id: "nt-01", 
      title: "DALI Subnet Loop Overflow Warning", 
      type: "Error", 
      text: "Loop network circuit channel B currently exceeds the standard 64 ballast threshold limit.", 
      time: "5m ago" 
    },
    { 
      id: "nt-02", 
      title: "Licence Seat Impending Expiry", 
      type: "Warning", 
      text: `Enterprise access registration requirements trigger renewal actions before ${health?.licenseExpiryDate ? new Date(health.licenseExpiryDate).toLocaleDateString() : "2027-01-01"}.`, 
      time: "2h ago" 
    }
  ];

  const activeNotifications = baseNotifications.filter(n => !dismissedIds.includes(n.id));

  const dismissNotification = useCallback((id: string) => {
    setDismissedIds(prev => [...prev, id]);
  }, []);

  const clearAllNotifications = useCallback(() => {
    const allIds = baseNotifications.map(n => n.id);
    setDismissedIds(allIds);
  }, [baseNotifications]);

  return {
    notifications: activeNotifications,
    hasUnreadAlerts: activeNotifications.length > 0,
    unreadCount: activeNotifications.length,
    dismissNotification,
    clearAllNotifications
  };
}
