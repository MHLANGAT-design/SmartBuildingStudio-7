import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { AddressAllocator } from "@/modules/DaliDesigner/Document/AddressAllocator";

export interface ValidationIssue {
  id: string;
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  deviceId?: string;
  position?: { x: number; y: number };
}

export const ValidationService = {
  validate(doc: DaliDocument): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    AddressAllocator.findConflicts(doc.devices).forEach((c) => {
      c.deviceIds.forEach((deviceId) => {
        const dev = doc.devices.find((d) => d.id === deviceId);
        issues.push({
          id: `conflict-${c.address}-${deviceId}`,
          code: "ADDR_CONFLICT",
          severity: "error",
          message: `Address ${c.address} used by multiple devices`,
          deviceId,
          position: dev?.metadata.position,
        });
      });
    });

    doc.devices.forEach((d) => {
      if (d.address == null) {
        issues.push({
          id: `unaddressed-${d.id}`,
          code: "NO_ADDRESS",
          severity: "warning",
          message: `Device ${d.label} has no DALI address`,
          deviceId: d.id,
          position: d.metadata.position,
        });
      }
      if (!d.lineId) {
        issues.push({
          id: `no-line-${d.id}`,
          code: "NO_LINE",
          severity: "warning",
          message: `Device ${d.label} is not on a DALI line`,
          deviceId: d.id,
          position: d.metadata.position,
        });
      }
    });

    doc.lines.forEach((l) => {
      const count = doc.devices.filter((d) => d.lineId === l.id).length;
      if (count > l.maxDevices) {
        issues.push({
          id: `line-overflow-${l.id}`,
          code: "LINE_OVERFLOW",
          severity: "error",
          message: `Line ${l.name} has ${count} devices (max ${l.maxDevices})`,
        });
      }
    });

    return issues;
  },
};