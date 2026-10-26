import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

export interface Switch extends DaliDevice {
  kind: "Switch";
  buttonCount: number;
}