import { Activity } from "@/modules/Dashboard/Models/Activity";
import { SystemJobActivity } from "@/modules/Dashboard/Store/DashboardTypes";

export class ActivityService {
  /**
   * Transforms raw transport activity payloads from the server into domain entity structures.
   */
  public static mapToDomainEntities(rawActivities: SystemJobActivity[]): Activity[] {
    if (!rawActivities || !Array.isArray(rawActivities)) return [];

    return rawActivities.map(
      (item) =>
        new Activity({
          id: item.id,
          timestamp: new Date(item.timestamp),
          description: item.description,
          operator: item.operator,
          status: item.status
        })
    );
  }

  /**
   * Compiles severe operation failures requiring immediate supervisor review.
   */
  public static extractCriticalFailures(activities: Activity[]): Activity[] {
    return activities.filter((act) => act.requiresEngineeringReview() && act.getStatus() === "Failed");
  }

  /**
   * Computes operational throughput percentages across an active telemetry stream buffer.
   */
  public static computeSuccessRatePercentage(activities: Activity[]): number {
    if (activities.length === 0) return 100.0;

    const successfulCount = activities.filter((act) => act.getStatus() === "Success").length;
    return (successfulCount / activities.length) * 100;
  }
}