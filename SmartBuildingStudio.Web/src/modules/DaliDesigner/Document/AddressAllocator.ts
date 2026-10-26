// src/modules/DaliDesigner/Document/AddressAllocator.ts
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

const MIN_ADDRESS = 0;
const MAX_ADDRESS = 63;

export const AddressAllocator = {
  /**
   * Assign sequential DALI addresses to any device that doesn't already
   * have one. Existing addresses are respected and never reassigned.
   *
   * Never produces duplicates: the allocator seeds a "taken" set from
   * the addresses already in use, then walks unaddressed devices and
   * gives each the next free slot at or above `start`.
   *
   * If the pool is exhausted (all 0–63 used), remaining devices are
   * left without an address.
   */
  autoAddress(devices: DaliDevice[], start = MIN_ADDRESS): DaliDevice[] {
    // 1. Collect every address already in use.
    const taken = new Set<number>();
    for (const d of devices) {
      if (d.address != null) taken.add(d.address);
    }

    // 2. Walk devices; give the next free address to each unaddressed one.
    let next = Math.max(start, MIN_ADDRESS);
    return devices.map((d) => {
      if (d.address != null) return d;

      // Advance past addresses that are already taken.
      while (taken.has(next) && next <= MAX_ADDRESS) next++;
      if (next > MAX_ADDRESS) return d; // out of address space

      const assigned = next;
      taken.add(assigned);
      next++;
      return { ...d, address: assigned };
    });
  },

  /**
   * Wipe all addresses and renumber from `start`.
   *
   * Use this when you want a clean, dense sequence (0..N-1) and don't
   * care about preserving existing numbers. Devices beyond the
   * 0–63 address space get `null`.
   */
  reassignAll(devices: DaliDevice[], start = MIN_ADDRESS): DaliDevice[] {
    let next = Math.max(start, MIN_ADDRESS);
    return devices.map((d) => {
      if (next > MAX_ADDRESS) return { ...d, address: null };
      return { ...d, address: next++ };
    });
  },

  /**
   * Return any addresses that are used by more than one device.
   *
   * A well-formed DALI network should have an empty result from this.
   * Any entries returned indicate a conflict that ValidationService
   * surfaces as an error-level issue.
   */
  findConflicts(
    devices: DaliDevice[]
  ): Array<{ address: number; deviceIds: string[] }> {
    const map = new Map<number, string[]>();
    for (const d of devices) {
      if (d.address == null) continue;
      const arr = map.get(d.address) ?? [];
      arr.push(d.id);
      map.set(d.address, arr);
    }
    return Array.from(map.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([address, deviceIds]) => ({ address, deviceIds }));
  },
};

export default AddressAllocator;