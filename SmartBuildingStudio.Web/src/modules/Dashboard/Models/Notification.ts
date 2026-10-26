export type NotificationType = "Error" | "Warning" | "Info";

export interface INotificationProps {
  id: string;
  title: string;
  type: NotificationType;
  text: string;
  timeLabel: string;
  isRead: boolean;
}

export class Notification {
  private props: INotificationProps;

  constructor(props: INotificationProps) {
    this.props = { ...props };
  }

  public getId(): string { return this.props.id; }
  public getTitle(): string { return this.props.title; }
  public getType(): NotificationType { return this.props.type; }
  public getText(): string { return this.props.text; }
  public getTimeLabel(): string { return this.props.timeLabel; }
  public isRead(): boolean { return this.props.isRead; }

  public markAsRead(): void {
    this.props.isRead = true;
  }
}
