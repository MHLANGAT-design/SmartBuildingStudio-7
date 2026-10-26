// src/modules/DaliDesigner/services/DaliApi.ts
//
// Thin HTTP client for the DALI Designer module.

import { API_ROUTES } from "@/Application/ApiRoutes";
import { DaliNetworkDTO } from "@/modules/DaliDesigner/Document/DaliDocumentSerializer";
import { SourceFixture } from "@/modules/DaliDesigner/Document/DaliNetworkManager";

const R = API_ROUTES.DALI_DESIGNER_SERVICE;
const PE = API_ROUTES.PROJECT_EXPLORER_SERVICE;

// ─────────────────────────────────────────────────────────────────────
// Transport
// ─────────────────────────────────────────────────────────────────────

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`
    );
  }
  return res.status === 204
    ? (undefined as T)
    : ((await res.json()) as T);
}

// ─────────────────────────────────────────────────────────────────────
// Envelope adapter
// ─────────────────────────────────────────────────────────────────────

function toEnvelope(dto: DaliNetworkDTO, networkId?: string) {
  const {
    id: _id,
    projectId: _projectId,
    floorplanId: _floorplanId,
    name: _name,
    revision: _revision,
    updatedAt: _updatedAt,
    ...payload
  } = dto as any;

  return {
    id: networkId ?? dto.id ?? null,
    projectId: dto.projectId,
    floorplanId: dto.floorplanId,
    name: dto.name,
    revision: dto.revision,
    payload,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export interface DaliNetworkSummary {
  id: string;
  name: string;
  revision: number;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

export const DaliApi = {
  // ── FIXTURES ──────────────────────────────────────────────────────
  getPlacedFixtures(
    projectId: string,
    floorplanId: string
  ): Promise<SourceFixture[]> {
    return http<SourceFixture[]>(R.PLACED_FIXTURES(projectId, floorplanId));
  },

  // ── FLOORPLAN DOCUMENT ────────────────────────────────────────────
  getFloorplanDocument<T = any>(floorplanId: string): Promise<T> {
    return http<T>(PE.DOCUMENTS.GET(floorplanId));
  },

  // ── DALI NETWORKS ─────────────────────────────────────────────────
  getDaliNetwork(
    projectId: string,
    networkId: string
  ): Promise<DaliNetworkDTO> {
    return http<DaliNetworkDTO>(R.NETWORK(projectId, networkId));
  },

  /**
   * List every DALI network attached to a floorplan document.
   *
   * Used by DaliDesignerPage on entry when the URL carries no
   * networkId. If it returns a non-empty list, the client adopts the
   * most recent network's id into the URL.
   */
  listNetworksForFloorplan(
    projectId: string,
    floorplanId: string
  ): Promise<DaliNetworkSummary[]> {
    return http<DaliNetworkSummary[]>(
      R.NETWORKS_FOR_FLOORPLAN(projectId, floorplanId)
    );
  },

  createDaliNetwork(
    projectId: string,
    dto: DaliNetworkDTO
  ): Promise<DaliNetworkDTO> {
    return http<DaliNetworkDTO>(R.NETWORKS(projectId), {
      method: "POST",
      body: JSON.stringify(toEnvelope(dto)),
    });
  },

  updateDaliNetwork(
    projectId: string,
    networkId: string,
    dto: DaliNetworkDTO
  ): Promise<DaliNetworkDTO> {
    return http<DaliNetworkDTO>(R.NETWORK(projectId, networkId), {
      method: "PUT",
      body: JSON.stringify(toEnvelope(dto, networkId)),
    });
  },

  deleteDaliNetwork(projectId: string, networkId: string): Promise<void> {
    return http<void>(R.NETWORK(projectId, networkId), { method: "DELETE" });
  },
};

export default DaliApi;