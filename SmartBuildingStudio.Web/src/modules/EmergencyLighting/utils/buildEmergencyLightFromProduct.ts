// src/modules/EmergencyLighting/utils/buildEmergencyLightFromProduct.ts
//
// Build the EmergencyLight payload for a placed fixture from a catalog
// product's specifications JSON.
//
// The backend ProductDto carries `specifications` as an OPAQUE STRING
// (raw manufacturer JSON, not parsed). This mapper parses it, then
// walks the parsed object — supporting both the raw ABB vendor shape
// (battery_management.*) and a normalized shape (battery.*).
//
// Classification and operation mode are inferred from the product name
// and type code:
//
//   "Escape Route LED"  → 'escape-route'   mode: non-maintained (or maintained when M3/NM3)
//   "Exit Sign"         → 'exit-sign'      mode: maintained
//   "High Risk Task"    → 'high-risk-task'
//   "Open Area"         → 'open-area'
//
// Every vendor field that isn't in the typed EmergencyLight payload is
// preserved under `overrides`, so a placed fixture carries the full spec
// sheet even if the catalog changes later.

import type {
  EmergencyLight,
  EmergencyOperationMode,
  EmergencyClassification,
} from '@/modules/FixturePlacementStudio/models/EmergencyLight';

/**
 * Safely parse the specifications field. Accepts either a JSON string
 * (the standard case — backend DTO uses string) or an already-parsed
 * object (defensive, for tests or future DTO changes). Returns an empty
 * object on parse failure so the mapper never throws mid-placement.
 */
function parseSpecifications(raw: unknown): any {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    if (raw.trim() === '') return {};
    try {
      return JSON.parse(raw);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[buildEmergencyLightFromProduct] Failed to parse specifications JSON:', err);
      return {};
    }
  }
  if (typeof raw === 'object') return raw;
  return {};
}

export function buildEmergencyLightFromProduct(
  product: { specifications?: unknown } | null | undefined
): EmergencyLight {
  const spec = parseSpecifications(product?.specifications);

  // ── Autonomy ──
  const ratedHours =
    typeof spec.battery_management?.rated_duration_hours === 'number'
      ? spec.battery_management.rated_duration_hours
      : typeof spec.battery?.ratedDurationHours === 'number'
      ? spec.battery.ratedDurationHours
      : undefined;

  const autonomyMinutes =
    typeof spec.battery?.autonomyMinutes === 'number'
      ? spec.battery.autonomyMinutes
      : typeof ratedHours === 'number'
      ? Math.round(ratedHours * 60)
      : undefined;

  // ── Classification ──
  const productName = String(
    spec.device_profile?.product_name ?? spec.name ?? ''
  ).toLowerCase();
  const typeCode = String(
    spec.device_profile?.type_code ?? spec.typeCode ?? ''
  );

  let classification: EmergencyClassification = 'unknown';
  if (/exit\s*sign/i.test(productName)) {
    classification = 'exit-sign';
  } else if (/escape|egress|route/i.test(productName)) {
    classification = 'escape-route';
  } else if (/high\s*risk/i.test(productName)) {
    classification = 'high-risk-task';
  } else if (/open\s*area|anti.?panic/i.test(productName)) {
    classification = 'open-area';
  } else if (spec.deviceProfile?.emergencyClassification) {
    classification = spec.deviceProfile.emergencyClassification;
  } else if (spec.emergencyClassification) {
    classification = spec.emergencyClassification;
  }

  // ── Operation mode ──
  let operationMode: EmergencyOperationMode = 'unknown';
  if (/M3\/NM3|NM3\/M3/i.test(typeCode)) {
    operationMode =
      classification === 'exit-sign' ? 'maintained' : 'non-maintained';
  } else if (/NM3|non.?maintained/i.test(typeCode)) {
    operationMode = 'non-maintained';
  } else if (/M3|maintained/i.test(typeCode)) {
    operationMode = 'maintained';
  } else if (/combined|\bC\d/i.test(typeCode)) {
    operationMode = 'combined';
  }

  // ── Preserve vendor spec sheet under overrides ──
  return {
    operationMode,
    autonomyMinutes,
    classification,
    onEscapeRoute: classification === 'escape-route',
    overrides: {
      // Electrical
      luminousFluxEmergencyLm: spec.technical_specifications?.luminous_flux_emergency,
      viewingDistanceMeters: spec.technical_specifications?.viewing_distance_meters,
      protectionRating: spec.technical_specifications?.protection_rating,
      impactProtection: spec.technical_specifications?.impact_protection,
      inputVoltage: spec.technical_specifications?.input_voltage,
      powerConsumptionW: spec.technical_specifications?.power_consumption_w,
      powerConsumptionVA: spec.technical_specifications?.power_consumption_va,
      lampType: spec.technical_specifications?.lamp_type,

      // Battery
      ratedDurationHours: ratedHours,
      batteryType: spec.battery_management?.battery_type,
      rechargeTimeHours: spec.battery_management?.recharge_time_hours,
      nominalVoltage: spec.battery_management?.nominal_voltage,

      // Device profile (exit-sign specific)
      orderCode: spec.device_profile?.order_code,
      mountingOptions: spec.device_profile?.mounting_options,

      // Monitoring (exit-sign specific)
      testSystem: spec.monitoring_and_testing?.test_system,
      statusIndicator: spec.monitoring_and_testing?.status_indicator,
      telemetry: spec.monitoring_and_testing?.telemetry,

      // Compliance
      certifications: spec.compliance_and_certifications,

      // Preserve the full raw specs so nothing is lost if new vendor
      // fields appear. Duplicated per-fixture — fine at normal fixture
      // counts (<2000). Remove this line if payload size matters more.
      rawSpecifications: spec,
    },
  };
}

export default buildEmergencyLightFromProduct;