// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { Logger } from './logger.js';
import { EVSEInfo } from './pdf-generator.js';

export interface CDSConnectionOptions {
  profile?: string;
  port?: number;
}

export class CDSEvseClient {
  private static instance: CDSEvseClient;
  private isConnected = false;
  private baseUrl = '';

  private constructor() {}

  static getInstance(): CDSEvseClient {
    if (!CDSEvseClient.instance) {
      CDSEvseClient.instance = new CDSEvseClient();
    }
    return CDSEvseClient.instance;
  }

  /**
   * Initialize connection to CDS server via HTTP API
   */
  async connect(options: CDSConnectionOptions = {}): Promise<void> {
    try {
      // Set default port to 4004 if not specified
      const port = options.port || 4004;
      this.baseUrl = `http://localhost:${port}`;

      this.isConnected = true;
    } catch (error) {
      throw new Error(
        `Failed to connect to CDS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Test connection to CDS services via HTTP API
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Try to fetch a small amount of data to test the connection
      const url = `${this.baseUrl}/odata/v4/charge-point/ChargePoints?$top=1`;
      const response = await fetch(url);

      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Fetch EVSEs via HTTP API
   */
  async fetchEVSEs(filter?: string): Promise<EVSEInfo[]> {
    if (!this.isConnected) {
      throw new Error('CDS client not connected. Call connect() first.');
    }

    try {
      // Build URL for ChargePoints endpoint (mapped to Evses)
      let url = `${this.baseUrl}/odata/v4/charge-point/ChargePoints?$expand=connectors,location`;

      // Apply filter if provided
      if (filter) {
        const filterQuery = `$filter=contains(name,'${filter}') or contains(code,'${filter}')`;
        url += `&${filterQuery}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const evses = data.value || [];

      // Transform the data to match our EVSEInfo interface
      return this.transformEVSEData(evses);
    } catch (error) {
      throw new Error(
        `Failed to fetch EVSEs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Fetch EVSEs by site area via HTTP API
   */
  async fetchEVSEsBySiteArea(siteAreaName: string): Promise<EVSEInfo[]> {
    if (!this.isConnected) {
      throw new Error('CDS client not connected. Call connect() first.');
    }

    try {
      const filterQuery = `$filter=location/siteAreaName eq '${siteAreaName}'`;
      const url = `${this.baseUrl}/odata/v4/charge-point/ChargePoints?$expand=connectors,location&${filterQuery}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const evses = data.value || [];

      return this.transformEVSEData(evses);
    } catch (error) {
      throw new Error(
        `Failed to fetch EVSEs by site area: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Transform raw EVSE data to our EVSEInfo format
   */
  private transformEVSEData(rawEvses: any[]): EVSEInfo[] {
    return rawEvses.map((evse) => {
      // Ensure connectors is an array and has valid data
      const connectors = Array.isArray(evse.connectors)
        ? evse.connectors.map((conn: any) => ({
            connectorId: conn.connectorId || conn.id || 1,
            type: conn.type,
            currentType: conn.currentType,
            voltage: conn.voltage,
            current: conn.current,
            maximumPower: conn.maximumPower,
            numberOfPhases: conn.numberOfPhases,
          }))
        : [{ connectorId: 1 }]; // Default connector if none provided

      return {
        id: evse.id,
        name: evse.name,
        code: evse.code,
        emi3Id: evse.emi3Id,
        chargingStationId: evse.chargingStationId,
        chargingStationName: evse.chargingStationName,
        location: evse.location
          ? {
              siteAreaName: evse.location.siteAreaName,
              siteName: evse.location.siteName,
              address: evse.location.address
                ? {
                    street: evse.location.address.street,
                    city: evse.location.address.city,
                    postalCode: evse.location.address.postalCode,
                    country: evse.location.address.country,
                  }
                : undefined,
            }
          : undefined,
        connectors,
      };
    });
  }

  /**
   * Get available site areas via HTTP API
   */
  async getSiteAreas(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('CDS client not connected. Call connect() first.');
    }

    try {
      const url = `${this.baseUrl}/odata/v4/charge-point/ChargePoints?$expand=location&$select=location`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const evses = data.value || [];

      const siteAreas = new Set<string>();
      evses.forEach((evse: any) => {
        if (evse.location?.siteAreaName) {
          siteAreas.add(evse.location.siteAreaName);
        }
      });

      return Array.from(siteAreas).sort();
    } catch (error) {
      throw new Error(
        `Failed to fetch site areas: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Disconnect from CDS server
   */
  async disconnect(): Promise<void> {
    Logger.info('🔌 Disconnecting from CDS server...');
    this.isConnected = false;
  }
}
