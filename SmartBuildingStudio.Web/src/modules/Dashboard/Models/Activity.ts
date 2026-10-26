export type ActivitySeverityStatus = "Success" | "Warning" | "Failed";

export interface IActivityProps {
  id: string;
  timestamp: Date;
  description: string;
  operator: string;
  status: ActivitySeverityStatus;
}

export class Activity {
  private readonly props: IActivityProps;

  constructor(props: IActivityProps) {
    this.props = { ...props };
  }

  public getId(): string { return this.props.id; }
  public getTimestamp(): Date { return this.props.timestamp; }
  public getDescription(): string { return this.props.description; }
  public getOperator(): string { return this.props.operator; }
  public getStatus(): ActivitySeverityStatus { return this.props.status; }

  public requiresEngineeringReview(): boolean {
    return this.props.status === "Failed" || this.props.status === "Warning";
  }
}
