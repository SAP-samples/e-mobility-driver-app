// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import type { ILocation } from '../../utils/odata';

/**
 * Charging Station information from expanded entity
 */
export interface ChargingStation {
  id: string;
  lastSeenAt?: string;
  disabled?: boolean;
  registrationStatus?: string;
  siteName?: string;
  siteAreaName?: string;
}

export interface Evse {
  id: string;
  emi3Id?: string;
  index?: number;
  code?: string;
  name?: string;
  parking?: string;
  parkingLevel?: string;
  parkingSpace?: string;
  chargingStationId?: string;
  chargingStationName?: string;
  connectors?: Connector[];
  location?: EvseLocation;
  chargingStation?: ChargingStation;
}

export interface Connector {
  connectorId: number;
  type?: string; // CCS, CHAdeMO, Type2, etc.
  currentType?: string; // AC ou DC
  voltage?: number;
  numberOfPhases?: number;
  evseIndex?: number;
  current?: number;
  currentLimit?: number;
  status?: string; // Available, Charging, Faulted, etc.
  maximumPower?: number;
}

export interface EvseLocation {
  parkingLevel?: string;
  parkingName?: string;
  parkingSpace?: string;
  companyId?: string;
  siteId?: string;
  siteName?: string;
  siteAreaId?: string;
  siteAreaName?: string;
  address?: Address;
  coordinates?: Coordinates;
}

export interface Address {
  number?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  country?: string;
  state?: string;
}

export interface Coordinates {
  latitude?: string;
  longitude?: string;
}

export interface EvseSearchOptions {
  query?: string;
  availableOnly?: boolean;
  connectorType?: 'AC' | 'DC';
  minPower?: number;
  maxPower?: number;
  city?: string;
  siteArea?: string;
  location?: ILocation;
  page?: number;
  pageSize?: number;
}

export const OcppConnectorStatus = {
  Available: 'Available',
  Charging: 'Charging',
  Faulted: 'Faulted',
  SuspendedEV: 'SuspendedEV',
  SuspendedEVSE: 'SuspendedEVSE',
  Finishing: 'Finishing',
  Reserved: 'Reserved',
  Unavailable: 'Unavailable',
  Preparing: 'Preparing',
} as const;

export type ConnectorStatus = keyof typeof OcppConnectorStatus;
