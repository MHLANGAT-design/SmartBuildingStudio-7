import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";
import { SceneManager } from "@/modules/DaliDesigner/Document/SceneManager";

export const SceneService = {
  create: SceneManager.create,
  setLevel: SceneManager.setLevel,
  remove: SceneManager.remove,
  list: (doc: DaliDocument) => doc.scenes,
};