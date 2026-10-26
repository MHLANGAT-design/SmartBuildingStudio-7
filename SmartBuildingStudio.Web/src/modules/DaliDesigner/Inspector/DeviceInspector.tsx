// src/modules/DaliDesigner/Inspector/DeviceInspector.tsx
import React from "react";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";
import { BallastInspector } from "./BallastInspector";
import { SensorInspector } from "./SensorInspector";

export function DeviceInspector({ device }: { device: DaliDevice }) {
  const displayKind = humanizeKind(
    device.metadata.sourceKind ?? device.kind
  );

  return (
    <div>
      <h3>{device.label}</h3>

      <div className="kv"><span>Kind</span><b>{displayKind}</b></div>
      <div className="kv"><span>Address</span><b>{device.address ?? "—"}</b></div>
      <div className="kv"><span>Line</span><b>{device.lineId ?? "—"}</b></div>

      {device.metadata.roomName && (
        <div className="kv"><span>Room</span><b>{device.metadata.roomName}</b></div>
      )}
      {device.metadata.luminaireType && (
        <div className="kv"><span>Type</span><b>{device.metadata.luminaireType}</b></div>
      )}

      <hr />

      <div className="kv kv-small">
        <span>Fixture ID</span>
        <code title={device.sourceFixtureId}>
          {device.sourceFixtureId.slice(0, 10)}…
        </code>
      </div>
      {device.metadata.productId && (
        <div className="kv kv-small">
          <span>Product ID</span>
          <code title={device.metadata.productId}>
            {device.metadata.productId.slice(0, 10)}…
          </code>
        </div>
      )}

      {/* Behavioral inspector — dispatched on the DALI-side kind, not
          the source kind. Emergency lights behave like Ballasts. */}
      {device.kind === "Ballast" && <BallastInspector device={device} />}
      {device.kind === "Sensor" && <SensorInspector device={device} />}
    </div>
  );
}

function humanizeKind(k: string): string {
  const n = String(k).toLowerCase().replace(/[_\s-]/g, "");
  switch (n) {
    case "emergencylight":
    case "emergency":
      return "Emergency Light";
    case "luminaire":
    case "light":
      return "Luminaire";
    case "sensor":
      return "Sensor";
    case "switch":
      return "Switch";
    case "controller":
      return "Controller";
    case "gateway":
      return "Gateway";
    case "driver":
      return "Driver";
    case "powersupply":
      return "Power Supply";
    case "ballast":
    default:
      return "Ballast";
  }
}