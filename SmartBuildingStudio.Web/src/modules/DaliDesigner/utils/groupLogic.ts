import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

export function devicesInGroup(devices: DaliDevice[], groupId: string): DaliDevice[] {
  return devices.filter((d) => d.groupIds.includes(groupId));
}