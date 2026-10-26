import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

export interface Sensor extends DaliDevice {
  kind: "Sensor";
  sensorType: "Occupancy" | "Daylight" | "Combined";
  sensitivity: "Low" | "Medium" | "High";
}