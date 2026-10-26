// src/modules/DaliDesigner/Document/GroupManager.ts
import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { Group } from "@/modules/DaliDesigner/models/Group";
import { nanoid } from "nanoid";

export const GroupManager = {
  create(doc: DaliDocument, name: string): { doc: DaliDocument; group: Group } {
    const group: Group = { id: `grp-${nanoid(6)}`, name };
    return { doc: { ...doc, groups: [...doc.groups, group] }, group };
  },

  assignDevices(doc: DaliDocument, groupId: string, deviceIds: string[]): DaliDocument {
    return {
      ...doc,
      devices: doc.devices.map((d) =>
        deviceIds.includes(d.id) && !d.groupIds.includes(groupId)
          ? { ...d, groupIds: [...d.groupIds, groupId] }
          : d
      ),
    };
  },

  removeDevices(doc: DaliDocument, groupId: string, deviceIds: string[]): DaliDocument {
    return {
      ...doc,
      devices: doc.devices.map((d) =>
        deviceIds.includes(d.id)
          ? { ...d, groupIds: d.groupIds.filter((g) => g !== groupId) }
          : d
      ),
    };
  },

  /**
   * Delete a group entirely.
   *
   * Removes the group from `doc.groups` AND unfiles its id from every
   * device's `groupIds`. Skipping the second step would leave dangling
   * references — the group would be gone but devices would still point
   * at it, breaking any `groups.find(g => g.id === gid)` call.
   */
  remove(doc: DaliDocument, groupId: string): DaliDocument {
    return {
      ...doc,
      groups: doc.groups.filter((g) => g.id !== groupId),
      devices: doc.devices.map((d) =>
        d.groupIds.includes(groupId)
          ? { ...d, groupIds: d.groupIds.filter((g) => g !== groupId) }
          : d
      ),
    };
  },
};