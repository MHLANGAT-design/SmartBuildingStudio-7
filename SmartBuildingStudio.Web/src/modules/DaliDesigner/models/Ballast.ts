import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

export interface Ballast extends DaliDevice {
  kind: "Ballast";
  dimRange: [number, number];
  fadeTime: number;
}