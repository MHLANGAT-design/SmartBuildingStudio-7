// src/modules/Commissioning/models/AddressAssignment.ts

export type AddressingMethod = 'AUTO' | 'MANUAL';

export interface AddressAssignment {
  deviceId: string;
  lineId: string;
  assignedAddress: number;
  previousAddress: number | null;
  method: AddressingMethod;
  assignedAt: string;
  assignedBy: string;
}