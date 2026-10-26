export interface IDashboardWidgetProps {
  id: string;
  title: string;
  visible: boolean;
  gridOrder: number;
}

export class DashboardWidget {
  private props: IDashboardWidgetProps;

  constructor(props: IDashboardWidgetProps) {
    this.props = { ...props };
  }

  public getId(): string { return this.props.id; }
  public getTitle(): string { return this.props.title; }
  public isVisible(): boolean { return this.props.visible; }
  public getGridOrder(): number { return this.props.gridOrder; }

  public toggleVisibility(): void {
    this.props.visible = !this.props.visible;
  }

  public updateOrderIndex(newOrder: number): void {
    this.props.gridOrder = newOrder;
  }
}
