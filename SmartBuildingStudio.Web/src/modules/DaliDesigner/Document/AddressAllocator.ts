// src/modules/DaliDesigner/Document/AddressAllocator.ts
//
// DALI short addressing is PER-LINE. Each physical DALI line has its own
// 0-63 address space, independent of every other line. Two devices on
// different lines can both hold address 0 — that's correct behavior, not
// a conflict.
//
// The allocator must therefore group by lineId before assigning:
//
//   • Line 1 with 5 devices → 0, 1, 2, 3, 4
//   • Line 2 with 5 devices → 0, 1, 2, 3, 4  (independent)
//
// Devices with lineId === null are skipped — there's no line context to
// allocate against, so the user has to assign them to a line first.
//
// If a line exhausts its 0-63 space, remaining devices on that line keep
// null (unaddressed). Other lines are unaffected.

import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

const MIN_ADDRESS = 0;
const MAX_ADDRESS = 63;

export interface DaliAddressConflict {
  lineId: string;
  address: number;
  deviceIds: string[];
}

export const AddressAllocator = {
  /**
   * Assign sequential addresses (per-line) to devices that don't
   * already have one. Existing addresses are respected.
   *
   * @param devices The full device list (all lines).
   * @param start First address to try (usually 0).
   * @returns New device list with per-line addresses assigned.
   */
  autoAddress(devices: DaliDevice[], start = MIN_ADDRESS): DaliDevice[] {
    // Group by line.
    const byLine = new Map<string, DaliDevice[]>();
    for (const d of devices) {
      if (d.lineId == null) continue;
      const list = byLine.get(d.lineId) ?? [];
      list.push(d);
      byLine.set(d.lineId, list);
    }

    // Assign within each line.
    const assignments = new Map<string, number>();
    for (const [, lineDevices] of byLine) {
      const taken = new Set<number>();
      for (const d of lineDevices) {
        if (d.address != null) taken.add(d.address);
      }

      let next = Math.max(start, MIN_ADDRESS);
      for (const d of lineDevices) {
        if (d.address != null) continue;
        while (taken.has(next) && next <= MAX_ADDRESS) next++;
        if (next > MAX_ADDRESS) break;
        assignments.set(d.id, next);
        taken.add(next);
        next++;
      }
    }

    // Apply assignments to the original device list.
    return devices.map((d) => {
      const newAddress = assignments.get(d.id);
      if (newAddress === undefined) return d;
      return { ...d, address: newAddress };
    });
  },

  /**
   * Wipe all addresses (per-line) and renumber from `start`.
   *
   * Each line gets its own 0..N-1 sequence. Devices beyond the 0-63
   * space on any given line get null.
   *
   * Devices without a lineId are left untouched (can't reassign
   * without line context).
   */
  reassignAll(devices: DaliDevice[], start = MIN_ADDRESS): DaliDevice[] {
    const counters = new Map<string, number>();
    return devices.map((d) => {
      if (d.lineId == null) return d;
      const next = Math.max(counters.get(d.lineId) ?? start, MIN_ADDRESS);
      if (next > MAX_ADDRESS) return { ...d, address: null };
      counters.set(d.lineId, next + 1);
      return { ...d, address: next };
    });
  },

  /**
   * Return any per-line address conflicts. An address held by two or
   * more devices **on the same line** is a conflict. The same address
   * on different lines is not.
   */
  findConflicts(devices: DaliDevice[]): DaliAddressConflict[] {
    const map = new Map<string, string[]>();
    for (const d of devices) {
      if (d.address == null || d.lineId == null) continue;
      const key = `${d.lineId}|${d.address}`;
      const arr = map.get(key) ?? [];
      arr.push(d.id);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([key, deviceIds]) => {
        const sep = key.indexOf("|");
        const lineId = key.substring(0, sep);
        const address = Number(key.substring(sep + 1));
        return { lineId, address, deviceIds };
      });
  },
};

export default AddressAllocator;