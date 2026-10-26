import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";
import { AddressAllocator } from "@/modules/DaliDesigner/Document/AddressAllocator";

export const AddressingService = {
  auto: (devices: DaliDevice[]) => AddressAllocator.autoAddress(devices),
  conflicts: (devices: DaliDevice[]) => AddressAllocator.findConflicts(devices),
};