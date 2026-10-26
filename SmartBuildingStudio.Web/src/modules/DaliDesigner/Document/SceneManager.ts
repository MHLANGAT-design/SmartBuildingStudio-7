import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { Scene } from "@/modules/DaliDesigner/models/Scene";
import { nanoid } from "nanoid";

export const SceneManager = {
  create(doc: DaliDocument, name: string): { doc: DaliDocument; scene: Scene } {
    const scene: Scene = { id: `scn-${nanoid(6)}`, name, levels: {} };
    return { doc: { ...doc, scenes: [...doc.scenes, scene] }, scene };
  },

  setLevel(doc: DaliDocument, sceneId: string, deviceId: string, level: number): DaliDocument {
    return {
      ...doc,
      scenes: doc.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, levels: { ...s.levels, [deviceId]: clamp(level) } }
          : s
      ),
    };
  },

  remove(doc: DaliDocument, sceneId: string): DaliDocument {
    return { ...doc, scenes: doc.scenes.filter((s) => s.id !== sceneId) };
  },
};

function clamp(n: number): number {
  return Math.max(0, Math.min(254, Math.round(n)));
}