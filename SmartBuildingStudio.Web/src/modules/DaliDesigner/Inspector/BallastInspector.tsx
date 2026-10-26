import React from "react";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";

export function BallastInspector({ device }: { device: DaliDevice }) {
  return (
    <fieldset>
      <legend>Ballast</legend>
      <div className="kv"><span>Wattage</span><b>{device.metadata.wattage ?? "—"}</b></div>
      <div className="kv"><span>Dim range</span><b>1–100%</b></div>
    </fieldset>
  );
}