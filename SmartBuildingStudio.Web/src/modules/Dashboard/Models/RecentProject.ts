export interface IRecentProjectProps {
  id: string;
  name: string;
  clientName: string;
  floorCount: number;
  totalDaliDevices: number;
  modifiedAt: Date;
}

export class RecentProject {
  private readonly props: IRecentProjectProps;

  constructor(props: IRecentProjectProps) {
    if (!props.id) throw new Error("RecentProject domain instantiation requires a valid unique ID.");
    this.props = { ...props };
  }

  public getId(): string { return this.props.id; }
  public getName(): string { return this.props.name; }
  public getClientName(): string { return this.props.clientName; }
  public getFloorCount(): number { return this.props.floorCount; }
  public getTotalDaliDevices(): number { return this.props.totalDaliDevices; }
  public getModifiedAt(): Date { return this.props.modifiedAt; }

  /**
   * Asserts whether a project scope carries highly complex network loops 
   * (e.g., more than 128 devices indicates multiple subnets required).
   */
  public isLargeScaleInstallation(): boolean {
    return this.props.totalDaliDevices > 128;
  }
}
