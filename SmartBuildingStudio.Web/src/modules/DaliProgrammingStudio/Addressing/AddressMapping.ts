// src/modules/DaliProgrammingStudio/Addressing/AddressMapping.ts

export interface AddressMapping {
  deviceId: string;         // The Design device ID from DaliDesigner
  lineId: string;
  shortAddress: number;     // The physical 0-63 address
  hardwareRandomAddress?: string; // The 24-bit DALI random address (unique factory ID)
}