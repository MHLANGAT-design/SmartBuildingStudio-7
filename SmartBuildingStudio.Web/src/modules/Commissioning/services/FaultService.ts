// src/modules/Commissioning/services/FaultService.ts

import type { Fault } from '@/modules/Commissioning/models/Fault';

export class FaultService {
  /**
   * Fetches all active (unresolved) faults for a session.
   */
  public static async getActiveFaults(sessionId: string): Promise<Fault[]> {
    const res = await fetch(`/api/commissioning/sessions/${sessionId}/faults?active=true`);
    if (!res.ok) throw new Error('Failed to fetch active faults');
    return res.json();
  }

  /**
   * Marks a fault as resolved with engineer notes.
   */
  public static async resolveFault(faultId: string, notes: string): Promise<Fault> {
    const res = await fetch(`/api/commissioning/faults/${faultId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Failed to resolve fault');
    return res.json();
  }
}