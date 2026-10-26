// src/modules/FixturePlacementStudio/services/FixtureApi.ts
//
// Thin HTTP client for FixturePlacementStudio.
//
// Wraps fetch calls, centralizes error handling, and exposes a small
// typed surface. Does NOT know about Redux, React, or the layout model
// — callers pass and receive plain data.

import { API_ROUTES } from '@/Application/ApiRoutes';

// ─── Errors ───────────────────────────────────────────────────────────────────

export class FixtureApiError extends Error {
  public readonly status: number;
  public readonly url: string;
  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'FixtureApiError';
    this.status = status;
    this.url = url;
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class FixtureApi {
  /**
   * Fetch a document by id from ProjectExplorer. Returns the raw
   * response payload; normalization lives in FixtureDocumentManager.
   */
  static async getDocument(documentId: string): Promise<any> {
    const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
    return FixtureApi.request(url, { method: 'GET' });
  }

  /**
   * Save a document. The caller is responsible for building the payload
   * (see FixtureDocumentManager.save). This method just transports it.
   */
  static async saveDocument(
    documentId: string,
    payload: Record<string, unknown>
  ): Promise<any> {
    const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.UPDATE(documentId);
    return FixtureApi.request(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Fetch the current revision token for a document. Used by the
   * pre-save conflict check. Returns the raw payload — the caller
   * extracts whatever revision field exists (or falls back to 0).
   */
  static async getDocumentRevision(documentId: string): Promise<any> {
    const url = API_ROUTES.PROJECT_EXPLORER_SERVICE.DOCUMENTS.GET(documentId);
    return FixtureApi.request(url, { method: 'GET' });
  }

  // ─── Transport ───────────────────────────────────────────────────────

  private static async request<T>(
    url: string,
    options: RequestInit
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new FixtureApiError(
        `HTTP ${response.status} ${response.statusText}: ${text}`,
        response.status,
        url
      );
    }

    // 204 No Content → return empty object.
    if (response.status === 204) return {} as T;

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      // Some endpoints return plain text on success. Return as-is.
      const text = await response.text();
      return text as unknown as T;
    }

    return (await response.json()) as T;
  }
}

export default FixtureApi;