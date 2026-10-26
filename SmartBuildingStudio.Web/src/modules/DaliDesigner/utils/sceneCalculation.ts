import { Scene } from "@/modules/DaliDesigner/models/Scene";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

export function applyScene(scene: Scene, devices: DaliDevice[]) {
  return devices.map((d) => ({ deviceId: d.id, level: scene.levels[d.id] ?? 0 }));
}