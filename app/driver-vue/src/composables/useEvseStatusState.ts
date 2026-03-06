// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import type { Connector, Evse } from '@/store/evse/types';

// Configuration constants
const STATION_DISCONNECT_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes - easily configurable

// OCPI EVSE Statuses
type OCPIEvseStatus =
  | 'AVAILABLE'
  | 'PREPARING'
  | 'OCCUPIED'
  | 'INOPERATIVE'
  | 'OUTOFORDER'
  | 'RESERVED';

// Connector Statuses (add more as needed)
type ConnectorStatus =
  | 'AVAILABLE'
  | 'CHARGING'
  | 'FAULTED'
  | 'UNAVAILABLE'
  | 'RESERVED'
  | 'PREPARING'
  | 'FINISHING'
  | 'SUSPENDEDEV'
  | 'SUSPENDEDEVSE';

// OCPI mapping
const connectorToOcpiStatus: Record<ConnectorStatus, OCPIEvseStatus> = {
  UNAVAILABLE: 'INOPERATIVE',
  FAULTED: 'OUTOFORDER',
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  PREPARING: 'PREPARING',
  FINISHING: 'OCCUPIED',
  SUSPENDEDEV: 'OCCUPIED',
  SUSPENDEDEVSE: 'OCCUPIED',
  CHARGING: 'OCCUPIED',
};

// Station connectivity functions
/**
 * Checks if a charging station is considered disconnected (not seen for over 3 minutes)
 * @param evse EVSE with expanded charging station information
 * @returns true if station is disconnected
 */
function isStationDisconnected(evse?: Evse): boolean {
  const lastSeenAt = evse?.chargingStation?.lastSeenAt;
  if (!lastSeenAt) return false;

  const lastSeen = new Date(lastSeenAt);
  if (isNaN(lastSeen.getTime())) return false;

  const now = new Date();
  return now.getTime() - lastSeen.getTime() >= STATION_DISCONNECT_THRESHOLD_MS;
}

// Compute OCPI status from connectors with station connectivity priority
function computeEvseOcpiStatus(evse?: Evse): OCPIEvseStatus {
  if (!evse) return 'INOPERATIVE';

  // Priority 1: Check station connectivity (highest priority)
  if (isStationDisconnected(evse)) {
    return 'INOPERATIVE';
  }

  // Priority 2: Check station disabled
  if (evse?.chargingStation?.disabled) {
    return 'INOPERATIVE';
  }

  // Priority 3: Check connector status (existing logic)
  if (!evse?.connectors?.length) return 'INOPERATIVE';

  let statuses: OCPIEvseStatus[] = [];

  for (const connector of evse.connectors) {
    if (!connector || typeof connector !== 'object') continue;
    const status = (connector.status || '').toUpperCase() as ConnectorStatus;
    const ocpiStatus = connectorToOcpiStatus[status];
    if (ocpiStatus) {
      statuses.push(ocpiStatus);
    }
  }

  if (statuses.includes('OCCUPIED')) return 'OCCUPIED';
  if (statuses.includes('PREPARING')) return 'PREPARING';
  if (statuses.includes('AVAILABLE')) return 'AVAILABLE';
  if (statuses.includes('RESERVED')) return 'RESERVED';
  if (statuses.includes('OUTOFORDER')) return 'OUTOFORDER';
  return 'INOPERATIVE';
}

function isReadyForCharging(evse?: Evse): boolean {
  const status = computeEvseOcpiStatus(evse);
  return ['AVAILABLE', 'PREPARING'].includes(status);
}

function isConnectorReadyForCharging(connector?: Connector): boolean {
  if (!connector) return false;
  const ocpiStatus = connectorToOcpiStatus[connector.status?.toUpperCase() as ConnectorStatus];
  return ['AVAILABLE', 'PREPARING'].includes(ocpiStatus);
}

// UI5 State mapping for OCPI status
const OCPI_STATUS_STATE_MAP: Record<OCPIEvseStatus, string> = {
  AVAILABLE: 'Positive',
  PREPARING: 'Information',
  OCCUPIED: 'Information',
  INOPERATIVE: 'Negative', // Default red for broken/inoperative
  OUTOFORDER: 'Negative',
  RESERVED: 'Critical',
};

function getConnectorOcpiStatusDisplay(status?: string): string {
  if (!status) return '-';
  const ocpiStatus = connectorToOcpiStatus[status.toUpperCase() as ConnectorStatus];
  return getEvseStatusDisplay(ocpiStatus) || '-';
}

function getEvseStatusState(ocpiStatus: OCPIEvseStatus, evse?: Evse): string {
  // Special case: Use gray/neutral for disconnected stations
  if (ocpiStatus === 'INOPERATIVE' && evse && isStationDisconnected(evse)) {
    return 'None';
  }

  return OCPI_STATUS_STATE_MAP[ocpiStatus] || 'None';
}

function getEvseStatusDisplay(ocpiStatus: OCPIEvseStatus, evse?: Evse): string {
  if (!ocpiStatus) return '';

  // Special case: Show "Disconnected" for station connectivity issues
  if (ocpiStatus === 'INOPERATIVE' && evse && isStationDisconnected(evse)) {
    return 'Disconnected';
  }

  return ocpiStatus.charAt(0).toUpperCase() + ocpiStatus.slice(1).toLowerCase();
}

function isEvseOperational(evse?: Evse): boolean {
  if (!evse) return false;

  return (
    !isStationDisconnected(evse) &&
    !evse.chargingStation?.disabled &&
    ['AVAILABLE', 'PREPARING', 'OCCUPIED', 'RESERVED'].includes(computeEvseOcpiStatus(evse))
  );
}

export function useEvseStatusState() {
  return {
    getEvseStatusState,
    computeEvseOcpiStatus,
    getEvseStatusDisplay,
    getConnectorOcpiStatusDisplay,
    isStationDisconnected,
    isEvseOperational,
    isReadyForCharging,
    isConnectorReadyForCharging,
  };
}
