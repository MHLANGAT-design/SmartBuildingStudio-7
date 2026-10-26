import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { GroupManager } from "@/modules/DaliDesigner/Document/GroupManager";

export const GroupService = {
  create: GroupManager.create,
  assign: GroupManager.assignDevices,
  remove: GroupManager.removeDevices,
  list: (doc: DaliDocument) => doc.groups,
};