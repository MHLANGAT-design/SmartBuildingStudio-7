// src/modules/DaliProgrammingStudio/Gateway/GatewaySession.ts

export class GatewaySession {
  public readonly sessionId: string;
  public readonly startedAt: string;
  public targetLineId?: string;
  
  constructor(
    public readonly gatewayId: string,
    public readonly protocol: string
  ) {
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.startedAt = new Date().toISOString();
  }

  /**
   * Safety Rule #12: Identify the target gateway and DALI line before sending commands.
   */
  public lockToLine(lineId: string): void {
    if (this.targetLineId) {
      throw new Error(`Session is already locked to line ${this.targetLineId}. Cannot switch lines mid-session.`);
    }
    this.targetLineId = lineId;
  }
}