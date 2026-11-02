// src/modules/DaliProgrammingStudio/Gateway/GatewayResponseHandler.ts

import type { GatewayResponse } from '@/modules/DaliProgrammingStudio/types/gateway.types';

export class GatewayResponseHandler {
  /**
   * Normalizes a raw gateway response into our standard GatewayResponse format.
   */
  public static normalize(rawResponse: any, gatewayId: string): GatewayResponse {
    // If the adapter already formatted it correctly, just return it
    if (rawResponse && typeof rawResponse.success === 'boolean') {
      return {
        gatewayId,
        timestamp: new Date().toISOString(),
        responseCode: rawResponse.responseCode || 200,
        payload: rawResponse,
        ...rawResponse,
      };
    }

    // Handle raw string/JSON formats (varies by manufacturer)
    return {
      success: false,
      gatewayId,
      timestamp: new Date().toISOString(),
      responseCode: 500,
      error: 'Unrecognized gateway response format',
      payload: rawResponse,
    };
  }
}