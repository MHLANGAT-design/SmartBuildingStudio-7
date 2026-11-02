// src/modules/DaliProgrammingStudio/Deployment/DeploymentLockManager.ts

export class DeploymentLockManager {
  private activeLocks: Map<string, string> = new Map(); // gateway-line -> deploymentId

  /**
   * Attempt to acquire a lock for a specific gateway and line.
   * Returns true if successful, false if already locked.
   */
  public acquireLock(gatewayId: string, lineId: string, deploymentId: string): boolean {
    const key = `${gatewayId}-${lineId}`;
    if (this.activeLocks.has(key)) {
      return false;
    }
    this.activeLocks.set(key, deploymentId);
    return true;
  }

  public releaseLock(gatewayId: string, lineId: string): void {
    const key = `${gatewayId}-${lineId}`;
    this.activeLocks.delete(key);
  }

  public isLocked(gatewayId: string, lineId: string): boolean {
    return this.activeLocks.has(`${gatewayId}-${lineId}`);
  }

  public getLockOwner(gatewayId: string, lineId: string): string | undefined {
    return this.activeLocks.get(`${gatewayId}-${lineId}`);
  }
}