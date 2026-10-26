import React from "react";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

export function SensorInspector({ device }: { device: DaliDevice }) {
  return (
    <fieldset>
      <legend>Sensor</legend>
      <div className="kv"><span>Type</span><b>Occupancy</b></div>
      <div className="kv"><span>Sensitivity</span><b>Medium</b></div>
    </fieldset>
  );
}