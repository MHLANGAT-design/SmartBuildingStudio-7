export interface ITaskProps {
  id: string;
  label: string;
  done: boolean;
}

export class Task {
  private props: ITaskProps;

  constructor(props: ITaskProps) {
    this.props = { ...props };
  }

  public getId(): string { return this.props.id; }
  public getLabel(): string { return this.props.label; }
  public isDone(): boolean { return this.props.done; }

  public toggleCompletionState(): void {
    this.props.done = !this.props.done;
  }
}
