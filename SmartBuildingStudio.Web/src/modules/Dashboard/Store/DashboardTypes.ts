export interface RecentProject {
  id: string;
  name: string;
  clientName: string;
  floorCount: number;
  totalDaliDevices: number;
  modifiedAt: string;
}

export interface RecentDocument {
  id: string;
  title: string;
  moduleOwner: "FloorPlanDesigner" | "FixturePlacementStudio" | "DaliDesigner" | "EmergencyLighting";
  floorName: string;
  modifiedAt: string;
}

export interface SystemJobActivity {
  id: string;
  timestamp: string;
  description: string;
  operator: string;
  status: "Success" | "Warning" | "Failed";
}

export interface SystemHealthMetric {
  databaseConnected: boolean;
  storageUsedBytes: number;
  storageMaxBytes: number;
  activeBackgroundJobs: number;
  syncSynchronized: boolean;
  licenseStatus: "Valid" | "Expiring" | "Invalid";
  licenseExpiryDate: string;
}

export interface DashboardState {
  recentProjects: RecentProject[];
  recentDocuments: RecentDocument[];
  activities: SystemJobActivity[];
  health: SystemHealthMetric | null;
  loading: boolean;
  error: string | null;
  activeFilters: {
    projectQuery: string;
    activitySeverity: "All" | "Success" | "Warning" | "Failed";
  };
}
