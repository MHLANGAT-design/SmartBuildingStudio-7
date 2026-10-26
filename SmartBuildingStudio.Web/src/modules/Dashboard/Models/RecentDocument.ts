export type ModuleStudioOwner = 
  | "FloorPlanDesigner" 
  | "FixturePlacementStudio" 
  | "DaliDesigner" 
  | "EmergencyLighting";

export interface IRecentDocumentProps {
  id: string;
  title: string;
  moduleOwner: ModuleStudioOwner;
  floorName: string;
  modifiedAt: Date;
}

export class RecentDocument {
  private readonly props: IRecentDocumentProps;

  constructor(props: IRecentDocumentProps) {
    this.props = { ...props };
  }

  public getId(): string { return this.props.id; }
  public getTitle(): string { return this.props.title; }
  public getModuleOwner(): ModuleStudioOwner { return this.props.moduleOwner; }
  public getFloorName(): string { return this.props.floorName; }
  public getModifiedAt(): Date { return this.props.modifiedAt; }
}
