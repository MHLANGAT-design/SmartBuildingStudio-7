export interface ISystemStatusProps {
  databaseConnected: boolean;
  storageUsedBytes: number;
  storageMaxBytes: number;
  activeBackgroundJobs: number;
  syncSynchronized: boolean;
  licenseStatus: "Valid" | "Expiring" | "Invalid";
  licenseExpiryDate: Date;
}

export class SystemStatus {
  private readonly props: ISystemStatusProps;

  constructor(props: ISystemStatusProps) {
    this.props = { ...props };
  }

  public isDatabaseOnline(): boolean { return this.props.databaseConnected; }
  public getActiveBackgroundJobsCount(): number { return this.props.activeBackgroundJobs; }
  public isCloudSyncActive(): boolean { return this.props.syncSynchronized; }
  public getLicenseStatus(): string { return this.props.licenseStatus; }
  public getLicenseExpiryDate(): Date { return this.props.licenseExpiryDate; }

  public getStorageUsagePercentage(): number {
    if (this.props.storageMaxBytes <= 0) return 0;
    return (this.props.storageUsedBytes / this.props.storageMaxBytes) * 100;
  }

  public isStorageThresholdExceeded(): boolean {
    return this.getStorageUsagePercentage() > 90.0;
  }
}