import { RecentProject } from "@/modules/Dashboard/Models/RecentProject";
import { RecentDocument } from "@/modules/Dashboard/Models/RecentDocument";
import { Activity } from "@/modules/Dashboard/Models/Activity";
import { SystemStatus } from "@/modules/Dashboard/Models/SystemStatus";

export interface IDashboardProps {
  projects: RecentProject[];
  documents: RecentDocument[];
  activities: Activity[];
  status: SystemStatus;
}

export class Dashboard {
  private readonly props: IDashboardProps;

  constructor(props: IDashboardProps) {
    this.props = { ...props };
  }

  public getRecentProjects(): readonly RecentProject[] { return this.props.projects; }
  public getRecentDocuments(): readonly RecentDocument[] { return this.props.documents; }
  public getActivityLog(): readonly Activity[] { return this.props.activities; }
  public getSystemStatus(): SystemStatus { return this.props.status; }

  /**
   * Compiles severe ongoing structural system failures requiring action.
   */
  public containsCriticalAlerts(): boolean {
    if (!this.props.status.isDatabaseOnline()) return true;
    if (this.props.status.isStorageThresholdExceeded()) return true;
    return this.props.activities.some(act => act.requiresEngineeringReview() && act.getStatus() === "Failed");
  }
}
