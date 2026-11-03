// src/modules/Commissioning/services/CommissioningApi.ts

import type { CommissioningSession } from '@/modules/Commissioning/models/CommissioningSession';
import type { CommissioningReport } from '@/modules/Commissioning/models/CommissioningReport';

const BASE_URL = '/api/commissioning';

export class CommissioningApi {
  /**
   * POST /api/commissioning/start
   * Initializes a new field session for a specific floor/project.
   */
  public static async startSession(projectId: string, floorId: string): Promise<CommissioningSession> {
    const res = await fetch(`${BASE_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, floorId }),
    });
    if (!res.ok) throw new Error('Failed to start commissioning session');
    return res.json();
  }

  /**
   * POST /api/commissioning/session
   * Saves the current field state snapshot (device states, active faults, etc.).
   */
  public static async saveSessionState(session: CommissioningSession): Promise<void> {
    const res = await fetch(`${BASE_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error('Failed to save commissioning session state');
  }

  /**
   * POST /api/commissioning/report
   * Generates and persists the final handover report.
   */
  public static async generateReport(sessionId: string): Promise<CommissioningReport> {
    const res = await fetch(`${BASE_URL}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error('Failed to generate commissioning report');
    return res.json();
  }
}